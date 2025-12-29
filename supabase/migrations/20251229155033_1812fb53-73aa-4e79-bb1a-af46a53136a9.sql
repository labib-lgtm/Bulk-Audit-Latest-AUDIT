-- Update get_user_role function to only allow querying own role or admin access
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
    AND (
      -- Users can only query their own role
      _user_id = auth.uid()
      -- Or admins can query any role
      OR public.has_role(auth.uid(), 'admin')
    )
  LIMIT 1
$$;