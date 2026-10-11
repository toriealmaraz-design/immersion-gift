/** 
 * Immersion Gift — Global Persistent Audio Player
 * Keeps the background soundtrack mounted across all pages so navigation
 * never interrupts playback (per blueprint §6.2).
 *
 * The track file is placed at assets/audio/. Update TRACK_URL to match
 * the actual file name in that folder.
 */

(function () {
  "use strict";

  // ── Configuration ───────────────────────────────────────────────────
  // Point this at your local track, or a hosted URL.
  const TRACK_URL = "assets/audio/(meloaz.com) 120 - Adore You.mp3";

  // ── DOM refs ────────────────────────────────────────────────────────
  const widget = document.createElement("div");
  widget.className = "music-widget";

  const toggle = document.createElement("button");
  toggle.className = "music-toggle";
  toggle.setAttribute("aria-label", "Play or pause background music");
  toggle.setAttribute("title", "Pause music");

  const bars = document.createElement("div");
  bars.className = "music-bars";

  const barsCon = document.createElement("div");
  barsCon.className = "bars-con";
  for (let i = 0; i < 8; i++) {
    const bar = document.createElement("span");
    bar.style.height = "30%";
    barsCon.appendChild(bar);
  }
  bars.appendChild(barsCon);

  const label = document.createElement("span");
  label.className = "music-label";
  label.textContent = "Adore You";

  widget.appendChild(toggle);
  widget.appendChild(bars);
  widget.appendChild(label);

  // ── Audio element ───────────────────────────────────────────────────
  const audio = document.createElement("audio");
  audio.id = "bg-audio";
  audio.preload = "auto";
  audio.loop = true;
  audio.src = TRACK_URL;
  audio.volume = 0.5; // subjectively gentle for a romantic gift

  // ── State ───────────────────────────────────────────────────────────
  let playing = false;
  let barInterval = null;

  // ── UI update ───────────────────────────────────────────────────────
  function updateBars() {
    // Grow bars with playback progress
    const progress = audio?.currentTime / Math.max(audio?.duration || 1, 1);
    bars.style.width = "100%";
    const barsCon = bars.querySelector(".bars-con");
    if (barsCon) {
      barsCon.style.transform = `scaleX(${Math.min(progress, 1)})`;
    }
  }

  function stopBars() {
    if (barInterval) {
      clearInterval(barInterval);
      barInterval = null;
    }
  }

  // ── Play / pause ────────────────────────────────────────────────────
  function togglePlay() {
    if (playing) {
      audio.pause();
      toggle.setAttribute("title", "Play music");
      label.textContent = "Adore You · paused";
    } else {
      audio.play().then(() => {
        playing = true;
        toggle.setAttribute("title", "Pause music");
        label.textContent = "Adore You · playing";
        // Continuous animated bars while playing
        stopBars();
        barInterval = setInterval(() => {
          bars.style.width = "100%";
          const progress = audio?.currentTime / Math.max(audio?.duration || 1, 1);
          const barsCon = bars.querySelector(".bars-con");
          if (barsCon) {
            barsCon.style.transform = `scaleX(${Math.min(progress, 1)})`;
          }
        }, 80);
      }).catch((err) => {
        console.warn("Audio playback failed:", err);
        label.textContent = "Adore You · unavailable";
      });
    }
    playing = !playing;
  }

  toggle.addEventListener("click", togglePlay);

  // ── Load / restart ──────────────────────────────────────────────────
  function loadTrack() {
    try {
      audio.load();
      playing = false;
      toggle.setAttribute("title", "Play music");
      label.textContent = "Adore You";
      stopBars();
      updateBars();
    } catch (e) {
      console.warn("Failed to load audio track:", e);
    }
  }

  // ── Inject widget ───────────────────────────────────────────────────
  document.body.appendChild(widget);

  // ── Expose globally for teardown / manual control ───────────────────
  window.ImmersionAudio = {
    play: togglePlay,
    pause: () => { if (playing) togglePlay(); },
    toggle: togglePlay,
    load: loadTrack,
    audio,
    playing,
  };

  // ── Page-resume: re-check if the tab was hidden (some browsers drop
  //     scheduled timers / promise repairs after long hidden periods). ─
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !audio.paused && audio.readyState > 0) {
      // Re-sync visual state
      if (playing) {
        label.textContent = "Adore You · playing";
        bars.style.width = "100%";
        const barsCon = bars.querySelector(".bars-con");
        if (barsCon) barsCon.style.transform = "scaleX(1)";
      }
    }
  });

  // ── Graceful: track missing ─────────────────────────────────────────
  audio.addEventListener("error", () => {
    label.textContent = "Adore You · (track not found)";
    toggle.style.opacity = "0.5";
    toggle.title = "Track not found — set the correct filename in assets/audio/";
  });

  console.log("🎧 Immersion Gift audio player ready — click the music widget to play.");
})();
