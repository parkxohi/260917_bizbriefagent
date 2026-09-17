// "발송하기" 화면의 "최근 발송 이력" 테이블이 fetch하는 조회 API.
const { readHistory } = require("../lib/sendHistory");

module.exports = function handler(req, res) {
  res.status(200).json(readHistory());
};
