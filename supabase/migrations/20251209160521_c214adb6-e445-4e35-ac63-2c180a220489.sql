-- ============================================
-- SECURITY FIX: Block anonymous access to user data tables
-- ============================================

-- All these tables already have RLS enabled and policies for authenticated users.
-- The issue is they don't explicitly DENY anonymous access.
-- Since RLS is RESTRICTIVE by default, we need to ensure no PERMISSIVE policies allow anon access.

-- 1. FIX: profiles - Add explicit check for authenticated users
-- The existing policies use auth.uid() = id which returns null for anon, effectively blocking access
-- But let's verify by checking the existing policies are working correctly
-- The table should already be secure since auth.uid() will be null for anonymous users

-- 2. FIX: user_profiles - Same situation
-- The existing policies check auth.uid() = account_id which is null for anon

-- 3. FIX: push_subscriptions - Add explicit authenticated check
-- Update the existing ALL policy to explicitly require authentication
DROP POLICY IF EXISTS "Users can manage their own push subscriptions" ON public.push_subscriptions;

CREATE POLICY "Users can manage their own push subscriptions"
ON public.push_subscriptions
FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = push_subscriptions.profile_id
    AND user_profiles.account_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = push_subscriptions.profile_id
    AND user_profiles.account_id = auth.uid()
  )
);

-- 4. FIX: favorites - Strengthen policies with explicit auth check
DROP POLICY IF EXISTS "Users can view their profiles favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can add to their profiles favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can remove from their profiles favorites" ON public.favorites;

CREATE POLICY "Users can view their profiles favorites"
ON public.favorites
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = favorites.profile_id
    AND user_profiles.account_id = auth.uid()
  )
);

CREATE POLICY "Users can add to their profiles favorites"
ON public.favorites
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = favorites.profile_id
    AND user_profiles.account_id = auth.uid()
  )
);

CREATE POLICY "Users can remove from their profiles favorites"
ON public.favorites
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = favorites.profile_id
    AND user_profiles.account_id = auth.uid()
  )
);

-- 5. FIX: likes - Strengthen policies with explicit auth check
DROP POLICY IF EXISTS "Users can view their profiles likes" ON public.likes;
DROP POLICY IF EXISTS "Users can add likes for their profiles" ON public.likes;
DROP POLICY IF EXISTS "Users can update their profiles likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete their profiles likes" ON public.likes;

CREATE POLICY "Users can view their profiles likes"
ON public.likes
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = likes.profile_id
    AND user_profiles.account_id = auth.uid()
  )
);

CREATE POLICY "Users can add likes for their profiles"
ON public.likes
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = likes.profile_id
    AND user_profiles.account_id = auth.uid()
  )
);

CREATE POLICY "Users can update their profiles likes"
ON public.likes
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = likes.profile_id
    AND user_profiles.account_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their profiles likes"
ON public.likes
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = likes.profile_id
    AND user_profiles.account_id = auth.uid()
  )
);

-- 6. FIX: watch_history - Strengthen policies with explicit auth check
DROP POLICY IF EXISTS "Users can view their profiles watch history" ON public.watch_history;
DROP POLICY IF EXISTS "Users can add to their profiles watch history" ON public.watch_history;
DROP POLICY IF EXISTS "Users can update their profiles watch history" ON public.watch_history;
DROP POLICY IF EXISTS "Users can delete their profiles watch history" ON public.watch_history;

CREATE POLICY "Users can view their profiles watch history"
ON public.watch_history
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = watch_history.profile_id
    AND user_profiles.account_id = auth.uid()
  )
);

CREATE POLICY "Users can add to their profiles watch history"
ON public.watch_history
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = watch_history.profile_id
    AND user_profiles.account_id = auth.uid()
  )
);

CREATE POLICY "Users can update their profiles watch history"
ON public.watch_history
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = watch_history.profile_id
    AND user_profiles.account_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their profiles watch history"
ON public.watch_history
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = watch_history.profile_id
    AND user_profiles.account_id = auth.uid()
  )
);

-- 7. FIX: user_profiles - Add explicit auth check
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create their own profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete their own profiles" ON public.user_profiles;

CREATE POLICY "Users can view their own profiles"
ON public.user_profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = account_id);

CREATE POLICY "Users can create their own profiles"
ON public.user_profiles
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = account_id);

CREATE POLICY "Users can update their own profiles"
ON public.user_profiles
FOR UPDATE
USING (auth.uid() IS NOT NULL AND auth.uid() = account_id);

CREATE POLICY "Users can delete their own profiles"
ON public.user_profiles
FOR DELETE
USING (auth.uid() IS NOT NULL AND auth.uid() = account_id);

-- 8. FIX: profiles - Add explicit auth check
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile safely" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own profile safely"
ON public.profiles
FOR UPDATE
USING (auth.uid() IS NOT NULL AND auth.uid() = id)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = id 
  AND is_admin IS NOT DISTINCT FROM (SELECT p.is_admin FROM public.profiles p WHERE p.id = auth.uid())
);