// "메일링 > 발송하기" 화면의 "미리보기" 버튼이 여는 라우트.
// 실제 발송 없이, 오늘 발송될 이메일 HTML을 그대로 렌더링해서 보여준다.
const { buildTodaysEmail } = require("../lib/briefing");

module.exports = function handler(req, res) {
  try {
    const { html } = buildTodaysEmail({ dashboardUrl: process.env.DASHBOARD_URL || "/dashboard.html" });
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200);
    res.end(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
