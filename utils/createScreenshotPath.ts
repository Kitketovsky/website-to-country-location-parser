import path from "path";
import fs from "fs";

const screenshotsFolderPath = path.join(process.cwd(), "screenshots");

if (!fs.existsSync(screenshotsFolderPath)) {
  fs.mkdirSync(screenshotsFolderPath);
}

export default function createScreenshotPath(website: string) {
  const hostname = new URL(website).hostname;
  const pathname = path.join(process.cwd(), "screenshots", `${hostname}.jpeg`);
  return pathname;
}
