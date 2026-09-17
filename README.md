# Biz Briefing Agent

매일 아침 KPI(판매·생산·CAPA·부진재고) 이상징후를 AI가 분석해 이메일로 알려주는 Daily Briefing 서비스.
경영정보 대시보드(Biz Insight)와 메일링 관리 화면까지 포함한 capstone 과제.

과제 기획 전 과정(요구사항, 의사결정 로그)은 [`Biz Briefing Agent_과제정의서.md`](./Biz%20Briefing%20Agent_과제정의서.md) 참고.

## 빠른 시작

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000/dashboard.html 접속.

## 구조

```
data/            샘플 KPI 데이터 (sales/production/capa/inventory, json+csv)
lib/
  data.js        데이터 접근 (IO 전담)
  kpi.js         KPI 계산 + 이상징후 판정 (순수 함수)
  emailTemplate.js  이메일 HTML 렌더링
  mailer.js      Gmail SMTP 발송
  briefing.js    위 셋을 조합하는 오케스트레이션
api/
  briefing.js            대시보드가 fetch하는 조회 API
  send-daily-briefing.js Vercel Cron이 매일 08:00(KST) 호출하는 발송 API
  email-preview.js       "미리보기" 버튼이 여는 라우트
public/
  dashboard.html         경영정보 대시보드
  admin/                 메일링 관리(발송하기/발송 스케줄/수신처 관리)
scripts/
  dev-server.js   로컬 개발 서버 (Vercel 없이 api/+public/ 실행)
  send-now.js     로컬에서 수동 발송 테스트
  backlog-cli.cjs 작업 진행상황 추적 CLI
backlog.json      진행 상황 기록 (node scripts/backlog-cli.cjs list)
vercel.json       배포 설정 + Cron(매일 08:00 KST = 23:00 UTC)
```

## KPI 판정 기준

`lib/kpi.js`에 구현되어 있으며, 과제정의서 STEP4에서 확정한 값:

| KPI | 계산 | 이상 판정 |
|---|---|---|
| 판매진척률 | 일누적 판매량 ÷ 월목표 | 표준 진척률 대비 ±5%p |
| 생산진척률 | 일누적 생산량 ÷ 월목표 | 표준 진척률 대비 ±5%p |
| CAPA 가동률 | 일누적 생산량 ÷ 월CAPA | 90% 이하 |
| 부진재고비율 | 부진재고 ÷ 총재고 | 5% 이상 |

## 실제 이메일 발송 활성화

1. Google 계정 2단계 인증 → https://myaccount.google.com/apppasswords 에서 앱 비밀번호 발급
2. `.env.example`을 복사해 `.env`로 만들고 `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `BRIEFING_RECIPIENTS` 채우기 (`.env`는 git에 커밋되지 않음)
3. 수동 테스트: `npm run send:now`
4. 실제 화면에서: `/admin/send.html` → "지금 발송하기"

## 배포 (Vercel)

`vercel.json`에 매일 08:00 KST 자동 발송 Cron이 이미 설정되어 있음. Vercel에 배포 후 환경변수(GMAIL_USER, GMAIL_APP_PASSWORD, BRIEFING_RECIPIENTS)만 등록하면 바로 운영 전환 가능.

## 남은 이슈 / 로드맵

- Supabase 등 실 DB 연동 (현재 수신자 목록은 화면 내 임시 상태, 새로고침 시 초기화) — MVP 단계에서는 보류 결정
- 실제 Gmail 계정 연동 전까지는 `scripts/send-now.js`로 로컬 발송 테스트만 가능

## 참고 링크

- 실제 구현 화면 스냅샷: https://claude.ai/artifact/RebQqwZ94TXPyXtW6GcESe
- 발표자료(전체화면): https://claude.ai/artifact/WMR1vNSYtk4u4Gd1eh3LCt
