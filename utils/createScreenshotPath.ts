import path from "path";
import APP_CONFIG from "../config";

export default function createScreenshotPath(website: string) {
  const hostname = new URL(website).hostname;
  const pathname = path.join(APP_CONFIG.screenshotsPath, `${hostname}.jpeg`);
  return pathname;
}
