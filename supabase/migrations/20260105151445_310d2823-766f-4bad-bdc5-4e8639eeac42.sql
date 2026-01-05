-- Create a function to mark invitations as accepted when a user signs up
CREATE OR REPLACE FUNCTION public.handle_invitation_accepted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update any pending invitations for this email to 'accepted'
  UPDATE public.invitations
  SET status = 'accepted'
  WHERE email = NEW.email
    AND status = 'pending';
  
  RETURN NEW;
END;
$$;

-- Create trigger to run after a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created_update_invitation ON auth.users;
CREATE TRIGGER on_auth_user_created_update_invitation
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_invitation_accepted();