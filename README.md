# fhk-bff-server

프론트엔드와 내부 MSA 서비스 사이에 있는 BFF 서버입니다. 브라우저 요청을 서비스별 API로 라우팅하고, 로그인 이후 발급되는 JWT를 HttpOnly cookie로 관리합니다.

## Role

- `/api/security/**` 요청을 security-server로 전달
- `/api/ticketing/**` 요청을 reservation/payment 서비스로 전달
- access token과 refresh token을 `AT`, `RT` cookie로 관리
- 보호 API에서 401 응답이 발생하면 refresh token으로 토큰 재발급 후 요청 재시도
- 프론트엔드가 직접 내부 서비스 주소를 알지 않도록 API 진입점 단일화

## Request Flow

```text
React App
  -> fhk-bff-server
  -> route match
  -> target microservice
```

로그인 성공 시 security-server 응답의 access token과 refresh token을 BFF가 cookie로 내려줍니다. 이후 보호 API 요청은 cookie의 access token을 `Authorization: Bearer` 헤더로 변환해 내부 서비스에 전달합니다.

## Route Map

| Prefix | Target | Protected |
| --- | --- | --- |
| `/api/security` | fhk-security-server | Mixed |
| `/api/asset` | asset service | No |
| `/api/ticketing/reservation` | ticketing reservation service | Yes |
| `/api/ticketing/payment` | ticketing payment service | Yes |
| `/api/chatting/chat` | chatting service | Yes |
| `/api/chatting/notification` | notification service | Yes |
| `/api/financial/client` | financial customer service | Yes |
| `/api/financial/payment` | financial payment service | Yes |

## Tech Stack

- Node.js, Express 5
- Axios
- cookie-parser
- jsonwebtoken
- Docker, k3s

## Run Locally

```bash
npm install
npm start
```

대표 환경 변수입니다.

```env
PORT=4000
FHK_SECURITY_SERVER_URL=http://localhost:9000
FHK_TICKETING_RESERVATION_SERVICE_URL=http://localhost:9101
FHK_TICKETING_PAYMENT_SERVICE_URL=http://localhost:9102
```
