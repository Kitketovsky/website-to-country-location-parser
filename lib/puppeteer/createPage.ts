import { Browser } from "puppeteer";
import UserAgent from "user-agents";

export default async function createPage(browser: Browser) {
  const page = await browser.newPage();

  const randomUserAgent = new UserAgent().random().toString();

  const UA =
    randomUserAgent ||
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Safari/537.36";

  await page.setUserAgent(UA);

  await page.setViewport({
    width: 1920 + Math.floor(Math.random() * 100),
    height: 3000 + Math.floor(Math.random() * 100),
    deviceScaleFactor: 1,
    hasTouch: false,
    isLandscape: false,
    isMobile: false,
  });

  return page;
}
