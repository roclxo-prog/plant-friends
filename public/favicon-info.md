# 파비콘 변환 안내 (favicon.svg → PNG)

`favicon.svg`는 모든 최신 브라우저에서 그대로 쓸 수 있습니다. 다만 일부 구형 브라우저와 iOS, 안드로이드 홈화면 아이콘은 PNG가 필요합니다. 아래 방법으로 PNG를 만들어 `public/`에 함께 넣어 주세요.

생성할 PNG 목록:

| 파일명 | 크기 | 용도 |
|---|---|---|
| `favicon-16.png` | 16×16 | 브라우저 탭 (작은) |
| `favicon-32.png` | 32×32 | 브라우저 탭 (기본) |
| `apple-touch-icon.png` | 180×180 | iOS 홈화면 아이콘 |
| `android-chrome-192.png` | 192×192 | 안드로이드 / PWA |
| `android-chrome-512.png` | 512×512 | 안드로이드 / PWA (스플래시) |

---

## 방법 1. 온라인 변환 도구 (설치 불필요, 가장 쉬움)

1. <https://realfavicongenerator.net/> 접속
2. `favicon.svg` 업로드
3. 각 플랫폼 미리보기 확인 후 "Generate" 클릭
4. 내려받은 묶음에서 위 표의 PNG들을 `public/` 폴더에 복사

또는 단순 SVG→PNG 한 장씩 변환만 원하면: <https://svgtopng.com/> 또는 <https://cloudconvert.com/svg-to-png> 에서 크기를 지정해 변환합니다.

---

## 방법 2. 명령어로 변환

### (a) ImageMagick

```bash
magick -background none favicon.svg -resize 16x16   favicon-16.png
magick -background none favicon.svg -resize 32x32   favicon-32.png
magick -background none favicon.svg -resize 180x180 apple-touch-icon.png
magick -background none favicon.svg -resize 192x192 android-chrome-192.png
magick -background none favicon.svg -resize 512x512 android-chrome-512.png
```

> 참고: favicon.svg는 크림 배경이 채워져 있어 `-background none`이어도 모서리만 투명하게 남습니다.

### (b) rsvg-convert (librsvg) — SVG 렌더링이 더 정확

```bash
rsvg-convert -w 16  -h 16  favicon.svg -o favicon-16.png
rsvg-convert -w 32  -h 32  favicon.svg -o favicon-32.png
rsvg-convert -w 180 -h 180 favicon.svg -o apple-touch-icon.png
rsvg-convert -w 192 -h 192 favicon.svg -o android-chrome-192.png
rsvg-convert -w 512 -h 512 favicon.svg -o android-chrome-512.png
```

### (c) Node 스크립트 (sharp 패키지)

```bash
npm i -D sharp
```

```js
// scripts/gen-favicons.mjs  →  node scripts/gen-favicons.mjs
import sharp from "sharp";
const sizes = {
  "favicon-16.png": 16,
  "favicon-32.png": 32,
  "apple-touch-icon.png": 180,
  "android-chrome-192.png": 192,
  "android-chrome-512.png": 512,
};
for (const [name, size] of Object.entries(sizes)) {
  await sharp("public/favicon.svg")
    .resize(size, size)
    .png()
    .toFile(`public/${name}`);
  console.log("생성:", name);
}
```

---

## HTML `<head>` 링크 태그 스니펫

아래를 `<head>` 안에 넣어 주세요. SVG를 우선 쓰고, PNG는 폴백·플랫폼별로 제공합니다.

```html
<!-- 최신 브라우저: SVG 우선 -->
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />

<!-- 폴백 PNG (구형 브라우저, 탭 아이콘) -->
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png" />
<link rel="icon" href="/favicon-16.png" sizes="16x16" type="image/png" />

<!-- iOS 홈화면 -->
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />

<!-- 안드로이드 / PWA (manifest 사용 시 아래는 manifest로 대체 가능) -->
<link rel="icon" href="/android-chrome-192.png" sizes="192x192" type="image/png" />
<link rel="icon" href="/android-chrome-512.png" sizes="512x512" type="image/png" />
```

### (선택) PWA를 쓴다면 `site.webmanifest`

```json
{
  "name": "우리집 초록친구",
  "short_name": "초록친구",
  "icons": [
    { "src": "/android-chrome-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/android-chrome-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "theme_color": "#2E7D32",
  "background_color": "#F5F0E1",
  "display": "standalone"
}
```

```html
<link rel="manifest" href="/site.webmanifest" />
<meta name="theme-color" content="#2E7D32" />
```
