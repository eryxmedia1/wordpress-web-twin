
DROP POLICY IF EXISTS "Anyone can view approved talents" ON public.talents;
CREATE POLICY "Authenticated users can view approved talents"
ON public.talents FOR SELECT
TO authenticated
USING (is_approved = true AND is_active = true);

DROP POLICY IF EXISTS "Authenticated users can view live channels" ON public.live_channels;

DROP POLICY IF EXISTS "Anyone can view staff" ON public.department_staff;
CREATE POLICY "Authenticated users can view staff"
ON public.department_staff FOR SELECT
TO authenticated
USING (true);

CREATE OR REPLACE VIEW public.department_staff_public AS
SELECT id, department_id, name, title, is_active, created_at
FROM public.department_staff
WHERE is_active = true;

GRANT SELECT ON public.department_staff_public TO anon, authenticated;

DROP POLICY IF EXISTS "Authenticated users can insert ad impressions" ON public.ad_impressions;
DROP POLICY IF EXISTS "Users can insert their own ad impressions" ON public.ad_impressions;
CREATE POLICY "Users can insert their own ad impressions"
ON public.ad_impressions FOR INSERT
TO authenticated
WITH CHECK (user_id IS NOT NULL AND user_id = auth.uid());

DROP POLICY IF EXISTS "Talent can view own applications" ON public.casting_applications;
DROP POLICY IF EXISTS "Talent can insert own applications" ON public.casting_applications;

DROP POLICY IF EXISTS "Channel logos are publicly accessible" ON storage.objects;
CREATE POLICY "Admins can list channel logos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'channel-logos' AND has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can view talent media" ON storage.objects;
CREATE POLICY "Owners and admins can list talent media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'talent-media'
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

REVOKE USAGE ON SCHEMA graphql_public FROM anon, authenticated;
REVOKE ALL ON FUNCTION graphql_public.graphql(text, text, jsonb, jsonb) FROM anon, authenticated;
REVOKE USAGE ON SCHEMA graphql FROM anon, authenticated;

REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_profile() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.check_ad_impression_limit() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_ad_impressions() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_channel_subscribers() FROM anon, authenticated;
