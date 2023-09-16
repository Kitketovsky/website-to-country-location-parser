import path from "path";

const APP_CONFIG = {
  screenshotsPath: path.join(process.cwd(), "screenshots"),
  inputPath: path.join(process.cwd(), "input.xlsx"),
  outputPath: path.join(process.cwd(), "output.xlsx"),
};

export default APP_CONFIG;
