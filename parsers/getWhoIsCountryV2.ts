import { Browser } from "puppeteer";
import createPage from "../lib/puppeteer/createPage";

export default async function getWhoIsCountryV2({
  browser,
  website,
}: {
  browser: Browser;
  website: string;
}) {
  const page = await createPage(browser);

  try {
    const hostname = new URL(website).hostname;

    const response = await page.goto(`https://who.is/whois/${hostname}`);

    await page.waitForNetworkIdle();

    if (!response) return null;

    if (!response.ok() || response.status() === 404) {
      return null;
    }

    return await page.evaluate(() => {
      const rawWhoisBlocks = window.document.querySelectorAll(
        ".rawWhois > .rawWhois"
      );

      if (!rawWhoisBlocks) return null;

      const countryBlock = Array.from(rawWhoisBlocks).find((node) =>
        node.textContent?.toLowerCase().includes("country")
      );

      if (!countryBlock) return null;

      const rows = countryBlock.querySelectorAll(".row");

      if (!rows) return null;

      const countryRow = Array.from(rows).find((row) =>
        row.textContent?.toLowerCase().includes("country")
      );

      if (!countryRow) return null;

      const country = countryRow.children[1]?.textContent;

      return country?.length === 2 ? country : null;
    });
  } catch (error) {
    return null;
  } finally {
    if (!page.isClosed()) {
      await page.close();
    }
  }
}
