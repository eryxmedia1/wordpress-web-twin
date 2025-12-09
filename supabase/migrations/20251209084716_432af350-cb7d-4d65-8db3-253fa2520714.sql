-- Create channel_notifications table for subscriber notifications
CREATE TABLE public.channel_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  indie_channel_id uuid NOT NULL REFERENCES public.indie_channels(id) ON DELETE CASCADE,
  content_id uuid REFERENCES public.contents(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.channel_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.channel_notifications
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_profiles.id = channel_notifications.profile_id
  AND user_profiles.account_id = auth.uid()
));

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.channel_notifications
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_profiles.id = channel_notifications.profile_id
  AND user_profiles.account_id = auth.uid()
));

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.channel_notifications
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_profiles.id = channel_notifications.profile_id
  AND user_profiles.account_id = auth.uid()
));

-- System can insert notifications (via trigger)
CREATE POLICY "System can insert notifications"
ON public.channel_notifications
FOR INSERT
WITH CHECK (true);

-- Create function to notify channel subscribers when new content is added
CREATE OR REPLACE FUNCTION public.notify_channel_subscribers()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  channel_name text;
  content_title text;
BEGIN
  -- Only trigger if content has an indie_channel_id
  IF NEW.indie_channel_id IS NOT NULL THEN
    -- Get channel name
    SELECT name INTO channel_name FROM indie_channels WHERE id = NEW.indie_channel_id;
    content_title := NEW.title;
    
    -- Insert notifications for all subscribers of this channel
    INSERT INTO channel_notifications (profile_id, indie_channel_id, content_id, message)
    SELECT 
      icf.profile_id,
      NEW.indie_channel_id,
      NEW.id,
      'New video on ' || channel_name || ': ' || content_title
    FROM indie_channel_favorites icf
    WHERE icf.indie_channel_id = NEW.indie_channel_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on contents table
CREATE TRIGGER on_content_created_notify_subscribers
AFTER INSERT ON public.contents
FOR EACH ROW
EXECUTE FUNCTION public.notify_channel_subscribers();