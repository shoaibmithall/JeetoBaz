-- Payment method accounts (JazzCash/Easypaisa/bank numbers, account titles, QR images) were
-- hardcoded as a duplicated PAYMENT_ACCOUNTS array in both payment.tsx and wallet-topup.tsx.
-- Blocking or changing any one of these numbers required a code change and app rebuild before
-- payments could keep flowing. Seeding them into app_settings (same public-read/admin-write
-- pattern already used for home_ad_images and announcement) lets an admin edit them from the
-- panel instead. qr_image_url starts null for every method -- the app falls back to the
-- existing bundled QR images by method name until an admin uploads a replacement, so this
-- migration changes no user-visible behavior on its own.

insert into app_settings (key, value)
values (
  'payment_accounts',
  '[
    {"method": "JazzCash", "number": "03706814892", "accountTitle": "Shoaib Ahmed", "qrImageUrl": null, "active": true},
    {"method": "Easypaisa", "number": "03706814892", "accountTitle": "Shoaib Ahmed", "qrImageUrl": null, "active": true},
    {"method": "NayaPay", "number": "03706814892", "accountTitle": "Shoaib Ahmed", "qrImageUrl": null, "active": true},
    {"method": "UPaisa", "number": "03706814892", "accountTitle": "Shoaib Ahmed", "qrImageUrl": null, "active": true},
    {"method": "SadaPay", "number": "03706814892", "accountTitle": "Shoaib Ahmed", "qrImageUrl": null, "active": true},
    {"method": "JS Bank / Zindigi App", "number": "03706814892", "accountTitle": "Shoaib Ahmed", "qrImageUrl": null, "active": true},
    {"method": "My ABL Allied Bank / Bank Transfer", "number": "08530010142159150013", "accountTitle": "Shoaib Ahmed", "qrImageUrl": null, "active": true}
  ]'::jsonb
)
on conflict (key) do nothing;
