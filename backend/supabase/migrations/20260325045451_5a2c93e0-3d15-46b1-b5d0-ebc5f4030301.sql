
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('banner-images', 'banner-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('developer-images', 'developer-images', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies for public read
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'avatars');
CREATE POLICY "Public read event-images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'event-images');
CREATE POLICY "Public read banner-images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'banner-images');
CREATE POLICY "Public read developer-images" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'developer-images');

-- Authenticated users can upload to their folder
CREATE POLICY "Auth upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Auth upload event-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'event-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Auth upload banner-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'banner-images');
CREATE POLICY "Auth upload developer-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'developer-images');

-- Authenticated users can update/delete their own files
CREATE POLICY "Auth manage avatars" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Auth delete avatars" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Auth manage event-images" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'event-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Auth delete event-images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'event-images' AND (storage.foldername(name))[1] = auth.uid()::text);
