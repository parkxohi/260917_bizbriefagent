#!/usr/bin/env node
// 로컬에서 수동으로 지금 바로 발송해보는 스크립트.
// 실제 "메일링 > 발송하기" 화면의 버튼과 같은 동작을 로컬에서 재현한다.
// 사용법: npm run send:now  (.env에 GMAIL_USER/GMAIL_APP_PASSWORD/BRIEFING_RECIPIENTS 필요)
require("dotenv").config();
const { buildTodaysEmail } = require("../lib/briefing");
const { sendBriefingEmail } = require("../lib/mailer");

async function main() {
  const { subject, html, briefing } = buildTodaysEmail({ dashboardUrl: process.env.DASHBOARD_URL });
  console.log("제목:", subject);
  console.log("이상징후 요약:");
  console.log("  판매:", briefing.issues.sales.map((i) => i.product).join(", ") || "없음");
  console.log("  생산:", briefing.issues.production.map((i) => i.product_type).join(", ") || "없음");
  console.log("  CAPA:", briefing.issues.capa.map((i) => i.line).join(", ") || "없음");
  console.log("  재고:", `${briefing.issues.inventory.length}개 제품`);

  try {
    const result = await sendBriefingEmail({ subject, html });
    console.log("발송 완료:", result);
  } catch (err) {
    console.error("발송 실패:", err.message);
    process.exitCode = 1;
  }
}

main();
