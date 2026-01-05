-- Block anonymous access to invitations table
CREATE POLICY "Block anonymous access to invitations"
ON public.invitations
FOR SELECT
TO anon
USING (false);

-- Block anonymous access to user_roles table
CREATE POLICY "Block anonymous access to user_roles"
ON public.user_roles
FOR SELECT
TO anon
USING (false);