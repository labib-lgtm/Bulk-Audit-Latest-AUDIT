-- Drop the overly broad authentication policy
DROP POLICY IF EXISTS "Require authentication for invitations" ON public.invitations;

-- Drop the restrictive admin policy (we'll replace with permissive)
DROP POLICY IF EXISTS "Admins can view all invitations" ON public.invitations;

-- Create a permissive admin-only SELECT policy
CREATE POLICY "Admins can view all invitations"
ON public.invitations
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));