const { execFile } = require("child_process");

function runSpeedTest() {
  return new Promise((resolve) => {
    execFile(
      "/usr/bin/networkQuality",
      ["-c", "-s"],
      { timeout: 120000 },
      (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            error: stderr || error.message,
            downloadMbps: 0,
            uploadMbps: 0,
            responsiveness: 0,
            rating: "ERROR"
          });
          return;
        }

        try {
          const data = JSON.parse(stdout);

          const downloadMbps = Number(
            ((data.dl_throughput || 0) / 1000000).toFixed(1)
          );

          const uploadMbps = Number(
            ((data.ul_throughput || 0) / 1000000).toFixed(1)
          );

          const responsiveness = Math.round(
            data.responsiveness || 0
          );

          let rating = "POOR";

          if (uploadMbps >= 10 && responsiveness >= 1000) {
            rating = "EXCELLENT";
          } else if (uploadMbps >= 6 && responsiveness >= 500) {
            rating = "GOOD";
          } else if (uploadMbps >= 3 && responsiveness >= 150) {
            rating = "FAIR";
          }

          resolve({
            success: true,
            downloadMbps,
            uploadMbps,
            responsiveness,
            rating
          });
        } catch (parseError) {
          resolve({
            success: false,
            error: `Could not read speed-test results: ${parseError.message}`,
            downloadMbps: 0,
            uploadMbps: 0,
            responsiveness: 0,
            rating: "ERROR"
          });
        }
      }
    );
  });
}

module.exports = {
  runSpeedTest
};