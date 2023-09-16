import checkURLValidity from "./../utils/checkURLValidity";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

import getWhoIsCountryV1 from "./../parsers/getWhoIsCountryV1";
import getWhoIsCountryV2 from "./../parsers/getWhoIsCountryV2";
import getLanguageViaRecognition from "./../parsers/getLanguageViaRecognition";
import { IOutputRow } from "../types/OutputRow";
import createScreenshotPath from "../utils/createScreenshotPath";

const REQUEST_DELAY = 1000;
const RECOGNITION_REQUEST_DELAY = 1500;

puppeteer.use(StealthPlugin());

export default async function getDomainsMetadata(
  input: { website: string; company: string }[]
) {
  if (!input || !input.length) {
    throw new Error("No input data found of it's empty");
  }

  const interval = 10;

  let start = 0;
  let end = interval;

  const response: (IOutputRow | null)[] = [];

  while (start < input.length) {
    const browser = await puppeteer.launch({
      headless: "new",
    });

    try {
      const portion = input.slice(start, end);

      const promises = portion.map(async (row, index) => {
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

        await new Promise((resolve) =>
          setTimeout(resolve, index * REQUEST_DELAY)
        );

        const page = await browser.newPage();

        try {
          if (!("website" in row)) {
            output.error = "No website was provided";
            return output;
          }

          output.website = row.website
            .split(" ")[0]
            .toLowerCase()
            .replace("www.", "");

          const isValidURL = checkURLValidity(output.website);

          if (!isValidURL) {
            output.error = "Invalid website URL";
            return output;
          }

          const response = await page.goto(output.website);

          await page.waitForNetworkIdle({ timeout: 10000 });

          if (!response) {
            output.error = "No response from website";
            return null;
          }

          if (!response.ok) {
            await page.screenshot({
              path: createScreenshotPath(output.website),
              type: "jpeg",
              quality: 70,
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
              setTimeout(resolve, index * RECOGNITION_REQUEST_DELAY);
            });

            const recognizedLanguages = await getLanguageViaRecognition(
              contentToCheck
            );

            if (recognizedLanguages) {
              output.language = recognizedLanguages;
            } else {
              await page.screenshot({
                path: createScreenshotPath(output.website),
                type: "jpeg",
                quality: 70,
              });

              output.withImage = true;
            }
          } else {
            output.language = langAttr;
          }
        } catch (error) {
          await page.screenshot({
            path: createScreenshotPath(output.website),
            type: "jpeg",
            quality: 70,
          });

          output.withImage = true;
          // @ts-ignore
          output.error = error.message;
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

          if (!page.isClosed()) {
            await page.close();
          }

          return output;
        }
      });

      const portionResponse = await Promise.all(promises);

      // @ts-ignore
      response.push(portionResponse);
    } catch (error) {
    } finally {
      await browser.close();

      start += interval;
      end += interval;
    }
  }

  return response.flat();
}
