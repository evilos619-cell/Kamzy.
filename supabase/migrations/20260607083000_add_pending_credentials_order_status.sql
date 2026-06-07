-- Add pending_credentials order status and improve credential assignment
DO $$ BEGIN
  ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'pending_credentials';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.purchase_with_wallet(_user_id uuid, _product_id uuid, _quantity int)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_product     public.products;
  v_total       numeric(14,2);
  v_wallet_id   uuid;
  v_new_balance numeric(14,2);
  v_tx_id       uuid;
  v_order_id    uuid;
  v_cred_id     uuid;
BEGIN
  IF _quantity <= 0 THEN RAISE EXCEPTION 'quantity must be positive'; END IF;
  SELECT * INTO v_product FROM public.products WHERE id = _product_id AND published = true FOR UPDATE;
  IF v_product.id IS NULL THEN RAISE EXCEPTION 'product not available'; END IF;
  IF v_product.stock < _quantity THEN RAISE EXCEPTION 'insufficient stock'; END IF;
  v_total := v_product.price * _quantity;

  SELECT id, balance INTO v_wallet_id, v_new_balance FROM public.wallets WHERE user_id = _user_id FOR UPDATE;
  IF v_wallet_id IS NULL THEN RAISE EXCEPTION 'wallet not found'; END IF;
  IF v_new_balance < v_total THEN RAISE EXCEPTION 'insufficient wallet balance'; END IF;

  UPDATE public.wallets SET balance = balance - v_total, updated_at = now() WHERE id = v_wallet_id RETURNING balance INTO v_new_balance;
  UPDATE public.products SET stock = stock - _quantity, updated_at = now() WHERE id = _product_id;

  INSERT INTO public.wallet_transactions(wallet_id,user_id,type,amount,balance_after,status,provider,reference,description)
    VALUES (v_wallet_id,_user_id,'debit',v_total,v_new_balance,'success','manual','purchase-'||gen_random_uuid()::text,'Purchase: '||v_product.title)
    RETURNING id INTO v_tx_id;

  INSERT INTO public.orders(user_id,total,currency,status,wallet_tx_id)
    VALUES (_user_id,v_total,v_product.currency,'completed',v_tx_id) RETURNING id INTO v_order_id;
  INSERT INTO public.order_items(order_id,product_id,title,unit_price,quantity)
    VALUES (v_order_id,v_product.id,v_product.title,v_product.price,_quantity);

  v_cred_id := public.assign_credential_to_order(v_order_id, _product_id);
  IF v_cred_id IS NULL THEN
    UPDATE public.orders SET status = 'pending_credentials' WHERE id = v_order_id;
    INSERT INTO public.activity_logs(actor_id, action, target, metadata)
      VALUES (_user_id, 'pending_credentials', _product_id::text, json_build_object('order_id', v_order_id));
  END IF;

  RETURN v_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_credential_to_order(_order_id uuid, _product_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_cred_id uuid;
  v_user_id uuid;
BEGIN
  SELECT user_id INTO v_user_id FROM public.orders WHERE id = _order_id;
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'order not found'; END IF;

  SELECT id INTO v_cred_id
  FROM public.product_credentials
  WHERE product_id = _product_id AND order_id IS NULL
  ORDER BY created_at ASC LIMIT 1 FOR UPDATE SKIP LOCKED;

  IF v_cred_id IS NULL THEN RETURN NULL; END IF;

  UPDATE public.product_credentials
    SET order_id = _order_id, assigned_to = v_user_id, delivered_at = now()
    WHERE id = v_cred_id;
  UPDATE public.order_items SET delivered_payload = v_cred_id::text WHERE order_id = _order_id AND product_id = _product_id;
  UPDATE public.orders SET status = 'completed' WHERE id = _order_id AND status = 'pending_credentials';
  RETURN v_cred_id;
END;
$$;
