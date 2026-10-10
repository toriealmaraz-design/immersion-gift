/**
 * Immersion Gift — Universe open logic
 * Fades out the on-screen entry overlay and reveals the Three.js scene.
 */

(function () {
  "use strict";

  const overlay = document.getElementById("entryOverlay");
  const openBtn = document.getElementById("openUniverse");
  const scene = document.getElementById("galaxyScene");

  if (!overlay || !openBtn || !scene) return;

  // If the scene already built (JS-enabled), skip the overlay immediately.
  if (scene.offsetHeight > 0 || scene.children.length > 0) {
    overlay.style.display = "none";
    return;
  }

  // Fallback: click → fade out → let Three.js kick in
  openBtn.addEventListener("click", () => {
    overlay.style.display = "none";
  });

  // Optionally start the scene a beat early so it's warm when opened.
  setTimeout(() => {
    if (scene.offsetHeight > 0 || scene.children.length > 0) {
      overlay.style.display = "none";
    }
  }, 600);
})();
