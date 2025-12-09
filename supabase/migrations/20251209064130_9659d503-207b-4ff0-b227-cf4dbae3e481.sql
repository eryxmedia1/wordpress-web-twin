-- Add pod_position to ads table
ALTER TABLE ads ADD COLUMN IF NOT EXISTS pod_position integer DEFAULT 1;

-- Create ad_pod_config table for per-content/channel ad pod settings
CREATE TABLE IF NOT EXISTS ad_pod_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES contents(id) ON DELETE CASCADE,
  channel_id uuid REFERENCES live_channels(id) ON DELETE CASCADE,
  preroll_pod_size integer DEFAULT 1,
  midroll_pod_size integer DEFAULT 1,
  postroll_pod_size integer DEFAULT 1,
  midroll_interval_minutes integer DEFAULT 10,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_content_config UNIQUE(content_id),
  CONSTRAINT unique_channel_config UNIQUE(channel_id),
  CONSTRAINT check_one_target CHECK (
    (content_id IS NOT NULL AND channel_id IS NULL) OR
    (content_id IS NULL AND channel_id IS NOT NULL) OR
    (content_id IS NULL AND channel_id IS NULL)
  )
);

-- Global ad config table
CREATE TABLE IF NOT EXISTS ad_global_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  preroll_pod_size integer DEFAULT 1,
  midroll_pod_size integer DEFAULT 1,
  postroll_pod_size integer DEFAULT 1,
  midroll_interval_minutes integer DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert default global config if not exists
INSERT INTO ad_global_config (preroll_pod_size, midroll_pod_size, postroll_pod_size, midroll_interval_minutes)
SELECT 1, 1, 1, 10
WHERE NOT EXISTS (SELECT 1 FROM ad_global_config);

-- Add all_channels flag to ad_placements
ALTER TABLE ad_placements ADD COLUMN IF NOT EXISTS all_channels boolean DEFAULT false;

-- Enable RLS
ALTER TABLE ad_pod_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_global_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for ad_pod_config
CREATE POLICY "Admins can manage ad pod config" ON ad_pod_config
FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Anyone can view ad pod config" ON ad_pod_config
FOR SELECT USING (true);

-- RLS policies for ad_global_config
CREATE POLICY "Admins can manage ad global config" ON ad_global_config
FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));

CREATE POLICY "Anyone can view ad global config" ON ad_global_config
FOR SELECT USING (true);