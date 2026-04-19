import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Once you verify a domain on Resend, change this in your .env to your domain email.
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

export const sendOTP = async (email: string, otp: string) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #3b82f6; text-align: center;">CYBERSUITE</h2>
      <p>Hello,</p>
      <p>Your verification code is:</p>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 10px; margin: 20px 0;">
        ${otp}
      </div>
      <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">Secure your digital life with CYBERSUITE.</p>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Verification Code for CYBERSUITE',
      html,
    });

    if (error) throw error;
    console.log(`[Resend] OTP sent to ${email}: ${data?.id}`);
    return data;
  } catch (err) {
    console.error('❌ [Resend] Error:', err);
    console.log('\n------------------------------------------');
    console.log(`🔑 DEV OTP FOR ${email}: ${otp}`);
    console.log('------------------------------------------\n');
    return { id: 'dev-mode' };
  }
};

export const sendResetLink = async (email: string, token: string) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #3b82f6; text-align: center;">CYBERSUITE</h2>
      <p>Hello,</p>
      <p>You requested to reset your password. Click the button below to proceed:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
      </div>
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #3b82f6;">${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">Secure your digital life with CYBERSUITE.</p>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Password Reset Link for CYBERSUITE',
      html,
    });

    if (error) throw error;
    console.log(`[Resend] Reset link sent to ${email}: ${data?.id}`);
    return data;
  } catch (err) {
    console.error('❌ [Resend] Error (Reset):', err);
    console.log('\n------------------------------------------');
    console.log(`🔗 DEV RESET LINK FOR ${email}: ${resetUrl}`);
    console.log('------------------------------------------\n');
    return { id: 'dev-mode' };
  }
};
