# Cloudflare Pages 이전 안내

이 압축본은 네프티스 연합 교육처 프로젝트 소스와 로컬 로고 에셋을 포함합니다.

## 중요한 구조 안내

현재 프로젝트는 React/Vite 프론트엔드와 Express/tRPC 서버, MySQL, Manus OAuth를 함께 사용합니다. 따라서 **Cloudflare Pages 정적 배포만으로는 관리자 로그인, 교육 신청 저장, 설문 저장, 통계를 포함한 전체 기능이 실행되지 않습니다.**

Cloudflare로 완전히 이전하려면 다음 구성이 필요합니다.

- 프론트엔드: Cloudflare Pages 또는 Pages Functions
- API: Cloudflare Workers/Pages Functions로 Express/tRPC 라우터 이전 또는 별도 Node 서버 유지
- 데이터베이스: D1 또는 외부 MySQL/Postgres로 스키마와 DB 함수를 이전
- 파일/로고: `client/public/assets/`의 로컬 파일 사용
- 관리자 비밀번호: Cloudflare Secrets에 `NEPHTHYS_ADMIN_PASSWORD` 등록
- Manus OAuth: Cloudflare 환경에서 사용할 로그인 제공자와 callback URL 재설정

## 로컬 실행

```bash
pnpm install
pnpm check
pnpm dev
```

현재 서버 기능은 `server/`와 `drizzle/`에 있습니다. Cloudflare Pages에서 프론트엔드만 먼저 확인하려면 기존 API 주소를 연결하거나 API mock을 별도로 구성해야 합니다.
