const fs = require("fs");
const xlsxParser = require("convert-excel-to-json");
const { JSDOM } = require("jsdom");

const counter = require("./utils/counter.js");
const checkURLValidity = require("./utils/checkURLValidity.js");

const getWhoIsCountryV1 = require("./parsers/getWhoIsCountryV1.js");
const getWhoIsCountryV2 = require("./parsers/getWhoIsCountryV2.js");
const getLanguageViaRecognition = require("./parsers/getLanguageViaRecognition.js");

const jsonTableData = xlsxParser({
  source: fs.readFileSync("./data.xlsx"),
  header: {
    rows: 1,
  },
  columnToKey: {
    A: "company",
    B: "website",
    C: "country",
    D: "notes",
  },
});

const data = [];

const AMOUNT_TO_PARSE = 100;

async function getCountries() {
  const addDelayedItems = counter();

  await Promise.all(
    jsonTableData.List.slice(0, AMOUNT_TO_PARSE).map(async (row) => {
      const urlData = {
        url: row.website,
        langAttrCountry: null,
        whoIsCountry: null,
        serverActive: null,
        error: null,
        domError: false,
        redirectedTo: null,
      };

      try {
        if (!("website" in row)) {
          data.push(urlData);
          return null;
        }

        const isValidURL = checkURLValidity(row.website);

        if (!isValidURL) {
          data.push(urlData);
          return null;
        }

        const response = await fetch(row.website);

        if (response.status > 299 || !response.ok) {
          urlData.error = {
            website: row.website,
            code: response.status,
            reason: response.statusText,
          };

          data.push(urlData);

          return null;
        }

        if (response.redirected) {
          urlData.redirectedTo = response.url;
        }

        const htmlString = await response.text();

        if (!htmlString) return;

        try {
          const dom = new JSDOM(htmlString);

          const languageFromHTMLTag = dom.window.document.documentElement?.lang;

          if (languageFromHTMLTag) {
            urlData.langAttrCountry = languageFromHTMLTag;
          } else {
            await new Promise((resolve) => {
              setTimeout(resolve, addDelayedItems() * delay);
            });

            const languages = await getLanguageViaRecognition(response.url);

            urlData.langAttrCountry = languages;
          }

          const whoIsCountryV1 = await getWhoIsCountryV1(
            response.redirected ? response.url : row.website
          );

          if (whoIsCountryV1) {
            urlData.whoIsCountry = whoIsCountryV1;
            urlData.serverActive = true;
            data.push(urlData);

            return;
          }

          const whoIsCountryV2 = await getWhoIsCountryV2(
            response.redirected ? response.url : row.website
          );

          if (whoIsCountryV2) {
            urlData.whoIsCountry = whoIsCountryV2;
            urlData.serverActive = true;
            data.push(urlData);
            return;
          }

          urlData.serverActive = false;
          data.push(urlData);
        } catch (error) {
          urlData.domError = true;
          data.push(urlData);
        }
      } catch (error) {
        urlData.error = {
          website: row.website,
          code: error?.cause?.code,
          reason: (error?.cause?.reason || error?.cause?.message || "").slice(
            0,
            40
          ),
        };

        data.push(urlData);
      }
    })
  );
}

getCountries().then(() => {
  var stream = fs.createWriteStream("logs.txt", { flags: "a" });

  data.forEach((itemData) => {
    stream.write(JSON.stringify(itemData) + "\n");
  });

  stream.end();
});
