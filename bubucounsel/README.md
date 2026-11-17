# bubucounsel

부부·연인의 메신저 다툼 캡처를 올리면 AI가 대화를 읽고, 어디서 엇갈렸는지와 지금 뭐라고 보내면 좋을지 알려 주는 토스 미니앱입니다.

- 계획: [`PLAN.md`](./PLAN.md)
- 디자인 규칙: [`DESIGN.md`](./DESIGN.md)

## 구성

| 폴더 | 내용 |
| --- | --- |
| `app/` | 미니앱 화면 (Vite + React + 토스 WebView SDK) |
| `server/` | 분석 서버 (Node, Claude API). 대화 내용은 저장하지 않고 사용 횟수만 셉니다. |
| `shared/` | 앱과 서버가 함께 쓰는 분석 결과 형식, 예시 데이터 |

## 브라우저에서 실행하기

터미널 두 개가 필요합니다.

AI 없이 화면만 볼 때 (예시 결과를 돌려주는 가짜 분석기):

```bash
cd server && npm install && npm run dev:fake
```

```bash
cd app && npm install && VITE_API_URL=http://localhost:8787 npm run dev
```

실제 AI로 분석할 때는 `server/.env.example`을 참고해 `ANTHROPIC_API_KEY`를 넣고 서버를 이렇게 띄웁니다.

```bash
cd server && ALLOW_DEV_AUTH=1 npm run dev
```

## 점검

```bash
cd app && npm run typecheck && npm test
```

```bash
cd server && npm run typecheck && npm test
```

## 토스에 올리기

1. 앱인토스 콘솔에서 미니앱을 등록합니다. 앱 이름이 `app/apps-in-toss.config.ts`의 `appName`(`bubucounsel`)과 같아야 합니다.
2. `app/.env`에 운영 서버 주소(`VITE_API_URL`)와 광고 그룹 ID(`VITE_AD_GROUP_ID`)를 넣습니다.
3. 번들을 만들고 올립니다.

```bash
cd app && npm run build
```

```bash
cd app && npx ait deploy --api-key <콘솔_API_키>
```

4. 콘솔에서 받은 QR로 토스 앱에서 확인한 뒤 검토를 요청합니다.

서버에는 콘솔에서 발급한 mTLS 인증서(`TOSS_MTLS_CERT_FILE`, `TOSS_MTLS_KEY_FILE`)를 넣고 `ALLOW_DEV_AUTH`는 끕니다.
