import { Browser } from "puppeteer";

export default async function getWhoIsCountryV1({
  browser,
  website,
}: {
  browser: Browser;
  website: string;
}) {
  const page = await browser.newPage();

  try {
    const hostname = new URL(website).hostname;

    const response = await page.goto(`https://www.whois.com/whois/${hostname}`);

    await page.waitForNetworkIdle();

    if (!response) return null;

    if (!response.ok() || response.status() > 299) {
      return null;
    }

    return await page.evaluate(() => {
      const blocks = window.document.querySelectorAll(".df-block");

      if (!blocks) return null;

      const countryBlock = Array.from(blocks).find((block) =>
        block.textContent?.toLowerCase().includes("country")
      );

      if (!countryBlock) return null;

      const rows = countryBlock.querySelectorAll(".df-row");

      if (!rows) return null;

      const countryRow = Array.from(rows).find((row) =>
        row.textContent?.toLowerCase().includes("country")
      );

      if (!countryRow) return null;

      const country = countryRow.querySelector(".df-value")?.textContent;

      return country?.length === 2 ? country : null;
    });
  } catch (error) {
    return null;
  } finally {
    await page.close();
  }
}
