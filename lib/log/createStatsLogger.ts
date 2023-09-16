export default function createStatsLogger({ all }: { all: number }) {
  const stats = { all, successed: 0, failed: 0 };

  console.log("Parsing has been started...");

  return function log(status: "success" | "failed") {
    status === "success" ? stats.successed++ : stats.failed++;

    const now = new Date().toLocaleTimeString();

    console.log(
      `${now}:: [successed]: ${stats.successed} [failed]: ${stats.failed} [all]: ${stats.all} `
    );
  };
}
