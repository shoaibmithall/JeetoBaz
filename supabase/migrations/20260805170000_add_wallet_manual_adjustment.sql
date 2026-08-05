-- Wallet feature, Phase 5: admin manual balance adjustments (bonus / refund / correction).
--
-- Phase 1 already defined wallet_transactions.type as ('topup', 'entry', 'refund', 'bonus',
-- 'adjustment'), but only 'topup' (topup_wallet_atomic) and 'entry'
-- (enter_draw_from_wallet_atomic) have ever had a function that could write them -- there was no
-- way for the admin to issue a goodwill credit, refund a wallet-paid entry, or correct a mistake
-- without going into the SQL Editor directly. This closes that gap with the same trust model as
-- every other wallet-writing function: admin identity is checked inside the function body, never
-- left to a client-side gate.

create or replace function public.adjust_wallet_balance_atomic(
  p_phone text,
  p_amount integer,
  p_type text,
  p_reference text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_current_balance integer;
  v_new_balance integer;
begin
  if auth.uid() is distinct from '65d46154-c62b-415c-852c-c923b0b3cd1a'::uuid then
    raise exception 'Only the verified JeetoBaz admin can adjust wallet balances.';
  end if;

  if p_amount is null or p_amount = 0 then
    return jsonb_build_object('ok', false, 'error', 'Adjustment amount cannot be zero.');
  end if;

  if p_type not in ('bonus', 'refund', 'adjustment') then
    return jsonb_build_object('ok', false, 'error', 'Invalid adjustment type.');
  end if;

  select balance into v_current_balance from wallets where phone = p_phone for update;
  v_current_balance := coalesce(v_current_balance, 0);

  if v_current_balance + p_amount < 0 then
    return jsonb_build_object('ok', false, 'error', 'This adjustment would make the balance negative.');
  end if;

  insert into wallets (phone, balance)
  values (p_phone, p_amount)
  on conflict (phone) do update set balance = wallets.balance + excluded.balance, updated_at = now()
  returning balance into v_new_balance;

  insert into wallet_transactions (phone, type, amount, balance_after, reference)
  values (p_phone, p_type, p_amount, v_new_balance, p_reference);

  return jsonb_build_object('ok', true, 'new_balance', v_new_balance);
end;
$$;

grant execute on function public.adjust_wallet_balance_atomic(text, integer, text, text) to authenticated;
