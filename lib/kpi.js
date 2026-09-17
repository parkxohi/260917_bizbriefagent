// KPI 계산 + 이상징후 판단 로직 (순수 함수, 파일 IO 없음 - data.js가 읽어온 배열을 받는다).
// 임계값 출처: "Biz Briefing Agent_과제정의서.md" STEP4 이하 확정 사항.

const REFERENCE_DATE = "2026-09-17";
const ELAPSED_DAYS = 16; // 9/1~9/16 실적 존재
const DAYS_IN_MONTH = 30; // 9월
const STANDARD_PCT = (ELAPSED_DAYS / DAYS_IN_MONTH) * 100; // 53.333...%
const SALES_PRODUCTION_THRESHOLD_PP = 5; // 표준 대비 ±5%p
const CAPA_THRESHOLD_PCT = 90; // 가동률 90% 이하면 이상
const INVENTORY_THRESHOLD_PCT = 5; // 부진재고 비율 5% 이상이면 이상
const SLOW_MOVING_DAYS = 60;

function round1(n) {
  return Math.round(n * 10) / 10;
}

function analyzeSales(salesRows) {
  const byProduct = new Map();
  for (const row of salesRows) {
    const key = row.product;
    if (!byProduct.has(key)) {
      byProduct.set(key, {
        product: row.product,
        product_type: row.product_type,
        line: row.line,
        qty: 0,
        target: row.monthly_target_qty,
      });
    }
    byProduct.get(key).qty += row.qty;
  }
  return [...byProduct.values()].map((p) => {
    const pct = (p.qty / p.target) * 100;
    const deviation = pct - STANDARD_PCT;
    return {
      product: p.product,
      product_type: p.product_type,
      line: p.line,
      pct: round1(pct),
      deviationPp: round1(deviation),
      isAnomaly: Math.abs(deviation) > SALES_PRODUCTION_THRESHOLD_PP,
    };
  });
}

function analyzeProduction(productionRows, productionTargets) {
  const byType = new Map();
  for (const row of productionRows) {
    byType.set(row.product_type, (byType.get(row.product_type) || 0) + row.qty);
  }
  return [...byType.entries()].map(([productType, qty]) => {
    const target = productionTargets[productType];
    const pct = (qty / target) * 100;
    const deviation = pct - STANDARD_PCT;
    return {
      product_type: productType,
      pct: round1(pct),
      deviationPp: round1(deviation),
      isAnomaly: Math.abs(deviation) > SALES_PRODUCTION_THRESHOLD_PP,
    };
  });
}

function analyzeCapa(capaRows) {
  const byLine = new Map();
  for (const row of capaRows) {
    if (!byLine.has(row.line)) byLine.set(row.line, { qty: 0, capByShift: new Map() });
    const entry = byLine.get(row.line);
    entry.qty += row.qty;
    entry.capByShift.set(row.shift, row.monthly_capa_qty_shift);
  }
  return [...byLine.entries()].map(([line, entry]) => {
    const totalCap = [...entry.capByShift.values()].reduce((a, b) => a + b, 0);
    const pct = (entry.qty / totalCap) * 100;
    return {
      line,
      pct: round1(pct),
      isAnomaly: pct <= CAPA_THRESHOLD_PCT,
    };
  });
}

function analyzeInventory(inventoryRows, referenceDate = REFERENCE_DATE) {
  const cutoff = new Date(referenceDate);
  cutoff.setDate(cutoff.getDate() - SLOW_MOVING_DAYS);

  const byProduct = new Map();
  for (const row of inventoryRows) {
    if (!byProduct.has(row.product)) {
      byProduct.set(row.product, { product: row.product, product_type: row.product_type, total: 0, slow: 0 });
    }
    const entry = byProduct.get(row.product);
    entry.total += row.remaining_qty;
    if (new Date(row.production_date) < cutoff) entry.slow += row.remaining_qty;
  }
  return [...byProduct.values()].map((p) => {
    const pct = (p.slow / p.total) * 100;
    return {
      product: p.product,
      product_type: p.product_type,
      pct: round1(pct),
      isAnomaly: pct >= INVENTORY_THRESHOLD_PCT,
    };
  });
}

// 최근 N일(D-2/D-1/D-0)의 "일일 실적 ÷ 일목표" 달성률 추이.
// 일목표 = 월목표 합계 ÷ 30. 실제 원본 수량으로 계산하며 하드코딩된 값은 없다.
function dailyAttainment(rows, { dateField = "date", qtyField = "qty", monthlyTargetTotal, lastNDates }) {
  const dailyTarget = monthlyTargetTotal / DAYS_IN_MONTH;
  return lastNDates.map((date) => {
    const total = rows.filter((r) => r[dateField] === date).reduce((s, r) => s + r[qtyField], 0);
    return { date, pct: round1((total / dailyTarget) * 100) };
  });
}

function uniqueSum(rows, groupKey, valueKey) {
  const seen = new Map();
  for (const r of rows) if (!seen.has(r[groupKey])) seen.set(r[groupKey], r[valueKey]);
  return [...seen.values()].reduce((a, b) => a + b, 0);
}

function lastNDates(rows, dateField, n) {
  return [...new Set(rows.map((r) => r[dateField]))].sort().slice(-n);
}

function analyzeInventoryByType(inventoryRows, referenceDate = REFERENCE_DATE) {
  const cutoff = new Date(referenceDate);
  cutoff.setDate(cutoff.getDate() - SLOW_MOVING_DAYS);

  const byType = new Map();
  for (const row of inventoryRows) {
    if (!byType.has(row.product_type)) byType.set(row.product_type, { total: 0, slow: 0 });
    const entry = byType.get(row.product_type);
    entry.total += row.remaining_qty;
    if (new Date(row.production_date) < cutoff) entry.slow += row.remaining_qty;
  }
  return [...byType.entries()]
    .map(([productType, e]) => ({
      product_type: productType,
      pct: round1((e.slow / e.total) * 100),
      isAnomaly: (e.slow / e.total) * 100 >= INVENTORY_THRESHOLD_PCT,
    }))
    .sort((a, b) => b.pct - a.pct);
}

function buildBriefing({ sales, production, productionTargets, capa, inventory }) {
  const salesResult = analyzeSales(sales);
  const productionResult = analyzeProduction(production, productionTargets);
  const capaResult = analyzeCapa(capa);
  const inventoryResult = analyzeInventory(inventory);
  const inventoryByType = analyzeInventoryByType(inventory);

  const salesMonthlyTargetTotal = uniqueSum(sales, "product", "monthly_target_qty");
  const productionMonthlyTargetTotal = Object.values(productionTargets).reduce((a, b) => a + b, 0);

  const salesTrend = dailyAttainment(sales, {
    monthlyTargetTotal: salesMonthlyTargetTotal,
    lastNDates: lastNDates(sales, "date", 3),
  });
  const productionTrend = dailyAttainment(production, {
    monthlyTargetTotal: productionMonthlyTargetTotal,
    lastNDates: lastNDates(production, "date", 3),
  });

  return {
    referenceDate: REFERENCE_DATE,
    standardPct: round1(STANDARD_PCT),
    sales: salesResult,
    production: productionResult,
    capa: capaResult,
    inventory: inventoryResult,
    inventoryByType,
    dailyTrend: { sales: salesTrend, production: productionTrend },
    issues: {
      sales: salesResult.filter((r) => r.isAnomaly),
      production: productionResult.filter((r) => r.isAnomaly),
      capa: capaResult.filter((r) => r.isAnomaly),
      inventory: inventoryResult.filter((r) => r.isAnomaly).sort((a, b) => b.pct - a.pct),
    },
  };
}

module.exports = {
  REFERENCE_DATE,
  STANDARD_PCT,
  analyzeSales,
  analyzeProduction,
  analyzeCapa,
  analyzeInventory,
  analyzeInventoryByType,
  buildBriefing,
};
