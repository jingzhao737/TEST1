const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', error => console.log('ERROR:', error.message));
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2500);

  // Add event listeners to work-list to debug
  await page.evaluate(() => {
    const wl = document.querySelector('.work-list');
    wl.addEventListener('mouseenter', () => console.log('>>> WORK-LIST MOUSEENTER FIRED'));
    wl.addEventListener('mouseleave', () => console.log('>>> WORK-LIST MOUSELEAVE FIRED'));
    wl.addEventListener('mousemove', (e) => console.log('>>> WORK-LIST MOUSEMOVE', e.clientX, e.clientY));
    const cards = document.querySelectorAll('.work-card');
    cards.forEach((c, i) => {
      c.addEventListener('mouseenter', () => console.log('>>> CARD MOUSEENTER', i));
    });
  });

  // Scroll work-list into view
  await page.evaluate(() => {
    document.querySelector('.work-list').scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(500);

  // Move mouse well outside first, then into the work list area
  await page.mouse.move(100, 0);
  await page.waitForTimeout(100);
  
  // Now move into the work-list
  const listBox = await page.$eval('.work-list', el => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  console.log('Moving to work-list at y=' + (listBox.y + 30));
  
  // Move in steps to ensure mouseenter fires
  for (let y = 0; y <= listBox.y + 30; y += 20) {
    await page.mouse.move(300, y);
  }
  await page.waitForTimeout(300);

  // Move onto the first card
  const cardBox = await page.$eval('.work-card', el => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  await page.mouse.move(cardBox.x + 200, cardBox.y + cardBox.height / 2);
  await page.waitForTimeout(800);

  // Check wrapper state
  const info = await page.evaluate(() => {
    const w = document.querySelector('.work-preview-wrapper');
    if (!w) return 'NO WRAPPER';
    const curtain = w.querySelector('.work-preview-curtain');
    const imgCont = w.querySelector('.work-preview-img-container');
    return {
      opacity: getComputedStyle(w).opacity,
      visibility: getComputedStyle(w).visibility,
      curtainClipPath: getComputedStyle(curtain).clipPath,
      imgContClipPath: getComputedStyle(imgCont).clipPath,
      imgCount: imgCont.querySelectorAll('img').length
    };
  });
  console.log('FINAL STATE:', JSON.stringify(info, null, 2));

  await page.screenshot({ path: 'C:/Users/jackchen/lobsterai/project/portfolio-v1/debug_hover2.png' });
  await browser.close();
})();
