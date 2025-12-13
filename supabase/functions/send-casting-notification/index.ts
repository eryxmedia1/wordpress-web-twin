import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CastingNotificationRequest {
  applicationId: string;
  applicantName: string;
  applicantEmail: string;
  showTitle: string;
  roleNames: string[];
  reelUrl?: string;
  location?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      applicationId,
      applicantName,
      applicantEmail,
      showTitle,
      roleNames,
      reelUrl,
      location,
    }: CastingNotificationRequest = await req.json();

    console.log("Sending casting notification for application:", applicationId);

    // Create Supabase client to fetch email config
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch casting email config (global emails)
    const { data: emailConfig } = await supabase
      .from("casting_email_config")
      .select("emails")
      .eq("email_type", "global")
      .eq("is_active", true)
      .single();

    // Default to a fallback email if no config
    const castingEmails = emailConfig?.emails?.length 
      ? emailConfig.emails 
      : ["casting@zoeratedtv.com"];

    const rolesText = roleNames.join(", ");
    const applicationUrl = `https://zoeratedtv.com/admin/casting-applications`;
    const profileUrl = `https://zoeratedtv.com/admin/casting-applications`;

    // Send notification to casting team
    const castingEmailResponse = await resend.emails.send({
      from: "Zoe RatedTV Casting <casting@zoeratedtv.com>",
      to: castingEmails,
      subject: `New Application: ${applicantName} for ${showTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1a1a2e; color: #ffffff; padding: 24px; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #d4af37; margin: 0;">Zoe RatedTV Casting</h1>
            <p style="color: #888; margin-top: 4px;">New Application Received</p>
          </div>
          
          <div style="background-color: #252540; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #d4af37; margin-top: 0;">${applicantName}</h2>
            <p style="margin: 8px 0;"><strong>Show:</strong> ${showTitle}</p>
            <p style="margin: 8px 0;"><strong>Role(s):</strong> ${rolesText}</p>
            ${location ? `<p style="margin: 8px 0;"><strong>Location:</strong> ${location}</p>` : ""}
            ${reelUrl ? `<p style="margin: 8px 0;"><strong>Reel:</strong> <a href="${reelUrl}" style="color: #d4af37;">${reelUrl}</a></p>` : ""}
          </div>
          
          <div style="text-align: center;">
            <a href="${applicationUrl}" style="display: inline-block; background-color: #d4af37; color: #1a1a2e; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 8px;">View Application</a>
            <a href="${profileUrl}" style="display: inline-block; background-color: transparent; color: #d4af37; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; border: 1px solid #d4af37;">View Profile</a>
          </div>
          
          <p style="color: #666; font-size: 12px; text-align: center; margin-top: 24px;">
            This is an automated message from Zoe RatedTV Casting Portal
          </p>
        </div>
      `,
    });

    console.log("Casting team email sent:", castingEmailResponse);

    // Send confirmation to applicant
    const applicantEmailResponse = await resend.emails.send({
      from: "Zoe RatedTV Casting <casting@zoeratedtv.com>",
      to: [applicantEmail],
      subject: `Application Received - ${showTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1a1a2e; color: #ffffff; padding: 24px; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #d4af37; margin: 0;">Zoe RatedTV</h1>
            <p style="color: #888; margin-top: 4px;">Casting Portal</p>
          </div>
          
          <h2 style="color: #ffffff;">Thank you for your application, ${applicantName}!</h2>
          
          <p>We have received your application for the following:</p>
          
          <div style="background-color: #252540; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong style="color: #d4af37;">Show:</strong> ${showTitle}</p>
            <p style="margin: 8px 0;"><strong style="color: #d4af37;">Role(s):</strong> ${rolesText}</p>
          </div>
          
          <h3 style="color: #d4af37;">What happens next?</h3>
          <ul style="color: #ccc; line-height: 1.8;">
            <li>Our casting team will review your application</li>
            <li>If you're a match, we'll reach out via email or phone</li>
            <li>You can track your application status in your dashboard</li>
          </ul>
          
          <div style="text-align: center; margin-top: 24px;">
            <a href="https://zoeratedtv.com/talent/dashboard" style="display: inline-block; background-color: #d4af37; color: #1a1a2e; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Your Dashboard</a>
          </div>
          
          <p style="color: #888; font-size: 14px; margin-top: 24px;">
            If you have any questions, please contact us at casting@zoeratedtv.com
          </p>
          
          <hr style="border: none; border-top: 1px solid #333; margin: 24px 0;">
          
          <p style="color: #666; font-size: 12px; text-align: center;">
            &copy; ${new Date().getFullYear()} Zoe RatedTV. All rights reserved.
          </p>
        </div>
      `,
    });

    console.log("Applicant confirmation email sent:", applicantEmailResponse);

    return new Response(
      JSON.stringify({ 
        success: true,
        castingEmail: castingEmailResponse,
        applicantEmail: applicantEmailResponse
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-casting-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
