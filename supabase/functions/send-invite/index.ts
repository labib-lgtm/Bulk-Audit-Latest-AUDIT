import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  role?: string;
}

// Valid roles for the application
const VALID_ROLES = ["user", "admin"] as const;
type ValidRole = typeof VALID_ROLES[number];

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Rate limit: max invitations per admin per time window
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MINUTES = 15;

function validateEmail(email: unknown): { valid: boolean; error?: string } {
  if (typeof email !== "string") {
    return { valid: false, error: "Email must be a string" };
  }
  
  const trimmed = email.trim();
  
  if (!trimmed) {
    return { valid: false, error: "Email is required" };
  }
  
  if (trimmed.length > 255) {
    return { valid: false, error: "Email is too long" };
  }
  
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: "Invalid email format" };
  }
  
  return { valid: true };
}

function validateRole(role: unknown): { valid: boolean; value: ValidRole; error?: string } {
  if (role === undefined || role === null) {
    return { valid: true, value: "user" };
  }
  
  if (typeof role !== "string") {
    return { valid: false, value: "user", error: "Role must be a string" };
  }
  
  const trimmed = role.trim().toLowerCase();
  
  if (!VALID_ROLES.includes(trimmed as ValidRole)) {
    return { valid: false, value: "user", error: "Invalid role. Must be 'user' or 'admin'" };
  }
  
  return { valid: true, value: trimmed as ValidRole };
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the user from the JWT token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Failed to get user:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError || roleData?.role !== "admin") {
      console.error("User is not admin:", roleError);
      return new Response(
        JSON.stringify({ error: "Only admins can send invitations" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate input
    let requestBody: InviteRequest;
    try {
      requestBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email: rawEmail, role: rawRole } = requestBody;

    // Validate email
    const emailValidation = validateEmail(rawEmail);
    if (!emailValidation.valid) {
      return new Response(
        JSON.stringify({ error: emailValidation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const email = (rawEmail as string).trim().toLowerCase();

    // Validate role
    const roleValidation = validateRole(rawRole);
    if (!roleValidation.valid) {
      return new Response(
        JSON.stringify({ error: roleValidation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const role = roleValidation.value;

    // Rate limiting: Check recent invitations from this admin
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
    const { count: recentInvitesCount, error: countError } = await supabaseAdmin
      .from("invitations")
      .select("id", { count: "exact", head: true })
      .eq("invited_by", user.id)
      .gte("created_at", windowStart);

    if (countError) {
      console.error("Failed to check rate limit:", countError);
      // Continue anyway - don't block on rate limit check failure
    } else if (recentInvitesCount !== null && recentInvitesCount >= RATE_LIMIT_MAX) {
      console.warn(`Rate limit exceeded for user ${user.id}: ${recentInvitesCount} invites in last ${RATE_LIMIT_WINDOW_MINUTES} minutes`);
      return new Response(
        JSON.stringify({ error: `Rate limit exceeded. Please wait before sending more invitations.` }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing invitation request for ${email} with role ${role} by admin ${user.id}`);

    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("Failed to check existing users:", listError);
      return new Response(
        JSON.stringify({ error: "Failed to process invitation. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email);
    
    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "A user with this email already exists" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if there's already a pending invitation for this email
    const { data: existingInvite } = await supabaseAdmin
      .from("invitations")
      .select("id")
      .eq("email", email)
      .eq("status", "pending")
      .maybeSingle();

    if (existingInvite) {
      return new Response(
        JSON.stringify({ error: "An invitation has already been sent to this email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send invitation using Supabase's built-in invite
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);

    if (inviteError) {
      console.error("Failed to send invitation:", inviteError);
      return new Response(
        JSON.stringify({ error: "Failed to send invitation. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store the invitation record
    const { error: insertError } = await supabaseAdmin
      .from("invitations")
      .insert({
        email,
        invited_by: user.id,
        role: role,
      });

    if (insertError) {
      console.error("Failed to store invitation record:", insertError);
      // Don't fail the request, the invite was still sent
    }

    // If a specific role was requested, update the user_roles table
    if (role === "admin" && inviteData.user) {
      const { error: upsertError } = await supabaseAdmin
        .from("user_roles")
        .upsert({
          user_id: inviteData.user.id,
          role: "admin",
        });
      
      if (upsertError) {
        console.error("Failed to set admin role:", upsertError);
      }
    }

    console.log(`Invitation sent successfully to ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Invitation sent to ${email}` 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in send-invite function:", error);
    // Don't expose internal error details
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
