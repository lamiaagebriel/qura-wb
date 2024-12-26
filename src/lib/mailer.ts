import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import { z } from "zod";

import { getDictionary } from "@/servers/locale";

import { Dictionary, Locale } from "./locale";
import { Validation, ValidationName } from "./validations";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT!),
  secure: Number(process.env.SMTP_PORT!) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

type Template = Omit<typeof templates, "base">;
export type MailerTemplateName = keyof Template;
export type MailerTemplateProps = {
  // Note: all props are object
  [K in MailerTemplateName]: Parameters<Template[K]>[0];
};

const templates = {
  base: ({ locale, content }: { locale: Locale; content: any }) => `
  <!DOCTYPE html>
  <html lang="${locale}" dir="${locale === "ar" ? "rtl" : "ltr"}">
    <head>
      <meta charset="UTF-8">
      <style>
        :root {
          --primary-color: #4a90e2;
          --text-color: #333;
          --background-color: #f4f4f4;
          --card-background: #ffffff;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          line-height: 1.6;
          color: var(--text-color);
          margin: 0;
          padding: 0;
          background-color: var(--background-color);
        }
        
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: var(--card-background);
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .header {
          background-color: var(--primary-color);
          color: white;
          padding: 20px;
          text-align: center;
        }
        
        .content {
          padding: 30px;
          background-color: var(--card-background);
        }
        
        .verification-code {
          text-align: center;
          font-size: 32px;
          font-weight: bold;
          color: var(--primary-color);
          margin: 20px 0;
          letter-spacing: 4px;
        }
        
        .footer {
          text-align: center;
          padding: 20px;
          color: #666;
          font-size: 12px;
          border-top: 1px solid #eee;
        }
        
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: var(--primary-color);
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
        }
        
        .info-text {
          font-size: 14px;
          color: #666;
          margin: 15px 0;
        }
      </style>
    </head>
    <body dir="${locale === "ar" ? "rtl" : "ltr"}">${content}</body>
  </html>
  `,
  "verify-email": async ({ ...data }: Validation["verify-email"]) => {
    const {
      locale,
      emails: { "verify-email": c },
    } = await getDictionary();

    return {
      subject: "Verify Email",
      html: templates.base({
        locale,
        content: `
      <div class="container">
        <div class="header">
          <h1>${c?.title}</h1>
        </div>
        <div class="content">
          <p>${c?.greeting},</p>
          <p>${c?.message}</p>
          
          <div class="verification-code">
            ${data.code}
          </div>
          
          <p class="info-text">${c?.validityMessage}</p>
          ${`<p class="info-text">${c?.helpText}</p>`}
          
          <p>${c?.contactMessage} <a href="mailto:${process.env.SMTP_USER}">${process.env.SMTP_USER}</a></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ConCom Services</p>
          <p>${process.env.SMTP_USER || ""}</p>
        </div>
      </div>
    `,
      }),
    };
  },

  "send-password-reset-link": async ({
    ...data
  }: Validation["password-reset-schema"]) => {
    const {
      locale,
      emails: { "password-reset-link": c },
    } = await getDictionary();

    return {
      subject: "Forgot password",
      html: templates.base({
        locale,
        content: `
      <div class="container">
        <div class="header">
          <h1>${c?.title}</h1>
        </div>
        <div class="content">
          <p>${c?.greeting},</p>
          <p>${c?.message} <a href="${data.token}">reset password now</a></p>
           
          <p class="info-text">${c?.validityMessage}</p> 
          ${`<p class="info-text">${c?.warningMessage}</p>`}
          
          <p>${c?.contactMessage} <a href="mailto:${process.env.SMTP_USER}">${process.env.SMTP_USER}</a></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ConCom Services</p>
          <p>${process.env.SMTP_USER || ""}</p>
        </div>
      </div>
    `,
      }),
    };
  },
};

export const mailer = {
  send: async <T extends MailerTemplateName>(
    to: Pick<Mail.Options, "to">["to"],
    template: T,
    options: MailerTemplateProps[T],
    props: Omit<Mail.Options, "to" | "html"> = {
      from: `ConCom Services ${process.env.SMTP_USER}`,
      sender: process.env.SMTP_USER,
    }
  ) => {
    const html = await templates?.[template]?.(options as any);
    return transporter.sendMail({ to, ...html, ...props });
  },
};
