-- Add PERMISSIVE policy to require authentication for user_roles table
-- This ensures anonymous users cannot read from the table

-- First, drop the existing RESTRICTIVE SELECT policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

-- Create PERMISSIVE policies that require authentication
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Also fix the invitations table which has the same issue
DROP POLICY IF EXISTS "Admins can view all invitations" ON public.invitations;

CREATE POLICY "Admins can view all invitations"
ON public.invitations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));