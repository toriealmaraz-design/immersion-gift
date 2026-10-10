/**
 * Immersion Gift — Memory lightbox
 * Clicking a photo or video opens a full-screen lightbox with unhindered
 * playback controls for video clips.
 */

(function () {
  "use strict";

  const items = Array.from(document.querySelectorAll(".memory-item"));
  const media = document.getElementById("lightboxMedia");
  const caption = document.getElementById("lightboxCaption");
  const backdrop = document.getElementById("lightbox");
  const closeBtn = document.getElementById("lightboxClose");
  const prevBtn = document.getElementById("lightboxPrev");
  const nextBtn = document.getElementById("lightboxNext");

  let current = -1;

  // ── Helpers ─────────────────────────────────────────────────────────
  function isVideo(el) {
    return el.tagName && el.tagName.toLowerCase() === "video";
  }

  function setMedia(el) {
    if (isVideo(el)) {
      const src = el.querySelector("source")?.getAttribute("src") || el.src;
      media.innerHTML = `<video src="${src}" controls playsinline autoplay loop></video>`;
    } else {
      const src = el.querySelector("img")?.getAttribute("src") || el.querySelector("source")?.getAttribute("src");
      caption.textContent = el.querySelector(".memory-caption")?.textContent || "";
      media.innerHTML = `<img src="${src}" alt="${el.querySelector("img")?.getAttribute("alt") || ""}" />`;
    }
    // Reset to first frame / beginning
    const vid = media.querySelector("video");
    if (vid) vid.currentTime = 0;
  }

  function open(index) {
    if (index < 0 || index >= items.length) return;
    current = index;
    const el = items[current];
    setMedia(el);
    backdrop.hidden = false;
    backdrop.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    // Focus
    setTimeout(() => closeBtn.focus(), 50);
  }

  function close() {
    backdrop.hidden = true;
    backdrop.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    // Return focus to the item that opened it
    const el = items[current] || items[0];
    el?.focus();
  }

  // ── Attach item handlers ────────────────────────────────────────────
  items.forEach((el, i) => {
    el.addEventListener("click", () => open(i));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open(i);
      }
    });
  });

  // ── Lightbox navigation ─────────────────────────────────────────────
  closeBtn.addEventListener("click", close);
  prevBtn.addEventListener("click", () => {
    const next = (current - 1 + items.length) % items.length;
    open(next);
  });
  nextBtn.addEventListener("click", () => {
    const next = (current + 1) % items.length;
    open(next);
  });

  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) close();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !backdrop.hidden) close();
    if (e.key === "ArrowLeft" && !backdrop.hidden) prevBtn.click();
    if (e.key === "ArrowRight" && !backdrop.hidden) nextBtn.click();
  });

  // ── Prevent body scroll while lightbox is open ──────────────────────
  document.addEventListener("keydown", (e) => {
    if (e.key === "Tab" && !backdrop.hidden) {
      const focusables = media.querySelectorAll("a, button, video");
      if (focusables.length) focusables[0].focus();
    }
  });
})();
