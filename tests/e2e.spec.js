/* =====================================================================
   tests/e2e.spec.js — "우리집 초록친구" E2E 스펙 (Playwright)
   ---------------------------------------------------------------------
   실행 전제: 사이트는 루트(/)에서 서빙되어야 합니다.
   quiz.js / result.js 가 절대경로(/result.html, /quiz.html, /packages/...)를
   사용하므로 file:// 또는 하위경로 서빙에서는 동작하지 않습니다.

   로컬 정적 서버 띄우기(둘 중 하나):
     python -m http.server 8000          (프로젝트 루트에서)
     npx http-server -p 8000 .

   Playwright 설치(미설치 시):
     npm i -D @playwright/test
     npx playwright install chromium

   실행:
     BASE_URL=http://localhost:8000 npx playwright test tests/e2e.spec.js
   (BASE_URL 미지정 시 http://localhost:8000 기본값)
   ===================================================================== */

const { test, expect } = require('@playwright/test');

const BASE = process.env.BASE_URL || 'http://localhost:8000';

const PLANT_IDS = [
  'sansevieria', 'spathiphyllum', 'succulent', 'scindapsus', 'zamioculcas',
  'parlor_palm', 'rubber_plant', 'lucky_bamboo', 'phalaenopsis', 'ivy',
  'lettuce', 'basil'
];

/* ---------------------------------------------------------------------
   시나리오 1: 핵심 흐름 — index → quiz → result
   --------------------------------------------------------------------- */
test.describe('1. 핵심 흐름', () => {
  test('index "식물 추천받기" → quiz.html 이동', async ({ page }) => {
    await page.goto(`${BASE}/index.html`);
    await page.click('a.btn-primary[href="/quiz.html"]');
    await expect(page).toHaveURL(/\/quiz\.html$/);
    await expect(page.locator('#quiz-question')).toBeVisible();
  });

  test('Q1→Q2→Q3→Q4 응답 후 result.html?쿼리 이동', async ({ page }) => {
    await page.goto(`${BASE}/quiz.html`);

    // Q1 빛 — 첫 번째 선택지 클릭(☀️ 햇빛 잘 들어요 = high)
    await expect(page.locator('#quiz-question')).toContainText('햇빛');
    await page.click('.choice-card[data-value="high"]');

    // Q2 물 — 자주 줄 수 있어요 = high
    await expect(page.locator('#quiz-question')).toContainText('물');
    await page.click('.choice-card[data-value="high"]');

    // Q3 목적 — 먹을 수 있는 식물 = harvest
    await expect(page.locator('#quiz-question')).toContainText('어떤 식물');
    await page.click('.choice-card[data-value="harvest"]');

    // Q4 경험(선택) — 처음이에요 = beginner
    await expect(page.locator('#quiz-question')).toContainText('키워 보신');
    await page.click('.choice-card[data-value="beginner"]');

    await expect(page).toHaveURL(
      /\/result\.html\?light=high&water=high&purpose=harvest&level=beginner$/
    );
  });

  test('Q4 "건너뛰고 결과 보기" → level 없이 이동', async ({ page }) => {
    await page.goto(`${BASE}/quiz.html`);
    await page.click('.choice-card[data-value="mid"]');   // Q1
    await page.click('.choice-card[data-value="mid"]');   // Q2
    await page.click('.choice-card[data-value="deco"]');  // Q3
    await page.click('#quiz-skip');                        // Q4 건너뛰기
    await expect(page).toHaveURL(/\/result\.html\?light=mid&water=mid&purpose=deco$/);
  });
});

/* ---------------------------------------------------------------------
   시나리오 2: 결과 렌더 — 카드 3종 + 링크/버튼
   --------------------------------------------------------------------- */
test.describe('2. 결과 렌더', () => {
  test('정확히 3종 카드 렌더', async ({ page }) => {
    await page.goto(`${BASE}/result.html?light=mid&water=mid&purpose=air&level=beginner`);
    await expect(page.locator('.plant-card')).toHaveCount(3);
  });

  test('[자세히 보기] 링크가 실제 plants/{id}.html 을 가리킴', async ({ page }) => {
    await page.goto(`${BASE}/result.html?light=mid&water=mid&purpose=air`);
    const links = page.locator('a.btn--detail');
    const n = await links.count();
    expect(n).toBe(3);
    for (let i = 0; i < n; i++) {
      const href = await links.nth(i).getAttribute('href');
      expect(href).toMatch(/^\/plants\/[a-z_]+\.html$/);
      const id = href.replace('/plants/', '').replace('.html', '');
      expect(PLANT_IDS).toContain(id);
      // 실제 페이지가 200으로 응답하는지 확인
      const res = await page.request.get(`${BASE}${href}`);
      expect(res.status()).toBe(200);
    }
  });

  test('쿠팡 버튼 + 카톡 공유 버튼 존재', async ({ page }) => {
    await page.goto(`${BASE}/result.html?light=mid&water=mid&purpose=air`);
    await expect(page.locator('a.btn--shop')).toHaveCount(3);
    await expect(page.locator('button.btn--share[data-share-id]')).toHaveCount(3);
    // 쿠팡 버튼은 새 탭 + rel sponsored
    const rel = await page.locator('a.btn--shop').first().getAttribute('rel');
    expect(rel).toContain('sponsored');
    expect(rel).toContain('nofollow');
  });

  test('12종 상세 페이지 전부 200', async ({ page }) => {
    for (const id of PLANT_IDS) {
      const res = await page.request.get(`${BASE}/plants/${id}.html`);
      expect(res.status(), `plants/${id}.html`).toBe(200);
    }
  });
});

/* ---------------------------------------------------------------------
   시나리오 4: 이전 / 다시하기
   --------------------------------------------------------------------- */
test.describe('4. 이전 / 다시하기', () => {
  test('첫 질문에서 "이전" 비활성', async ({ page }) => {
    await page.goto(`${BASE}/quiz.html`);
    await expect(page.locator('#nav-back')).toBeDisabled();
  });

  test('"← 이전"으로 이전 질문 복귀 + 선택 복원', async ({ page }) => {
    await page.goto(`${BASE}/quiz.html`);
    await page.click('.choice-card[data-value="high"]');  // Q1=high
    await expect(page.locator('#quiz-question')).toContainText('물'); // Q2
    await page.click('#nav-back');
    await expect(page.locator('#quiz-question')).toContainText('햇빛'); // Q1 복귀
    // 이전 선택(high)이 aria-pressed=true 로 복원
    await expect(page.locator('.choice-card[data-value="high"]'))
      .toHaveAttribute('aria-pressed', 'true');
  });

  test('"처음부터 다시" → Q1 초기화', async ({ page }) => {
    await page.goto(`${BASE}/quiz.html`);
    await page.click('.choice-card[data-value="high"]');  // Q1
    await page.click('.choice-card[data-value="mid"]');   // Q2 → Q3
    await page.click('#nav-restart');
    await expect(page.locator('#quiz-question')).toContainText('햇빛'); // Q1
    await expect(page.locator('#nav-back')).toBeDisabled();
  });

  test('result 화면 "처음부터 다시" → quiz.html', async ({ page }) => {
    await page.goto(`${BASE}/result.html?light=mid&water=mid&purpose=air`);
    await page.click('#nav-restart');
    await expect(page).toHaveURL(/\/quiz\.html$/);
  });
});

/* ---------------------------------------------------------------------
   시나리오 5: 진행바 ①②③ 갱신
   --------------------------------------------------------------------- */
test.describe('5. 진행바', () => {
  test('단계별 is-current / is-done 갱신', async ({ page }) => {
    await page.goto(`${BASE}/quiz.html`);
    // Q1: 1번째 단계가 current
    await expect(page.locator('.progress__step').nth(0)).toHaveClass(/is-current/);
    await page.click('.choice-card[data-value="high"]');
    // Q2: 1번째 done, 2번째 current
    await expect(page.locator('.progress__step').nth(0)).toHaveClass(/is-done/);
    await expect(page.locator('.progress__step').nth(1)).toHaveClass(/is-current/);
    await page.click('.choice-card[data-value="high"]');
    // Q3: 3번째 current
    await expect(page.locator('.progress__step').nth(2)).toHaveClass(/is-current/);
  });
});

/* ---------------------------------------------------------------------
   시나리오 7: 한국어 엣지케이스
   --------------------------------------------------------------------- */
test.describe('7. 엣지케이스', () => {
  test('빈 쿼리 result.html 직접 진입 → 안내 + 시작 링크', async ({ page }) => {
    await page.goto(`${BASE}/result.html`);
    await expect(page.locator('.state-box')).toBeVisible();
    await expect(page.locator('.state-box a[href="/quiz.html"]')).toBeVisible();
    await expect(page.locator('.plant-card')).toHaveCount(0);
  });

  test('잘못된 파라미터 → 무시되고 빈 핵심답 처리(안내)', async ({ page }) => {
    await page.goto(`${BASE}/result.html?light=PURPLE&water=999&purpose=hack`);
    await expect(page.locator('.state-box')).toBeVisible(); // 전부 무효 → 안내
  });

  test('일부만 유효한 파라미터 → 결과 진행(3종)', async ({ page }) => {
    await page.goto(`${BASE}/result.html?light=low&water=999&purpose=hack`);
    await expect(page.locator('.plant-card')).toHaveCount(3);
  });

  test('존재하지 않는 식물 id 링크는 렌더되지 않음(검증된 12종만)', async ({ page }) => {
    await page.goto(`${BASE}/result.html?purpose=harvest`);
    const links = page.locator('a.btn--detail');
    const n = await links.count();
    for (let i = 0; i < n; i++) {
      const href = await links.nth(i).getAttribute('href');
      const id = href.replace('/plants/', '').replace('.html', '');
      expect(PLANT_IDS).toContain(id);
    }
  });
});
