# 우리집 초록친구 — CLAUDE.md

## 프로젝트
50~60대 시니어 맞춤 **식물 추천 정적 웹서비스**. 집 안 환경 질문 3개에 큰 버튼으로 답하면 우리집에 맞는 키우기 쉬운 식물 3종을 추천하고, 큰 글씨 키우는 법과 쿠팡 구매 링크를 제공한다.

## 기술 스택 (절대 고정)
- **HTML + CSS + Vanilla JS** 정적사이트. 빌드툴·프레임워크·npm 의존 **없음**.
- **데이터**: `plants.json` 단일 파일 (fetch).
- **배포**: GitHub → **Cloudflare Pages** (빌드 없음, output=루트).
- **인증 없음**: 가입·로그인·사진촬영 절대 요구 X.
- **설정 주입**: `config.js`의 `window.CONFIG`에 쿠팡·애드센스 ID placeholder. **NEXT_PUBLIC_ 등 빌드 환경변수 절대 금지.**
- **수익**: 쿠팡 파트너스(주) + 애드센스(보조) + 네이버 쇼핑커넥트(옵션).

## 팀 (23명, .claude/agents/)
- 총괄·검수(4): product-orchestrator, code-reviewer, qa-engineer, security-auditor
- 기획·아키텍처(2): req-lead, arch-lead
- 도메인·UX(2): plant-domain-expert, senior-ux-specialist
- 디자인(4): design-lead, ui-ux-specialist, brand-strategist, image-generator
- 개발(2): static-site-dev, prompt-engineer
- 콘텐츠·현지화(4): content-seo-writer, content-creator, copy-writer, korean-localizer
- 마케팅·수익·확산(5): marketing-lead, affiliate-marketing-specialist, seo-specialist, social-publisher, onboarding-specialist

## 랄프모드 (자율 실행)
- product-orchestrator가 사용자 답변 없이 Wave 루프를 돈다.
- 불확실 → 안전한 기본값으로 임시결정 + `docs/decisions.md` 기록.
- 상태는 `docs/state.md` 로 추적. 매 배치 종료 시 git commit + push.
- 의존성 없는 태스크는 한 메시지 다중 Task 병렬 디스패치(같은 파일 쓰는 태스크는 같은 배치 금지).

## Hard Rules (절대 금지)
1. 18px 미만 폰트 / 명도대비 4.5:1 미만
2. 광고를 도구·결과 위 배치 (콘텐츠 페이지 하단만)
3. 가입·로그인·사진촬영 요구
4. 독성 식물 추천 / 자동재생 비디오 / 모달 안의 모달
5. NEXT_PUBLIC_ 등 빌드 환경변수 (config.js만)
6. 자체 복잡 일러스트 SVG (로고·아이콘 단순 SVG는 허용)
7. 저작권 이미지 (CC0만)

## 디자인 토큰
- 컬러: 메인 `#2E7D32`(초록), 배경 `#F5F0E1`(크림), 포인트 `#5D4037`(브라운), 텍스트 `#1B1B1B`
- 폰트: Pretendard → Noto Sans KR 폴백
- 본문 18px+, 제목 24~32px, 버튼 48px+, 카드 선택 버튼 96px+

## 매칭 알고리즘 (PRD 5-2)
```
score = (light 일치 ? 3 : 0) + (water 허용 ? 3 : 0)
      + (purpose 포함 ? 2 : 0) + (초보 && 난이도'매우 쉬움' ? 1 : 0)
```
동점: 난이도 쉬운 순 → common(흔함) 순. 최소 3종 보장.

## 평가 기준
외부 95점 · KWCAG 2.2 100% · Lighthouse 90+ · 어색한 한자어/외래어 0개 · 자체 일러스트 SVG 0개
