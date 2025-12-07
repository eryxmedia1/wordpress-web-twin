-- Grant admin role to eryxmedia@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('50fa474f-70d8-459c-85c4-49aad6f91d20', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;