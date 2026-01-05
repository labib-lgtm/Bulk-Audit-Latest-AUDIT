import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Email service is not configured. Please contact support." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);
    
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

    // Generate a signup link for the invited user
    const appUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", "") || "";
    const signupUrl = `${supabaseUrl.replace("https://", "https://").replace(".supabase.co", ".lovable.app")}/auth`;
    
    // Get the actual app URL from the request origin or use a fallback
    const origin = req.headers.get("origin") || "https://lynx-analytics.lovable.app";
    const inviteSignupUrl = `${origin}/auth?invite=true&email=${encodeURIComponent(email)}`;

    // Send invitation email using Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Lynx Analytics <onboarding@resend.dev>",
      to: [email],
      subject: "You've been invited to join Lynx Analytics",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 20px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">You're Invited! 🎉</h1>
            </div>
            <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                Hello,
              </p>
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
                You've been invited to join <strong>Lynx Analytics</strong> as a <strong style="color: #6366f1;">${role}</strong>.
              </p>
              <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">
                Click the button below to create your account and get started:
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteSignupUrl}" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                  Accept Invitation
                </a>
              </div>
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="font-size: 12px; color: #9ca3af; text-align: center;">
                © ${new Date().getFullYear()} Lynx Analytics. All rights reserved.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("Failed to send invitation email:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send invitation email. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email sent successfully:", emailData);

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
      // Don't fail the request, the invite email was still sent
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