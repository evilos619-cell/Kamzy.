import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Facebook, Instagram, Twitter, Youtube, Linkedin, Music2, Send, MessageCircle, Globe, ShoppingBag, Loader2, ShoppingCart, X, Copy, CheckCheck, PackageCheck, AlertCircle, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { PageHero } from "@/components/sections/PageHero";
import { categories as staticCategories } from "@/data/site";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { assignCredentialToOrder } from "@/lib/api/delivery";
import { PaystackTopUpDialog } from "@/components/wallet/PaystackTopUpDialog";

type DbCategory = { id: string; name: string; slug: string; description: string | null };
type Product = { id: string; title: string; price: number; stock: number; description: string | null; image_url: string | null; slug: string; currency: string };
type DeliveredCred = { content: string; label: string | null };

const CRED_FIELDS = ["Username", "Password", "Email", "Email Password", "2FA Code"];
function parseCred(content: string) {
  const parts = content.split(/\||\//).map((part) => part.trim());
  return CRED_FIELDS.map((label, i) => ({ label, value: parts[i] ?? "" })).filter((f) => f.value);
}

type CategoryMeta = { Icon: React.ElementType; iconColor: string; bg: string };
function getCategoryMeta(slug: string, name: string): CategoryMeta {
  const s = (slug ?? "").toLowerCase();
  const n = (name ?? "").toLowerCase();
  if (s.includes("twitter") || s.includes("-x-") || s.endsWith("-x") || n.includes("twitter") || / x$/.test(n))
    return { Icon: Twitter, iconColor: "text-slate-900", bg: "bg-slate-100" };
  if (s.includes("instagram") || n.includes("instagram"))
    return { Icon: Instagram, iconColor: "text-pink-600", bg: "bg-pink-100" };
  if (s.includes("facebook") || n.includes("facebook") || s.includes("fb-") || n.includes(" fb "))
    return { Icon: Facebook, iconColor: "text-blue-600", bg: "bg-blue-100" };
  if (s.includes("youtube") || n.includes("youtube"))
    return { Icon: Youtube, iconColor: "text-red-600", bg: "bg-red-100" };
  if (s.includes("tiktok") || n.includes("tiktok"))
    return { Icon: Music2, iconColor: "text-slate-800", bg: "bg-slate-100" };
  if (s.includes("linkedin") || n.includes("linkedin"))
    return { Icon: Linkedin, iconColor: "text-blue-700", bg: "bg-blue-100" };
  if (s.includes("telegram") || n.includes("telegram"))
    return { Icon: Send, iconColor: "text-sky-500", bg: "bg-sky-100" };
  if (s.includes("whatsapp") || n.includes("whatsapp"))
    return { Icon: MessageCircle, iconColor: "text-green-600", bg: "bg-green-100" };
  if (s.includes("website") || s.includes("web") || n.includes("website") || n.includes("web"))
    return { Icon: Globe, iconColor: "text-brand-orange", bg: "bg-brand-orange/10" };
  return { Icon: ShoppingBag, iconColor: "text-gray-500", bg: "bg-gray-100" };
}

export default function ProductsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dbCategories, setDbCategories] = useState<DbCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const activeCat = searchParams.get("cat") ?? undefined;
  const activeCategory = dbCategories.find((c) => c.slug === activeCat);

  useEffect(() => {
    supabase.from("product_categories").select("*").order("name").then(({ data }) => {
      if (data?.length) setDbCategories(data as DbCategory[]);
    });
  }, []);

  useEffect(() => {
    if (!activeCat) { setProducts([]); return; }
    setProductsLoading(true);
    const catId = dbCategories.find((c) => c.slug === activeCat)?.id ?? "";
    if (!catId) { setProductsLoading(false); return; }
    supabase
      .from("products")
      .select("id, title, price, stock, description, image_url, slug, currency")
      .eq("published", true)
      .eq("category_id", catId)
      .order("price")
      .then(({ data }) => { setProducts((data as Product[]) ?? []); setProductsLoading(false); });
  }, [activeCat, dbCategories]);

  const displayCategories = dbCategories.length > 0
    ? dbCategories
    : staticCategories.map((c) => ({ id: String(c.id), name: c.name, slug: c.slug, description: null }));

  const setCat = (slug: string | undefined) => {
    if (slug) setSearchParams({ cat: slug });
    else setSearchParams({});
  };

  const handleProductClick = (product: Product) => {
    navigate(`/products/${product.slug}`);
  };

  return (
    <>
      <PageHero title="Our Products" subtitle="Verified accounts across every major social platform." breadcrumbs={[{ name: "Products" }]} />

      <section className="w-full bg-background py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-12">
            <h3 className="text-lg font-semibold text-brand-foreground/80">Handpicked categories</h3>
            <h2 className="mt-3 text-3xl md:text-4xl font-extrabold">Verified accounts for sale</h2>
          </motion.div>

          {/* Categories */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-8">
            {displayCategories.map((c) => {
              const meta = getCategoryMeta(c.slug, c.name);
              const active = activeCategory?.id === c.id;
              return (
                <button key={c.id} onClick={() => setCat(c.slug)} aria-pressed={active} className={`group p-3 rounded-lg flex flex-col items-center justify-center space-y-2 ${meta.bg} ${active ? 'ring-2 ring-offset-2 ring-brand-500' : ''}`}>
                  <meta.Icon className={`w-6 h-6 ${meta.iconColor}`} />
                  <div className="text-xs text-slate-700 mt-1">{c.name}</div>
                </button>
              );
            })}
          </div>

          {/* Products grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {productsLoading ? (
              <div className="col-span-full text-center py-12"><Loader2 className="mx-auto" /></div>
            ) : products.map((p) => (
              <Card key={p.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleProductClick(p)}>
                <CardContent className="p-0">
                  {/* Product Image Placeholder */}
                  <div className="aspect-square bg-slate-100 flex items-center justify-center overflow-hidden">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.title} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    ) : (
                      <ShoppingBag className="w-12 h-12 text-slate-300" />
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-brand-navy line-clamp-2">{p.title}</h3>
                    <div className="flex items-center justify-between mt-3">
                      <div>
                        <div className="text-2xl font-bold text-brand-orange">
                          ₦{p.price.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.stock > 0 ? `${p.stock} available` : 'Out of stock'}
                        </div>
                      </div>
                      <div>
                        {p.stock > 0 ? (
                          <Badge className="bg-green-100 text-green-700 text-xs">In Stock</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 text-xs">Out of Stock</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {!productsLoading && products.length === 0 && activeCat && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No products available in this category.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
