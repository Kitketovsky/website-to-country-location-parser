import path from "path";
import puppeteer from "puppeteer";
import ExcelJS from "exceljs";

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

    const content = await page.evaluate(() => {
      let elements = Array.from(document.querySelectorAll("p, h1, h2, span"));

      return elements.map((element) =>
        element.textContent?.replace(/\s{2,}/g, "")
      );
    });

    await page.screenshot({
      path: path.join(process.cwd(), "screenshot.png"),
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet 1");

    worksheet.columns = [
      { header: "Website", key: "website", width: 10 },
      { header: "Redirect", key: "redirect", width: 32 },
    ];

    worksheet.addRow({
      website,
      redirect: response.url() !== website ? response.url() : "",
    });

    const screenshotFilename = new URL(website).hostname.replace(".", "");

    const screenshotPath = path.join(
      process.cwd(),
      `${screenshotFilename}.png`
    );

    const imageId = workbook.addImage({
      filename: screenshotPath,
      extension: "png",
    });

    worksheet.addImage(imageId, "A3:A3");

    await workbook.xlsx.writeFile("./output.xlsx");
    console.log("Finished!");
  } catch (error) {
    console.log(error);
  } finally {
    await page.close();
    await browser.close();
  }
})();
