import nodemailer, { type TransportOptions } from "nodemailer";
import { Resend } from 'resend';

const smtpPort = Number(process.env.SMTP_PORT || 465);
export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "127.0.0.1",
    port: smtpPort,
    secure: smtpPort === 465,
    auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    } : null,
} as TransportOptions);


const api_key = process.env.RESEND_API_KEY;
export const resend = new Resend(api_key);