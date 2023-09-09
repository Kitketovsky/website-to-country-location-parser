const dotenv = require("dotenv");
const path = require("path");
const { JSDOM } = require("jsdom");

dotenv.config({ path: path.join(process.cwd(), ".env") });

async function getLanguageViaRecognition(website) {
  try {
    const response = await fetch(website);

    if (!response.ok || response.status > 299) {
      return null;
    }

    const htmlString = await response.text();

    const dom = new JSDOM(htmlString);

    if (!dom) return null;

    const textFilledNodes = dom.window.document.querySelectorAll(
      "h1, h2, h3, a, p, span"
    );

    const filtered = Array.from(textFilledNodes)
      .map((node) => node.textContent.replace(/\s{2,}/g, "").trim())
      .filter((text) => text && text.length > 15);

    const textToCheck = filtered.join(", ").slice(0, 250);

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AI}`,
      },
      body: JSON.stringify({
        providers: "amazon",
        text: textToCheck,
      }),
    };

    if (!textToCheck) return null;

    const aiResponse = await fetch(
      "https://api.edenai.run/v2/translation/language_detection",
      options
    );

    const data = await aiResponse.json();

    const languages = data?.amazon?.items
      .map((langData) => langData.display_name)
      .join(", ");

    return languages;
  } catch (error) {
    return null;
  }
}

module.exports = getLanguageViaRecognition;
