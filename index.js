const getDomainsMetadata = require("./functions/getDomainsMetadata.js");
const readInputFile = require("./functions/readInputFile.js");
const createCsvFile = require("./functions/createCsvFile.js");

async function main() {
  const inputData = readInputFile();
  const metadata = await getDomainsMetadata(inputData.List);

  createCsvFile(metadata);
}

main();
