-- Create progressive midroll pod configuration table
CREATE TABLE public.ad_midroll_pod_config (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    content_id uuid REFERENCES public.contents(id) ON DELETE CASCADE,
    channel_id uuid REFERENCES public.live_channels(id) ON DELETE CASCADE,
    is_global boolean DEFAULT false,
    break_1_pod_size integer DEFAULT 2,
    break_2_pod_size integer DEFAULT 3,
    break_3_pod_size integer DEFAULT 5,
    break_4_pod_size integer DEFAULT 3,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT unique_content_midroll UNIQUE (content_id),
    CONSTRAINT unique_channel_midroll UNIQUE (channel_id)
);

-- Enable RLS
ALTER TABLE public.ad_midroll_pod_config ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage midroll pod config"
ON public.ad_midroll_pod_config
FOR ALL
USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
));

CREATE POLICY "Anyone can view midroll pod config"
ON public.ad_midroll_pod_config
FOR SELECT
USING (true);

-- Insert global default
INSERT INTO public.ad_midroll_pod_config (is_global, break_1_pod_size, break_2_pod_size, break_3_pod_size, break_4_pod_size)
VALUES (true, 2, 3, 5, 3);

-- Create indie channel categories table
CREATE TABLE public.indie_channel_categories (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    indie_channel_id uuid NOT NULL REFERENCES public.indie_channels(id) ON DELETE CASCADE,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.indie_channel_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies for indie_channel_categories
CREATE POLICY "Anyone can view indie channel categories"
ON public.indie_channel_categories
FOR SELECT
USING (true);

CREATE POLICY "Channel owners can manage their categories"
ON public.indie_channel_categories
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM indie_channels 
        WHERE indie_channels.id = indie_channel_categories.indie_channel_id 
        AND indie_channels.owner_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all indie channel categories"
ON public.indie_channel_categories
FOR ALL
USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
));

-- Create indie channel category items junction table
CREATE TABLE public.indie_channel_category_items (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id uuid NOT NULL REFERENCES public.indie_channel_categories(id) ON DELETE CASCADE,
    content_id uuid NOT NULL REFERENCES public.contents(id) ON DELETE CASCADE,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT unique_category_content UNIQUE (category_id, content_id)
);

-- Enable RLS
ALTER TABLE public.indie_channel_category_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for indie_channel_category_items
CREATE POLICY "Anyone can view category items"
ON public.indie_channel_category_items
FOR SELECT
USING (true);

CREATE POLICY "Channel owners can manage their category items"
ON public.indie_channel_category_items
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM indie_channel_categories
        JOIN indie_channels ON indie_channels.id = indie_channel_categories.indie_channel_id
        WHERE indie_channel_categories.id = indie_channel_category_items.category_id
        AND indie_channels.owner_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage all category items"
ON public.indie_channel_category_items
FOR ALL
USING (EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true
));