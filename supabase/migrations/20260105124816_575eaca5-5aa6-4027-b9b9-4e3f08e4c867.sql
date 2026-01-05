-- Add permissive policies requiring authentication for user_roles table
CREATE POLICY "Require authentication for user_roles"
ON public.user_roles
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);

-- Add permissive policies requiring authentication for invitations table
CREATE POLICY "Require authentication for invitations"
ON public.invitations
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);