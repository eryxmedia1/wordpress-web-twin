-- Grant premium membership to eryxmedia@gmail.com and legernyida@gmail.com
UPDATE public.profiles 
SET subscription_tier = 'premium' 
WHERE id IN ('50fa474f-70d8-459c-85c4-49aad6f91d20', '05520256-76d3-419c-b42f-2fae435603d0');