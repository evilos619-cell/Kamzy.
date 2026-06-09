---
id: 20260609_add_activity_logs.sql
title: add activity_logs table for admin activity tracking
created_at: 2026-06-09
---

-- Migration: create activity_logs table (nullable actor_id so token-based admin calls work)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  action text NOT NULL,
  target text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
