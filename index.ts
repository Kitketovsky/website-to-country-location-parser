import getDomainsMetadata from "./functions/getDomainsMetadata";
import readInputXlsxFile from "./functions/readInputXlsxFile";
import createXlsxFile from "./functions/createXlsxFile";

import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

async function main() {
  const filepath = path.join(process.cwd(), "./input.xlsx");
  const xlsxFileContent = readInputXlsxFile(filepath);

  const metadata = await getDomainsMetadata(xlsxFileContent.List);

  if (metadata) {
    await createXlsxFile(metadata);
  }
}

// main();

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
  });

  const page = await browser.newPage();

  try {
    const website = "https://vekto596.itch.io/";

    const response = await page.goto(website);

    await page.waitForNetworkIdle();

    if (!response) return null;

    if (!response.ok) {
      throw new Error(response.statusText());
    }

    if (response.url() !== website) {
      // you got redirected
      console.log(`Redirected from ${website} to ${response.url()}`);
    }

    const langAttr = await page.evaluate(
      () => window.document.documentElement.lang
    );

    console.log("lang", langAttr);

    // const content = await page.evaluate(() => {
    //   let elements = Array.from(document.querySelectorAll("p, h1, h2, span"));

    //   return elements.map((element) =>
    //     element.textContent.replace(/\s{2,}/g, "")
    //   );
    // });

    // await page.screenshot({
    //   path: path.join(process.cwd(), "screenshot.png"),
    // });

    // if (fs.existsSync("./content.txt")) {
    //   fs.rmSync("./content.txt");
    // }

    // fs.writeFileSync("./content.txt", content.join("; "));
  } catch (error) {
    console.log(error);
  } finally {
    await page.close();
    await browser.close();
  }
})();
