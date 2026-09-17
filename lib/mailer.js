// Gmail SMTP + 앱 비밀번호 발송 모듈 (2026-09-17 확정 방식).
const nodemailer = require("nodemailer");

function createTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD 환경변수가 설정되지 않았습니다 (.env 확인)");
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

function getRecipients() {
  const raw = process.env.BRIEFING_RECIPIENTS || "";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

async function sendBriefingEmail({ subject, html }) {
  const transport = createTransport();
  const recipients = getRecipients();
  if (!recipients.length) {
    throw new Error("BRIEFING_RECIPIENTS 환경변수에 수신자가 없습니다");
  }
  const info = await transport.sendMail({
    from: `Biz Briefing Agent <${process.env.GMAIL_USER}>`,
    to: recipients.join(","),
    subject,
    html,
  });
  return { messageId: info.messageId, recipients };
}

module.exports = { sendBriefingEmail, getRecipients };
