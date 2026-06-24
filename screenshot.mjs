import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const URL = process.env.URL || "http://localhost:3000";
const OUT = process.env.OUT || "fullpage.png";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
  args: ["--no-sandbox", "--hide-scrollbars"],
});

const page = await browser.newPage();
await page.goto(URL, { waitUntil: "networkidle2", timeout: 60000 });

// Slowly scroll the whole page in viewport-sized steps, pausing at each step so
// framer-motion whileInView fade-ins fire and the count-up animations run.
await page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const vh = window.innerHeight;
  const max = () => document.documentElement.scrollHeight;
  for (let y = 0; y < max(); y += Math.round(vh * 0.6)) {
    window.scrollTo(0, y);
    await sleep(450);
  }
  window.scrollTo(0, max());
  await sleep(2200); // let the last section's count-up (1.6s) finish
  window.scrollTo(0, 0);
});

// Fallback: force any element still left at opacity 0 / shifted (un-triggered
// whileInView) into its final visible state so nothing renders blank.
await page.evaluate(() => {
  for (const el of document.querySelectorAll("*")) {
    const cs = getComputedStyle(el);
    if (parseFloat(cs.opacity) < 0.99 || cs.transform !== "none") {
      el.style.setProperty("opacity", "1", "important");
      el.style.setProperty("transform", "none", "important");
    }
  }
});

await new Promise((r) => setTimeout(r, 1200));

await page.screenshot({ path: OUT, fullPage: true });
await browser.close();
console.log("Saved", OUT);
