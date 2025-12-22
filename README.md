# fhk-financial-bff-server
FE-BE Bridge Server

소스 베이스 : https://github.com/mbc-group-4-two/mbc-dvd-market-bff 

주요 변경사항
동적 baseURL 결정: 요청이 들어오면 req.path를 분석하여 해당 서비스의 URL을 SERVICE_MAP에서 찾고, 해당 URL로 axios 요청을 보냅니다.

라우팅 테이블/맵 정의: 어떤 경로가 어떤 마이크로서비스로 가야 하는지를 정의하는 맵을 만듭니다.
