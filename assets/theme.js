/* =========================================
   UNAMÉ — theme.js
   ========================================= */

/* ---- Cart Drawer ---- */
const CartDrawer = {
  overlay: null,
  drawer: null,
  bodyEl: null,
  totalEl: null,

  init() {
    this.overlay = document.getElementById('cart-drawer-overlay');
    this.drawer  = document.getElementById('cart-drawer');
    this.bodyEl  = document.getElementById('cart-drawer-body');
    this.totalEl = document.getElementById('cart-drawer-total');

    // Open
    document.querySelectorAll('[data-open-cart]').forEach(btn => {
      btn.addEventListener('click', e => { e.preventDefault(); this.open(); });
    });

    // Close
    this.overlay?.addEventListener('click', () => this.close());
    document.getElementById('cart-drawer-close')?.addEventListener('click', () => this.close());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });

    // Sync count on load
    this.syncCount();
  },

  open() {
    this.overlay?.classList.add('is-open');
    this.drawer?.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    this.render();
  },

  close() {
    this.overlay?.classList.remove('is-open');
    this.drawer?.classList.remove('is-open');
    document.body.style.overflow = '';
  },

  async render() {
    try {
      const cart = await this.fetchCart();
      this.syncCount(cart.item_count);
      this.renderItems(cart);
      this.renderTotal(cart);
    } catch (err) {
      console.error('[CartDrawer] render error', err);
    }
  },

  async fetchCart() {
    const res = await fetch('/cart.js', { headers: { 'Content-Type': 'application/json' } });
    return res.json();
  },

  async syncCount(count) {
    if (count === undefined) {
      const cart = await this.fetchCart();
      count = cart.item_count;
    }
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.setAttribute('data-count', count);
      el.textContent = count;
    });
  },

  renderItems(cart) {
    if (!this.bodyEl) return;
    if (cart.item_count === 0) {
      this.bodyEl.innerHTML = '<p class="cart-drawer__empty">Votre panier est vide</p>';
      return;
    }
    this.bodyEl.innerHTML = cart.items.map(item => `
      <div class="cart-item" data-key="${item.key}">
        <img class="cart-item__image"
             src="${item.image ?? ''}"
             alt="${item.title}"
             loading="lazy"
             width="80" height="80">
        <div class="cart-item__details">
          <span class="cart-item__name">${item.product_title}</span>
          ${item.variant_title ? `<span class="cart-item__variant">${item.variant_title}</span>` : ''}
          <div class="cart-item__qty-row">
            <button class="cart-item__qty-btn" data-key="${item.key}" data-qty="${item.quantity - 1}" aria-label="Diminuer">−</button>
            <span class="cart-item__qty-val">${item.quantity}</span>
            <button class="cart-item__qty-btn" data-key="${item.key}" data-qty="${item.quantity + 1}" aria-label="Augmenter">+</button>
            <button class="cart-item__remove" data-key="${item.key}">Supprimer</button>
          </div>
          <span class="cart-item__price">${this.formatPrice(item.line_price)}</span>
        </div>
      </div>
    `).join('');

    this.bodyEl.querySelectorAll('.cart-item__qty-btn').forEach(btn => {
      btn.addEventListener('click', () => this.updateItem(btn.dataset.key, parseInt(btn.dataset.qty)));
    });
    this.bodyEl.querySelectorAll('.cart-item__remove').forEach(btn => {
      btn.addEventListener('click', () => this.updateItem(btn.dataset.key, 0));
    });
  },

  renderTotal(cart) {
    if (this.totalEl) this.totalEl.textContent = this.formatPrice(cart.total_price);
  },

  async updateItem(key, quantity) {
    try {
      const res = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, quantity })
      });
      const cart = await res.json();
      this.syncCount(cart.item_count);
      this.renderItems(cart);
      this.renderTotal(cart);
    } catch (err) {
      console.error('[CartDrawer] update error', err);
    }
  },

  formatPrice(cents) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
  }
};

/* ---- Header ---- */
const Header = {
  init() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    // Scroll border
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Mobile burger
    const burger = document.getElementById('header-burger');
    const nav    = document.getElementById('header-nav');
    burger?.addEventListener('click', () => {
      burger.classList.toggle('is-active');
      nav?.classList.toggle('is-open');
    });

    // Close mobile menu on link click
    nav?.querySelectorAll('.header__nav-link').forEach(link => {
      link.addEventListener('click', () => {
        burger?.classList.remove('is-active');
        nav.classList.remove('is-open');
      });
    });
  }
};

/* ---- Boot ---- */
document.addEventListener('DOMContentLoaded', () => {
  Header.init();
  CartDrawer.init();
});
