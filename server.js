const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// מוודא שתיקיית screenshots קיימת
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

app.get('/', (req, res) => {
  res.send('Welcome to your enhanced Node.js server!');
});

app.get('/fetch', async (req, res) => {
  const { url, mode } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing "url" parameter.' });

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

    let response = { success: true, url };

    if (mode === 'text') {
      const text = await page.evaluate(() => document.body.innerText);
      response.text = text.slice(0, 5000);
    } else if (mode === 'links') {
      const links = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a'))
          .map(a => a.href)
          .filter(Boolean)
      );
      response.links = links.slice(0, 50);
    } else if (mode === 'iframe') {
      const hasIframe = await page.evaluate(() => !!document.querySelector('iframe'));
      response.hasIframe = hasIframe;
    } else if (mode === 'screenshot' || mode === 'full') {
      // שומר צילום מסך לקובץ עם שם ייחודי
      const timestamp = Date.now();
      const filePath = path.join(screenshotsDir, `shot_${timestamp}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      response.screenshotPath = `/screenshots/shot_${timestamp}.png`;

      if (mode === 'full') {
        const text = await page.evaluate(() => document.body.innerText);
        const links = await page.evaluate(() =>
          Array.from(document.querySelectorAll('a'))
            .map(a => a.href)
            .filter(Boolean)
        );
        const hasIframe = await page.evaluate(() => !!document.querySelector('iframe'));

        response.text = text.slice(0, 5000);
        response.links = links.slice(0, 50);
        response.hasIframe = hasIframe;
      }
    } else {
      // כברירת מחדל - טקסט ולינקים
      const text = await page.evaluate(() => document.body.innerText);
      const links = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a'))
          .map(a => a.href)
          .filter(Boolean)
      );
      response.text = text.slice(0, 5000);
      response.links = links.slice(0, 50);
    }

    await browser.close();
    res.json(response);

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// הגדרה לשרת קבצים סטטיים מתיקיית screenshots
app.use('/screenshots', express.static(path.join(__dirname, 'screenshots')));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
