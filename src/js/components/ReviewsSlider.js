/**
 * ReviewsSlider
 * 
 * Implements mouse-draggable horizontal scrolling for the reviews carousel,
 * along with arrow and dot navigation that matches the portfolio slider's design.
 */

export default class ReviewsSlider {
  constructor() {
    this.container = document.querySelector('.reviews-scroll');
    this.wrapper = document.querySelector('.reviews-slider-wrapper');
    this.dotsContainer = document.querySelector('.reviews-dots');
    this.prevBtn = this.wrapper?.querySelector('.bento-nav-btn--prev');
    this.nextBtn = this.wrapper?.querySelector('.bento-nav-btn--next');
    
    this.isDown = false;
    this.startX = 0;
    this.scrollLeft = 0;
    this.cards = [];
    this.dots = [];
    this.gap = 24; // 1.5rem
  }

  init() {
    if (!this.container) return;

    this.cards = [...this.container.querySelectorAll('.review-card')];
    if (this.cards.length === 0) return;

    this._initDrag();
    this._initArrows();
    this._initDots();
    this._initScrollSync();
    
    // Initial UI state
    setTimeout(() => this._updateUI(), 100);

    // Re-sync on resize
    window.addEventListener('resize', () => this._updateUI());
  }

  /**
   * Mouse dragging logic
   */
  _initDrag() {
    this.container.addEventListener('mousedown', (e) => {
      // Only drag with left mouse button
      if (e.button !== 0) return;
      
      this.isDown = true;
      this.hasMoved = false;
      this.container.classList.add('is-dragging');
      this.startX = e.pageX - this.container.offsetLeft;
      this.scrollLeft = this.container.scrollLeft;
    });

    // Prevent clicks on links or cards if we actually dragged
    this.container.addEventListener('click', (e) => {
      if (this.hasMoved) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);

    window.addEventListener('mouseleave', () => this._stopDragging());
    window.addEventListener('mouseup', () => this._stopDragging());

    window.addEventListener('mousemove', (e) => {
      if (!this.isDown) return;

      const x = e.pageX - this.container.offsetLeft;
      const dist = x - this.startX;

      // Threshold to prevent tiny accidental movements from being counted as drag
      if (!this.hasMoved && Math.abs(dist) > 8) {
        this.hasMoved = true;
      }

      if (this.hasMoved) {
        e.preventDefault();
        // Reduced multiplier for more controlled movement
        const walk = dist * 1.5;
        this.container.scrollLeft = this.scrollLeft - walk;
      }
    });
  }

  _stopDragging() {
    if (!this.isDown) return;
    this.isDown = false;
    this.container.classList.remove('is-dragging');
  }

  /**
   * Arrow navigation
   */
  _initArrows() {
    if (!this.prevBtn || !this.nextBtn) return;

    this.prevBtn.addEventListener('click', () => {
      const cardWidth = this.cards[0].offsetWidth + this.gap;
      this.container.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    });

    this.nextBtn.addEventListener('click', () => {
      const cardWidth = this.cards[0].offsetWidth + this.gap;
      this.container.scrollBy({ left: cardWidth, behavior: 'smooth' });
    });
  }

  /**
   * Pagination dots
   */
  _initDots() {
    if (!this.dotsContainer) return;
    
    // Clear existing (if any)
    this.dotsContainer.innerHTML = '';
    this.dots = [];

    this.cards.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'bento-nav-dot';
      dot.setAttribute('aria-label', `Zobraziť recenziu ${i + 1}`);
      dot.addEventListener('click', () => {
        const cardWidth = this.cards[0].offsetWidth + this.gap;
        this.container.scrollTo({ left: i * cardWidth, behavior: 'smooth' });
      });
      this.dotsContainer.appendChild(dot);
      this.dots.push(dot);
    });
  }

  /**
   * Keep UI in sync with scroll position
   */
  _initScrollSync() {
    let timeout;
    this.container.addEventListener('scroll', () => {
      if (timeout) cancelAnimationFrame(timeout);
      timeout = requestAnimationFrame(() => this._updateUI());
    }, { passive: true });
  }

  _updateUI() {
    if (!this.container || this.cards.length === 0) return;

    const scrollPos = this.container.scrollLeft;
    const cardWidth = this.cards[0].offsetWidth + this.gap;
    const activeIndex = Math.round(scrollPos / cardWidth);

    // Sync dots
    this.dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === activeIndex);
    });

    // Sync arrows and fades
    const maxScroll = this.container.scrollWidth - this.container.offsetWidth;
    const isAtStart = scrollPos <= 10;
    const isAtEnd = scrollPos >= maxScroll - 10;

    if (this.prevBtn) this.prevBtn.disabled = isAtStart;
    if (this.nextBtn) this.nextBtn.disabled = isAtEnd;
  }
}
