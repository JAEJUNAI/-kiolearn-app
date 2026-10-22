# 키오런 앱 (이름 미정) — Expo 단일 코드

안드로이드, iOS, 웹을 한 코드로 만든다. 화면 30개가 들어 있고, 서버가 붙기 전까지는 기기 안 저장소(개발 데이터)로 돈다.
기준 문서: `offer-submit-docs/앱기획_2026/05_서비스_운영정책.md`(규칙), `06_앱_기능_구현명세.md`(화면·API·데이터), `07_운영매뉴얼.md`.
화면 시안: https://claude.ai/artifact/JfKXQwf51b6qfUWWWaeyDv

## 실행

```
cd mobile
npm install
npx expo start          # 터미널의 QR을 Expo Go 앱으로 찍으면 폰에서 열린다
npx expo start --web    # 브라우저
npm run typecheck       # 타입 검사
npm run export:web      # dist/ 에 웹 빌드 (app.kiolearn.co.kr 에 올릴 파일)
```

개발 로그인: 전화번호 아무거나 11자리, 인증번호 아무 6자리. 강사는 "강사" 칩을 고르고 자격번호 `KL-DC-2026-0417`.
개발 효도권 코드 `KIO-7F3K-28QD`, 기관 코드 `YC-MOK-2026`. 더보기 맨 아래 "데이터 초기화"로 처음 상태로 돌아간다.

## 구조

```
app/                       expo-router 화면 (파일 경로 = 주소)
  login.tsx tour.tsx       G1/T1 로그인, 둘러보기
  (family)/                보호자 탭: home(G3) reports/(G5,G4) book(G6) more(G9)
  family/                  profile(G2) reschedule/[id](G7) invite(G8)
  (instructor)/            강사 탭: today(T3) schedule(T5) payout(T8) profile(T10)
  instructor/              settings(T2) assignment/[id](T4) lesson/[id](T6) report/[id](T7) certificate(T9)
  (senior)/                활동 탭: me(A1) today(A2) help(A3)
  connect/                 org(K1) org-posts(K2) gift(E1) jobs(W1)
  courses/                 index(P1) [id](P2) certs(P3)
src/theme.ts               색·서체·모서리 (nachocode 톤)
src/ui.tsx                 공용 컴포넌트 (Tile, Box, Btn, Chip, KV, Check, Input, Toggle, Seg …)
src/data/types.ts          데이터 타입 (서버 테이블과 열 이름을 맞춤)
src/data/store.ts          상태와 규칙: 상태기계(회차권·배정·수업·리포트), 정산 계산, 환불 계산, RULES 상수
src/data/mock.ts           개발용 시드
src/data/cards.ts          수업 카드 콘텐츠 (서버 lesson_cards 로 옮길 것)
src/lib/supabase.ts        Supabase 클라이언트와 API 호출 (env 없으면 꺼짐)
src/lib/fmt.ts             날짜·금액 표기
assets/fonts, assets/img   Pretendard, 시안 이미지
```

## 서버 붙이기 (다음 단계)

1. `.env.example`을 `.env`로 복사하고 Supabase URL·anon key를 넣으면 전화 OTP가 실제로 간다.
2. `store.ts`의 각 액션이 지금은 로컬만 바꾼다. 06 명세 8장의 API(`/assign/accept`, `/session/*`, `/report/submit`, `/pay/*`)를 `src/lib/supabase.ts`의 `api()`로 먼저 부르고, 응답으로 로컬을 갱신하는 순서로 바꾼다.
3. 읽기는 Supabase 클라이언트가 RLS로 직접 읽는다(06 명세 7장 테이블).
4. 결제는 토스페이먼츠 결제위젯을 웹뷰로 연다(`book.tsx`의 `pay()`).
5. 푸시는 Expo Push 토큰을 `accounts.push_tokens`에 저장한다.

## 스토어 제출 전

앱 이름과 아이콘(`app.json`), 번들 ID 확정, `app.json`의 권한 문구 확인, 계정 삭제(더보기)와 둘러보기(로그인 전) 동작 확인, 테스트 계정 2개 준비. 자세한 것은 03 개발기획서 9~10장.
