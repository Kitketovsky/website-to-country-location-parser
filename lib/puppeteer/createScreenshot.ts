import fs from "fs";
import { Page } from "puppeteer";
import createScreenshotPath from "../../utils/createScreenshotPath";
import APP_CONFIG from "../../config";

export default async function createScreenshot({
  page,
  website,
}: {
  page: Page;
  website: string;
}) {
  if (!fs.existsSync(APP_CONFIG.screenshotsPath)) {
    fs.mkdirSync(APP_CONFIG.screenshotsPath);
  }

  await page.screenshot({
    path: createScreenshotPath(website),
    type: "jpeg",
    quality: 50,
  });
}
