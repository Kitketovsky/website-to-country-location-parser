const { JSDOM } = require("jsdom");

async function getWhoIsCountryV2(website) {
  try {
    const hostname = new URL(website).hostname;

    const response = await fetch(`https://who.is/whois/${hostname}`);

    if (!response.ok || response.status > 299) {
      return null;
    }

    const htmlString = await response.text();

    const dom = new JSDOM(htmlString);

    if (!dom) return null;

    const rawWhoisBlocks = dom.window.document.querySelectorAll(
      ".rawWhois > .rawWhois"
    );

    if (!rawWhoisBlocks) return null;

    const countryBlock = Array.from(rawWhoisBlocks).find((node) =>
      node.textContent.toLowerCase().includes("country")
    );

    if (!countryBlock) return null;

    const rows = countryBlock.querySelectorAll(".row");

    if (!rows) return null;

    const countryRow = Array.from(rows).find((row) =>
      row.textContent.toLowerCase().includes("country")
    );

    if (!countryRow) return null;

    const country = countryRow.children[1]?.textContent;

    return country.length === 2 ? country : null;
  } catch (error) {
    return null;
  }
}

module.exports = getWhoIsCountryV2;
