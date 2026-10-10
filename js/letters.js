/**
 * Immersion Gift — Letters page logic
 * Envelope card open → glassmorphism reading modal.
 */

(function () {
  "use strict";

  const cards = Array.from(document.querySelectorAll(".envelope-card"));
  const modal = document.getElementById("letterModal");
  const closeBtn = document.getElementById("letterClose");
  const pinBtn = document.getElementById("letterPin");

  // ── Open ────────────────────────────────────────────────────────────
  function openCard(card) {
    const modalEl = modal;
    modalEl.hidden = false;
    modalEl.setAttribute("aria-hidden", "false");
    // Focus management: focus the close button for keyboard users
    setTimeout(() => closeBtn.focus(), 50);
  }

  function closeAll() {
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    // Return focus to the card that opened it (fallback: nav item)
    const active = document.querySelector(".nav-item.active");
    if (active) {
      // Just nudge so the user can tab to cards again without jumping the whole dock
      document.activeElement?.blur();
    }
  }

  // ── Attach card clicks ──────────────────────────────────────────────
  cards.forEach((card) => {
    card.addEventListener("click", () => openCard(card));
    // Keyboard: Enter / Space
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openCard(card);
      }
    });
  });

  // ── Close (X / pin / backdrop / Escape) ─────────────────────────────
  closeBtn.addEventListener("click", closeAll);

  pinBtn.addEventListener("click", () => {
    // Feature flag: when on, the card gets a "pinned" state.
    // (Draft: we keep it simple and just close; actual persistence
    //  would be a bookmark / localStorage for a real product.)
    const card = document.querySelector(".envelope-card[style*='display: block']") ||
                 cards[cards.length - 1];
    // Toggle a class on the last open card
    const last = card;
    last.classList.toggle("pinned");
  });

  modal.addEventListener("click", (e) => {
    // Click on backdrop (outside the modal card) closes
    if (e.target === modal) closeAll();
  });

  // Keyboard
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) closeAll();
  });

  // ── Smooth scroll to letters on load ────────────────────────────────
  // (No-op: the letters section is already the primary content.)
})();
