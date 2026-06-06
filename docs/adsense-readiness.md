# 애드센스 심사 준비 검수 보고서 (adsense-readiness)

> 검수 주체: affiliate-marketing-specialist
> 검수일: 2026-06-06
> 검수 방식: **소스 정적 검수만 수행(파일 수정 없음)**. 소스 `C:\projects\plant-friends\`
> 비고: 기존 `docs/adsense-checklist.md`는 일부 항목이 outdated(아래 §종합 참고). 본 문서가 최신 검증 결과입니다.

---

## 1. 체크리스트 검수 결과

| # | 항목 | 충족 여부 | 근거 | 보완 필요 |
|---|---|---|---|---|
| 1 | 실제 작동 기능 (quiz→result→매칭) | ✅ 충족 | `scripts/quiz.js`(Q1빛·Q2물·Q3목적·Q4경험) → URL 쿼리 전달 → `scripts/result.js`가 `plants.json` fetch 후 `scripts/match.js`의 `matchPlants()`로 점수 매칭·정렬·최소 3종 보장. 순수 함수 분리, 동적 "왜 맞는지" 이유 생성, 빈답/에러/로딩 상태 처리까지 완비. **실제 동작 구조 확인.** | 없음 |
| 2 | 콘텐츠 분량 | ✅ 충족 | 케어가이드 `packages/plants/care-guides/*.md` **12편** 전부 존재, 글자수 **3,634~4,759자**(모두 1,000자+ 크게 초과). 상세페이지 `plants/*.html` **12종 전부** 실제 콘텐츠 임베드(예: `sansevieria.html` 13,107자, H2 8개: 핵심정보·소개·햇빛·물·온도·실수·구매·어울리는식물 + HowTo/Breadcrumb 구조화데이터). JS 렌더가 아닌 정적 HTML 본문. | 없음 |
| 3 | 정책 3종 | ✅ 충족 | `privacy.html`(6,492자, 8개 섹션: 수집정보·쿠키/광고·쿠팡파트너스·제3자·아동보호·변경·문의 — 애드센스 필수 광고쿠키 고지 포함), `about.html`(5,536자, 운영목적·신뢰성·**수익 정직 고지**), `contact.html`(6,615자, 이메일문의·답변안내·FAQ). 3종 모두 존재·내용 충실. | 이메일은 `config.js`로 주입(현재 placeholder) |
| 4 | 광고 배치 정책 | ✅ 충족 | `.ad-slot`은 콘텐츠 페이지(guide·plants 12종·about·contact·privacy)에만, 그리고 **본문 최하단**에 위치(예: `sansevieria.html` 245줄 중 226줄 = 모든 본문·관련링크 뒤). **index/quiz/result에는 `.ad-slot` 0개**(재확인 완료). 결과·도구 위 배치 없음. | 없음 |
| 5 | sitemap.xml + robots.txt | ✅ 충족(유효) | `sitemap.xml`: 유효한 urlset, 메인·quiz·result·guide·정책3종·식물상세 12종 = 전 페이지 등록. `robots.txt`: `User-agent: *` / `Allow: /` + `Sitemap:` 지시. 둘 다 유효. | URL이 `https://example.pages.dev` placeholder → 배포 도메인으로 일괄 치환 필요 |
| 6 | 모바일 반응형·빠른 로딩 | ✅ 충족 | 검수한 8개 페이지 모두 `meta viewport` 존재. 외부 의존은 **Pretendard 폰트(jsDelivr CDN) 1건뿐**, `preconnect` 최적화 적용. CSS/JS는 전부 자체 호스팅(`styles/`, `scripts/`), 빌드 단계 없음, 이미지 `loading="lazy"`·`decoding="async"`. 외부 의존 최소 구조 확인. | 실기기 확인 권장(코드상 이상 없음) |
| 7 | 저작권 이미지 미사용 | ✅ 충족(준비중 반영) | `IMAGE-SOURCES.md`·`asset-licenses.md` 점검: 브랜드 자산(로고·파비콘·OG·placeholder)은 자체제작, 식물 사진 12종은 Unsplash/Pixabay/Pexels(전부 무료 상업이용·저작자표시 의무 없음) 큐레이션. **실제 `public/plants/*.jpg` 사진은 아직 없음**(placeholder.svg만 존재) → 추적표 상태 전부 `준비중`으로 정직 반영. 저작권 침해 자산 사용 없음. | 실제 사진 확정 시 작가/URL 기입 + 상태 `완료` 전환 |
| 8 | 애드센스 코드 주입 위치 | ✅ 충족 | `scripts/app.js` `App.loadAds()`: `CONFIG.ADSENSE_CLIENT_ID`가 placeholder(`여기에`/`PLACEHOLDER`)면 **로드 안 함**(`isPlaceholder` 가드). 실제 ID 채우면 adsbygoogle.js를 head에 1회 주입 + `.ad-slot__body`마다 `<ins class="adsbygoogle">` 자동 삽입. `.ad-slot` 있는 페이지에서만 `initCommon()`이 호출. **placeholder 동안 미로드, ID 주입 시 자동 로드 구조 확인.** | `config.js`에 실제 ID 입력만 하면 됨 |

**충족 8 / 미충족 0 / 부분(운영자 후속작업) — 코드·콘텐츠 측면은 전부 충족.**

---

## 2. 종합 판정

### 심사 제출 가능 여부: **조건부 가능 (코드·콘텐츠 준비 완료, 배포 설정만 남음)**

- 코드 구조, 콘텐츠 분량/품질, 정책 페이지, 광고 정책, sitemap/robots, 반응형, 저작권 안전성 — **검수 항목 8개 모두 충족.**
- 단, 애드센스는 **실제 라이브 도메인 + 실제 콘텐츠(특히 식물 사진)**가 있는 사이트를 심사합니다. 현재는 placeholder(도메인·ID·이미지) 상태이므로, 아래 운영자 필수 조치를 끝내고 배포한 뒤 제출해야 합니다.

### 심사 준비도(기술/콘텐츠 기준): **약 90%**
- 자동화·검증 가능한 영역(기능·콘텐츠·정책·광고배치·sitemap·반응형·저작권 안전성·광고로딩 가드) 100% 완료.
- 남은 약 10%는 **운영자만 할 수 있는 배포 설정**(실제 도메인 치환, 실제 ID 주입, 실제 사진 업로드, Search Console 등록)으로, 코드/콘텐츠 결함이 아닌 라이브 전환 작업.

---

## 3. 제출 전 사용자(운영자)가 해야 할 일

### 필수 (이거 안 하면 심사 부적합/반려 위험)
1. **실제 식물 사진 업로드** — `public/plants/{id}.jpg` 12종. `IMAGE-SOURCES.md`의 CC0/무료 출처에서 받아 800px·4:3 JPG로 저장. (현재 placeholder.svg만 폴백 중 → 빈 사진 상태로 제출 시 "가치 있는 콘텐츠" 평가에 불리.) 업로드 후 `docs/asset-licenses.md`에 작가/URL 기입 + 상태 `완료`로 변경.
2. **실제 배포 도메인 확정 + 치환** — 다음 3곳의 `https://example.pages.dev`(및 `초록친구.example.pages.dev`)를 실제 도메인으로 일괄 치환:
   - `scripts/config.js` `SITE_URL`
   - `sitemap.xml` 전체 `<loc>`
   - `robots.txt` `Sitemap:`
   - 각 `plants/*.html`·`guide.html` 구조화데이터(JSON-LD)의 절대 URL
3. **실제 ID 주입** — `scripts/config.js`의 placeholder 4개 교체:
   - `ADSENSE_CLIENT_ID` (예: `ca-pub-XXXXXXXX`) → 채우면 `.ad-slot`에 광고 자동 로드
   - `COUPANG_TRACKING_ID`, `KAKAO_JS_KEY`(공유용), `CONTACT_EMAIL`(정책/문의 페이지에 노출)

### 권장 (심사 통과율·색인 향상)
4. **배포 후 Google Search Console 등록** + `sitemap.xml` 제출, 색인 요청.
5. **실기기 모바일 확인** — 코드상 반응형 정상이나 실제 단말 1회 점검 권장.
6. **쿠팡 파트너스 링크 확정** — `packages/affiliate/coupang-links.json` placeholder 링크 실제 URL로(미설정 시 코드가 쿠팡 검색으로 안전 폴백하나, 수익화엔 실제 링크 필요. 심사 자체와는 무관).

### 참고 (오류 정정)
- 기존 `docs/adsense-checklist.md`는 (a) sitemap.xml·robots.txt를 "미충족"으로, (b) "상추·바질 상세 페이지 없음"으로, (c) 콘텐츠 분량을 "확인 필요"로 기재 — **모두 outdated.** 실제로는 sitemap/robots 존재, `plants/lettuce.html`·`plants/basil.html` 포함 12종 전부 존재, 전 케어가이드 1,000자+ 충족. 본 문서를 최신 기준으로 사용하세요.
