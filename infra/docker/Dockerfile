# Node.js 20 Alpine 사용
FROM node:20-alpine

# 작업 디렉토리 설정
WORKDIR /app

# package.json, package-lock.json 복사
COPY package*.json ./

# 의존성 설치 (dev 제외)
RUN npm ci --omit=dev

# 소스 코드 복사
COPY . .

# 포트 설정
EXPOSE 4000

# 실행
CMD ["node", "index.js"]
