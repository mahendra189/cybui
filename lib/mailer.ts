import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

type SendMailInput = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  from?: string;
};

let transporter: Transporter | null = null;

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error("SMTP_USER and SMTP_PASS must be set before sending mail.");
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

export async function sendMail({ from, to, subject, text, html, cc, bcc, replyTo }: SendMailInput) {
  const user = process.env.SMTP_USER;

  if (!user) {
    throw new Error("SMTP_USER must be set before sending mail.");
  }

  return getTransporter().sendMail({
    from: from ?? user,
    to,
    subject,
    text,
    html,
    cc,
    bcc,
    replyTo,
  });
}