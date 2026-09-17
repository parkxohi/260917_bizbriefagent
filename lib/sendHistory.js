// 발송 이력 저장 전용 모듈. data/send-history.json에 append-only로 기록한다.
// (실제 발송 로그이므로 샘플 데이터와 달리 git에는 올리지 않는다 — .gitignore 참고)
const fs = require("node:fs");
const path = require("node:path");

const FILE = path.join(__dirname, "..", "data", "send-history.json");

function readHistory() {
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8"));
  } catch {
    return [];
  }
}

function appendHistory(entry) {
  const history = readHistory();
  history.unshift(entry);
  fs.writeFileSync(FILE, JSON.stringify(history, null, 2) + "\n", "utf8");
  return history;
}

module.exports = { readHistory, appendHistory };
