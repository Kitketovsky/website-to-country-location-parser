const { json2csv } = require("json-2-csv");
const fs = require("fs");
const path = require("path");

const OUTPUT_PATH = path.join(process.cwd(), "output.csv");

async function createCsvFile(metadata) {
  const csvData = [];

  metadata.forEach((itemData) => {
    const {
      domError,
      company,
      serverActive,
      errorCode,
      langAttrCountry,
      errorReason,
      whoIsCountry,
      redirectedTo,
      url,
    } = itemData;
    let notes = [];

    let checkManually = false;
    let unhandledError = "";

    if (
      domError ||
      (serverActive && !langAttrCountry && !errorCode && !errorReason) ||
      (!errorCode && !errorReason && !serverActive)
    ) {
      checkManually = true;
    }

    if (errorCode && errorReason) {
      if (errorCode.match(/ENOTFOUND/gi) || errorReason.match(/ENOTFOUND/gi)) {
        notes.push("This site can’t be reached | Not safety");
      } else if (errorCode.match(/UND_ERR_CONNECT_TIMEOUT/gi)) {
        notes.push("Тайм-аут подключения");
      } else if (errorCode === 403) {
        checkManually = true;
      } else {
        checkManually = true;
        unhandledError = errorCode;
      }
    }

    csvData.push({
      company: company,
      website: url,
      country:
        !langAttrCountry && !whoIsCountry
          ? " "
          : `${langAttrCountry || "NOT FOUND"} | ${
              whoIsCountry || "NOT FOUND"
            }`,
      notes: notes.join("; "),
      redirect: redirectedTo,
      manually: checkManually,
      unhandled: unhandledError,
    });
  });

  if (fs.existsSync(OUTPUT_PATH)) {
    fs.rmSync(OUTPUT_PATH);
  }

  const csv = await json2csv(csvData);

  fs.appendFileSync(OUTPUT_PATH, csv);
}

module.exports = createCsvFile;
