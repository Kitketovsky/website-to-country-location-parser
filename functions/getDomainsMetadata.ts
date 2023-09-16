import isValidURL from "../utils/isValidURL";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import getWhoIsCountryV1 from "./../parsers/getWhoIsCountryV1";
import getWhoIsCountryV2 from "./../parsers/getWhoIsCountryV2";
import getLanguageViaRecognition from "./../parsers/getLanguageViaRecognition";
import { IOutputRow } from "../types/OutputRow";
import counter from "../utils/counter";
import sleep from "../utils/sleep";
import createScreenshot from "../lib/puppeteer/createScreenshot";
import createStatsLogger from "../lib/log/createStatsLogger";

const RECOGNITION_REQUEST_DELAY = 1500;

puppeteer.use(StealthPlugin());

export default async function getDomainsMetadata(
  input: { website: string; company: string }[]
) {
  if (!input || !input.length) {
    throw new Error("No input data found of it's empty");
  }

  const CHUNK_SIZE = 9;

  let start = 0;
  let end = CHUNK_SIZE;

  let response: (IOutputRow | null)[] = [];

  const log = createStatsLogger({ all: input.length });

  while (start < input.length) {
    const browser = await puppeteer.launch({
      headless: "new",
    });

    try {
      const portion = input.slice(start, end);

      const addToRecognitionCallsCounter = counter();

      const promises = portion.map(async (row) => {
        const output: IOutputRow = {
          website: row?.website,
          company: row?.company,
          language: null,
          whoIsV1: null,
          whoIsV2: null,
          error: null,
          redirect: null,
          withImage: false,
        };

        const page = await browser.newPage();

        try {
          if (!("website" in row)) {
            throw new Error("No website was provided");
          }

          output.website = row.website
            .split(" ")[0]
            .toLowerCase()
            .replace("www.", "");

          const isValidWebsite = isValidURL(output.website);

          if (!isValidWebsite) {
            throw new Error("Invalid website URL");
          }

          const response = await page.goto(output.website);

          if (!response) {
            throw new Error("No response from website");
          }

          if (!response.ok) {
            throw new Error("Response was not OK");
          }

          if (response.url() !== output.website) {
            output.redirect = response.url();
          }

          const langAttr = await page.evaluate(
            () => window.document.documentElement?.lang
          );

          if (langAttr) {
            output.language = langAttr;
            log("success");
            return output;
          }

          const content = await page.evaluate(() => {
            const CONTENT_RICH_TAGS = "p, h1, h2, span";

            let elements = Array.from(
              document.querySelectorAll(CONTENT_RICH_TAGS)
            );

            const MINIMUM_VALID_STRING_LENGTH = 15;
            const REMOVE_ALL_WHITESPACE_REGEX = /\s{2,}/g;

            return elements
              .map((element) =>
                element.textContent
                  ?.replace(REMOVE_ALL_WHITESPACE_REGEX, "")
                  .trim()
              )
              .filter(
                (text) => text && text.length > MINIMUM_VALID_STRING_LENGTH
              );
          });

          const MAXIMUM_TEXT_LENGTH_FOR_RECOGNITION = 500;

          const contentToCheck = content
            .join(" ")
            .slice(0, MAXIMUM_TEXT_LENGTH_FOR_RECOGNITION);

          await sleep(
            addToRecognitionCallsCounter() * RECOGNITION_REQUEST_DELAY
          );

          const recognizedLanguages = await getLanguageViaRecognition(
            contentToCheck
          );

          if (!recognizedLanguages) {
            throw new Error("Site language has not been recognized!");
          }

          output.language = recognizedLanguages;
          log("success");
          return output;
        } catch (error) {
          log("failed");
          await createScreenshot({ page, website: output.website });
          output.withImage = true;
          // @ts-ignore
          output.error = error.message;
        } finally {
          if (!page.isClosed()) {
            await page.close();
          }

          if (!output.website && !isValidURL(output.website)) {
            return output;
          }

          const [whoIsV1, whoIsV2] = await Promise.all([
            getWhoIsCountryV1({
              browser,
              website: output.website,
            }),
            getWhoIsCountryV2({
              browser,
              website: output.website,
            }),
          ]);

          output.whoIsV1 = whoIsV1;
          output.whoIsV2 = whoIsV2;

          return output;
        }
      });

      const portionResponse = await Promise.all(promises);

      response = [...response, ...portionResponse];
    } catch (error) {
    } finally {
      await browser.close();
      start += CHUNK_SIZE;
      end += CHUNK_SIZE;
    }
  }

  return response;
}
