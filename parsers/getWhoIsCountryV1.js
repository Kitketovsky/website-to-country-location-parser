const { JSDOM } = require("jsdom");

async function getWhoIsCountryV1(website) {
  try {
    const hostname = new URL(website).hostname;

    const response = await fetch(`https://www.whois.com/whois/${hostname}`);

    if (!response.ok || response.status > 299) {
      return null;
    }

    const htmlString = await response.text();

    const dom = new JSDOM(htmlString);

    if (!dom) return null;

    const blocks = dom.window.document.querySelectorAll(".df-block");

    if (!blocks) return null;

    const countryBlock = Array.from(blocks).find((block) =>
      block.textContent.toLowerCase().includes("country")
    );

    if (!countryBlock) return null;

    const rows = countryBlock.querySelectorAll(".df-row");

    if (!rows) return null;

    const countryRow = Array.from(rows).find((row) =>
      row.textContent.toLowerCase().includes("country")
    );

    if (!countryRow) return null;

    const country = countryRow.querySelector(".df-value").textContent;

    return country.length === 2 ? country : null;
  } catch (error) {
    return null;
  }
}

module.exports = getWhoIsCountryV1;
