// Final.dc.html(블랙-골드) 디자인을 실제 이메일 HTML로 코드화.
// 입력은 kpi.js의 buildBriefing() 결과 하나뿐 — 문구를 데이터에서 생성한다(하드코딩 금지).
// 이메일 클라이언트 호환을 위해 전부 인라인 스타일로 작성한다.

const ACCENT = "#F5B942";
const BG = "#1C1917";
const CARD_BG = "#262220";
const BORDER = "#3A3530";
const TEXT = "#F5F1EA";
const TEXT_BODY = "#D6D3D1";
const TEXT_MUTED = "#A89F92";
const TEXT_FOOT = "#78716C";
const WARN = "#F5B942";
const DANGER = "#F87171";

function severityColor(severity) {
  return severity === "danger" ? DANGER : WARN;
}
function severityLabel(severity) {
  return severity === "danger" ? "위험" : "주의";
}
function severityBg(severity) {
  return severity === "danger" ? "rgba(239,68,68,0.15)" : "rgba(245,185,66,0.15)";
}

function sentenceForSales(issues, standardPct) {
  if (!issues.length) return null;
  const names = issues.map((i) => i.product).join(" · ");
  const values = issues.map((i) => `${i.pct}%`).join(", ");
  const subject = issues.length === 1 ? "해당 제품의" : "두 제품의";
  return {
    title: `${names} 판매 부진`,
    body: `${subject} 9월 누적 판매진척률이 각각 <strong>${values}</strong>로, 표준 진척률(${standardPct}%) 대비 5%p 이상 낮은 상태입니다.`,
    summary: `${names} 판매진척률이 표준 대비 5%p 이상 낮습니다.`,
    severity: "warn",
  };
}

function sentenceForProduction(issues, standardPct) {
  if (!issues.length) return null;
  const names = issues.map((i) => i.product_type).join(" · ");
  const values = issues.map((i) => `${i.pct}%`).join(", ");
  return {
    title: `${names} 생산 지연`,
    body: `${names} 생산진척률이 <strong>${values}</strong>로, 표준 진척률 대비 지연되고 있습니다.`,
    summary: `${names} 생산진척률이 표준 대비 지연되고 있습니다.`,
    severity: "warn",
  };
}

function sentenceForCapa(issues) {
  if (!issues.length) return null;
  const names = issues.map((i) => i.line).join(" · ");
  const values = issues.map((i) => `${i.pct}%`).join(", ");
  return {
    title: `${names} 가동률 저하`,
    body: `${names}의 CAPA 가동률이 <strong>${values}</strong>로, 기준선인 90%를 밑돌고 있습니다.`,
    summary: `${names} CAPA 가동률이 기준(90%)에 못 미칩니다.`,
    severity: "warn",
  };
}

function sentenceForInventory(issues) {
  if (!issues.length) return null;
  const top = issues.slice(0, 2).map((i) => `${i.product}(${i.pct}%)`).join(", ");
  return {
    title: `부진재고 ${issues.length}개 제품 누적`,
    body: `${top} 등 ${issues.length}개 제품에서 부진재고 비율이 기준(5%)을 초과했습니다.`,
    summary: `부진재고 ${issues.length}개 제품이 5% 기준을 초과했습니다 — 재고 소진 대책이 필요합니다.`,
    severity: "danger",
  };
}

function buildIssueSections(briefing) {
  const sections = [
    sentenceForSales(briefing.issues.sales, briefing.standardPct),
    sentenceForProduction(briefing.issues.production, briefing.standardPct),
    sentenceForCapa(briefing.issues.capa),
    sentenceForInventory(briefing.issues.inventory),
  ].filter(Boolean);
  return sections;
}

function issueCardHtml(section, index) {
  const color = severityColor(section.severity);
  const label = severityLabel(section.severity);
  const bg = severityBg(section.severity);
  return `
    <div style="border: 1px solid ${BORDER}; border-radius: 12px; padding: 18px 20px; background: ${CARD_BG}; margin-bottom: 14px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
        <div style="font-weight: 700; font-size: 15px; color: ${color};">${index + 1}. ${section.title}</div>
        <span style="flex: none; padding: 3px 9px; border-radius: 6px; font-size: 11px; font-weight: 700; background: ${bg}; color: ${color};">${label}</span>
      </div>
      <p style="margin: 0; font-size: 14px; line-height: 1.65; color: ${TEXT_BODY};">${section.body}</p>
    </div>`;
}

function priorityRowHtml(section, index) {
  const color = severityColor(section.severity);
  return `
    <div style="display: flex; gap: 12px; margin-bottom: 10px;">
      <span style="display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center; border-radius: 999px; background: ${color}; color: ${BG}; font-size: 12px; font-weight: 700;">${index + 1}</span>
      <span style="font-size: 14px; line-height: 1.5; color: #E7E0D6;">${section.summary}</span>
    </div>`;
}

function buildEmailHtml(briefing, opts = {}) {
  const dashboardUrl = opts.dashboardUrl || "#";
  const sections = buildIssueSections(briefing);
  const issueCards = sections.length
    ? sections.map(issueCardHtml).join("")
    : `<div style="border: 1px solid ${BORDER}; border-radius: 12px; padding: 18px 20px; background: ${CARD_BG};"><p style="margin:0; font-size:14px; color:${TEXT_BODY};">오늘은 임계값을 벗어난 이상징후가 없습니다.</p></div>`;
  const priorityRows = sections.length
    ? sections.map(priorityRowHtml).join("")
    : "";

  return `<!doctype html>
<html lang="ko">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0; background:${BG};">
<div style="max-width: 640px; margin: 0 auto; background: ${BG}; padding: 48px 44px; font-family: -apple-system, 'Apple SD Gothic Neo', system-ui, sans-serif; color: ${TEXT};">

  <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 26px;">
    <div>
      <div style="font-family: Georgia, 'Noto Serif KR', serif; font-size: 20px; font-weight: 700; color: ${ACCENT};">Biz Daily Briefing</div>
      <div style="font-size: 13px; color: ${TEXT_MUTED}; margin-top: 4px;">삼성디스플레이 / 중소형사업부</div>
    </div>
    <div style="font-size: 13px; color: ${TEXT_MUTED};">${briefing.referenceDate.replaceAll("-", ".")}</div>
  </div>

  <div style="font-size: 14px; color: ${TEXT_MUTED}; margin-bottom: 20px;">9월 1일~16일 누적 실적 기준 · 데이터 분석 결과</div>

  <div style="height: 1px; background: ${BORDER}; margin-bottom: 20px;"></div>

  <div style="margin-bottom: 20px;">${issueCards}</div>

  ${sections.length ? `
  <div style="margin-bottom: 20px;">
    <div style="font-weight: 700; font-size: 15px; color: ${TEXT}; margin-bottom: 12px;">AI 분석 Check Point</div>
    ${priorityRows}
  </div>` : ""}

  <a href="${dashboardUrl}" style="display: block; text-align: center; background: ${ACCENT}; color: ${BG}; text-decoration: none; padding: 15px; border-radius: 10px; font-weight: 700; font-size: 15px; margin-bottom: 20px;">Biz Insight 바로가기 ▶</a>

  <div style="font-size: 12px; color: ${TEXT_FOOT}; text-align: center;">본 메일은 Biz Insight Briefing Agent 시연용으로 발송되었습니다.</div>

</div>
</body>
</html>`;
}

module.exports = { buildEmailHtml, buildIssueSections };
