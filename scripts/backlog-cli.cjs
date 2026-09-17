#!/usr/bin/env node
// 간이 backlog.json 조회/상태변경 CLI. 세션이 끊겨도 다음 세션이
// `list`/`ready`만으로 진행 상황을 바로 파악할 수 있게 하는 목적.
const fs = require("node:fs");
const path = require("node:path");

const FILE = path.join(__dirname, "..", "backlog.json");

function load() {
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}
function save(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + "\n", "utf8");
}
function parseFlags(argv) {
  const flags = {};
  for (const arg of argv) {
    if (arg.startsWith("--")) {
      const eq = arg.indexOf("=");
      if (eq === -1) flags[arg.slice(2)] = true;
      else flags[arg.slice(2, eq)] = arg.slice(eq + 1);
    }
  }
  return flags;
}

function printTask(t) {
  console.log(`[${t.status}] ${t.id} (${t.priority}/${t.category}) - ${t.title}`);
  if (t.deps?.length) console.log(`  deps: ${t.deps.join(", ")}`);
  console.log(`  done_when: ${t.done_when}`);
  if (t.note) console.log(`  note: ${t.note}`);
}

function cmdList(data, flags) {
  let tasks = data.tasks;
  if (flags.status) tasks = tasks.filter((t) => t.status === flags.status);
  tasks.forEach(printTask);
}

function cmdShow(data, id) {
  const t = data.tasks.find((x) => x.id === id);
  if (!t) return console.error(`[오류] 태스크 없음: ${id}`);
  printTask(t);
}

function cmdReady(data) {
  const doneIds = new Set(data.tasks.filter((t) => t.status === "done").map((t) => t.id));
  const ready = data.tasks.filter(
    (t) => t.status === "todo" && (t.deps || []).every((d) => doneIds.has(d)),
  );
  if (!ready.length) return console.log("(진행 가능한 todo 없음 - 의존성 확인)");
  ready.forEach(printTask);
}

function cmdSetStatus(data, id, flags) {
  const t = data.tasks.find((x) => x.id === id);
  if (!t) return console.error(`[오류] 태스크 없음: ${id}`);
  if (!flags.status) return console.error("[오류] --status= 필요");
  t.status = flags.status;
  if (flags.note) t.note = flags.note;
  save(data);
  console.log(`업데이트됨:`);
  printTask(t);
}

function main() {
  const [, , cmd, ...rest] = process.argv;
  const flags = parseFlags(rest);
  const positional = rest.filter((a) => !a.startsWith("--"));
  const data = load();

  switch (cmd) {
    case "list":
      return cmdList(data, flags);
    case "show":
      return cmdShow(data, positional[0]);
    case "ready":
      return cmdReady(data);
    case "set-status":
      return cmdSetStatus(data, positional[0], flags);
    default:
      console.log("사용법: node scripts/backlog-cli.cjs <list|show|ready|set-status> [options]");
  }
}

main();
