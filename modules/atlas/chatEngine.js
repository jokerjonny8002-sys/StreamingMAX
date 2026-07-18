function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function chooseTone(humor, versions) {
  if (humor === "professional") {
    return versions.professional;
  }

  if (humor === "full") {
    return versions.full;
  }

  return versions.friendly;
}

function formatPercent(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? `${Math.round(number)}%`
    : "unavailable";
}

function formatMbps(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? `${number.toFixed(2)} Mbps`
    : "unavailable";
}

function equipmentNames(equipment = []) {
  return equipment
    .map(device =>
      device?.name ||
      device?.displayName ||
      device?.id
    )
    .filter(Boolean);
}

function buildSystemSummary(state, humor) {
  const cpu = formatPercent(
    state.performance?.cpuPercent
  );

  const memory = formatPercent(
    state.performance?.memoryPercent
  );

  const score =
    Number(state.mission?.readinessScore) || 0;

  return chooseTone(humor, {
    professional:
      `CPU is ${cpu}, memory is ${memory}, and mission readiness is ${score}%.`,

    friendly:
      `CPU is sitting at ${cpu}, memory is at ${memory}, and your mission score is ${score}%.`,

    full:
      `CPU is chilling at ${cpu}, memory is holding at ${memory}, and the mission score is ${score}%. Nothing appears to be trying to explode.`
  });
}

function buildStreamAnswer(state, recommendation, humor) {
  const ready =
    Number(state.mission?.readinessScore) >= 85;

  if (ready) {
    return chooseTone(humor, {
      professional:
        `Yes. Mission readiness is ${state.mission.readinessScore}%. ${recommendation.message}`,

      friendly:
        `You’re looking good to stream. Mission readiness is ${state.mission.readinessScore}%. ${recommendation.message}`,

      full:
        `Hell yeah, Commander. You’re sitting at ${state.mission.readinessScore}% readiness. ${recommendation.message}`
    });
  }

  return chooseTone(humor, {
    professional:
      `Not yet. Mission readiness is ${state.mission?.readinessScore || 0}%. ${recommendation.message}`,

    friendly:
      `I’d hold up for one quick fix. Your readiness score is ${state.mission?.readinessScore || 0}%. ${recommendation.message}`,

    full:
      `Not quite yet, boss. We’re at ${state.mission?.readinessScore || 0}%, and I’d rather fix the weak link before we send this bitch live. ${recommendation.message}`
  });
}

function getAtlasChatResponse({
  message,
  state = {},
  recommendation = {},
  profile = {},
  equipment = []
}) {
  const input = normalize(message);
  const humor = normalize(
    profile.atlasHumor || "friendly"
  );

  const name =
    profile.displayName ||
    profile.djName ||
    profile.nickname ||
    profile.realName ||
    "Commander";

  if (!input) {
    return {
      reply: `I’m listening, ${name}.`,
      action: null
    };
  }

  if (
    input === "hi" ||
    input === "hello" ||
    input.includes("hey atlas") ||
    input.includes("what's up") ||
    input.includes("whats up")
  ) {
    return {
      reply: chooseTone(humor, {
        professional:
          `Hello, ${name}. Mission Control is online.`,

        friendly:
          `Hey, ${name}. Mission Control is online. What are we checking?`,

        full:
          `What’s good, ${name}? ATLAS is online and ready to rock this piece.`
      }),
      action: null
    };
  }

  if (
    input.includes("how is my system") ||
    input.includes("how's my system") ||
    input.includes("system status") ||
    input.includes("computer status")
  ) {
    return {
      reply: buildSystemSummary(state, humor),
      action: null
    };
  }

  if (
    input.includes("can i stream") ||
    input.includes("am i ready") ||
    input.includes("mission ready") ||
    input.includes("ready to stream")
  ) {
    return {
      reply: buildStreamAnswer(
        state,
        recommendation,
        humor
      ),
      action: null
    };
  }

  if (
    input.includes("score") ||
    input.includes("readiness")
  ) {
    const score =
      Number(state.mission?.readinessScore) || 0;

    const issue =
      state.mission?.primaryIssue ||
      recommendation.message ||
      "No primary issue is currently listed.";

    return {
      reply:
        `Your mission-readiness score is ${score}%. ${issue}`,
      action: null
    };
  }

  if (input.includes("obs")) {
    if (
      input.includes("open") ||
      input.includes("launch") ||
      input.includes("start")
    ) {
      return {
        reply: chooseTone(humor, {
          professional:
            "Opening OBS now.",

          friendly:
            "Opening OBS for you now.",

          full:
            "Waking OBS up. About damn time it got to work."
        }),
        action: "launch-obs"
      };
    }

    return {
      reply: state.studio?.obsRunning
        ? "OBS is currently online."
        : chooseTone(humor, {
            professional:
              "OBS is not currently running.",

            friendly:
              "OBS isn’t running yet.",

            full:
              "OBS is still sleeping on the job."
          }),
      action: null
    };
  }

  if (
    input.includes("rekordbox") ||
    input.includes("record box")
  ) {
    if (
      input.includes("open") ||
      input.includes("launch") ||
      input.includes("start")
    ) {
      return {
        reply: chooseTone(humor, {
          professional:
            "Opening Rekordbox now.",

          friendly:
            "Opening Rekordbox for you.",

          full:
            "Firing up Rekordbox. Let’s make some damn noise."
        }),
        action: "launch-rekordbox"
      };
    }

    return {
      reply: state.studio?.rekordboxRunning
        ? "Rekordbox is currently online."
        : "Rekordbox is not currently running.",
      action: null
    };
  }

  if (
    input.includes("speed test") ||
    input.includes("test internet")
  ) {
    return {
      reply: chooseTone(humor, {
        professional:
          "Starting the network speed test.",

        friendly:
          "I’ll run a speed test now.",

        full:
          "Let’s see whether the internet is hauling ass or dragging ass."
      }),
      action: "run-speed-test"
    };
  }

  if (
    input.includes("internet") ||
    input.includes("network")
  ) {
    const networkStatus =
      state.network?.status || "checking";

    const upload =
      formatMbps(state.network?.uploadMbps);

    const download =
      formatMbps(state.network?.downloadMbps);

    return {
      reply:
        `Network status is ${networkStatus}. Current traffic shows ${download} download and ${upload} upload. Run a full speed test for a true connection measurement.`,
      action: null
    };
  }

  if (
    input.includes("my studio") ||
    input.includes("equipment") ||
    input.includes("gear")
  ) {
    const names = equipmentNames(equipment);

    if (!names.length) {
      return {
        reply: chooseTone(humor, {
          professional:
            "No equipment has been saved to My Studio.",

          friendly:
            "Your studio profile is empty right now. Add some gear and I’ll keep track of it.",

          full:
            "Your studio is looking a little naked. Add some gear and I’ll remember the whole damn setup."
        }),
        action: "open-studio"
      };
    }

    return {
      reply:
        `Your saved studio contains ${names.length} item${names.length === 1 ? "" : "s"}: ${names.join(", ")}.`,
      action: null
    };
  }

  if (
    input.includes("prepare mission") ||
    input.includes("run preflight") ||
    input.includes("pre-flight")
  ) {
    return {
      reply: chooseTone(humor, {
        professional:
          "Beginning the mission-preparation scan.",

        friendly:
          "Starting a fresh mission scan now.",

        full:
          "Copy that. Checking the important shit before we launch."
      }),
      action: "prepare-mission"
    };
  }

  if (
    input === "help" ||
    input.includes("what can you do")
  ) {
    return {
      reply:
        "Try asking: How is my system? Can I stream? Is OBS running? Open OBS. Open Rekordbox. Run a speed test. What equipment is in My Studio? Prepare Mission.",
      action: null
    };
  }

  return {
    reply: chooseTone(humor, {
      professional:
        "I do not understand that command yet. Try asking about system health, OBS, Rekordbox, network status, mission readiness, or studio equipment.",

      friendly:
        "I’m still learning that one. Ask me about your system, stream readiness, OBS, Rekordbox, internet, or studio gear.",

      full:
        "I ain’t learned that trick yet. Ask me about the computer, stream readiness, OBS, Rekordbox, internet, or your studio gear."
    }),
    action: null
  };
}

module.exports = {
  getAtlasChatResponse
};
