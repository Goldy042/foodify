import { Resend } from "resend";

type VerificationEmailInput = {
  to: string;
  token: string;
};

function getBaseUrl() {
  return process.env.APP_URL || "http://localhost:3000";
}

export async function sendVerificationEmail({ to, token }: VerificationEmailInput) {
  const verifyUrl = `${getBaseUrl()}/verify?token=${token}`;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Foodify <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn("RESEND_API_KEY is missing. Verification link:", verifyUrl);
    return { delivered: false, verifyUrl };
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to,
    subject: "Verify your Foodify email",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2 style="margin: 0 0 12px;">Verify your email</h2>
        <p style="margin: 0 0 16px;">
          Click the button below to verify your Foodify account and continue onboarding.
        </p>
        <a href="${verifyUrl}" style="display:inline-block;background:#e35b1d;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;">
          Verify email
        </a>
        <p style="margin: 16px 0 0; font-size: 12px; color: #6b6b6b;">
          If you did not request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  return { delivered: true, verifyUrl };
}
