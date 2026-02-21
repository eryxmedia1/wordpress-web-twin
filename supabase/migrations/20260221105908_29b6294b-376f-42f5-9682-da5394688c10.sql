
-- 2. FIX: casting_applications - drop existing admin policy and recreate with talent access
DROP POLICY IF EXISTS "Admins can manage all applications" ON public.casting_applications;

-- Talent can view their own applications
CREATE POLICY "Talent can view own applications"
  ON public.casting_applications
  FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM public.talents WHERE id = casting_applications.talent_id));

-- Admins can do everything
CREATE POLICY "Admins can manage all applications"
  ON public.casting_applications
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Talent can insert their own applications
CREATE POLICY "Talent can insert own applications"
  ON public.casting_applications
  FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.talents WHERE id = casting_applications.talent_id));

-- 3. FIX: profiles public view without email
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
  SELECT id, full_name, avatar_url, subscription_tier, creator_tier, created_at
  FROM public.profiles;
