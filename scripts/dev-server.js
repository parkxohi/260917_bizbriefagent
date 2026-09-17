#!/usr/bin/env node
// Vercel 없이 로컬에서 api/*.js + public/*를 그대로 띄워보는 초경량 개발 서버.
// 실제 배포 전 대시보드/발송 API 동작을 브라우저로 확인하는 용도.
require("dotenv").config();
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const url = require("node:url");

const ROOT = path.join(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const PORT = process.env.PORT || 3000;

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function withVercelShim(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (obj) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(obj));
  };
  return res;
}

async function handleApi(req, res, apiPath) {
  const modulePath = path.join(ROOT, "api", apiPath + ".js");
  if (!fs.existsSync(modulePath)) {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }
  delete require.cache[require.resolve(modulePath)];
  const handler = require(modulePath);
  withVercelShim(res);
  await handler(req, res);
}

function serveStatic(req, res, pathname) {
  let filePath = path.join(PUBLIC_DIR, pathname === "/" ? "dashboard.html" : pathname);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.statusCode = 404;
    res.end("Not found: " + pathname);
    return;
  }
  const ext = path.extname(filePath);
  res.setHeader("Content-Type", CONTENT_TYPES[ext] || "application/octet-stream");
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const { pathname } = url.parse(req.url);
  try {
    if (pathname.startsWith("/api/")) {
      await handleApi(req, res, pathname.slice(5));
    } else {
      serveStatic(req, res, pathname);
    }
  } catch (err) {
    res.statusCode = 500;
    res.end("서버 오류: " + err.message);
  }
});

server.listen(PORT, () => {
  console.log(`로컬 개발 서버: http://localhost:${PORT}/dashboard.html`);
});
