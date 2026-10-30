-- Public, read-only bucket for compressed content media (scripts/compress-media.ts uploads to it).
--
-- Public means anyone can fetch a file by its URL, which is what the day screen needs. Nobody can write
-- or list from the app: storage.objects has RLS on and there are no policies for anon or authenticated,
-- so only the service role (the script) can upload.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 2097152, array['image/webp', 'audio/mpeg'])
on conflict (id) do nothing;
