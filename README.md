# fhk-financial-bff-server
> FE-BE Bridge Server's Features
- **라우팅 테이블/맵 정의**
  - 서비스별 요청 경로와 내부 URL 매핑을 정의하여 중앙에서 관리
- **동적 Base URL 결정**
  - 들어오는 요청의 req.path를 분석하여 해당 서비스의 URL을 SERVICE_MAP에서 조회
  - 조회된 URL로 Axios 요청을 전송
- **FHK 팀 정책 반영 - Auth & Asset**
  - Auth: Access/Refresh Token 처리, 쿠키 기반 인증
  - Asset: 인증 없이 파일 업로드 및 다운로드 프록시 처리

>기술 스택
- Node.js 20 (ESM), Express 5
- Docker + K3s
- JWT Auth (AT/RT), Cookie 기반
- Axios Proxy to Microservices
- Multipart Upload with FormData + Multer

>Run Locally 수정 필요
```bash
cp .env.example .env
docker build -t fhk-bff-server .
docker run -p 4000:4000 --env-file .env fhk-bff-server
```
<hr></hr>

### 문제해결과정

<details>
   <summary><strong>Issue 1. Jenkins 배포단계 kubernetes pod의 타임아웃_251224</strong></summary><br/>

> 문제 상황
- Jenkins pipeline 중 `stage('Deploy to k3s (staging/prod, tagged only)') `단계에서 여러 차례 타임 아웃으로 배포 실패
> 원인 분석
- 이전에 배포를 완료한 이력이 있기에 그 이후의 주요 변경사항을 관찰
  1. Jenkins credentials에 docker-hub, git-token 적용할 타 사용자 등록
  2. Jenkinsfile 내부 도커 허브 registry 변경
  3. src 폴더 하위에 소스파일 배치
  4. docker 태그를 latest에서 동적 git-tag로 변경
> 해결 방법
- docker build, push, pull 모두 완료 되었고, 환경변수도 적절히 주입되었기에 1,2 배제
- 도커 이미지 인식 문제 의심 ->  4로 변경
- npm run dev시 소스파일 간의 import 오류 발생 -> 수정
- 로컬에서 dockerfile 내부 cmd 명령어로 실행 -> index.js => src/index.js
> 결론
- 디버깅할 때 이전 성공이력이 있다면 이후 변경사항 분석
- 배포 운영의 단계에만 치중되어 기본적인 로컬 실행 테스트를 잊지말 것
</details>

소스 베이스 : https://github.com/mbc-group-4-two/mbc-dvd-market-bff 
