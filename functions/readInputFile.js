const fs = require("fs");
const xlsxParser = require("convert-excel-to-json");
const path = require("path");

const filePath = path.join(process.cwd(), "./input.xlsx");

function readInputFile() {
  return xlsxParser({
    source: fs.readFileSync(filePath),
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

module.exports = readInputFile;
