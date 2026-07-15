let sessionStart = new Date();
let sessionInterval = null;

function formatSessionTime(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");

  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");

  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

function updateSessionClock() {
  const now = new Date();

  const clock = document.getElementById("liveClock");
  if (clock) {
    clock.textContent = now.toLocaleTimeString();
  }

  const timer = document.getElementById("sessionTimer");
  if (timer) {
    const elapsed = Math.floor((now - sessionStart) / 1000);
    timer.textContent = formatSessionTime(elapsed);
  }
}

window.startSessionClock = function () {
  sessionStart = new Date();

  if (sessionInterval) {
    clearInterval(sessionInterval);
  }

  updateSessionClock();
  sessionInterval = setInterval(updateSessionClock, 1000);
};
