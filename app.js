/**
 * Shreeji Campus Canteen - Customer Application Logic
 * Modern, responsive food ordering with QR table detection,
 * Gujarati cultural theme, cart management, and real-time status tracking.
 */

// Sound synthesis using Web Audio API for zero-dependency reliable audio alerts
const SoundFX = {
  ctx: null,
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  },
  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio error", e);
    }
  },
  click() {
    this.playTone(600, 'sine', 0.08, 0.05);
  },
  addToCart() {
    this.playTone(523.25, 'triangle', 0.1, 0.08); // C5
    setTimeout(() => this.playTone(659.25, 'triangle', 0.15, 0.08), 70); // E5
  },
  orderPlaced() {
    // Joyful Gujarati Canteen chime
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C - E - G - C
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.25, 0.12), idx * 110);
    });
  },
  orderReady() {
    // Ready bell alert
    const bellNotes = [880, 880, 1174.66];
    bellNotes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.3, 0.15), idx * 160);
    });
  }
};

// Main Customer App Controller
const CanteenApp = {
  tableNumber: 1,
  menuItems: [],
  cart: [],
  activeCategory: 'All',
  searchQuery: '',
  filterJainOnly: false,
  filterAvailableOnly: false,
  sortBy: 'recommended',
  activeOrderId: null,
  isClosedNoticeDismissed: false,

  init() {
    this.detectTableFromURL();
    this.loadMenu();
    this.loadCart();
    this.checkActiveOrder();
    this.setupEventListeners();
    this.renderMenu();
    this.updateCartUI();
    this.updateOperatingStatus();
    this.startStatusPoller();

    // Check canteen hours every 30 seconds
    setInterval(() => {
      this.updateOperatingStatus();
    }, 30000);
  },

  /**
   * 1. Detect Table Number from URL e.g., ?table=4 or canteen.com/menu?table=4
   */
  detectTableFromURL() {
    const params = new URLSearchParams(window.location.search);
    let tableParam = params.get('table');
    
    // Also check hash #table=4 if passed that way
    if (!tableParam && window.location.hash.includes('table=')) {
      const match = window.location.hash.match(/table=(\d+)/);
      if (match) tableParam = match[1];
    }

    if (tableParam && !isNaN(tableParam) && parseInt(tableParam) > 0) {
      this.tableNumber = parseInt(tableParam);
      localStorage.setItem('shreeji_table_number', this.tableNumber);
    } else {
      const savedTable = localStorage.getItem('shreeji_table_number');
      if (savedTable && !isNaN(savedTable)) {
        this.tableNumber = parseInt(savedTable);
      } else {
        this.tableNumber = 1; // Default table 1
      }
    }

    this.updateTableBanner();
  },

  setTableNumber(tableNum) {
    if (tableNum < 1 || tableNum > 20) return;
    this.tableNumber = parseInt(tableNum);
    localStorage.setItem('shreeji_table_number', this.tableNumber);
    
    // Update URL query string without page reload
    const newUrl = `${window.location.pathname}?table=${this.tableNumber}`;
    window.history.replaceState({ path: newUrl }, '', newUrl);

    this.updateTableBanner();
    this.closeTableModal();
    showToast(`Welcome to Table ${this.tableNumber}!`);
  },

  updateTableBanner() {
    const tableBadgeText = document.getElementById('table-badge-text');
    const tableBannerTitle = document.getElementById('table-welcome-title');
    const orderModalTable = document.getElementById('checkout-table-display');

    if (tableBadgeText) {
      tableBadgeText.textContent = `Table ${this.tableNumber}`;
    }
    if (tableBannerTitle) {
      tableBannerTitle.innerHTML = `Table ${this.tableNumber} – <span class="text-orange-600 font-extrabold">Welcome to Our Canteen</span> <span class="gujarati-font text-amber-800 text-sm block md:inline font-normal mt-1 md:mt-0">(આપનું હાર્દિક સ્વાગત છે)</span>`;
    }
    if (orderModalTable) {
      orderModalTable.value = `Table ${this.tableNumber}`;
    }
  },

  /**
   * 2. Operating Hours System
   * Monday - Saturday: 8:00 AM - 8:00 PM
   * Sunday: Closed
   */
  isCanteenOpen() {
    const override = localStorage.getItem('shreeji_canteen_open_override');
    if (override === 'force_open') return { isOpen: true, reason: 'Open (Special Schedule)' };
    if (override === 'force_closed') return { isOpen: false, reason: 'Temporarily Closed by Admin' };

    const now = new Date();
    const day = now.getDay(); // 0 is Sunday, 1..6 is Mon..Sat
    const hours = now.getHours();

    // Sunday closed
    if (day === 0) {
      return { isOpen: false, reason: 'Sunday Closed' };
    }

    // 8:00 AM to 8:00 PM (8 to 20)
    if (hours >= 8 && hours < 20) {
      return { isOpen: true, reason: 'Open Now • 8:00 AM – 8:00 PM' };
    } else {
      return { isOpen: false, reason: 'Closed • Timings: 8:00 AM – 8:00 PM' };
    }
  },

  updateOperatingStatus() {
    const status = this.isCanteenOpen();
    const statusPill = document.getElementById('canteen-status-pill');
    const statusPillText = document.getElementById('canteen-status-pill-text');
    const closedBanner = document.getElementById('canteen-closed-banner');
    const checkoutBtn = document.getElementById('checkout-submit-btn');

    if (statusPill && statusPillText) {
      if (status.isOpen) {
        statusPill.className = "px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm";
        statusPillText.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span> Open (8 AM – 8 PM)`;
      } else {
        statusPill.className = "px-3 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm";
        statusPillText.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> Closed Now`;
      }
    }

    if (closedBanner) {
      if (!status.isOpen) {
        closedBanner.classList.remove('hidden');
      } else {
        closedBanner.classList.add('hidden');
      }
    }

    if (checkoutBtn) {
      if (!status.isOpen) {
        checkoutBtn.disabled = true;
        checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
        checkoutBtn.title = "Canteen is currently closed";
      } else {
        checkoutBtn.disabled = false;
        checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        checkoutBtn.title = "";
      }
    }
  },

  /**
   * 3. Load Menu Data
   */
  loadMenu() {
    this.menuItems = getMenuDatabase();
  },

  /**
   * 4. Cart Storage & Actions
   */
  loadCart() {
    const saved = localStorage.getItem('shreeji_cart');
    if (saved) {
      try {
        this.cart = JSON.parse(saved);
      } catch (e) {
        this.cart = [];
      }
    }
  },

  saveCart() {
    localStorage.setItem('shreeji_cart', JSON.stringify(this.cart));
    this.updateCartUI();
  },

  addToCart(itemId, quantity = 1) {
    const item = this.menuItems.find(i => i.id === itemId);
    if (!item) return;

    if (!item.isAvailable) {
      showToast("Sorry, this item is currently out of stock!");
      return;
    }

    const existing = this.cart.find(c => c.id === itemId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.cart.push({
        id: item.id,
        nameEn: item.nameEn,
        nameGu: item.nameGu,
        category: item.category,
        price: item.price,
        prepTime: item.prepTime,
        image: item.image,
        quantity: quantity
      });
    }

    SoundFX.addToCart();
    this.saveCart();
    this.animateCartBounce();
    showToast(`Added ${item.nameEn} to cart!`);
  },

  updateCartQuantity(itemId, delta) {
    const index = this.cart.findIndex(c => c.id === itemId);
    if (index === -1) return;

    SoundFX.click();
    this.cart[index].quantity += delta;
    if (this.cart[index].quantity <= 0) {
      this.cart.splice(index, 1);
      showToast("Item removed from cart");
    }
    this.saveCart();
  },

  removeFromCart(itemId) {
    SoundFX.click();
    this.cart = this.cart.filter(c => c.id !== itemId);
    this.saveCart();
    showToast("Item removed from cart");
  },

  clearCart() {
    this.cart = [];
    this.saveCart();
  },

  getCartTotal() {
    return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  },

  getCartCount() {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  },

  /**
   * Timing System:
   * Dynamic order prep time estimation:
   * Highest prep time item + additional items scaling factor
   */
  calculateEstimatedPrepTime() {
    if (this.cart.length === 0) return { min: 0, max: 0, text: "0 min" };

    let maxSinglePrep = 0;
    let totalItemsCount = 0;

    this.cart.forEach(item => {
      if (item.prepTime > maxSinglePrep) {
        maxSinglePrep = item.prepTime;
      }
      totalItemsCount += item.quantity;
    });

    // Additional queue/prep buffer for multiple items
    const additionalBuffer = Math.min(12, Math.floor((totalItemsCount - 1) * 1.5));
    const minTime = maxSinglePrep + Math.floor(additionalBuffer * 0.7);
    const maxTime = minTime + 5;

    return {
      min: minTime,
      max: maxTime,
      text: `${minTime}–${maxTime} minutes`
    };
  },

  animateCartBounce() {
    const badges = document.querySelectorAll('.cart-count-badge');
    badges.forEach(b => {
      b.classList.remove('scale-125');
      void b.offsetWidth; // Trigger reflow
      b.classList.add('scale-125');
      setTimeout(() => b.classList.remove('scale-125'), 200);
    });
  },

  /**
   * 5. Render Food Cards & Filter System
   */
  renderMenu() {
    const container = document.getElementById('food-menu-grid');
    if (!container) return;

    let filtered = [...this.menuItems];

    // Category filter
    if (this.activeCategory !== 'All') {
      filtered = filtered.filter(item => item.category === this.activeCategory);
    }

    // Search query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.nameEn.toLowerCase().includes(q) ||
        item.nameGu.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }

    // Jain filter
    if (this.filterJainOnly) {
      filtered = filtered.filter(item => item.isJain === true);
    }

    // Available only
    if (this.filterAvailableOnly) {
      filtered = filtered.filter(item => item.isAvailable === true);
    }

    // Sorting
    if (this.sortBy === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (this.sortBy === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (this.sortBy === 'prep-asc') {
      filtered.sort((a, b) => a.prepTime - b.prepTime);
    } else if (this.sortBy === 'popular') {
      filtered.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
    }

    const countElem = document.getElementById('menu-item-count');
    if (countElem) {
      countElem.textContent = `${filtered.length} Dishes Found`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-16 text-center bg-white rounded-3xl border border-amber-200/80 p-8 shadow-sm">
          <div class="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 border border-amber-200">
            🔍
          </div>
          <h3 class="text-xl font-bold text-gray-800 mb-1">No items found</h3>
          <p class="text-sm text-gray-500 gujarati-font mb-4">આ કેટેગરીમાં કોઈ વાનગી મળી નથી. કૃપા કરીને ફિલ્ટર બદલો.</p>
          <button onclick="CanteenApp.resetFilters()" class="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold shadow-md transition-all">
            Clear Filters / Show All
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(item => this.createFoodCardHtml(item)).join('');
  },

  createFoodCardHtml(item) {
    const cartItem = this.cart.find(c => c.id === item.id);
    const inCartQty = cartItem ? cartItem.quantity : 0;
    const isOut = !item.isAvailable;

    return `
      <div class="food-card bg-white rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm relative ${isOut ? 'opacity-70 grayscale-[20%]' : ''}">
        <!-- Image & Tags Container -->
        <div class="relative h-48 w-full overflow-hidden bg-amber-50">
          <img 
            src="${item.image}" 
            alt="${item.nameEn}"
            loading="lazy"
            onerror="this.src='images/masala-bhakhri.jpg'"
            class="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none"></div>

          <!-- Top badges -->
          <div class="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
            <span class="veg-indicator bg-white/95 shadow-sm" title="100% Pure Vegetarian">
              <span class="veg-indicator-dot"></span>
            </span>
            ${item.isJain ? `
              <span class="px-2 py-0.5 bg-purple-900/90 text-purple-100 rounded-md text-[10px] font-black uppercase tracking-wider backdrop-blur-sm shadow-sm" title="Jain Friendly Available">
                Jain
              </span>
            ` : ''}
            ${item.badge ? `
              <span class="px-2.5 py-0.5 badge-kesari rounded-md text-[11px] font-bold tracking-tight shadow-sm">
                ${item.badge}
              </span>
            ` : ''}
          </div>

          <!-- Prep time pill -->
          <div class="absolute bottom-3 right-3 z-10">
            <span class="px-2.5 py-1 bg-black/75 text-amber-300 rounded-lg text-xs font-semibold backdrop-blur-sm flex items-center gap-1 shadow-sm">
              <svg class="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              ${item.prepTime} mins
            </span>
          </div>

          <!-- Rating -->
          <div class="absolute bottom-3 left-3 z-10 flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-md text-white text-xs font-bold">
            <span class="text-amber-400 text-xs">★</span> ${item.rating || '4.8'}
          </div>

          ${isOut ? `
            <div class="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-20">
              <span class="px-4 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-extrabold uppercase tracking-widest shadow-lg">
                Sold Out / ખૂટી ગયું
              </span>
            </div>
          ` : ''}
        </div>

        <!-- Content Area -->
        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <!-- Category and Gujarati Name -->
            <div class="flex items-start justify-between gap-1 mb-1">
              <div>
                <h3 class="font-extrabold text-gray-900 text-base leading-snug hover:text-orange-600 transition-colors">
                  ${item.nameEn}
                </h3>
                <h4 class="text-xs font-bold text-amber-700 gujarati-font tracking-wide">
                  ${item.nameGu}
                </h4>
              </div>
              <span class="text-lg font-black text-orange-600 flex-shrink-0">
                ₹${item.price}
              </span>
            </div>

            <!-- Description -->
            <p class="text-xs text-gray-500 line-clamp-2 mt-1.5 leading-relaxed">
              ${item.description}
            </p>
          </div>

          <!-- Footer / Action Area -->
          <div class="pt-3 mt-3 border-t border-amber-100/80 flex items-center justify-between">
            <div class="text-[11px] font-medium text-gray-400 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full ${isOut ? 'bg-rose-400' : 'bg-emerald-500'}"></span>
              ${isOut ? 'Unavailable' : 'Fresh & Ready'}
            </div>

            ${isOut ? `
              <button disabled class="px-4 py-1.5 bg-gray-100 text-gray-400 rounded-xl text-xs font-bold cursor-not-allowed">
                Out of Stock
              </button>
            ` : inCartQty > 0 ? `
              <div class="flex items-center bg-orange-50 border border-orange-300 rounded-xl overflow-hidden shadow-sm">
                <button 
                  onclick="CanteenApp.updateCartQuantity('${item.id}', -1)"
                  class="w-8 h-8 flex items-center justify-center font-bold text-orange-700 hover:bg-orange-200 transition-colors text-base"
                  title="Decrease"
                >
                  −
                </button>
                <span class="w-7 text-center font-black text-xs text-orange-900">
                  ${inCartQty}
                </span>
                <button 
                  onclick="CanteenApp.updateCartQuantity('${item.id}', 1)"
                  class="w-8 h-8 flex items-center justify-center font-bold text-orange-700 hover:bg-orange-200 transition-colors text-base"
                  title="Increase"
                >
                  +
                </button>
              </div>
            ` : `
              <button 
                onclick="CanteenApp.addToCart('${item.id}')"
                class="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-xs font-extrabold shadow-sm hover:shadow transition-all flex items-center gap-1.5 active:scale-95"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"></path></svg>
                Add to Cart
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 6. Update Cart UI (Side Drawer + Mobile Floating Bar)
   */
  updateCartUI() {
    const totalCount = this.getCartCount();
    const grandTotal = this.getCartTotal();
    const estTime = this.calculateEstimatedPrepTime();

    // Badges update
    document.querySelectorAll('.cart-count-badge').forEach(el => {
      el.textContent = totalCount;
      if (totalCount > 0) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    });

    // Floating bar on mobile
    const mobileBar = document.getElementById('mobile-cart-float-bar');
    if (mobileBar) {
      if (totalCount > 0) {
        mobileBar.classList.remove('translate-y-32');
        mobileBar.classList.add('translate-y-0');
        document.getElementById('mobile-cart-float-count').textContent = `${totalCount} ${totalCount === 1 ? 'item' : 'items'}`;
        document.getElementById('mobile-cart-float-total').textContent = `₹${grandTotal}`;
        document.getElementById('mobile-cart-float-time').textContent = estTime.text;
      } else {
        mobileBar.classList.remove('translate-y-0');
        mobileBar.classList.add('translate-y-32');
      }
    }

    // Cart Drawer Items Container
    const cartItemsContainer = document.getElementById('cart-drawer-items');
    const emptyState = document.getElementById('cart-drawer-empty');
    const cartFooter = document.getElementById('cart-drawer-footer');
    const prepTimeDisplay = document.getElementById('cart-prep-time-estimate');
    const cartSubtotalElem = document.getElementById('cart-subtotal-display');
    const cartGrandTotalElem = document.getElementById('cart-grand-total-display');

    if (prepTimeDisplay) prepTimeDisplay.textContent = estTime.text;
    if (cartSubtotalElem) cartSubtotalElem.textContent = `₹${grandTotal}`;
    if (cartGrandTotalElem) cartGrandTotalElem.textContent = `₹${grandTotal}`;

    if (totalCount === 0) {
      if (cartItemsContainer) cartItemsContainer.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      if (cartFooter) cartFooter.classList.add('hidden');
      this.renderMenu(); // re-render cards to reset qty counters
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (cartFooter) cartFooter.classList.remove('hidden');

    if (cartItemsContainer) {
      cartItemsContainer.innerHTML = this.cart.map(item => `
        <div class="p-3 bg-amber-50/50 rounded-2xl border border-amber-200/70 flex items-center gap-3 transition-all">
          <img src="${item.image}" alt="${item.nameEn}" class="w-14 h-14 rounded-xl object-cover border border-amber-200 flex-shrink-0" onerror="this.src='images/masala-bhakhri.jpg'" />
          
          <div class="flex-1 min-w-0">
            <h4 class="font-extrabold text-gray-800 text-sm truncate">${item.nameEn}</h4>
            <p class="text-xs text-amber-700 gujarati-font font-medium truncate">${item.nameGu}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs font-bold text-orange-600">₹${item.price}</span>
              <span class="text-[10px] text-gray-400">⏱️ ${item.prepTime}m</span>
            </div>
          </div>

          <!-- Stepper & Item Total -->
          <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
            <div class="flex items-center bg-white border border-amber-300 rounded-lg shadow-2xs">
              <button onclick="CanteenApp.updateCartQuantity('${item.id}', -1)" class="w-6 h-6 flex items-center justify-center font-bold text-gray-600 hover:text-orange-600 text-xs">
                −
              </button>
              <span class="w-6 text-center text-xs font-extrabold text-gray-800">${item.quantity}</span>
              <button onclick="CanteenApp.updateCartQuantity('${item.id}', 1)" class="w-6 h-6 flex items-center justify-center font-bold text-gray-600 hover:text-orange-600 text-xs">
                +
              </button>
            </div>
            <span class="text-xs font-black text-gray-900">₹${item.price * item.quantity}</span>
          </div>
        </div>
      `).join('');
    }

    // Re-render food grid to update quantity steppers on individual cards
    this.renderMenu();
  },

  openCartDrawer() {
    SoundFX.click();
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');
    if (drawer && backdrop) {
      drawer.classList.remove('translate-x-full');
      backdrop.classList.remove('hidden');
    }
  },

  closeCartDrawer() {
    SoundFX.click();
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-backdrop');
    if (drawer && backdrop) {
      drawer.classList.add('translate-x-full');
      backdrop.classList.add('hidden');
    }
  },

  /**
   * 7. Checkout & Order Placement
   */
  openCheckoutModal() {
    if (this.cart.length === 0) {
      showToast("Your cart is empty! Add some delicious snacks first.");
      return;
    }

    const canteenStatus = this.isCanteenOpen();
    if (!canteenStatus.isOpen) {
      showToast("Canteen is currently closed. Please order during opening hours.");
      return;
    }

    SoundFX.click();
    this.closeCartDrawer();

    const modal = document.getElementById('checkout-modal');
    const tableField = document.getElementById('checkout-table-display');
    const totalField = document.getElementById('checkout-total-display');
    const prepField = document.getElementById('checkout-prep-display');
    const itemsList = document.getElementById('checkout-summary-items');

    if (tableField) tableField.value = `Table ${this.tableNumber}`;
    if (totalField) totalField.textContent = `₹${this.getCartTotal()}`;
    if (prepField) prepField.textContent = this.calculateEstimatedPrepTime().text;

    if (itemsList) {
      itemsList.innerHTML = this.cart.map(c => `
        <div class="flex justify-between items-center text-xs text-gray-700 py-1 border-b border-dashed border-gray-200">
          <span class="font-medium">${c.quantity} × ${c.nameEn}</span>
          <span class="font-bold text-gray-900">₹${c.price * c.quantity}</span>
        </div>
      `).join('');
    }

    if (modal) modal.classList.remove('hidden');
  },

  closeCheckoutModal() {
    SoundFX.click();
    const modal = document.getElementById('checkout-modal');
    if (modal) modal.classList.add('hidden');
  },

  submitOrder(event) {
    if (event) event.preventDefault();

    const canteenStatus = this.isCanteenOpen();
    if (!canteenStatus.isOpen) {
      showToast("Canteen is currently closed. Orders cannot be placed right now.");
      return;
    }

    if (this.cart.length === 0) {
      showToast("Your cart is empty!");
      return;
    }

    const nameInput = document.getElementById('cust-name-input');
    const mobileInput = document.getElementById('cust-mobile-input');
    const instructionsInput = document.getElementById('cust-notes-input');
    const paymentMethodInput = document.querySelector('input[name="payment_method"]:checked');

    const customerName = nameInput ? nameInput.value.trim() : "";
    if (!customerName) {
      showToast("Please enter your name!");
      if (nameInput) nameInput.focus();
      return;
    }

    const customerMobile = mobileInput ? mobileInput.value.trim() : "";
    const instructions = instructionsInput ? instructionsInput.value.trim() : "";
    const paymentMethod = paymentMethodInput ? paymentMethodInput.value : "Cash at Counter";

    // Generate unique Order ID e.g., #ORD1025
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const orderId = `#ORD${randomDigits}`;

    const now = new Date();
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const estPrep = this.calculateEstimatedPrepTime();

    const orderData = {
      orderId: orderId,
      tableNumber: this.tableNumber,
      customerName: customerName,
      customerMobile: customerMobile,
      items: JSON.parse(JSON.stringify(this.cart)),
      specialInstructions: instructions,
      totalAmount: this.getCartTotal(),
      itemCount: this.getCartCount(),
      estimatedTime: estPrep.text,
      orderTime: timeFormatted,
      createdAt: Date.now(),
      status: "Order Received", // 'Order Received' | 'Order Accepted' | 'Preparing' | 'Ready' | 'Completed' | 'Rejected'
      paymentMethod: paymentMethod,
      statusHistory: [
        { status: "Order Received", time: timeFormatted, note: "Order sent to kitchen" }
      ]
    };

    // Save order to localStorage database
    const orders = this.getAllOrders();
    orders.unshift(orderData);
    localStorage.setItem('shreeji_canteen_orders', JSON.stringify(orders));

    // Save active order for current student
    this.activeOrderId = orderId;
    localStorage.setItem('shreeji_active_order_id', orderId);

    // Clear cart
    this.clearCart();
    this.closeCheckoutModal();

    // Trigger celebration sound and visual
    SoundFX.orderPlaced();
    this.triggerConfetti();

    // Render Order Confirmation Screen & Banner
    this.showOrderConfirmationNotice(orderData);
  },

  getAllOrders() {
    const raw = localStorage.getItem('shreeji_canteen_orders');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        return [];
      }
    }
    return [];
  },

  triggerConfetti() {
    if (typeof confetti === 'function') {
      try {
        confetti({
          particleCount: 65,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#d9480f', '#f59f00', '#16a34a', '#fab005']
        });
      } catch (e) {}
    }
  },

  /**
   * 8. Order Notice / Confirmation Screen
   * Fulfills exact user prompt requirements:
   * 🔔 CANTEEN ORDER NOTICE
   * Order ID: #ORD1025
   * Table: 4
   * Estimated preparation time: 10–15 minutes
   * Status: 🟡 Order Received
   */
  showOrderConfirmationNotice(order) {
    this.activeOrderData = order;
    const noticeModal = document.getElementById('order-confirmation-modal');
    if (!noticeModal) return;

    document.getElementById('conf-order-id').textContent = order.orderId;
    document.getElementById('conf-table-number').textContent = `Table ${order.tableNumber}`;
    document.getElementById('conf-est-time').textContent = order.estimatedTime;
    document.getElementById('conf-total-amount').textContent = `₹${order.totalAmount}`;
    document.getElementById('conf-customer-name').textContent = order.customerName;

    // Prepopulate WhatsApp number input
    const waInput = document.getElementById('conf-whatsapp-input');
    if (waInput) {
      // If customer mobile exists, show 10-digit number
      let rawPhone = order.customerMobile || '';
      let clean = rawPhone.replace(/\D/g, '');
      if (clean.length === 12 && clean.startsWith('91')) clean = clean.substring(2);
      waInput.value = clean;
    }

    // Items list in confirmation
    const itemsContainer = document.getElementById('conf-items-list');
    if (itemsContainer) {
      itemsContainer.innerHTML = order.items.map(item => `
        <div class="flex justify-between items-center text-xs text-gray-800 py-1">
          <span><b class="text-orange-600">${item.quantity}×</b> ${item.nameEn} <span class="text-[11px] text-gray-500 gujarati-font">(${item.nameGu})</span></span>
          <span class="font-bold">₹${item.price * item.quantity}</span>
        </div>
      `).join('');
    }

    this.renderLiveTracker(order);
    noticeModal.classList.remove('hidden');

    // Also update on-page floating tracker widget
    this.updateActiveOrderWidget(order);
  },

  saveConfirmationWhatsAppNumber() {
    const input = document.getElementById('conf-whatsapp-input');
    if (!input || !this.activeOrderData) return;

    const phone = input.value.trim();
    if (!WhatsAppBillManager.isValidPhone(phone)) {
      showToast("Please enter a valid 10-digit mobile number!");
      input.focus();
      return false;
    }

    this.activeOrderData.customerMobile = phone;
    const orders = this.getAllOrders();
    const idx = orders.findIndex(o => o.orderId === this.activeOrderData.orderId);
    if (idx !== -1) {
      orders[idx].customerMobile = phone;
      localStorage.setItem('shreeji_canteen_orders', JSON.stringify(orders));
    }
    showToast("WhatsApp number updated successfully!");
    return true;
  },

  sendWhatsAppBillFromConfirmation() {
    if (!this.activeOrderData) {
      const orders = this.getAllOrders();
      if (orders.length > 0) this.activeOrderData = orders[0];
    }
    if (!this.activeOrderData) {
      showToast("No active order found to send bill!");
      return;
    }

    const waInput = document.getElementById('conf-whatsapp-input');
    let phone = waInput ? waInput.value.trim() : (this.activeOrderData.customerMobile || '');

    if (!phone) {
      showToast("Please enter your 10-digit WhatsApp number above!");
      if (waInput) waInput.focus();
      return;
    }

    if (!WhatsAppBillManager.isValidPhone(phone)) {
      showToast("Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)");
      if (waInput) waInput.focus();
      return;
    }

    // Save and send
    this.activeOrderData.customerMobile = phone;
    const orders = this.getAllOrders();
    const idx = orders.findIndex(o => o.orderId === this.activeOrderData.orderId);
    if (idx !== -1) {
      orders[idx].customerMobile = phone;
      localStorage.setItem('shreeji_canteen_orders', JSON.stringify(orders));
    }

    WhatsAppBillManager.sendBill(this.activeOrderData, phone);
  },

  viewBillFromConfirmation() {
    if (!this.activeOrderData) {
      const orders = this.getAllOrders();
      if (orders.length > 0) this.activeOrderData = orders[0];
    }
    if (!this.activeOrderData) {
      showToast("No order details found!");
      return;
    }
    WhatsAppBillManager.openBillModal(this.activeOrderData);
  },

  printBillFromConfirmation() {
    if (!this.activeOrderData) {
      const orders = this.getAllOrders();
      if (orders.length > 0) this.activeOrderData = orders[0];
    }
    if (!this.activeOrderData) {
      showToast("No order details found!");
      return;
    }
    WhatsAppBillManager.printCustomerBill(this.activeOrderData);
  },

  closeOrderConfirmationModal() {
    SoundFX.click();
    const modal = document.getElementById('order-confirmation-modal');
    if (modal) modal.classList.add('hidden');
  },

  /**
   * 9. Live 5-Step Order Status Tracking
   * Statuses:
   * 1. Order Received
   * 2. Order Accepted
   * 3. Preparing
   * 4. Ready
   * 5. Completed
   */
  renderLiveTracker(order) {
    const trackerContainer = document.getElementById('order-status-steps');
    if (!trackerContainer) return;

    const steps = [
      { id: 'Order Received', label: 'Order Received', icon: '📝', gu: 'ઓર્ડર મળ્યો' },
      { id: 'Order Accepted', label: 'Order Accepted', icon: '👨‍🍳', gu: 'સ્વીકાર્યો' },
      { id: 'Preparing', label: 'Preparing', icon: '🔥', gu: 'બનાવી રહ્યા છીએ' },
      { id: 'Ready', label: 'Ready for Pickup', icon: '🔔', gu: 'તૈયાર છે!' },
      { id: 'Completed', label: 'Completed', icon: '✓', gu: 'પૂર્ણ' }
    ];

    const currentStatus = order.status;
    let currentIndex = steps.findIndex(s => s.id === currentStatus);
    if (currentIndex === -1) currentIndex = 0;

    trackerContainer.innerHTML = steps.map((step, idx) => {
      let stateClass = 'pending';
      let lineBg = 'bg-gray-200';
      if (idx < currentIndex) {
        stateClass = 'completed';
        lineBg = 'bg-emerald-500';
      } else if (idx === currentIndex) {
        stateClass = 'current';
      }

      return `
        <div class="status-step ${stateClass} flex flex-col items-center flex-1 relative text-center">
          ${idx > 0 ? `
            <div class="absolute -top-3.5 left-[-50%] right-[50%] h-1 ${idx <= currentIndex ? 'bg-orange-600' : 'bg-gray-200'} z-0"></div>
          ` : ''}
          <div class="step-icon w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold z-10 transition-all">
            ${idx < currentIndex ? '✓' : step.icon}
          </div>
          <span class="text-[10px] md:text-xs font-bold text-gray-800 mt-2 leading-tight">${step.label}</span>
          <span class="text-[9px] text-amber-700 gujarati-font">${step.gu}</span>
        </div>
      `;
    }).join('');

    // Update Status Pill
    const statusPill = document.getElementById('conf-status-pill');
    if (statusPill) {
      if (currentStatus === 'Ready') {
        statusPill.className = "px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-400 rounded-full text-xs font-black animate-bounce inline-flex items-center gap-1.5";
        statusPill.innerHTML = `🟢 Ready for Pickup / કલેક્ટ કરો!`;
      } else if (currentStatus === 'Preparing') {
        statusPill.className = "px-3 py-1 bg-amber-100 text-amber-900 border border-amber-400 rounded-full text-xs font-black inline-flex items-center gap-1.5";
        statusPill.innerHTML = `🟠 Preparing in Kitchen`;
      } else if (currentStatus === 'Order Accepted') {
        statusPill.className = "px-3 py-1 bg-blue-100 text-blue-800 border border-blue-400 rounded-full text-xs font-black inline-flex items-center gap-1.5";
        statusPill.innerHTML = `🔵 Order Accepted`;
      } else if (currentStatus === 'Completed') {
        statusPill.className = "px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-black inline-flex items-center gap-1.5";
        statusPill.innerHTML = `✅ Order Completed`;
      } else {
        statusPill.className = "px-3 py-1 bg-yellow-100 text-yellow-900 border border-yellow-400 rounded-full text-xs font-black inline-flex items-center gap-1.5";
        statusPill.innerHTML = `🟡 Order Received`;
      }
    }
  },

  updateActiveOrderWidget(order) {
    const widget = document.getElementById('active-order-floating-banner');
    if (!widget) return;

    if (!order || order.status === 'Completed' || order.status === 'Rejected') {
      widget.classList.add('hidden');
      return;
    }

    widget.classList.remove('hidden');
    document.getElementById('floating-order-id').textContent = order.orderId;
    document.getElementById('floating-order-status').textContent = order.status;
    document.getElementById('floating-order-time').textContent = order.estimatedTime;
  },

  checkActiveOrder() {
    const savedOrderId = localStorage.getItem('shreeji_active_order_id');
    if (!savedOrderId) return;

    const orders = this.getAllOrders();
    const active = orders.find(o => o.orderId === savedOrderId);
    if (active && active.status !== 'Completed' && active.status !== 'Rejected') {
      this.activeOrderId = savedOrderId;
      this.updateActiveOrderWidget(active);
    }
  },

  viewActiveOrderDetails() {
    if (!this.activeOrderId) return;
    const orders = this.getAllOrders();
    const active = orders.find(o => o.orderId === this.activeOrderId);
    if (active) {
      this.showOrderConfirmationNotice(active);
    }
  },

  /**
   * Inter-tab and live polling sync
   * Listens to changes in localStorage triggered by the Admin Dashboard!
   */
  startStatusPoller() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'shreeji_canteen_orders') {
        this.onOrdersUpdatedExternally();
      }
      if (e.key === 'shreeji_canteen_open_override') {
        this.updateOperatingStatus();
      }
      if (e.key === 'shreeji_canteen_menu') {
        this.loadMenu();
        this.renderMenu();
      }
    });

    // Also poll every 3 seconds for active order updates
    setInterval(() => {
      this.onOrdersUpdatedExternally();
    }, 3000);
  },

  onOrdersUpdatedExternally() {
    if (!this.activeOrderId) return;
    const orders = this.getAllOrders();
    const active = orders.find(o => o.orderId === this.activeOrderId);
    if (!active) return;

    const currentNoticeOpen = !document.getElementById('order-confirmation-modal').classList.contains('hidden');
    if (currentNoticeOpen) {
      this.renderLiveTracker(active);
    }
    this.updateActiveOrderWidget(active);

    // Audio chime if status just changed to Ready!
    const lastSeenStatus = localStorage.getItem('shreeji_last_seen_status_' + active.orderId);
    if (lastSeenStatus !== active.status) {
      localStorage.setItem('shreeji_last_seen_status_' + active.orderId, active.status);
      if (active.status === 'Ready') {
        SoundFX.orderReady();
        showToast(`🎉 Order ${active.orderId} is READY for pickup at Table ${active.tableNumber}!`);
      } else {
        showToast(`Order status updated: ${active.status}`);
      }
    }
  },

  /**
   * 10. Filter & Search Controls
   */
  setCategory(category) {
    SoundFX.click();
    this.activeCategory = category;
    
    // Update active tab buttons
    document.querySelectorAll('.cat-chip').forEach(btn => {
      if (btn.dataset.category === category) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.renderMenu();
  },

  setSearchQuery(query) {
    this.searchQuery = query;
    this.renderMenu();
  },

  toggleJainFilter() {
    SoundFX.click();
    this.filterJainOnly = !this.filterJainOnly;
    const btn = document.getElementById('filter-jain-btn');
    if (btn) {
      if (this.filterJainOnly) {
        btn.classList.add('bg-purple-700', 'text-white', 'border-purple-800');
        btn.classList.remove('bg-white', 'text-purple-700');
      } else {
        btn.classList.remove('bg-purple-700', 'text-white', 'border-purple-800');
        btn.classList.add('bg-white', 'text-purple-700');
      }
    }
    this.renderMenu();
  },

  toggleAvailableFilter() {
    SoundFX.click();
    this.filterAvailableOnly = !this.filterAvailableOnly;
    const btn = document.getElementById('filter-available-btn');
    if (btn) {
      if (this.filterAvailableOnly) {
        btn.classList.add('bg-emerald-700', 'text-white', 'border-emerald-800');
        btn.classList.remove('bg-white', 'text-emerald-700');
      } else {
        btn.classList.remove('bg-emerald-700', 'text-white', 'border-emerald-800');
        btn.classList.add('bg-white', 'text-emerald-700');
      }
    }
    this.renderMenu();
  },

  setSortBy(sortVal) {
    this.sortBy = sortVal;
    this.renderMenu();
  },

  resetFilters() {
    this.activeCategory = 'All';
    this.searchQuery = '';
    this.filterJainOnly = false;
    this.filterAvailableOnly = false;
    this.sortBy = 'recommended';
    
    const searchInput = document.getElementById('menu-search-input');
    if (searchInput) searchInput.value = '';
    
    const sortSelect = document.getElementById('menu-sort-select');
    if (sortSelect) sortSelect.value = 'recommended';

    document.querySelectorAll('.cat-chip').forEach(btn => {
      if (btn.dataset.category === 'All') {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const jainBtn = document.getElementById('filter-jain-btn');
    if (jainBtn) {
      jainBtn.classList.remove('bg-purple-700', 'text-white', 'border-purple-800');
      jainBtn.classList.add('bg-white', 'text-purple-700');
    }

    const availBtn = document.getElementById('filter-available-btn');
    if (availBtn) {
      availBtn.classList.remove('bg-emerald-700', 'text-white', 'border-emerald-800');
      availBtn.classList.add('bg-white', 'text-emerald-700');
    }

    this.renderMenu();
  },

  /**
   * 11. Modal Controls
   */
  openTableModal() {
    SoundFX.click();
    const modal = document.getElementById('table-selector-modal');
    if (modal) {
      modal.classList.remove('hidden');
      this.renderTableGridInModal();
    }
  },

  closeTableModal() {
    SoundFX.click();
    const modal = document.getElementById('table-selector-modal');
    if (modal) modal.classList.add('hidden');
  },

  renderTableGridInModal() {
    const grid = document.getElementById('table-buttons-grid');
    if (!grid) return;

    let html = '';
    for (let i = 1; i <= 10; i++) {
      const isCurrent = i === this.tableNumber;
      html += `
        <button 
          onclick="CanteenApp.setTableNumber(${i})" 
          class="p-3.5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center ${isCurrent ? 'bg-orange-600 text-white border-orange-700 shadow-md scale-105' : 'bg-amber-50/70 hover:bg-amber-100/90 text-amber-950 border-amber-200'}"
        >
          <span class="text-xs uppercase font-extrabold tracking-wider ${isCurrent ? 'text-orange-200' : 'text-amber-700'}">Table</span>
          <span class="text-2xl font-black my-0.5">${i}</span>
          <span class="text-[10px] gujarati-font ${isCurrent ? 'text-orange-100' : 'text-amber-800'}">ટેબલ ${i}</span>
        </button>
      `;
    }
    grid.innerHTML = html;
  },

  openUPIModal() {
    SoundFX.click();
    const modal = document.getElementById('upi-qr-modal');
    const total = this.getCartTotal();
    const upiAmount = document.getElementById('upi-amount-display');
    if (upiAmount) upiAmount.textContent = `₹${total}`;

    // Render UPI QR
    const upiUri = `upi://pay?pa=canteen@okhdfcbank&pn=Shreeji%20College%20Canteen&am=${total}&cu=INR&tn=Table${this.tableNumber}Order`;
    QRManager.renderQR('upi-qr-box', upiUri, 150);

    if (modal) modal.classList.remove('hidden');
  },

  closeUPIModal() {
    SoundFX.click();
    const modal = document.getElementById('upi-qr-modal');
    if (modal) modal.classList.add('hidden');
  },

  simulateUPISuccess() {
    this.closeUPIModal();
    showToast("UPI Payment received successfully!");
    // Set payment method radio to UPI
    const upiRadio = document.getElementById('pay-upi');
    if (upiRadio) upiRadio.checked = true;
    this.submitOrder();
  },

  openStandeesModal() {
    SoundFX.click();
    const modal = document.getElementById('qr-standees-modal');
    if (modal) {
      modal.classList.remove('hidden');
      QRManager.renderAllStandees('all-standees-grid');
    }
  },

  closeStandeesModal() {
    SoundFX.click();
    const modal = document.getElementById('qr-standees-modal');
    if (modal) modal.classList.add('hidden');
  },

  setupEventListeners() {
    // Search input debouncer
    const searchInput = document.getElementById('menu-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.setSearchQuery(e.target.value);
      });
    }

    // Sort select
    const sortSelect = document.getElementById('menu-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.setSortBy(e.target.value);
      });
    }
  }
};

// Global toast alert helper
function showToast(msg, duration = 3000) {
  const toast = document.getElementById('global-toast');
  const toastText = document.getElementById('toast-text');
  if (!toast || !toastText) return;

  toastText.textContent = msg;
  toast.classList.remove('translate-y-24', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  if (window._toastTimer) clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-24', 'opacity-0');
  }, duration);
}
