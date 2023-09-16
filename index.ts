import getDomainsMetadata from "./functions/getDomainsMetadata";
import readInputXlsxFile from "./functions/readInputXlsxFile";
import createXlsxFile from "./functions/createXlsxFile";
import path from "path";

async function main() {
  const filepath = path.join(process.cwd(), "./input.xlsx");

  const xlsxFileContent = readInputXlsxFile(filepath);

  const metadata = await getDomainsMetadata(xlsxFileContent.List);

  if (metadata) {
    await createXlsxFile(metadata);
  }
}

main();
