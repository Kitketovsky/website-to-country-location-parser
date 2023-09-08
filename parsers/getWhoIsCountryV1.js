const { JSDOM } = require("jsdom");

async function getWhoIsCountryV1(website) {
  try {
    const hostname = new URL(website).hostname;

    const response = await fetch(`https://www.whois.com/whois/${hostname}`);

    if (!response.ok || response.status > 299) {
      throw new Error(response.statusText);
    }

    const htmlString = await response.text();

    const dom = new JSDOM(htmlString);

    const blocks = dom.window.document.querySelectorAll(".df-block");

    if (!blocks) return null;

    const countryBlock = Array.from(blocks).find((block) =>
      block.textContent.includes("Country")
    );

    if (!countryBlock) return null;

    const rows = countryBlock.querySelectorAll(".df-row");

    if (!rows) return null;

    const countryRow = Array.from(rows).find((row) =>
      row.textContent.includes("Country")
    );

    if (!countryRow) return null;

    const country = countryRow.querySelector(".df-value").textContent;

    return country.length === 2 ? country : null;
  } catch (error) {
    throw error;
  }
}

module.exports = getWhoIsCountryV1;
