-- The "products" bucket was misconfigured to only allow image/png (1MB limit), which broke the
-- new admin "Upload Product Image" feature for real-world JPEG/WebP photos. Match the limits
-- already used by the winner-media and home-ads buckets.
update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'],
    file_size_limit = 5242880
where id = 'products';
