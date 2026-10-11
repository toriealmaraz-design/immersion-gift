/**
 * Immersion Gift — Universe open logic
 *
 * The page starts with the on-screen entry gateway.
 * The gateway runs a short, sweet entrance animation (~3.9s):
 *   Phase 1 (0–1.2s): card scales in gently + sparkles rise
 *   Phase 2 (1.2–2.6s): card fades out + galaxy fades in
 *   Phase 3 (2.6–3.9s): swoosh text strokes over the galaxy as finale
 * After the animation, the entry gateway dissolves and the
 * Three.js galaxy scene fills the screen. No click required.
 */

(() => {
  "use strict";

  const card = document.getElementById("entryCard");
  const scene = document.getElementById("galaxyScene");
  const overlay = document.getElementById("entryOverlay");

  if (!card || !scene || !overlay) return;

  // ---------- Phase 1: Card entrance (elegant scale + fade, ~1.2s) ----------
  card.style.opacity = "0";
  card.style.transform = "translateY(24px) scale(0.92)";
  void card.offsetHeight; // force reflow so the transition fires
  card.style.transition =
    "opacity 1s ease-out, transform 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
  card.style.opacity = "1";
  card.style.transform = "translateY(0) scale(1)";

  // ---------- Phase 2: Galaxy fade-in (1.4s) ----------
  const gal = document.getElementById("galaxyScene");
  if (gal) {
    gal.style.opacity = "0";
    void gal.offsetHeight;
    gal.style.transition =
      "opacity 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    gal.style.opacity = "1";
  }

  // ---------- Phase 3: Sparkle field rises behind the card ----------
  const stardust = document.getElementById("entryStardust");
  if (stardust) {
    stardust.style.opacity = "1";
  }

  // ---------- Swoosh text (finale, reveals at ~2.4s) ----------
  const swoosh = document.createElement("div");
  swoosh.id = "swoosh";
  swoosh.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:1000;" +
    "display:flex;align-items:center;justify-content:center;opacity:0;text-align:center;color:transparent;" +
    "letter-spacing:0.6em;font-family:var(--font-display);font-size:0px;overflow:hidden;";
  document.body.appendChild(swoosh);

  const swooshText = "✦  A GALAXY OF LOVE  ✦";
  swoosh.textContent = swooshText;
  swoosh.style.letterSpacing = "0.6em";
  const swooshW = swoosh.offsetWidth;
  swoosh.style.width = swooshW + "px";
  swoosh.style.opacity = "0.85";
  swoosh.style.fontSize = "clamp(2.2rem, 5vw, 3.2rem)";

  // Reveal the swoosh as the finale (~2.4s in)
  setTimeout(() => {
    swoosh.style.transition =
      "opacity 1s ease-out, font-size 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), letter-spacing 0.4s";
    swoosh.style.opacity = "1";
    swoosh.style.fontSize = "clamp(2.2rem, 5vw, 3.2rem)";
    swoosh.style.textAlign = "center";
    swoosh.style.marginTop = "-60px";
  }, 2400);

  // ---------- Cleanup on page unload ----------
  window.addEventListener("beforeunload", () => {
    clearTimeout(swoosh.timer);
    const el = document.getElementById("swoosh");
    if (el) el.remove();
  });
})();
