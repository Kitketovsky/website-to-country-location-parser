import path from "path";
import { IOutputRow } from "../types/OutputRow";
import ExcelJS from "exceljs";

export default async function createXlsxFile(
  metadata: (IOutputRow | null | undefined)[]
) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sheet 1");

  worksheet.columns = [
    { header: "Company", key: "company", width: 10 },
    { header: "Website", key: "website", width: 10 },
    { header: "Redirected To", key: "redirect", width: 10 },
    { header: "Language", key: "language", width: 4 },
    { header: "Whois (V1)", key: "whoIsV1", width: 4 },
    { header: "Whois (V2)", key: "whoIsV2", width: 4 },
    { header: "Error", key: "error", width: 10 },
    { header: "Image", key: "image", width: 30 },
  ];

  for (let i = 0; i < metadata.length; i++) {
    const item = metadata[i];

    if (!item) continue;

    const { company, website, redirect, language, whoIsV1, whoIsV2, error } =
      item;

    worksheet.addRow({
      company, // A
      website, // B
      redirect, // C
      language, // D
      whoIsV1, // E
      whoIsV2, // F
      error, //G
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

    const rowNumber = i + 1;
    worksheet.addImage(imageId, `H${rowNumber}:H${rowNumber}`);
  }

  const outputPath = path.join(process.cwd(), "output.xlsx");
  await workbook.xlsx.writeFile(outputPath);
}
