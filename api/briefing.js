// 대시보드 화면이 fetch로 읽어가는 조회 전용 API. 발송은 하지 않는다.
const { loadAll } = require("../lib/data");
const { buildBriefing } = require("../lib/kpi");

module.exports = function handler(req, res) {
  try {
    const briefing = buildBriefing(loadAll());
    res.status(200).json(briefing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
