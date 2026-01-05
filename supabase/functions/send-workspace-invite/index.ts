import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteEmailRequest {
  inviteeEmail: string;
  inviterEmail: string;
  workspaceName: string;
  role: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inviteeEmail, inviterEmail, workspaceName, role }: InviteEmailRequest = await req.json();

    console.log(`Sending workspace invite email to ${inviteeEmail}`);
    console.log(`Inviter: ${inviterEmail}, Workspace: ${workspaceName}, Role: ${role}`);

    const appUrl = Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '.lovableproject.com') || '';

    const emailResponse = await resend.emails.send({
      from: "Kiden <onboarding@resend.dev>",
      to: [inviteeEmail],
      subject: `You've been invited to collaborate on "${workspaceName}"`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
              🎉 You're Invited!
            </h1>
          </div>
          
          <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
            <p style="font-size: 18px; margin-top: 0;">
              Hi there! 👋
            </p>
            
            <p style="font-size: 16px;">
              <strong>${inviterEmail}</strong> has invited you to collaborate on their workspace 
              <strong style="color: #667eea;">"${workspaceName}"</strong> as a <strong>${role}</strong>.
            </p>
            
            <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin: 30px 0;">
              <h3 style="margin-top: 0; color: #374151;">What you can do as ${role === 'editor' ? 'an Editor' : 'a Viewer'}:</h3>
              ${role === 'editor' ? `
                <ul style="color: #6b7280; margin-bottom: 0;">
                  <li>Create and edit notes</li>
                  <li>Organize content in collections</li>
                  <li>Collaborate in real-time</li>
                </ul>
              ` : `
                <ul style="color: #6b7280; margin-bottom: 0;">
                  <li>View all workspace notes</li>
                  <li>Browse collections</li>
                  <li>See real-time updates</li>
                </ul>
              `}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${appUrl}/dashboard" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Open Dashboard
              </a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; text-align: center; margin-bottom: 0;">
              Sign in with <strong>${inviteeEmail}</strong> to access the workspace.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            <p>This invitation was sent by Kiden</p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error sending invitation email:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
