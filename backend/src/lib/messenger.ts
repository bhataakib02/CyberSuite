import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// Email Transporter (Standard SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Resend (Alternative high-deliverability email)
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(to: string, subject: string, body: string) {
  try {
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'CyberSuite <alerts@cybersuite.security>',
        to,
        subject,
        html: body,
      });
    } else {
      await transporter.sendMail({
        from: '"CyberSuite Intelligence" <alerts@cybersuite.local>',
        to,
        subject,
        html: body,
      });
    }
    console.log(`[Email] Sent to ${to}: ${subject}`);
  } catch (err) {
    console.error('[Email Error]', err);
  }
}

export async function sendSMS(to: string, message: string) {
  // Logic for Twilio or similar SMS gateway
  // Placeholder:
  console.log(`[SMS Simulation] To ${to}: ${message}`);
  
  // Example Twilio Implementation:
  // const client = require('twilio')(sid, auth);
  // await client.messages.create({ body: message, from: '+1234567890', to });
}

export async function sendWhatsApp(to: string, message: string) {
  // Logic for WhatsApp Business API or Twilio WhatsApp
  console.log(`[WhatsApp Simulation] To ${to}: ${message}`);
  
  // Example Twilio WhatsApp Implementation:
  // await client.messages.create({ body: message, from: 'whatsapp:+1234567890', to: `whatsapp:${to}` });
}
