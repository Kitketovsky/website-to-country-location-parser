import fs from "fs";
import xlsxParser from "convert-excel-to-json";

export default function readInputXlsxFile(filepath: string) {
  if (!fs.existsSync(filepath)) {
    throw new Error(`No such file file in ${filepath}`);
  }

  if (!filepath.endsWith(".xlsx")) {
    throw new Error("Invalid file extension");
  }

  return xlsxParser({
    source: fs.readFileSync(filepath),
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
}
