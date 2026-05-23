# 나만의 옷장

사용자가 보유한 옷을 AI로 등록·관리하고, 안 입는 옷은 중고 판매로, 필요한 옷은 개인화 추천으로 연결해주는 모바일 웹 서비스입니다.
현재는 MVP 이전 단계로, 이메일 로그인/회원가입과 빈 옷장 페이지까지 구현되어 있습니다.

## 기술 스택

- **Framework**: Next.js 16 (App Router, TypeScript)
- **DB / Auth**: Supabase (Row Level Security 적용)
- **스타일**: Tailwind CSS v4
- **패키지 매니저**: pnpm

## 셋업 순서

### 1. 의존성 설치

```bash
pnpm install
```

### 2. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. **Project Settings → API**에서 `Project URL`과 `anon public` 키 복사
3. 프로젝트 루트의 `.env.local`에 입력:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. DB 스키마 적용

`supabase/migrations/0001_init.sql` 파일 내용을 복사하여 **Supabase 대시보드 → SQL Editor**에 붙여넣고 실행하세요.

### 4. Supabase 이메일 인증 설정

**Authentication → Providers → Email** 에서:
- **Enable Email Provider**: 활성화
- **Confirm email**: 개발 중에는 비활성화하면 이메일 확인 없이 즉시 로그인 가능

### 5. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속 → 로그인 → 빈 옷장 페이지 확인

## 다음 단계 (현재 범위 밖)

- 사진 1장 업로드 + AI 속성 자동 추출 (Gemini Vision)
- Gmail 영수증 자동 파싱으로 구매 이력 등록
- 오래 안 입은 옷 알림 기능
- 중고 마켓 연동 (당근, 번개장터 등)

---

## 결정 메모

- Next.js 16에서 `middleware.ts`가 `proxy.ts`로 이름이 변경되어 해당 규칙을 따랐습니다.
- 이미지 컴포넌트는 외부 URL 도메인 설정 없이도 동작하도록 `<img>` 태그를 사용했습니다 (다음 단계에서 Storage 연동 시 `next/image`로 교체 예정).
- 회원가입 시 이메일 확인(Confirm email)을 Supabase 기본값에 위임합니다. 개발 환경에서는 비활성화를 권장합니다.
