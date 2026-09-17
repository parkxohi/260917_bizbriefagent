// 데이터 접근 전용 모듈. data/*.json을 읽어 그대로 반환한다.
// 계산/판정 로직은 여기 두지 않는다 (kpi.js 참고, 데이터-로직 분리 원칙).
const fs = require("node:fs");
const path = require("node:path");

const DATA_DIR = path.join(__dirname, "..", "data");

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), "utf8"));
}

function loadSales() {
  return readJson("sales.json");
}

function loadProduction() {
  return readJson("production.json");
}

function loadCapa() {
  return readJson("capa.json");
}

function loadInventory() {
  return readJson("inventory.json");
}

function loadProductionTargets() {
  return readJson("production_targets.json");
}

function loadAll() {
  return {
    sales: loadSales(),
    production: loadProduction(),
    productionTargets: loadProductionTargets(),
    capa: loadCapa(),
    inventory: loadInventory(),
  };
}

module.exports = {
  loadSales,
  loadProduction,
  loadProductionTargets,
  loadCapa,
  loadInventory,
  loadAll,
};
