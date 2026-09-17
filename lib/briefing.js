// 오늘의 Daily Briefing 이메일(제목+본문)을 조립하는 오케스트레이션 레이어.
// data.js(IO) + kpi.js(계산) + emailTemplate.js(렌더링)를 조합하기만 한다.
const { loadAll } = require("./data");
const { buildBriefing } = require("./kpi");
const { buildEmailHtml, buildIssueSections } = require("./emailTemplate");

function buildTodaysEmail(opts = {}) {
  const briefing = buildBriefing(loadAll());
  const issueCount = buildIssueSections(briefing).length;
  const subject = issueCount
    ? `[Biz Briefing] ${briefing.referenceDate} 확인이 필요한 이슈 ${issueCount}건`
    : `[Biz Briefing] ${briefing.referenceDate} 특이사항 없음`;
  const html = buildEmailHtml(briefing, opts);
  return { subject, html, briefing };
}

module.exports = { buildTodaysEmail };
