-- Clear existing membership plans and insert the 3 tiers
TRUNCATE TABLE content_membership_plans;
TRUNCATE TABLE membership_plans CASCADE;

-- Insert the 3 membership tiers
INSERT INTO public.membership_plans (name, slug, price, description, features, sort_order)
VALUES 
  ('Free', 'free', 0, 'Free ad-supported tier with limited content', ARRAY['Limited shows & movies', 'Limited channels', 'Full ad support'], 1),
  ('Standard', 'standard', 9.95, 'Most content with limited ads', ARRAY['Access to most programming', 'Access to most channels', 'Max 2 ad breaks per show'], 2),
  ('Premium', 'premium', 19.95, 'All content with no ads', ARRAY['Access to ALL shows & movies', 'Access to ALL channels', 'NO commercials'], 3);