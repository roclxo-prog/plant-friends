# Cloudflare Pages 배포 가이드 — 우리집 초록친구

> 이 문서는 컴퓨터를 자주 다루지 않는 분도 **그대로 따라 하면** 사이트를 인터넷에 올릴 수 있도록
> 한 단계씩 자세히 안내합니다. 어려운 말은 풀어서 설명했으니 천천히 따라오시면 됩니다.
>
> **중요한 전제 한 가지**: 이 사이트는 "빌드(build, 프로그램을 조립하는 과정)"가 **전혀 없습니다.**
> 우리가 만든 HTML 파일이 그대로 인터넷에 올라갑니다. 그래서 설치할 프로그램도, 복잡한 설정도 거의 없습니다.
> 아래에서 **"빌드 명령은 비워 두기"**, **"출력 폴더는 루트(/)"** 이 두 가지만 기억하시면 됩니다.

---

## 전체 흐름 한눈에 보기

1. GitHub(깃허브)라는 곳에 우리 폴더를 올립니다. (사진을 인터넷 사진첩에 올리는 것과 비슷합니다.)
2. Cloudflare(클라우드플레어)가 그 GitHub를 보고 사이트를 자동으로 띄워 줍니다.
3. 처음에는 `초록친구.example.pages.dev` 같은 임시 주소가 생깁니다.
4. 주소가 정해졌으니, 파일 안에 적어 둔 **임시 주소·임시 ID들을 진짜 값으로 바꿔** 줍니다.
5. 식물 사진 12장을 넣습니다.
6. (원하시면) 직접 산 도메인 주소를 연결합니다.
7. 이후에는 파일을 고치고 올리기만 하면 **자동으로** 다시 배포됩니다.

---

## 1. 사전 준비 — GitHub에 폴더 올리기

### 1-1. GitHub 계정 만들기
1. 웹 브라우저(크롬 등)에서 **https://github.com** 에 접속합니다.
2. 화면 **오른쪽 위**의 **`Sign up`(가입)** 버튼을 누릅니다.
3. 이메일(예: `roclxo@gmail.com`), 비밀번호, 사용자 이름을 차례로 입력합니다.
4. 가입이 끝나면 이메일로 온 인증 메일의 버튼을 눌러 인증을 마칩니다.

### 1-2. 빈 저장소(repository) 만들기
"저장소"는 우리 폴더를 통째로 올려 둘 인터넷 보관함입니다.

1. GitHub 로그인 후, 화면 **오른쪽 위의 `+` 모양**을 누르고 **`New repository`(새 저장소)** 를 선택합니다.
2. **`Repository name`(저장소 이름)** 칸에 `plant-friends` 라고 입력합니다.
3. 공개 범위는 **`Public`(공개)** 으로 둡니다. (검색 노출에 유리합니다.)
4. 아래의 **`Add a README`, `.gitignore`, `license` 체크박스는 모두 비워 둡니다.** (우리 폴더에 이미 파일이 있어서, 체크하면 충돌이 납니다.)
5. 초록색 **`Create repository`(저장소 만들기)** 버튼을 누릅니다.
6. 다음 화면에 나오는 주소(예: `https://github.com/내아이디/plant-friends.git`)를 **메모해 둡니다.** 곧 사용합니다.

### 1-3. 내 컴퓨터의 폴더를 GitHub로 올리기 (push)

이 폴더(`C:\projects\plant-friends\`)에는 이미 git이 준비되어 있고, 커밋(저장 기록)도 있습니다.
다만 **"어디로 올릴지(원격 주소)"가 아직 설정되어 있지 않습니다.** 아래 명령으로 연결만 해 주면 됩니다.

> **명령 입력 방법**: 윈도우 시작 메뉴에서 **`PowerShell`** 을 찾아 엽니다.
> 아래 첫 줄을 입력하고 Enter, 다음 줄을 입력하고 Enter… 이렇게 한 줄씩 실행합니다.

먼저 폴더로 이동합니다.

```powershell
cd C:\projects\plant-friends
```

올릴 원격 주소를 연결합니다. **아래의 `내아이디` 부분만 본인 GitHub 아이디로 바꾸세요.**

```powershell
git remote add origin https://github.com/내아이디/plant-friends.git
```

잘 연결됐는지 확인합니다. (주소가 두 줄 보이면 정상입니다.)

```powershell
git remote -v
```

이제 GitHub로 올립니다. 현재 브랜치(작업 가지) 이름은 `master` 입니다.

```powershell
git push -u origin master
```

> - 명령을 실행하면 **GitHub 로그인 창**이 한 번 뜰 수 있습니다. 아이디·비밀번호(또는 안내되는 인증)를 입력하면 됩니다.
> - 다 올라간 뒤, GitHub의 저장소 페이지를 **새로고침(F5)** 하면 우리 파일들(`index.html` 등)이 보입니다. 보이면 성공입니다.

> **참고**: 혹시 위 `git remote add` 명령에서 "이미 origin이 있다"는 메시지가 나오면, 주소를 바꾸는 아래 명령을 대신 쓰세요.
> ```powershell
> git remote set-url origin https://github.com/내아이디/plant-friends.git
> ```

---

## 2. Cloudflare Pages에 연결하기

### 2-1. Cloudflare 가입
1. 브라우저에서 **https://dash.cloudflare.com/sign-up** 에 접속합니다.
2. 이메일과 비밀번호를 입력하고 가입합니다. (무료 요금제로 충분합니다.)
3. 가입 후 받은 인증 메일의 버튼을 눌러 인증을 마칩니다.

### 2-2. Pages 메뉴로 이동
1. 로그인하면 보이는 **왼쪽 세로 메뉴**에서 **`Compute (Workers)`** 또는 **`Workers & Pages`** 항목을 누릅니다.
   (메뉴 이름은 시기에 따라 조금 다를 수 있지만, **`Pages`** 라는 단어가 들어간 항목을 찾으면 됩니다.)
2. 화면에 나타나는 **`Create application`(만들기)** 버튼을 누른 뒤, 위쪽 탭에서 **`Pages`** 를 선택합니다.
3. **`Connect to Git`(깃에 연결)** 버튼을 누릅니다.

### 2-3. GitHub 저장소 선택
1. **`Connect GitHub`** 를 누르면 GitHub 로그인/권한 허용 화면으로 넘어갑니다. 안내대로 **`Authorize`(허용)** 를 누릅니다.
2. 권한을 줄 저장소를 고르라고 하면, 방금 만든 **`plant-friends`** 를 선택하고 허용합니다.
3. Cloudflare 화면으로 돌아오면 목록에서 **`plant-friends`** 를 고르고 **`Begin setup`(설정 시작)** 을 누릅니다.

### 2-4. ★ 빌드 설정 — 가장 중요한 단계

이 화면에서 **딱 세 가지**만 정확히 맞추면 됩니다. 우리 사이트는 빌드가 없으므로 **비워 두는 칸이 핵심**입니다.

| 항목 (화면에 보이는 영어) | 입력할 값 | 설명 |
| --- | --- | --- |
| **Framework preset** (프레임워크 프리셋) | **`None`** | 목록을 열어 맨 위/혹은 "None"을 고릅니다. 우리는 어떤 프레임워크도 쓰지 않습니다. |
| **Build command** (빌드 명령) | **(완전히 비움)** | 아무것도 입력하지 않습니다. 글자가 있다면 모두 지워 빈칸으로 둡니다. |
| **Build output directory** (출력 디렉터리) | **`/`** | 슬래시 하나만 입력합니다. 저장소 루트(맨 위 폴더)가 그대로 사이트입니다. |

> **꼭 확인하세요.** "빌드 명령"에 `npm run build` 같은 글자가 자동으로 채워져 있을 수 있습니다.
> 그대로 두면 배포가 실패합니다. **반드시 비워 주세요.** 우리 사이트는 조립 과정이 없습니다.

3. 아래쪽 **`Save and Deploy`(저장하고 배포)** 버튼을 누릅니다.

---

## 3. 첫 배포 후 주소(URL) 확인

1. 버튼을 누르면 잠시(보통 1~2분) 동안 진행 막대와 로그가 흐릅니다.
2. 끝나면 화면에 **`Success!`** 또는 큰 글씨로 **주소 링크**가 나타납니다.
   - 예: **`https://plant-friends-xxx.pages.dev`** (xxx 부분은 자동으로 정해집니다.)
3. 그 주소를 눌러 보면 우리 사이트가 인터넷에 뜬 것을 볼 수 있습니다.
4. 이 **`*.pages.dev` 주소를 메모해 두세요.** 바로 다음 4단계에서 파일에 적어 넣을 "진짜 주소"입니다.

> 이 단계에서는 식물 사진이 아직 없어 빈 사진(준비 중 그림)이 보일 수 있습니다. 정상입니다. 5단계에서 채웁니다.

---

## 4. ★ 배포 전/후 필수 치환 목록 (임시값 → 진짜값)

우리 파일 곳곳에는 임시 주소 **`초록친구.example.pages.dev`** 와 임시 ID들이 적혀 있습니다.
3단계에서 받은 **진짜 `*.pages.dev` 주소**(또는 나중에 연결할 도메인)로 바꿔 주어야 검색 노출·공유·광고가 제대로 동작합니다.

> **용어**: "치환"은 "찾아서 바꾸기"입니다. 메모장이나 코드 편집기의 **찾기·바꾸기(Ctrl+H)** 기능을 쓰면 한 번에 바꿀 수 있습니다.

### 4-1. 설정 파일 한 곳: `scripts\config.js`
이 파일 하나가 사이트 전체의 ID를 주입합니다. 따옴표 안의 값만 진짜 값으로 바꿉니다.

| 항목 | 현재(임시) 값 | 바꿀 값 예시 |
| --- | --- | --- |
| `SITE_URL` | `https://초록친구.example.pages.dev` | `https://plant-friends-xxx.pages.dev` (3단계 주소) |
| `COUPANG_TRACKING_ID` | `여기에_쿠팡_ID` | 쿠팡 파트너스에서 받은 ID |
| `ADSENSE_CLIENT_ID` | `여기에_애드센스_ID` | `ca-pub-...` 형태의 애드센스 ID |
| `KAKAO_JS_KEY` | `여기에_카카오_JS_키` | 카카오 개발자센터의 JavaScript 키 |
| `CONTACT_EMAIL` | `여기에_이메일@example.com` | 실제 연락 이메일 (예: roclxo@gmail.com) |

> **안심하세요.** 아직 쿠팡·애드센스·카카오 ID가 없다면 임시값(`여기에...`)을 그대로 두어도 사이트는 정상 동작합니다.
> 사이트가 임시값을 알아보고, 광고는 표시하지 않고 구매 버튼은 쿠팡 검색으로 자동 연결합니다. **준비되는 대로 나중에 채우면 됩니다.**
> 다만 **`SITE_URL` 만큼은 3단계 주소로 꼭 바꿔 주세요.** (공유·검색 노출에 직접 영향을 줍니다.)

### 4-2. 임시 주소가 박혀 있는 나머지 파일들
아래 파일들에는 `초록친구.example.pages.dev` 또는 `example.pages.dev` 라는 임시 주소가 들어 있습니다.
canonical(대표 주소), og(공유 카드 주소), JSON-LD(검색엔진용 정보), sitemap, robots 등에 쓰입니다.

| 파일 | 들어 있는 임시값 개수 | 무엇이 들어 있나 |
| --- | --- | --- |
| `sitemap.xml` | 21곳 | 모든 페이지의 전체 주소 |
| `robots.txt` | 2곳 | Sitemap 위치 등 |
| `index.html` | 8곳 | canonical / og:url / JSON-LD |
| `guide.html` | 16곳 | canonical / og:url / JSON-LD |
| `plants\sansevieria.html` | 7곳 | canonical / og:url / JSON-LD |
| `plants\spathiphyllum.html` | 7곳 | 〃 |
| `plants\succulent.html` | 7곳 | 〃 |
| `plants\scindapsus.html` | 7곳 | 〃 |
| `plants\zamioculcas.html` | 7곳 | 〃 |
| `plants\parlor_palm.html` | 7곳 | 〃 |
| `plants\rubber_plant.html` | 7곳 | 〃 |
| `plants\lucky_bamboo.html` | 7곳 | 〃 |
| `plants\phalaenopsis.html` | 7곳 | 〃 |
| `plants\ivy.html` | 7곳 | 〃 |
| `plants\lettuce.html` | 7곳 | 〃 |
| `plants\basil.html` | 7곳 | 〃 |

> 식물 상세 페이지는 12장 모두 각각 7곳씩 들어 있습니다.

### 4-3. 일괄 치환 요령 (한 번에 바꾸기)

여러 파일을 하나하나 고치면 빠뜨리기 쉽습니다. **PowerShell 명령으로 한 번에** 바꾸는 방법을 권장합니다.

> **먼저 본인 주소를 정합니다.** 아래 예시에서 `plant-friends-xxx.pages.dev` 부분을 **3단계에서 받은 본인 주소**로 바꾸세요.
> (도메인을 연결할 계획이라면 6단계 후 그 도메인으로 바꿔도 됩니다.)

PowerShell에서 폴더로 이동한 뒤 아래를 그대로 실행합니다.

```powershell
cd C:\projects\plant-friends
# 바꿀 대상: 모든 html, sitemap.xml, robots.txt, scripts\config.js
$old = "초록친구.example.pages.dev"
$new = "plant-friends-xxx.pages.dev"   # ← 본인 주소로 수정
Get-ChildItem -Recurse -Include *.html,*.xml,*.txt,*.js -File `
  | Where-Object { $_.FullName -notmatch "node_modules" } `
  | ForEach-Object {
      (Get-Content $_.FullName -Raw) -replace [regex]::Escape($old), $new `
        | Set-Content $_.FullName -Encoding utf8
    }
```

위 명령은 `초록친구.example.pages.dev` → `plant-friends-xxx.pages.dev` 로 전부 바꿉니다.
혹시 `초록친구.` 없이 `example.pages.dev` 만 남은 곳이 있는지 확인하려면 다음으로 검색합니다.

```powershell
Select-String -Path .\**\*.html, .\sitemap.xml, .\robots.txt -Pattern "example.pages.dev"
```

> 위 검색에서 아무것도 안 나오면 깨끗이 바뀐 것입니다.
> 손이 익숙지 않다면, 코드 편집기(예: VS Code)에서 폴더를 열고 **Ctrl+Shift+H(전체 찾기·바꾸기)** 로
> `초록친구.example.pages.dev` 를 본인 주소로 바꾸는 방법도 동일하게 안전합니다.

`scripts\config.js` 안의 쿠팡/애드센스/카카오/이메일 값은 자동 치환 대상이 아니므로 **메모장으로 직접 열어** 4-1 표대로 채웁니다.

### 4-4. 바꾼 내용 다시 올리기
치환을 마쳤으면 GitHub로 다시 올립니다. (자세한 내용은 7단계 참고)

```powershell
cd C:\projects\plant-friends
git add -A
git commit -m "배포 주소 및 설정값 반영"
git push
```

push가 끝나면 Cloudflare가 **자동으로 다시 배포**합니다. 잠시 후 사이트에 반영됩니다.

---

## 5. 실제 식물 사진 12장 올리기

식물 사진은 `public\plants\` 폴더에 **`{id}.jpg`** 라는 이름으로 넣습니다.
`{id}` 는 식물마다 정해진 영어 이름표입니다. 아래 12개가 전부입니다.

| 식물 | 넣을 파일 이름 |
| --- | --- |
| 산세베리아 | `public\plants\sansevieria.jpg` |
| 스파티필름 | `public\plants\spathiphyllum.jpg` |
| 다육식물 | `public\plants\succulent.jpg` |
| 스킨답서스 | `public\plants\scindapsus.jpg` |
| 금전수 | `public\plants\zamioculcas.jpg` |
| 테이블야자 | `public\plants\parlor_palm.jpg` |
| 고무나무 | `public\plants\rubber_plant.jpg` |
| 행운목 | `public\plants\lucky_bamboo.jpg` |
| 호접란 | `public\plants\phalaenopsis.jpg` |
| 아이비 | `public\plants\ivy.jpg` |
| 상추 | `public\plants\lettuce.jpg` |
| 바질 | `public\plants\basil.jpg` |

### 5-1. 사진 구하기와 규격
- 어떤 사진을 어디서 받을지는 **`public\IMAGE-SOURCES.md`** 파일에 식물별 추천 출처(무료·상업 이용 가능)와 검색어가 정리되어 있습니다. 그 안내를 따르세요.
- **반드시 무료·상업 이용 가능(CC0 등) 사진만** 사용합니다. 출처가 불분명한 사진은 절대 쓰지 않습니다.
- 권장 규격: 가로 800px 이상, **4:3 비율**로 크롭, JPG 품질 80 내외.
- 사용한 사진의 작가·주소는 `docs\asset-licenses.md` 에 기록해 두세요.

### 5-2. 사진을 넣고 올리기
1. 윈도우 탐색기에서 `C:\projects\plant-friends\public\plants\` 폴더를 엽니다.
2. 받은 사진의 이름을 위 표의 이름과 **똑같이**(예: `sansevieria.jpg`) 바꿔 이 폴더에 넣습니다.
3. 다 넣었으면 GitHub로 올립니다.

```powershell
cd C:\projects\plant-friends
git add -A
git commit -m "식물 사진 12장 추가"
git push
```

### 5-3. 사진이 아직 없을 때 (폴백 동작)
사진을 다 준비하지 못해도 사이트는 **깨지지 않습니다.**
파일이 없는 식물은 화면에서 그 사진을 불러오다 실패하면, 자동으로 **`public\plants\placeholder.svg`(준비 중 그림)** 으로 바뀌고
대체 문구("사진을 준비 중이에요")가 표시됩니다. 그러니 **있는 사진부터 차례로 채워 넣어도** 됩니다.

---

## 6. (선택) 내 도메인 주소 연결하기

`*.pages.dev` 주소도 충분히 쓸 수 있지만, `우리집초록친구.com` 같은 **내 도메인**을 연결하면 더 보기 좋습니다.

### 6-1. 도메인 구입
- 가비아(gabia), 후이즈(whois), 또는 Cloudflare 자체 Registrar 등에서 원하는 주소를 구입합니다. (보통 연 1~2만 원대)

### 6-2. Cloudflare Pages에 도메인 등록
1. Cloudflare 대시보드에서 우리 프로젝트(`plant-friends`)를 엽니다.
2. 위쪽 탭에서 **`Custom domains`(사용자 지정 도메인)** 를 누릅니다.
3. **`Set up a custom domain`** 을 누르고, 구입한 도메인(예: `우리집초록친구.com`)을 입력한 뒤 **`Continue`** 를 누릅니다.

### 6-3. DNS 연결
- 도메인을 **Cloudflare에서 샀다면**: 거의 자동으로 연결됩니다. 안내대로 **`Activate`(활성화)** 만 누르면 됩니다.
- **다른 곳에서 샀다면**: Cloudflare가 알려 주는 **네임서버(nameserver) 두 줄**을, 도메인을 구입한 사이트의 관리 화면에 그대로 입력합니다. (보통 "네임서버 변경" 메뉴) 반영까지 몇 시간 걸릴 수 있습니다.
- 연결되면 HTTPS(자물쇠) 보안 인증서가 **자동으로** 적용됩니다.

### 6-4. 주소 일치시키기
도메인을 연결했다면, **4단계의 치환을 그 도메인 주소로 다시** 해 주세요.
(`config.js`의 `SITE_URL`, 모든 HTML의 canonical·og, `sitemap.xml`, `robots.txt` 가 같은 도메인을 가리켜야 검색·공유가 정확해집니다.)
바꾼 뒤 4-4처럼 `git push` 하면 됩니다.

---

## 7. 재배포 — 앞으로 사이트 고치는 법

한 번 연결해 두면, 이후에는 **GitHub에 올리기만 하면 Cloudflare가 알아서 다시 배포**합니다.

```powershell
cd C:\projects\plant-friends
git add -A
git commit -m "내용 수정"   # 무엇을 고쳤는지 짧게 적습니다
git push
```

- push 후 Cloudflare 대시보드의 **`Deployments`(배포)** 탭에서 진행 상황을 볼 수 있습니다. 보통 1~2분이면 끝납니다.

### 캐시(임시 저장) 주의
- 브라우저가 예전 파일을 잠시 기억(캐시)하고 있어, 바꾼 내용이 **바로 안 보일 수 있습니다.**
  이럴 땐 **`Ctrl+F5`**(강력 새로고침)를 누르거나, 휴대폰이라면 잠시 후 다시 열어 보세요.
- 사진이나 스타일을 바꿨는데 갱신이 안 보이면, 파일 이름을 살짝 바꾸거나 `styles.css?v=2` 처럼 뒤에 버전 표시를 붙이는 방법도 있습니다.

---

## 8. 배포 점검 체크리스트 (마지막 확인)

사이트를 올린 뒤, **휴대폰으로** 직접 한 바퀴 둘러보며 아래를 확인하세요. 우리 사용자는 대부분 휴대폰으로 봅니다.

- [ ] **메인 흐름이 끊김 없이 진행되나요?**
      시작 화면(`index`) → "시작하기" → 질문 3개(빛·물·목적) → 추천 결과(식물 3종) → 식물 상세 페이지까지 자연스럽게 넘어가는지.
- [ ] **추천 결과가 항상 3종 나오나요?** 어떤 답을 골라도 빈 화면이 뜨지 않는지.
- [ ] **식물 사진이 잘 보이나요?** 사진을 넣은 식물은 사진이, 아직 없는 식물은 "준비 중" 그림이 보이는지.
- [ ] **모든 링크가 동작하나요?** 헤더·푸터의 메뉴(케어가이드, 소개, 개인정보, 문의), 각 식물의 "구매" 버튼, "공유" 버튼.
- [ ] **글씨가 크고 잘 읽히나요?** 휴대폰에서 글자가 너무 작지 않은지, 버튼이 누르기 쉬운지.
- [ ] **콘솔(개발자 도구) 에러가 없나요?**
      컴퓨터 브라우저에서 사이트를 열고 **`F12`** 를 누른 뒤 **`Console`(콘솔)** 탭을 봅니다. 빨간색 오류 메시지가 없으면 좋습니다.
      (사진 404 정도는 폴백으로 처리되니 큰 문제가 아니지만, 그 외 빨간 글씨가 많으면 확인이 필요합니다.)
- [ ] **주소가 본인 주소로 바뀌었나요?** 페이지 공유 시 미리보기 주소, 그리고 `사이트주소/sitemap.xml` 을 열어 임시 주소(`example.pages.dev`)가 남아 있지 않은지.
- [ ] **개인정보 안내가 보이나요?** `privacy.html` 에 "정보를 수집·저장하지 않는다"는 안내가 그대로 떠 있는지.

여기까지 모두 체크되면 배포가 잘 마무리된 것입니다. 수고하셨습니다.

---

### 한 줄 요약
- **빌드 없음**: Framework preset `None`, Build command **비움**, 출력 `/`.
- **꼭 바꿀 것**: `config.js`의 5개 값 + 모든 HTML·sitemap·robots의 임시 주소.
- **올리는 법**: 파일 고치고 `git push` → 자동 재배포.
