# 자동 콘텐츠 발행 설정 안내 (GitHub Actions)

이 문서는 "우리집 초록친구"의 **자동 글 발행 + 매일 복붙 게시물 + RSS**를 클라우드(깃허브 액션)에서 자동으로 돌리는 방법을 정리한 것입니다. 컴퓨터를 꺼 두어도 깃허브 서버가 정해진 시간에 알아서 실행합니다.

## 무엇이 자동으로 돌아가나요

| 워크플로 | 파일 | 실행 주기(KST) | 하는 일 | API 키 |
|---|---|---|---|---|
| 자동 글 발행 | `.github/workflows/auto-content.yml` | 월·수·금 09:00 (주 3회) | 큐의 다음 주제로 SEO 글 1편 생성 → `articles/`·허브·사이트맵·RSS 갱신 후 커밋 | **필요** (ANTHROPIC_API_KEY) |
| 복붙 게시물 | `.github/workflows/daily-posts.yml` | 매일 09:00 | 그날의 카페·밴드·카톡 복붙 글을 `docs/marketing/daily/`에 생성 후 커밋 | 불필요 |

> cron은 UTC 기준입니다. `0 0 * * 1,3,5` = 00:00 UTC = **09:00 KST** 월·수·금. 매일판은 `0 0 * * *`.

관련 스크립트(직접 실행도 가능, 프로젝트 루트에서):

```bash
node scripts/auto/generate-article.mjs        # 글 1편 발행(키 필요)
node scripts/auto/generate-article.mjs --dry  # 키 없이 큐 읽기·조립만 점검(파일 안 씀)
node scripts/auto/generate-posts.mjs          # 오늘 복붙 게시물 생성(키 불필요)
node scripts/auto/build-rss.mjs               # rss.xml 다시 만들기(키 불필요)
```

---

## ① ANTHROPIC_API_KEY 시크릿 등록 (글 발행에만 필요)

글 본문은 Anthropic(Claude) API로 생성합니다. **키는 코드/커밋에 절대 넣지 말고**, 깃허브 저장소의 암호화된 시크릿에만 넣습니다.

1. <https://console.anthropic.com> 접속 → 로그인 → **API Keys** 메뉴에서 새 키 발급(`sk-ant-...`). 한 번만 보이니 복사해 두세요.
2. 결제 수단 등록 후 약간의 크레딧 충전(아래 비용 안내 참고).
3. 깃허브 저장소 `roclxo-prog/plant-friends`로 이동 → **Settings → Secrets and variables → Actions → New repository secret**.
4. Name: `ANTHROPIC_API_KEY` / Secret: 발급받은 키 붙여넣기 → **Add secret**.

> 키를 등록하지 않으면 글 발행 워크플로는 **실패(커밋 안 됨)** 하고 사이트는 그대로 유지됩니다. 복붙 게시물·RSS는 키 없이도 정상 동작합니다.

### 비용 안내
- 모델: `claude-sonnet-4-6`. 글 1편당 토큰이 적어 **건당 몇 센트 수준**입니다.
- 주 3편 발행 기준 **월 약 $1~3** 정도면 충분합니다(분량·횟수에 따라 변동).
- 콘솔에서 사용량 한도(usage limit)를 걸어 두면 과금 사고를 예방할 수 있습니다.

---

## ② Actions(워크플로) 활성화

1. 저장소 상단 **Actions** 탭으로 이동.
2. 처음이면 "I understand my workflows, go ahead and enable them" 버튼으로 Actions를 켭니다.
3. 왼쪽 목록에서 **자동 글 발행 (주 3회)** / **복붙 게시물 생성 (매일)** 이 보이면 활성화된 것입니다.
4. 바로 한 번 돌려 보려면 워크플로 선택 → **Run workflow**(workflow_dispatch) 버튼으로 수동 실행.

> 액션이 커밋·푸시를 하려면 권한이 필요합니다. 워크플로에 `permissions: contents: write`가 이미 들어 있습니다. 만약 푸시가 거부되면 **Settings → Actions → General → Workflow permissions**에서 "Read and write permissions"를 켜 주세요.

발행 결과는 Cloudflare Pages가 깃허브 푸시를 감지해 자동 배포합니다(<https://plant-friends.pages.dev>).

---

## ③ 발행 주제 추가 / 편수·주기 조절

### 주제(글 큐) 추가
- 큐 파일: `scripts/auto/topics.json`.
- `status`가 `"queued"`인 **맨 위 항목부터 한 번에 한 편씩** 발행됩니다. 발행되면 `status: "published"`로 바뀌고 `date`(발행일)가 기록됩니다.
- 새 주제는 배열 맨 끝에 객체로 추가하세요. 필수 필드:
  - `slug`: 영문 소문자·하이픈만(파일명/URL이 됨, 예: `kitchen-plants`)
  - `title`: 글 제목
  - `main_keyword`, `sub_keywords`: SEO 키워드
  - `plant_ids`: 소개할 식물 id 배열 — 반드시 `packages/plants/plants.json`의 `id`와 일치해야 합니다.
  - `status`: 새 주제는 `"queued"`
- 선택 필드(없으면 자동 보강): `summary`(없으면 제목으로 생성), `thumb_id`(없으면 첫 식물), `diff_label`(없으면 main_keyword).
- 큐가 비면 글 워크플로는 아무 변경 없이 종료합니다(커밋 없음).

### 편수·주기 바꾸기
- `.github/workflows/auto-content.yml`의 `cron` 한 줄만 고치면 됩니다.
  - 주 2회(월·목): `0 0 * * 1,4`
  - 주 3회(월·수·금, 현재값): `0 0 * * 1,3,5`
  - 매일: `0 0 * * *`
- 한 번 실행에 항상 **글 1편**만 발행됩니다(같은 날 중복 실행해도 하루 1편 초과 금지 가드가 막습니다).

---

## ④ 일시중지 / 다시 켜기

- **잠깐 멈추기**: Actions 탭 → 해당 워크플로 선택 → 오른쪽 "···" → **Disable workflow**.
- **다시 켜기**: 같은 자리에서 **Enable workflow**.
- 글만 멈추고 복붙 게시물은 유지하는 식으로 워크플로별 개별 on/off가 가능합니다.
- 완전히 끄려면 해당 `.github/workflows/*.yml` 파일의 `schedule:` 블록을 주석 처리하거나 파일을 지우면 됩니다(수동 실행만 남기려면 `workflow_dispatch`만 두세요).

---

## ⑤ 애드센스 심사 중 주의

- 심사 기간에는 **갑작스러운 대량 발행보다 꾸준함**이 유리합니다. 현재 설정(주 2~3편)을 유지하길 권합니다.
- 자동 생성 글도 사람이 읽기 좋은 품질을 유지하도록 프롬프트에 강제되어 있습니다: 18px+ 디자인 시스템(템플릿 그대로), 존댓말, 절대경로 링크, 깨진 링크 0, **미검증 효능·과장 표현 금지**.
- 발행 직후 새 글을 한 번 눈으로 훑어보고, 어색한 문장이 있으면 손봐 주세요(자동화는 초안 생성이고, 최종 책임은 사람에게 있습니다).
- 심사 중 한 번에 너무 많은 글이 올라가는 것이 부담되면, 위 ③에서 주기를 주 2회로 낮추세요.

---

## 참고: RSS

- `rss.xml`(루트)은 글이 발행될 때 자동 재생성됩니다. `articles/*.html`의 제목·설명·canonical·발행일을 모읍니다.
- `index.html`·`articles.html` `<head>`에 `<link rel="alternate" type="application/rss+xml" href="/rss.xml">`가 들어 있어 구독기·검색엔진이 피드를 찾을 수 있습니다.
- 수동으로 다시 만들려면: `node scripts/auto/build-rss.mjs`.
