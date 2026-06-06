# 보안·개인정보 감사 보고서 — 우리집 초록친구

- 감사자: security-auditor
- 감사일: 2026-06-06
- 대상 소스: `C:\projects\plant-friends\`
- 감사 성격: **읽기 전용(파일 수정 없음). 감사·보고만.**
- 사이트 유형: 빌드 단계 없는 정적 사이트(HTML/CSS/Vanilla JS), Cloudflare Pages 호스팅 가정

---

## 종합 결과

| 구분 | 개수 |
|---|---|
| 치명(Critical) 위험 | **0** |
| 높음(High) 위험 | **0** |
| 중간(Medium) 위험 | 2 |
| 낮음(Low) 위험 / 권고 | 3 |

**개인정보 미수집 확인: 통과.** 폼·input·storage·쿠키를 통한 개인식별정보(이름·전화·이메일·주소) 수집 코드가 전혀 없습니다. 퀴즈 답변은 URL 쿼리스트링으로만 전달되며 서버/스토리지 저장이 없습니다.

---

## 1. 감사 항목별 상세 (통과/실패 + 근거 + 조치)

### 항목 1 — 개인정보 미수집 · 스토리지 미사용 · 퀴즈 답변 URL 전용
**결과: 통과 (위험도 없음)**

근거:
- 전체 `*.html`/`*.js`에서 `<form>`, `<input>`, `<textarea>` **0건** (코드 검색 결과 매치 없음).
- `localStorage` / `sessionStorage` / `document.cookie` 직접 사용 **0건** (애플리케이션 코드에서 매치 없음).
- 퀴즈 답변은 URL 쿼리로만 전달:
  - `scripts/quiz.js:184-191` `finish()` — 답을 `light/water/purpose/level` 쿼리로 묶어 `window.location.assign("/result.html?...")` 이동. 저장 없음.
  - `scripts/result.js:15-27` `parseAnswers()` — `URLSearchParams`로 쿼리 파싱, **화이트리스트 검증**(허용값 외 무시) 후 사용. 추가 강점(임의 입력 차단).
- 답변값은 빛/물/목적/경험의 enum 코드일 뿐 개인식별정보가 아님.

조치: 불필요(현 설계 유지). 향후 분석 도구·쿠키동의 추가 시 본 항목 재감사 필요.

---

### 항목 2 — 가입·로그인·사진 촬영/업로드 없음
**결과: 통과 (위험도 없음)**

근거:
- 가입/로그인 폼·인증 스크립트 없음(항목 1의 form/input 0건과 동일 근거).
- `<input type="file">`, `getUserMedia`, `capture`, 카메라/사진 업로드 관련 코드 **0건**.
- `privacy.html:60-64` 고지(회원가입·로그인·사진 미요구)와 실제 동작 일치.

조치: 불필요.

---

### 항목 3 — 제3자 요청 최소화 / 추적 스크립트
**결과: 통과 (위험도 낮음 — 권고 1건)**

확인된 외부 도메인 호출 목록:

| 도메인 | 용도 | 로드 방식 | 개인정보처리방침 고지 |
|---|---|---|---|
| `cdn.jsdelivr.net` | Pretendard 웹폰트 CSS | 모든 페이지 `<head>` `<link>` | 방침에 미명시(권고 L-1) |
| `fonts.googleapis.com` / `fonts.gstatic.com` | Noto Sans KR 웹폰트 | 모든 페이지 `<head>` `<link>` | 방침에 미명시(권고 L-1) |
| `pagead2.googlesyndication.com` | 구글 애드센스 | `scripts/app.js:183`, **실제 ID일 때만** 동적 로드 | `privacy.html:71-74`, `5절` 고지됨 ✔ |
| `link.coupang.com` / `www.coupang.com` | 쿠팡 파트너스 구매·검색 링크 | `<a>` 클릭 시(스크립트 호출 아님) | `privacy.html:76-78`, `5절` 고지됨 ✔ |

- **추적 스크립트(GA/GTM/Pixel 등): 없음.** `gtag`, `google-analytics`, `googletagmanager`, `facebook`, `hotjar` 등 매치 0건.
- 애드센스는 `App.isPlaceholder()` 가드로 **placeholder인 현재는 로드되지 않음**(`app.js:178`). 실제 ID 주입 시에만 활성.
- 카카오: `KAKAO_JS_KEY` placeholder만 존재하고 **SDK를 실제로 로드하는 코드 없음**. 공유는 `navigator.share`(Web Share API) → 클립보드 복사 폴백(`app.js:107-145`)으로, 카카오 도메인 호출 0건. (설계 근거 `docs/decisions.md:16`)

조치(권고 L-1): 웹폰트 CDN(jsDelivr, Google Fonts)도 외부 요청에 IP·UA가 전달되므로, 개인정보처리방침 5절 "제3자" 목록에 폰트 CDN을 1줄 추가 권고. 위험은 낮음(폰트는 추적 목적 아님).

---

### 항목 4 — 개인정보처리방침 정확성
**결과: 통과 (위험도 중간 — M-1 문의처 placeholder)**

`privacy.html` ↔ 실제 동작 대조:

| 방침 문구 | 실제 동작 | 일치 |
|---|---|---|
| 회원가입·로그인·사진 미요구 (1절) | 해당 코드 없음 | 일치 ✔ |
| 이름·전화·주소 직접 미수집 (1절) | 폼/input 없음 | 일치 ✔ |
| 퀴즈 답은 링크(URL)에서만 잠깐 쓰임, 서버 저장 없음 (1절) | `quiz.js`/`result.js` URL 쿼리 전용 | 일치 ✔ |
| 문의 시에만 이메일·내용 전달 (2절) | `mailto:` 링크만(`contact.html:60`) | 일치 ✔ |
| 구글 애드센스 광고·쿠키 사용 (3절) | `app.js` 애드센스 동적 로드(ID 주입 시) | 일치 ✔ |
| 쿠팡 파트너스 수수료 (4절) | 쿠팡 링크 `rel="nofollow sponsored"` | 일치 ✔ |
| 제3자: 애드센스·쿠팡·Cloudflare Pages (5절) | 일치(단 폰트 CDN 누락 → L-1) | 대체로 일치 |
| 어린이 개인정보 미수집 (6절) | 해당 수집 없음 | 일치 ✔ |

- **과대고지/과소고지 없음.** 수집하지 않는데 수집한다고 하거나 그 반대인 표현 없음.
- `docs/content/privacy.md`와 `privacy.html` 본문 동일(8개 절 일치).

문제(M-1): 문의처 이메일이 `privacy.html:98`·`contact.html:60`에서 placeholder `여기에_이메일@example.com`로 노출됨. `app.js`의 `[data-contact-email]` 채움 로직도 placeholder일 때 placeholder를 그대로 표시(`app.js:216-217`). 방침상 문의처가 명목상 무효 → 사용자 문의 불가.

조치(M-1): 배포 전 `scripts/config.js`의 `CONTACT_EMAIL`을 실제 운영 이메일로 교체. (코드는 정상, **운영 데이터 미입력** 이슈)

---

### 항목 5 — 외부 스크립트 무결성 / 신뢰성
**결과: 통과 (위험도 중간 — M-2 SRI 부재)**

근거:
- 로드되는 외부 **스크립트** 도메인: `pagead2.googlesyndication.com`(애드센스) 단 하나. 모두 신뢰 가능한 1군 제공자.
- 의심스러운/난독화/알 수 없는 도메인 스크립트 **없음**.
- 외부 **스타일시트**: jsDelivr(`orioncactus/pretendard@v1.3.9` — 버전 고정 ✔), Google Fonts.

문제(M-2): jsDelivr Pretendard CSS `<link>`에 **SRI(`integrity`) 미적용**. 버전은 `@v1.3.9`로 고정되어 있으나, CDN 변조 시 무결성 검증이 없음. (검색 결과 `integrity=` 매치 0건)

조치(M-2 권고):
- jsDelivr Pretendard CSS `<link rel="stylesheet">`에 `integrity="sha384-..."` + `crossorigin="anonymous"` 추가 권고(이미 `crossorigin`은 있음).
- Google Fonts는 응답이 가변(폰트 URL 동적)이라 SRI 부적합 → 적용 제외 타당.
- 애드센스 스크립트는 구글이 동적 갱신하므로 SRI 부적합(정상).
- (선택) Cloudflare Pages `_headers`로 CSP 헤더 도입 시 허용 도메인을 위 4개로 제한 권고.

---

### 항목 6 — 비밀 노출
**결과: 통과 (위험도 없음)**

근거:
- `scripts/config.js`의 모든 값이 placeholder: `COUPANG_TRACKING_ID`, `ADSENSE_CLIENT_ID`, `KAKAO_JS_KEY`, `CONTACT_EMAIL`, `SITE_URL` 전부 `여기에_...`/`example` 형태(`config.js:8-14`).
- 전체 `*.js/*.html/*.json`에서 `api_key`/`secret`/`password`/`token`/`AKIA`/`ghp_`/`sk-`/`client_secret` 패턴 **0건**.
- 파일 주석에 "공개 가능한 클라이언트 ID만, 비밀키 금지" 명시(`config.js:6`) — 설계 의도 양호. 애드센스/쿠팡/카카오 키는 본래 클라이언트 공개 ID라 노출 자체가 보안문제 아님.
- `git status` 클린, 작업트리에 미커밋 비밀 없음.

참고(정보성): `config.js`는 git 추적 대상이며 `.gitignore`에 없음. 현재 placeholder만 있어 문제없으나, 향후 운영 키 주입 시 **실키가 저장소에 커밋되지 않도록** 배포 파이프라인에서만 치환하거나 `config.js`를 ignore 처리하는 운영수칙 권고(L-2). 단, 들어가는 값이 전부 공개 클라이언트 ID라 위험도는 낮음.

조치: 현 상태 문제없음. 배포 시 운영수칙 L-2 참고.

---

### 항목 7 — 외부 링크 `target="_blank"` 안전성
**결과: 통과 (위험도 없음)**

근거:
- 동적 생성 쿠팡 링크: `result.js:88` `target="_blank" rel="noopener nofollow sponsored"` ✔ (`noopener` 포함).
- 정적 식물 상세 페이지 쿠팡 버튼 12종: 모두 `rel="nofollow sponsored noopener" target="_blank"` ✔ (`plants/*.html:206-213`).
- `noreferrer`는 미포함이나, `noopener`가 있어 reverse tabnabbing(window.opener) 위험은 차단됨. 제휴 링크는 클릭 추적상 referrer가 필요할 수 있어 `noreferrer` 생략은 합리적.

조치: 불필요. (선택적으로 비제휴 외부 링크가 추가될 경우 `noreferrer`도 병기 권고)

---

## 2. 위험도별 요약 표

### 높음(High) / 치명(Critical)
| # | 항목 | 결과 | 근거 | 조치 |
|---|---|---|---|---|
| — | — | **없음** | — | — |

### 중간(Medium)
| # | 항목 | 결과 | 근거 | 조치 |
|---|---|---|---|---|
| M-1 | 문의처 이메일 placeholder | 미흡 | `privacy.html:98`, `contact.html:60`, `config.js:12` | 배포 전 `CONTACT_EMAIL` 실제값 주입 |
| M-2 | 외부 CSS(jsDelivr) SRI 부재 | 권고 | jsDelivr `<link>`에 `integrity=` 없음(전체 0건) | Pretendard CSS에 SRI 추가, (선택) CSP 헤더 도입 |

### 낮음(Low) / 권고
| # | 항목 | 결과 | 근거 | 조치 |
|---|---|---|---|---|
| L-1 | 방침 제3자 목록에 폰트 CDN 누락 | 권고 | `privacy.html:80-87` 5절 | 5절에 폰트 CDN(jsDelivr/Google Fonts) 1줄 추가 |
| L-2 | `config.js` git 추적(향후 실키 커밋 주의) | 정보성 | `.gitignore` 미포함, 현재 placeholder | 배포 파이프라인 치환 또는 ignore 운영수칙 |
| L-3 | 외부 링크 `noreferrer` 미병기 | 정보성 | 쿠팡 링크 `noopener`만 | 비제휴 외부 링크 추가 시 `noreferrer` 병기 |

---

## 3. 결론

- **치명(Critical) 위험: 0건.**
- **높음(High) 위험: 0건.**
- 중간 2건(M-1 문의처 미입력, M-2 SRI 권고), 낮음/권고 3건. 모두 배포 전 운영·하드닝 항목이며 코드 결함이 아님.
- **개인정보 미수집 확인 — 통과.** 본 사이트는 폼·input·localStorage·sessionStorage·cookie를 통한 개인식별정보(이름·전화·이메일·주소) 수집이 전혀 없고, 가입·로그인·사진 기능이 없으며, 추적 스크립트(GA 등)도 없다. 퀴즈 답변은 URL 쿼리스트링으로만 전달·검증되고 어디에도 저장되지 않는다. 외부 호출은 웹폰트·애드센스·쿠팡 4개 도메인으로 최소화되어 있고, 애드센스·쿠팡은 개인정보처리방침에 정확히 고지되어 있다. 비밀/실API키 하드코딩은 없다.

> 배포 직전 권고: (1) `config.js`의 `CONTACT_EMAIL` 실제값 주입(M-1), (2) jsDelivr CSS에 SRI 추가(M-2), (3) 개인정보처리방침 5절에 폰트 CDN 한 줄 추가(L-1).
