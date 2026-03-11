/**
 * PortfolioSlider
 *
 * Groups `.bento-wrapper` items from a `.bento-grid` into pages of
 * ITEMS_PER_PAGE, builds a horizontal slider with arrow + dot navigation,
 * and animates between pages with a staggered horizontal swish effect.
 *
 * Design contract: zero changes to existing card HTML or CSS.
 * Only activates on viewport widths > 900 px (below that the grid stacks).
 */

/** Number of cards shown per slider page. */
const ITEMS_PER_PAGE = 4;

/** Stagger delay between individual cards on entry (ms). */
const STAGGER_MS = 70;

/** Must match the CSS ease duration used for track sliding. */
const SLIDE_MS = 550;

/* ─── Tiny DOM helper ──────────────────────────────────────────────────── */

/**
 * Create an HTMLElement with a className string.
 * @param {string} tag
 * @param {string} classes
 * @returns {HTMLElement}
 */
function mkEl(tag, classes) {
  const node = document.createElement(tag);
  node.className = classes;
  return node;
}

/* ─── PortfolioSlider ──────────────────────────────────────────────────── */

export default class PortfolioSlider {
  /**
   * @param {string} gridSelector - CSS selector for the original `.bento-grid`
   */
  constructor(gridSelector) {
    /** @type {string} */
    this._sel = gridSelector;
    /** @type {number} current page index */
    this._current = 0;
    /** @type {boolean} prevents overlapping animations */
    this._locked = false;
    /** @type {HTMLElement[]} page divs in the slider track */
    this._pageEls = [];
    /** @type {HTMLElement[][]} grouped bento-wrapper arrays */
    this._groups = [];
    /** @type {HTMLElement[]} dot button elements */
    this._dotBtns = [];
  }

  /* ─── Public API ───────────────────────────────────────────────────────── */

  /**
   * Reads the DOM, splits cards into pages, builds the slider structure,
   * and shows the first page.  No-ops silently if conditions aren't met.
   */
  init() {
    const grid = document.querySelector(this._sel);
    if (!grid) return;

    // Slider is for desktop only – on mobile the grid stacks vertically.
    if (window.matchMedia('(max-width: 900px)').matches) return;

    // Reverse so newest item (last in HTML) appears first in the slider
    const wrappers = [...grid.querySelectorAll(':scope > .bento-wrapper')].reverse();
    if (wrappers.length <= ITEMS_PER_PAGE) return; // Nothing to slide

    // Split into page groups of ITEMS_PER_PAGE
    for (let i = 0; i < wrappers.length; i += ITEMS_PER_PAGE) {
      this._groups.push(wrappers.slice(i, i + ITEMS_PER_PAGE));
    }

    this._buildSlider(grid);
    this._buildDots();
    this._setPageWidths(); // Must happen before first _show() so translateX is correct
    this._show(0, false); // Instant – no animation on first load
    this._listenResize();
  }

  /* ─── DOM Construction ─────────────────────────────────────────────────── */

  /**
   * Replaces the original `.bento-grid` with the full slider structure.
   * @param {HTMLElement} grid - the original grid element to replace
   */
  _buildSlider(grid) {
    // Outer wrapper – position:relative so arrows can be anchored inside
    this._wrapper = mkEl('div', 'bento-slider-wrapper');

    // Arrow buttons sit as direct children of wrapper (outside the clip)
    this._prevBtn = this._makeArrow('prev');
    this._nextBtn = this._makeArrow('next');

    // Clip – hides overflowing pages
    this._clip = mkEl('div', 'bento-slider-clip');

    // Track – the scrolling flex row that holds all pages side by side
    this._track = mkEl('div', 'bento-slider-track');

    // Build each page – each is a .bento-grid so nth-child CSS still applies
    this._pageEls = this._groups.map((items) => {
      const page = mkEl('div', 'bento-grid bento-page');

      items.forEach((wrapper) => {
        // Solo card on its page → make it span the full 12 columns
        wrapper.style.gridColumn = items.length === 1 ? '1 / -1' : '';
        // Cards may never have been observed by IntersectionObserver yet;
        // marking them visible here ensures the fade-in CSS doesn't hide them.
        wrapper.classList.add('visible');
        page.appendChild(wrapper);
      });

      // Fix 2: fill remaining slots with invisible placeholders so every page
      // has exactly ITEMS_PER_PAGE grid children → consistent bento layout.
      for (let j = items.length; j < ITEMS_PER_PAGE; j++) {
        const ph = mkEl('div', 'bento-wrapper bento-placeholder');
        ph.setAttribute('aria-hidden', 'true');
        page.appendChild(ph);
      }

      this._track.appendChild(page);
      return page;
    });

    this._clip.appendChild(this._track);
    this._wrapper.append(this._prevBtn, this._clip, this._nextBtn);

    // Swap original grid for slider wrapper
    grid.parentNode.replaceChild(this._wrapper, grid);

    // Wire arrow click handlers
    this._prevBtn.addEventListener('click', () => this._nav(-1));
    this._nextBtn.addEventListener('click', () => this._nav(+1));
  }

  /**
   * Builds the dot navigation row and inserts it after the slider wrapper.
   */
  _buildDots() {
    this._dotsEl = mkEl('div', 'bento-nav-dots');
    this._dotsEl.setAttribute('role', 'tablist');
    this._dotsEl.setAttribute('aria-label', 'Portfólio skupiny');

    this._dotBtns = this._groups.map((_, i) => {
      const btn = mkEl('button', 'bento-nav-dot');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-label', `Skupina ${i + 1}`);
      btn.addEventListener('click', () => this._show(i));
      this._dotsEl.appendChild(btn);
      return btn;
    });

    this._wrapper.insertAdjacentElement('afterend', this._dotsEl);
  }

  /**
   * Creates an arrow button with the appropriate chevron SVG.
   * @param {'prev'|'next'} dir
   * @returns {HTMLButtonElement}
   */
  _makeArrow(dir) {
    const btn = mkEl('button', `bento-nav-btn bento-nav-btn--${dir}`);
    btn.setAttribute(
      'aria-label',
      dir === 'prev' ? 'Predchádzajúca skupina' : 'Nasledujúca skupina',
    );
    const pts = dir === 'prev' ? '15 18 9 12 15 6' : '9 18 15 12 9 6';
    btn.innerHTML =
      `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" ` +
      `stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">` +
      `<polyline points="${pts}"/></svg>`;
    return btn;
  }

  /* ─── Navigation ───────────────────────────────────────────────────────── */

  /**
   * Navigate by a relative delta (+1 = next page, -1 = previous page).
   * @param {number} delta
   */
  _nav(delta) {
    this._show(this._current + delta);
  }

  /**
   * Navigate to an absolute page index.
   *
   * @param {number}  next    - target page index (0-based)
   * @param {boolean} [animate=true] - false = instant, no transition
   */
  _show(next, animate = true) {
    const total = this._groups.length;
    if (next < 0 || next >= total) return;
    if (animate && this._locked) return;

    const prev = this._current;
    this._current = next;
    const dir = next >= prev ? 1 : -1; // 1 = rightward (forward), -1 = leftward (back)

    if (animate) this._locked = true;

    const clipW = this._clip.offsetWidth;
    const toPage = this._pageEls[next];
    const toCards = [...toPage.querySelectorAll(':scope > .bento-wrapper')];

    if (!animate) {
      // ── Instant positioning: no transitions, no stagger ────────────────
      this._track.style.transition = 'none';
      this._track.style.transform = `translateX(-${next * clipW}px)`;

      // Only the active page renders; others are hidden so the overflow:visible
      // clip doesn't expose them at rest.
      this._pageEls.forEach((p, i) => {
        p.style.visibility = i === next ? 'visible' : 'hidden';
      });

      // Ensure all card states are clean
      toCards.forEach((c) => {
        c.style.transition = 'none';
        c.style.transform = 'none';
        c.style.opacity = '1';
      });
    } else {
      // ── Animated slide ─────────────────────────────────────────────────

      // Fix 4: enable overflow:hidden only while pages are sliding so that
      // hover box-shadows are visible at rest (clip has overflow:visible normally).
      this._clip.classList.add('bento-slider-clip--animating');

      // Make all pages temporarily visible so incoming and outgoing can both
      // animate. They will be re-hidden after animation completes.
      this._pageEls.forEach((p) => (p.style.visibility = 'visible'));

      // 1. Pre-position incoming cards offset in the arrival direction
      toCards.forEach((c) => {
        c.style.transition = 'none';
        c.style.transform = `translateX(${dir * 48}px)`;
        c.style.opacity = '0';
      });

      // Two rAFs: flush 'none' transitions before starting animated ones
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Re-measure in case a resize fired between call and paint
          const freshW = this._clip.offsetWidth;

          // 2. Slide the track to the new page
          this._track.style.transition = `transform ${SLIDE_MS}ms cubic-bezier(0.77, 0, 0.175, 1)`;
          this._track.style.transform = `translateX(-${next * freshW}px)`;

          // 3. Staggered swish: each card springs into place with a delay
          toCards.forEach((card, i) => {
            const delay = i * STAGGER_MS;
            card.style.transition =
              `transform 500ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, ` +
              `opacity 400ms ease ${delay}ms`;
            card.style.transform = 'none';
            card.style.opacity = '1';
          });

          // Unlock and restore overflow:visible after animation completes.
          // Hide all pages except the now-active one so the overflow:visible
          // clip doesn't expose their content at rest.
          const totalMs = SLIDE_MS + toCards.length * STAGGER_MS;
          setTimeout(() => {
            this._locked = false;
            this._clip.classList.remove('bento-slider-clip--animating');
            this._pageEls.forEach((p, i) => {
              p.style.visibility = i === this._current ? 'visible' : 'hidden';
            });
          }, totalMs);
        });
      });
    }

    this._syncControls();
  }

  /* ─── Control Sync ─────────────────────────────────────────────────────── */

  /**
   * Updates arrow disabled states and the active dot to match `_current`.
   */
  _syncControls() {
    const last = this._groups.length - 1;
    this._prevBtn.disabled = this._current === 0;
    this._nextBtn.disabled = this._current === last;

    this._dotBtns.forEach((btn, i) => {
      const active = i === this._current;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });
  }

  /* ─── Resize handling ──────────────────────────────────────────────────── */

  /**
   * Sets each page's pixel width to match the clip container.
   * Must be called once after the slider is in the DOM and any time the
   * clip width changes (handled by _listenResize).
   */
  _setPageWidths() {
    const w = this._clip.offsetWidth;
    this._pageEls.forEach((p) => (p.style.width = `${w}px`));
  }

  /**
   * Re-measures clip width on resize so pixel-based track translation stays
   * accurate if the viewport is resized while a desktop layout is active.
   */
  _listenResize() {
    let rafId = null;
    window.addEventListener('resize', () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        // Below breakpoint the slider isn't active; do nothing
        if (window.matchMedia('(max-width: 900px)').matches) return;
        this._setPageWidths();
        const w = this._clip.offsetWidth;
        // Reposition track instantly (no animation on resize)
        this._track.style.transition = 'none';
        this._track.style.transform = `translateX(-${this._current * w}px)`;
        rafId = null;
      });
    });
  }
}
