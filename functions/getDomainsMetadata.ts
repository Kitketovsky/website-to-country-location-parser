import counter from "./../utils/counter";
import checkURLValidity from "./../utils/checkURLValidity";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import getWhoIsCountryV1 from "./../parsers/getWhoIsCountryV1";
import getWhoIsCountryV2 from "./../parsers/getWhoIsCountryV2";
import getLanguageViaRecognition from "./../parsers/getLanguageViaRecognition";
import { IOutputRow } from "../types/OutputRow";
import createScreenshotPath from "../utils/createScreenshotPath";
import createPage from "../lib/puppeteer/createPage";

const REQUEST_DELAY = 500;
const RECOGNITION_REQUEST_DELAY = 1500;

puppeteer.use(StealthPlugin());

export default async function getDomainsMetadata(
  input: { website: string; company: string }[]
) {
  if (!input || !input.length) {
    throw new Error("No input data found of it's empty");
  }

  const addDelayedItems = counter();
  const allPromiseDelayCounter = counter();

  const browser = await puppeteer.launch({
    headless: "new",
  });

  try {
    return await Promise.all(
      input.map(async (row) => {
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

        const page = await createPage(browser);

        try {
          // Delay between requests
          await new Promise((resolve) =>
            setTimeout(resolve, allPromiseDelayCounter() * REQUEST_DELAY)
          );

          if (!("website" in row)) {
            return output;
          }

          // there might be several links in one string separated with a whitespace
          output.website = row.website
            .split(" ")[0]
            .toLowerCase()
            .replace("www.", "");

          const isValidURL = checkURLValidity(output.website);

          if (!isValidURL) {
            return output;
          }

          const response = await page.goto(output.website);
          await page.waitForNetworkIdle();

          if (!response) return null;

          if (!response.ok) {
            // TODO: take screenshot
            await page.screenshot({
              path: createScreenshotPath(output.website),
            });

            output.withImage = true;

            output.error = `${
              (response.status.toString(), response.statusText().slice(0, 40))
            }`;

            return output;
          }

          if (response.url() !== row.website) {
            output.redirect = response.url();
          }

          const langAttr = await page.evaluate(
            () => window.document.documentElement?.lang
          );

          if (!langAttr) {
            const content = await page.evaluate(() => {
              let elements = Array.from(
                document.querySelectorAll("p, h1, h2, span")
              );

              return elements
                .map((element) =>
                  element.textContent?.replace(/\s{2,}/g, "").trim()
                )
                .filter((text) => text && text.length > 15);
            });

            const contentToCheck = content.join("; ").slice(0, 300);

            await new Promise((resolve) => {
              setTimeout(
                resolve,
                addDelayedItems() * RECOGNITION_REQUEST_DELAY
              );
            });

            const recognizedLanguages = await getLanguageViaRecognition(
              contentToCheck
            );

            if (recognizedLanguages) {
              output.language = recognizedLanguages;
            } else {
              await page.screenshot({
                path: createScreenshotPath(output.website),
              });

              output.withImage = true;
            }
          } else {
            output.language = langAttr;
          }
        } catch (error) {
          const typedError = error as unknown as {
            cause?: { code?: string; reason?: string; message?: string };
          };

          output.error = `${typedError?.cause?.code} ${(
            typedError?.cause?.reason ||
            typedError?.cause?.message ||
            ""
          ).slice(0, 40)}}`;
        } finally {
          if (output.website) {
            const whoisv1 = await getWhoIsCountryV1({
              browser,
              website: output.website,
            });
            const whoisv2 = await getWhoIsCountryV2({
              browser,
              website: output.website,
            });

            output.whoIsV1 = whoisv1;
            output.whoIsV2 = whoisv2;
          }

          await page.close();

          return output;
        }
      })
    );
  } catch (error) {
    console.log("Uncaught error", error);
  } finally {
    await browser.close();
  }
}
