const { JSDOM } = require("jsdom");

const counter = require("./../utils/counter.js");
const checkURLValidity = require("./../utils/checkURLValidity.js");

const getWhoIsCountryV1 = require("./../parsers/getWhoIsCountryV1.js");
const getWhoIsCountryV2 = require("./../parsers/getWhoIsCountryV2.js");
const getLanguageViaRecognition = require("./../parsers/getLanguageViaRecognition.js");

const REQUEST_DELAY = 500;
const RECOGNITION_REQUEST_DELAY = 1500;

async function getDomainsMetadata(inputData) {
  const addDelayedItems = counter();
  const allPromiseDelayCounter = counter();

  return await Promise.all(
    inputData.map(async (row) => {
      const urlData = {
        url: row.website,
        company: row.company,
        langAttrCountry: null,
        whoIsCountry: null,
        serverActive: false,
        errorCode: null,
        errorReason: null,
        domError: false,
        redirectedTo: null,
      };

      try {
        // Delay between requests
        await new Promise((resolve) =>
          setTimeout(resolve, allPromiseDelayCounter() * REQUEST_DELAY)
        );

        if (!("website" in row)) {
          return urlData;
        }

        // there might be several links in one string separated with a whitespace
        row.website = row.website
          .split(" ")[0]
          .toLowerCase()
          .replace("www.", "");

        const isValidURL = checkURLValidity(row.website);

        if (!isValidURL) {
          return urlData;
        }

        const response = await fetch(row.website);

        if (response.redirected) {
          urlData.redirectedTo = response.url;
        }

        if (!response.ok || response.status > 299) {
          urlData.error = {
            website: row.website,
            code: response.status,
            reason: response.statusText,
          };

          return urlData;
        }

        // HTML website parsing
        const htmlString = await response.text();

        if (!htmlString) {
          urlData.domError = true;
          return urlData;
        }

        let dom;

        try {
          dom = new JSDOM(htmlString);
        } catch (error) {
          urlData.domError = true;
          return urlData;
        }

        const languageFromHTMLTag = dom.window.document.documentElement?.lang;

        if (languageFromHTMLTag) {
          urlData.langAttrCountry = languageFromHTMLTag?.toUpperCase();
        } else {
          await new Promise((resolve) => {
            setTimeout(resolve, addDelayedItems() * RECOGNITION_REQUEST_DELAY);
          });

          const languages = await getLanguageViaRecognition(response.url);

          urlData.langAttrCountry = languages?.toUpperCase();
        }

        if (!urlData.langAttrCountry) {
          urlData.domError = true;
        }
      } catch (error) {
        urlData.errorCode = error?.cause?.code;
        urlData.errorReason = (
          error?.cause?.reason ||
          error?.cause?.message ||
          ""
        ).slice(0, 40);
      } finally {
        const isValidURL = checkURLValidity(row.website);

        if (!urlData.redirectedTo && !isValidURL) {
          return urlData;
        }

        const whoIsCountryV1 = await getWhoIsCountryV1(
          urlData.redirectedTo ?? row.website
        );

        if (whoIsCountryV1) {
          urlData.whoIsCountry = whoIsCountryV1;
          urlData.serverActive = true;
        } else {
          const whoIsCountryV2 = await getWhoIsCountryV2(
            urlData.redirectedTo ?? row.website
          );

          if (whoIsCountryV2) {
            urlData.whoIsCountry = whoIsCountryV2;
            urlData.serverActive = true;
          }
        }

        return urlData;
      }
    })
  );
}

module.exports = getDomainsMetadata;
