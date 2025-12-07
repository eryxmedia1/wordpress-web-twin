-- Add DELETE policy to watch_history so users can remove items from Continue Watching
CREATE POLICY "Users can delete their profiles watch history" 
ON public.watch_history 
FOR DELETE 
USING (EXISTS ( 
  SELECT 1 FROM user_profiles 
  WHERE user_profiles.id = watch_history.profile_id 
  AND user_profiles.account_id = auth.uid()
));