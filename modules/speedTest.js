const { execFile } = require("child_process");

function getRating({
  uploadMbps,
  latencyMs,
  responsiveness
}) {
  /*
   * Practical streaming-oriented rating.
   * Upload capacity is the primary constraint.
   */
  if (
    uploadMbps >= 20 &&
    latencyMs <= 50 &&
    responsiveness >= 500
  ) {
    return "EXCELLENT";
  }

  if (
    uploadMbps >= 10 &&
    latencyMs <= 80 &&
    responsiveness >= 150
  ) {
    return "GOOD";
  }

  if (
    uploadMbps >= 5 &&
    latencyMs <= 120
  ) {
    return "FAIR";
  }

  return "POOR";
}

function getRecommendedBitrate(uploadMbps) {
  /*
   * Keep substantial upload headroom instead of assigning
   * the entire connection to OBS.
   */
  const safeCapacity =
    Math.floor(uploadMbps * 1000 * 0.65);

  return Math.max(
    2500,
    Math.min(10000, safeCapacity)
  );
}

function runSpeedTest() {
  return new Promise(resolve => {
    execFile(
      "/usr/bin/networkQuality",
      ["-c", "-s"],
      {
        timeout: 120000,
        maxBuffer: 20 * 1024 * 1024
      },
      (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            message:
              String(stderr || error.message).trim() ||
              "The network test could not be completed.",
            error:
              String(stderr || error.message).trim(),
            downloadMbps: 0,
            uploadMbps: 0,
            latencyMs: 0,
            responsiveness: 0,
            downloadResponsiveness: 0,
            uploadResponsiveness: 0,
            recommendedBitrate: 0,
            rating: "ERROR"
          });

          return;
        }

        try {
          const data = JSON.parse(stdout);

          const downloadMbps = Number(
            (
              Number(data.dl_throughput || 0) /
              1000000
            ).toFixed(1)
          );

          const uploadMbps = Number(
            (
              Number(data.ul_throughput || 0) /
              1000000
            ).toFixed(1)
          );

          const latencyMs = Number(
            Number(data.base_rtt || 0).toFixed(1)
          );

          const downloadResponsiveness =
            Math.round(
              Number(data.dl_responsiveness || 0)
            );

          const uploadResponsiveness =
            Math.round(
              Number(data.ul_responsiveness || 0)
            );

          /*
           * Download responsiveness is the most useful
           * overall responsiveness value from this test.
           */
          const responsiveness =
            downloadResponsiveness;

          const rating = getRating({
            uploadMbps,
            latencyMs,
            responsiveness
          });

          const recommendedBitrate =
            getRecommendedBitrate(uploadMbps);

          resolve({
            success: true,
            downloadMbps,
            uploadMbps,
            latencyMs,
            responsiveness,
            downloadResponsiveness,
            uploadResponsiveness,
            recommendedBitrate,
            rating,

            twitchReady:
              uploadMbps >= 8 &&
              latencyMs <= 100,

            tiktokReady:
              uploadMbps >= 6 &&
              latencyMs <= 120,

            youtubeReady:
              uploadMbps >= 10 &&
              latencyMs <= 100,

            interfaceName:
              data.interface_name || "unknown",

            endpoint:
              data.test_endpoint || "unknown"
          });
        } catch (parseError) {
          resolve({
            success: false,
            message:
              `Could not read speed-test results: ${parseError.message}`,
            error: parseError.message,
            downloadMbps: 0,
            uploadMbps: 0,
            latencyMs: 0,
            responsiveness: 0,
            recommendedBitrate: 0,
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
