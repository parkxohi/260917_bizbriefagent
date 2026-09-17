// Vercel 서버리스 함수. vercel.json의 cron이 매일 08:00(KST)에 이 경로를 호출한다.
// "메일링 > 발송하기" 화면의 버튼도 결국 이 함수를 호출하도록 연결한다(mail-admin-pages 단계).
require("dotenv").config();
const { buildTodaysEmail } = require("../lib/briefing");
const { sendBriefingEmail } = require("../lib/mailer");

module.exports = async function handler(req, res) {
  // Vercel Cron이 보내는 요청인지 확인(수동 테스트 시에는 없어도 되지만,
  // 운영 환경에서는 CRON_SECRET을 vercel.json/env에 설정해 외부에서 함부로 못 부르게 한다).
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.authorization;
    if (auth !== `Bearer ${cronSecret}`) {
      res.status(401).json({ error: "unauthorized" });
      return;
    }
  }

  try {
    const { subject, html } = buildTodaysEmail({ dashboardUrl: process.env.DASHBOARD_URL });
    const result = await sendBriefingEmail({ subject, html });
    res.status(200).json({ ok: true, subject, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
