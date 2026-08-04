import { Resend } from "resend"

const apiKey = process.env.RESEND_API_KEY
const from = process.env.EMAIL_FROM || "RetailCore <onboarding@resend.dev>"

const resend = apiKey ? new Resend(apiKey) : null

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!resend) {
    console.warn(
      "[email] RESEND_API_KEY not configured - skipping password reset email to",
      to
    )
    return
  }

  await resend.emails.send({
    from,
    to,
    subject: "Reset your RetailCore password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="margin-bottom: 8px;">RetailCore</h2>
        <p>We received a request to reset the password for your RetailCore account.</p>
        <p>This link expires in 1 hour:</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: #111; color: #fff; padding: 10px 20px; border-radius: 6px; text-decoration: none;">
            Reset password
          </a>
        </p>
        <p style="color: #666; font-size: 13px;">
          If you did not request this, you can safely ignore this email.
        </p>
      </div>
    `,
  })
}
