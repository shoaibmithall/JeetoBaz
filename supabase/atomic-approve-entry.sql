-- Atomic entry approval RPC
-- Prevents race condition on current_entries increment
-- Run this SQL in Supabase SQL Editor before deploying the updated admin.tsx

CREATE OR REPLACE FUNCTION public.approve_entry_atomic(
  p_product_id uuid,
  p_phone text,
  p_name text DEFAULT NULL,
  p_transaction_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product record;
  v_existing_entry_id uuid;
  v_new_entry_id uuid;
BEGIN
  -- Lock the product row to prevent concurrent modifications
  SELECT id, status, current_entries, max_entries
  INTO v_product
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  -- Validate product exists
  IF v_product IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Product not found.');
  END IF;

  -- Validate product is active
  IF v_product.status != 'active' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This draw is not active.');
  END IF;

  -- Check remaining capacity
  IF COALESCE(v_product.current_entries, 0) >= v_product.max_entries THEN
    RETURN jsonb_build_object('ok', false, 'error', 'This draw is full.');
  END IF;

  -- Prevent duplicate entry
  SELECT id INTO v_existing_entry_id
  FROM entries
  WHERE product_id = p_product_id AND phone = p_phone
  LIMIT 1;

  IF v_existing_entry_id IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Entry already exists for this phone number.');
  END IF;

  -- Insert entry
  INSERT INTO entries (product_id, phone, name, transaction_id)
  VALUES (p_product_id, p_phone, p_name, p_transaction_id)
  RETURNING id INTO v_new_entry_id;

  -- Atomically increment current_entries
  UPDATE products
  SET current_entries = COALESCE(current_entries, 0) + 1
  WHERE id = p_product_id;

  RETURN jsonb_build_object(
    'ok', true,
    'entry_id', v_new_entry_id,
    'new_entries', (SELECT current_entries FROM products WHERE id = p_product_id)
  );
END;
$$;

-- Grant execute to authenticated users (admin only via RLS or app logic)
GRANT EXECUTE ON FUNCTION public.approve_entry_atomic(uuid, text, text, text) TO authenticated;
