-- Fix 1: Require authentication for channel_views INSERT (no anonymous tracking)
DROP POLICY IF EXISTS "Users can insert their own views" ON channel_views;
CREATE POLICY "Authenticated users can insert their own views"
ON channel_views FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND user_id = auth.uid()
);

-- Fix 2: Require authentication for ad_impressions INSERT (no anonymous tracking)
DROP POLICY IF EXISTS "Authenticated users can insert ad impressions" ON ad_impressions;
CREATE POLICY "Authenticated users can insert ad impressions"
ON ad_impressions FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND user_id = auth.uid()
);

-- Fix 3: Fix channel_notifications INSERT policy to require authentication
DROP POLICY IF EXISTS "System can create notifications" ON channel_notifications;
CREATE POLICY "System can create notifications for authenticated users"
ON channel_notifications FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = profile_id 
    AND account_id = auth.uid()
  )
);

-- Fix 4: Make indie_channels owner_id NOT NULL for new channels and restrict creation
DROP POLICY IF EXISTS "Admins can manage all indie channels" ON indie_channels;
CREATE POLICY "Admins can manage all indie channels"
ON indie_channels FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can create channels (owners manage existing ones assigned by admin)
DROP POLICY IF EXISTS "Owners can manage their own channels" ON indie_channels;
CREATE POLICY "Owners can manage their own channels"
ON indie_channels FOR UPDATE
USING (auth.uid() IS NOT NULL AND owner_id = auth.uid())
WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());