import path from "path";
import { IOutputRow } from "../types/OutputRow";
import ExcelJS from "exceljs";
import createScreenshotPath from "../utils/createScreenshotPath";

export default async function createXlsxFile(
  metadata: (IOutputRow | null | undefined)[]
) {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet 1");

    worksheet.columns = [
      { header: "Company", key: "company", width: 30 },
      { header: "Website", key: "website", width: 30 },
      { header: "Redirected To", key: "redirect", width: 30 },
      { header: "Language", key: "language", width: 12 },
      { header: "Whois (V1)", key: "whoIsV1", width: 12 },
      { header: "Whois (V2)", key: "whoIsV2", width: 12 },
      { header: "Error", key: "error", width: 20 },
      { header: "Image", key: "image", width: 100 },
    ];

    worksheet.pageSetup.verticalCentered = true;

    for (let i = 0; i < metadata.length; i++) {
      const item = metadata[i];

      if (!item) continue;

      const {
        company,
        website,
        redirect,
        language,
        whoIsV1,
        whoIsV2,
        error,
        withImage,
      } = item;

      const row = worksheet.addRow({
        company, // A
        website, // B
        redirect, // C
        language: language?.toUpperCase(), // D
        whoIsV1, // E
        whoIsV2, // F
        error, //G
      });

      if (withImage) {
        row.height = 200;

        const screenshotPath = createScreenshotPath(website);

        const imageId = workbook.addImage({
          filename: screenshotPath,
          extension: "jpeg",
        });

        worksheet.addImage(imageId, `H${i + 2}:H${i + 2}`);
      }
    }

    const outputPath = path.join(process.cwd(), "output.xlsx");
    await workbook.xlsx.writeFile(outputPath);
  } catch (error) {
    console.log("createXlsxFile error", error);
  }
}
