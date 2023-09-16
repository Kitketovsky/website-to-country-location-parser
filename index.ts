import fs from "fs";
import getDomainsMetadata from "./functions/getDomainsMetadata";
import readInputXlsxFile from "./functions/readInputXlsxFile";
import createXlsxFile from "./functions/createXlsxFile";
import APP_CONFIG from "./config";

async function main() {
  if (fs.existsSync(APP_CONFIG.screenshotsPath)) {
    fs.rmSync(APP_CONFIG.screenshotsPath, { recursive: true });
  }

  if (fs.existsSync(APP_CONFIG.outputPath)) {
    fs.rmSync(APP_CONFIG.outputPath);
  }

  const xlsxFileContent = readInputXlsxFile(APP_CONFIG.inputPath);

  const metadata = await getDomainsMetadata(xlsxFileContent.List.slice(0, 20));

  await createXlsxFile(metadata);
}

main();
