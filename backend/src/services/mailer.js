const nodemailer = require("nodemailer");

/**
 * SMTP qua biến môi trường:
 *   SMTP_HOST, SMTP_PORT (mặc định 587), SMTP_SECURE ('true' nếu cổng 465),
 *   SMTP_USER, SMTP_PASS, MAIL_FROM (địa chỉ From; mặc định SMTP_USER)
 */
function getTransport() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user ? { user, pass } : undefined,
  });
}

async function sendMail({ to, subject, text, html }) {
  const transport = getTransport();
  if (!transport) {
    const err = new Error(
      "Chưa cấu hình SMTP_HOST (và tùy chọn SMTP_*) trong .env",
    );
    err.code = "SMTP_NOT_CONFIGURED";
    throw err;
  }
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  if (!from) {
    const err = new Error("Thiếu MAIL_FROM hoặc SMTP_USER");
    err.code = "SMTP_NO_FROM";
    throw err;
  }
  await transport.sendMail({
    from,
    to,
    subject,
    text,
    html: html || undefined,
  });
}

module.exports = { getTransport, sendMail };
