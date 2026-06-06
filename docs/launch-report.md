# 🌱 우리집 초록친구 — 최종 출시 보고서 (마스터 가이드)

> 작성: onboarding-specialist + product-orchestrator
> 작성일: 2026-06-06
> 대상: 사이트를 직접 출시하실 운영자님 (개발 지식 없으셔도 괜찮습니다)
> 읽는 법: 이 문서 한 장만 따라 하시면 **30분 안에** 사이트를 인터넷에 올릴 수 있습니다. 어려운 단계는 모두 전용 안내서로 연결해 두었습니다.

---

## 1. 한눈에 보는 요약 — 무엇이 다 만들어졌나요?

**"우리집 초록친구"는 50~60대 시니어가 자기 집에 맞는 식물을 1분 만에 찾도록 도와주는 정적 웹사이트입니다.** 가입·로그인·사진 없이, 질문 3개에 답하면 맞는 식물 3종을 추천합니다.

지금 시점에서 **완성된 것**은 다음과 같습니다.

| 영역 | 완성 내용 |
|---|---|
| 추천 도구 | 빛·물·목적(+경험) 질문 → 식물 3종 매칭. 어떤 답을 골라도 항상 3종 추천(검증 9/9 통과). |
| 식물 콘텐츠 | 실내 10종 + 텃밭 2종 = **총 12종** 데이터·케어가이드(편당 3,600~4,700자)·상세 페이지 완비. |
| 시니어 접근성 | 큰 글씨(18px+), 명도 대비 4.5:1+, 큰 버튼(48px+), 색만 의존 안 함 — **KWCAG 11항목 중 10개 완전 통과**(나머지 1개는 글자 토큰 1줄 권고). |
| 검색 노출(SEO) | sitemap·robots·구조화데이터(JSON-LD)·메타태그·롱테일 키워드 전략 준비 완료. |
| 수익 자리 | 애드센스 광고 슬롯(본문 하단만), 쿠팡 파트너스 링크 자리 — **ID만 채우면 작동**(미입력이어도 사이트는 정상). |
| 개인정보 | 폼·쿠키·저장 일절 없음. 퀴즈 답은 주소(URL)로만 잠깐 쓰이고 저장되지 않음 — 보안 감사 치명/높음 위험 0건. |

> **현재 상태 = 배포 직전(deploy-ready).** 코드와 콘텐츠는 다 끝났고, 남은 것은 **운영자님만 할 수 있는 배포 작업**(주소 받기, ID·사진 채우기)뿐입니다. 코드 결함이 남아서가 아닙니다.

---

## 2. 23명 팀 작업 현황표 (Wave PRE~5)

23명 멀티에이전트 팀이 5단계(Wave)로 작업했습니다. 각 단계의 주요 산출물과 상태입니다.

| Wave | 단계 | 주요 산출물 | 상태 |
|---|---|---|---|
| **PRE** | 골격 준비 | 23명 에이전트 정의, CLAUDE.md, 폴더 골격, 상태판 | ✅ 완료 |
| **1** | 기획·기준 | PRD, 아키텍처(정적사이트), plants.json(12종), 시니어 UX 가이드, 브랜드 | ✅ 완료 · GATE 1 통과 |
| **2** | 디자인·콘텐츠·코드 | 로고/파비콘, HTML/CSS 코어, config.js, match.js, 식물 상세 12편, 케어가이드 12편, 정책 3종, 제휴/광고 자리, SEO 메타·sitemap, 한글 교정 | ✅ 완료 · GATE 2 통과(12종 완전·매칭 검증) |
| **3** | 폴리싱 | KWCAG 감사, 브랜드·반응형, 모션, 문장 재검수 | ✅ 완료 |
| **4** | 교차 검토 | QA E2E, 코드리뷰, 보안 감사, 식물 정확성, 애드센스 준비 | ✅ 완료 · GATE 4 통과(검수 5종 치명 0) |
| **5** | 배포·확산·보고 | 배포 가이드, SEO 등록 가이드, 출시 마케팅, **본 출시 보고서** | ✅ 완료 |

### 핵심 품질 지표 (검수 결과)

| 지표 | 결과 | 출처 |
|---|---|---|
| 매칭 단위테스트 | **9 / 9 통과 (100%)** | `docs/qa/test-report.md` |
| 깨진 링크(내비/페이지/스크립트) | **0개** | `docs/qa/test-report.md` |
| 치명 결함(QA·코드리뷰·보안·KWCAG) | **0건** | 검수 4종 종합 |
| 보안 위험(치명/높음) | **0건** (중간 2·낮음 3 = 모두 배포 전 운영 항목) | `docs/security/audit.md` |
| 식물 정보 정확성 | 학명 오기 1건 **수정 완료**, 독성 표기 **12/12 정확** | `docs/plant-domain-audit.md` |
| KWCAG 2.2 통과율 | **10 / 11 항목 완전 통과 (90.9%)** | `docs/kwcag-audit.md` |
| 애드센스 준비도(기술·콘텐츠) | **8/8 항목 충족 (약 90%)** — 남은 10%는 배포 설정 | `docs/adsense-readiness.md` |
| Lighthouse 추정(모바일) | 성능 82~92, 접근성 95~100, 모범사례 92~100, SEO 95~100 | `docs/reviews/code-review.md` |

> 참고(정직한 보고): 식물 사진 12장은 아직 없어 **placeholder(준비 중 그림)** 로 표시됩니다(깨진 이미지 아님). 코드리뷰 중요 5건·경미 11건은 모두 개선 권고이며 **출시를 막는 결함이 아닙니다.**

---

## 3. 30분 출시 순서 (이대로 따라 하세요)

> 아래 7단계만 하면 사이트가 인터넷에 뜹니다. 각 단계의 **자세한 화면 안내**는 [`docs/deploy-cloudflare.md`](./deploy-cloudflare.md) 에 그림처럼 적혀 있습니다. 막히면 그 문서의 같은 번호 단락을 보세요.

- [ ] **① GitHub에 폴더 올리기 (push)** — 약 5분
  GitHub 가입 → 빈 저장소 `plant-friends` 만들기 → PowerShell에서 `git remote add origin ...` → `git push -u origin master`.
  자세히: deploy-cloudflare.md **1장**.

- [ ] **② Cloudflare Pages 연결** — 약 5분
  Cloudflare 가입 → Workers & Pages → Create application → Pages → Connect to Git → `plant-friends` 선택.
  ★ 빌드 설정 3가지: **Framework preset = `None`**, **Build command = 완전히 비움**, **Build output directory = `/`** (슬래시 하나).
  자세히: deploy-cloudflare.md **2장**.

- [ ] **③ 임시 주소(URL) 받기** — 1~2분
  배포가 끝나면 `https://plant-friends-xxx.pages.dev` 같은 주소가 나옵니다. **이 주소를 메모해 두세요.**
  자세히: deploy-cloudflare.md **3장**.

- [ ] **④ 임시 주소·임시 ID를 진짜 값으로 치환** — 약 7분 (가장 중요)
  `scripts\config.js`의 `SITE_URL`을 ③에서 받은 주소로 바꾸고, 사이트 전체에 박힌 `초록친구.example.pages.dev`(= `example.pages.dev`)를 PowerShell 일괄 치환 명령으로 한 번에 교체합니다(sitemap·robots·모든 HTML 포함).
  자세히: deploy-cloudflare.md **4장**(일괄 치환 명령 그대로 복사).

- [ ] **⑤ (선택) 식물 사진 12장 넣기** — 시간 여유 있을 때
  `public\plants\{id}.jpg` 형식으로 12장. 사진이 없어도 사이트는 "준비 중" 그림으로 정상 작동하니 **나중에 채워도 됩니다.**
  자세히: deploy-cloudflare.md **5장**, 출처는 `public\IMAGE-SOURCES.md`.

- [ ] **⑥ 바꾼 내용 다시 올리기 (재배포)** — 1~2분
  ```powershell
  cd C:\projects\plant-friends
  git add -A
  git commit -m "배포 주소 및 설정값 반영"
  git push
  ```
  push하면 Cloudflare가 **자동으로 다시 배포**합니다.
  자세히: deploy-cloudflare.md **4-4 / 7장**.

- [ ] **⑦ 휴대폰으로 최종 확인** — 약 3분
  시작 → 질문 3개 → 추천 3종 → 상세 페이지까지 끊김 없이 되는지, 글씨가 크고 잘 읽히는지, `사이트주소/sitemap.xml`에 임시 주소가 안 남았는지 확인.
  자세히: deploy-cloudflare.md **8장 체크리스트**.

> ⑤(사진)와 도메인 구입은 **선택**입니다. ①②③④⑥⑦만 하면 30분 안에 `*.pages.dev` 주소로 정식 공개됩니다.

---

## 4. 사용자가 반드시 채워야 하는 항목 (총 7가지)

아래 7가지는 **운영자님만 발급/입력할 수 있습니다.** "어디서 받나"와 "어느 파일에 넣나"를 함께 적었습니다. 사진·쿠팡 링크 외에는 대부분 `scripts\config.js` **한 파일**에서 관리됩니다.

| # | 항목 | 어디서 발급받나 | 어느 파일 어디에 넣나 | 안 넣으면? |
|---|---|---|---|---|
| 1 | **SITE_URL / 도메인** | Cloudflare 배포 시 자동(`*.pages.dev`) 또는 직접 구입한 도메인 | `scripts\config.js`의 `SITE_URL` + 전체 파일 일괄 치환(③④) | **필수.** 안 바꾸면 검색·공유·광고 미리보기가 모두 잘못됩니다. |
| 2 | **쿠팡 트래킹 ID** | [쿠팡 파트너스](https://partners.coupang.com) 가입·승인 후 대시보드(예 `AF1234567`) | `scripts\config.js`의 `COUPANG_TRACKING_ID` | 쿠팡 "구매" 버튼이 **검색 결과로 안전 폴백**(수수료는 안 잡힘). |
| 3 | **애드센스 클라이언트 ID** | [Google 애드센스](https://adsense.google.com) 가입·승인 후(`ca-pub-...`) | `scripts\config.js`의 `ADSENSE_CLIENT_ID` | 광고가 **로드되지 않음**(빈 슬롯, 에러 없음). |
| 4 | **카카오 JS 키** | [카카오 개발자센터](https://developers.kakao.com) 앱 등록 후 JavaScript 키 | `scripts\config.js`의 `KAKAO_JS_KEY` | 공유는 휴대폰 기본 공유(Web Share)→링크 복사로 **폴백**. |
| 5 | **문의 이메일** | 운영자님 실제 이메일(예 roclxo@gmail.com) | `scripts\config.js`의 `CONTACT_EMAIL` | privacy/contact 페이지 문의처가 placeholder로 노출 → **문의 불가**(보안 M-1). |
| 6 | **식물 사진 12장** | `public\IMAGE-SOURCES.md`의 무료·상업이용(CC0) 출처 | `public\plants\{id}.jpg` (12개 파일명 고정) | "준비 중" 그림으로 폴백(작동은 함, 애드센스 심사엔 불리). |
| 7 | **쿠팡 상품 링크** | 쿠팡 파트너스에서 상품별 [링크 만들기] | `packages\plants\plants.json`의 `coupang_url`(12개) + `packages\affiliate\coupang-links.json`(12종×4 = 48칸) | 검색 폴백으로 동작. **상세 채우는 법은 [`coupang-links-todo.md`](./coupang-links-todo.md).** |

> **순서 팁:** 1(주소)은 출시 필수, 5(이메일)는 정책 무효 방지를 위해 함께 권장. 2·3·4·6·7은 준비되는 대로 나중에 채워도 사이트가 깨지지 않습니다(안전 폴백 내장).

---

## 5. 출시 후 1주 체크리스트

첫 주는 무리하지 말고 **신뢰의 기반**을 까는 데 집중하세요. (자세한 4주 계획은 [`launch-marketing.md`](./launch-marketing.md))

- [ ] **애드센스 심사 신청** — *조건*: ⑤ 식물 사진 12장 업로드 + ③④ 도메인 치환 완료 후. (빈 사진 상태로 신청하면 "가치 있는 콘텐츠" 평가에 불리합니다. 근거 `adsense-readiness.md`)
- [ ] **검색엔진 등록** — 구글 Search Console + **네이버 서치어드바이저**(시니어 주 사용 — 최우선)에 사이트 등록·소유 확인·`sitemap.xml` 제출·색인 요청. 절차: [`seo-registration.md`](./seo-registration.md).
- [ ] **네이버 밴드/카페 1~2곳 자연 활동** — 가입 직후 글쓰기 금지. 며칠간 댓글·좋아요·인사로 신뢰부터. 도배·복붙 금지. (예시 글 `launch-marketing.md` 2장)
- [ ] **유튜브 60초 쇼츠 1개** — "처음 키워도 안 죽는 식물 3가지" 형식. 얼굴·촬영 없이 슬라이드+TTS로 제작 가능. (대본 `docs/social/youtube-script.md`)
- [ ] **지인·가족 피드백** — 카톡으로 결과 페이지를 공유해 보고, 휴대폰에서 잘 보이는지·이해되는지 솔직한 의견을 받습니다.
- [ ] **(권장) OG/카카오 디버거 1회 확인** — 카톡에 링크를 붙였을 때 미리보기 카드가 정상 노출되는지.

---

## 6. 알려진 한계·주의 (정직한 고지)

- **실제 식물 사진 미포함**: 현재 `public\plants\`에는 `placeholder.svg`(준비 중 그림)만 있습니다. 사진을 안 넣어도 폴백으로 깨지지 않지만, 채워야 보기 좋고 애드센스 심사에 유리합니다.
- **쿠팡/애드센스/카카오 ID 미입력 시 동작**: 광고는 **로드되지 않고**(빈 슬롯), 쿠팡 버튼은 **쿠팡 검색 페이지로 안전 폴백**하며(수수료 미발생), 공유는 휴대폰 기본 공유→링크 복사로 폴백합니다. 즉 **가짜 광고·가짜 링크가 나가지 않습니다.**
- **루트(/) 서빙 전제**: 이 사이트는 절대경로(`/quiz.html`, `/result.html`, `/packages/...`)를 씁니다. 반드시 **사이트 최상위(/)에서 서빙**해야 하며(Cloudflare Pages 기본값이 그러함), `file://`로 직접 열거나 하위 폴더에 올리면 페이지 이동·데이터 로드가 실패합니다.
- **수익 현실 기대치**: 시니어 원예 카테고리는 **쿠팡 수수료 약 3% 수준, 애드센스 CPC도 낮은 편**입니다. 단기 대박이 아니라, **흙·비료 같은 소모품 재구매 + 롱테일 검색 누적**으로 천천히 쌓는 모델입니다. 다행히 **호스팅·유지비는 0원**(Cloudflare Pages 무료)이라 손해 볼 구조는 아닙니다. 과장된 기대는 금물입니다.
- **배포 전 치환은 필수**: `example.pages.dev`와 `여기에_*` placeholder가 한 군데라도 남으면 그 페이지의 검색·공유·광고가 어긋납니다(④ 단계에서 일괄 치환 + 확인).
- **개선 권고 사항(출시는 가능)**: 코드리뷰 중요 5건(폰트 렌더블로킹, 상세 LCP 이미지, 점수 로직 중복 등)·KWCAG 글자 토큰 1줄·보안 SRI 등은 **나중에 손봐도 되는 품질 개선**이며 출시를 막지 않습니다.

---

## 7. 문서 색인 (docs/ 주요 문서)

| 문서 | 용도 (한 줄) |
|---|---|
| [`launch-report.md`](./launch-report.md) | **본 문서.** 30분 출시 마스터 가이드. |
| [`deploy-cloudflare.md`](./deploy-cloudflare.md) | 배포 단계별 상세(GitHub push → Cloudflare → 치환 → 사진). |
| [`seo-registration.md`](./seo-registration.md) | 구글·네이버·빙 검색엔진 등록과 색인 요청 절차. |
| [`launch-marketing.md`](./launch-marketing.md) | 시니어 대상 채널 전략·밴드/카페·유튜브·4주 캘린더. |
| [`adsense-readiness.md`](./adsense-readiness.md) | 애드센스 심사 준비도(8/8 충족)와 제출 전 운영자 할 일. |
| [`coupang-links-todo.md`](./coupang-links-todo.md) | 쿠팡 파트너스 링크 채우기 체크리스트(48칸). |
| [`qa/test-report.md`](./qa/test-report.md) | QA 검증(매칭 9/9, 깨진 링크 0, 치명 0). |
| [`security/audit.md`](./security/audit.md) | 보안·개인정보 감사(치명/높음 0, 미수집 확인). |
| [`reviews/code-review.md`](./reviews/code-review.md) | 코드 리뷰(치명 0)와 Lighthouse 추정 점수. |
| [`plant-domain-audit.md`](./plant-domain-audit.md) | 식물 정보 정확성(학명 1건 수정, 독성 12/12). |
| [`kwcag-audit.md`](./kwcag-audit.md) | 시니어 접근성 KWCAG 전수검사(10/11 통과). |
| `state.md` / `decisions.md` | 진행 상태판 / 자율 결정 로그. |

---

### 마지막 한마디

코드와 콘텐츠는 검수까지 끝나 **배포 직전 상태**입니다. 운영자님이 하실 일은 **주소 받고(③), 치환하고(④), 다시 올리는(⑥)** 흐름과 **7가지 값 채우기**뿐입니다. 사진·ID가 아직 없어도 사이트는 안전하게 작동하니, **먼저 띄우고 천천히 채워도** 괜찮습니다. 천천히, 막히면 deploy-cloudflare.md의 같은 번호를 보세요. 수고하셨습니다. 🌿
