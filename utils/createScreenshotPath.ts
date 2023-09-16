import path from "path";

export default function createScreenshotPath(website: string) {
  const filename = new URL(website).hostname.replace(".", "");
  return path.join(process.cwd(), "screenshots", filename);
}
