/**
 * Shreeji Campus Canteen - Admin & Kitchen Management Dashboard
 * Live Kitchen Display System (KDS), Order Status controls,
 * Menu CRUD, Stock availability toggles, and Opening Hours management.
 */

const AdminController = {
  activeTab: 'orders', // 'orders' | 'menu' | 'hours' | 'stats'
  orderFilter: 'active', // 'all' | 'active' | 'preparing' | 'ready' | 'completed'
  knownOrderIds: new Set(),
  authPin: '1234',
  isAuthenticated: false,

  init() {
    this.checkAuthStatus();
    this.renderOrders();
    this.renderMenuItems();
    this.renderStats();
    this.loadOperatingSettings();
    this.startLiveOrdersListener();
  },

  checkAuthStatus() {
    const saved = sessionStorage.getItem('shreeji_admin_auth');
    if (saved === 'true') {
      this.isAuthenticated = true;
    }
  },

  unlockAdmin(enteredPin) {
    if (enteredPin === this.authPin || enteredPin === 'admin') {
      this.isAuthenticated = true;
      sessionStorage.setItem('shreeji_admin_auth', 'true');
      const modal = document.getElementById('admin-pin-modal');
      if (modal) modal.classList.add('hidden');
      showToast("Admin Dashboard unlocked!");
      this.switchTab('orders');
      return true;
    } else {
      showToast("Incorrect PIN. Default staff PIN is: 1234");
      return false;
    }
  },

  switchTab(tab) {
    SoundFX.click();
    this.activeTab = tab;

    // Tab buttons
    document.querySelectorAll('.admin-nav-tab').forEach(b => {
      if (b.dataset.tab === tab) {
        b.classList.add('bg-orange-600', 'text-white', 'shadow-sm');
        b.classList.remove('text-gray-600', 'hover:bg-amber-100/70');
      } else {
        b.classList.remove('bg-orange-600', 'text-white', 'shadow-sm');
        b.classList.add('text-gray-600', 'hover:bg-amber-100/70');
      }
    });

    // Panels
    const panels = ['orders', 'menu', 'hours', 'stats'];
    panels.forEach(p => {
      const panelElem = document.getElementById(`admin-panel-${p}`);
      if (panelElem) {
        if (p === tab) {
          panelElem.classList.remove('hidden');
        } else {
          panelElem.classList.add('hidden');
        }
      }
    });

    if (tab === 'orders') this.renderOrders();
    if (tab === 'menu') this.renderMenuItems();
    if (tab === 'stats') this.renderStats();
  },

  /**
   * 1. Orders Board Management
   */
  getOrders() {
    return CanteenApp.getAllOrders();
  },

  saveOrders(orders) {
    localStorage.setItem('shreeji_canteen_orders', JSON.stringify(orders));
    this.renderOrders();
    this.renderStats();
  },

  setOrderFilter(filter) {
    SoundFX.click();
    this.orderFilter = filter;
    document.querySelectorAll('.order-filter-chip').forEach(c => {
      if (c.dataset.filter === filter) {
        c.classList.add('bg-orange-600', 'text-white');
        c.classList.remove('bg-amber-100', 'text-amber-900');
      } else {
        c.classList.remove('bg-orange-600', 'text-white');
        c.classList.add('bg-amber-100', 'text-amber-900');
      }
    });
    this.renderOrders();
  },

  renderOrders() {
    const container = document.getElementById('admin-orders-container');
    if (!container) return;

    const allOrders = this.getOrders();
    let filtered = [...allOrders];

    if (this.orderFilter === 'active') {
      filtered = filtered.filter(o => o.status === 'Order Received' || o.status === 'Order Accepted' || o.status === 'Preparing');
    } else if (this.orderFilter === 'preparing') {
      filtered = filtered.filter(o => o.status === 'Preparing');
    } else if (this.orderFilter === 'ready') {
      filtered = filtered.filter(o => o.status === 'Ready');
    } else if (this.orderFilter === 'completed') {
      filtered = filtered.filter(o => o.status === 'Completed');
    }

    // Update active badges
    const activeCountElem = document.getElementById('admin-active-orders-count');
    if (activeCountElem) {
      const count = allOrders.filter(o => o.status !== 'Completed' && o.status !== 'Rejected').length;
      activeCountElem.textContent = `${count} Active`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="p-12 text-center bg-white rounded-3xl border border-amber-200/80 shadow-xs">
          <div class="text-4xl mb-3">🔔</div>
          <h3 class="font-bold text-gray-800 text-base">No orders found in this view</h3>
          <p class="text-xs text-gray-500 gujarati-font mt-1">હાલમાં કોઈ ઓર્ડર પેન્ડિંગ નથી</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(order => this.createOrderCardHtml(order)).join('');
  },

  createOrderCardHtml(order) {
    // Status styling
    let statusBadgeColor = 'bg-yellow-100 text-yellow-900 border-yellow-300';
    if (order.status === 'Order Accepted') statusBadgeColor = 'bg-blue-100 text-blue-900 border-blue-300';
    if (order.status === 'Preparing') statusBadgeColor = 'bg-amber-100 text-amber-900 border-amber-400';
    if (order.status === 'Ready') statusBadgeColor = 'bg-emerald-100 text-emerald-900 border-emerald-400 animate-pulse';
    if (order.status === 'Completed') statusBadgeColor = 'bg-gray-100 text-gray-700 border-gray-300';
    if (order.status === 'Rejected') statusBadgeColor = 'bg-rose-100 text-rose-800 border-rose-300';

    return `
      <div class="bg-white rounded-2xl p-5 border-2 ${order.status === 'Ready' ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-amber-200'} shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
        <div>
          <!-- Header: Order ID, Table #, Time -->
          <div class="flex items-start justify-between border-b border-amber-100 pb-3 mb-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-black text-gray-900 text-base font-mono">${order.orderId}</span>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-black border ${statusBadgeColor}">
                  ${order.status}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-2 mt-1">
                <span class="px-2 py-0.5 bg-orange-100 text-orange-900 rounded-md text-xs font-black tracking-wide">
                  Table ${order.tableNumber}
                </span>
                <span class="text-xs text-gray-800 font-bold">
                  👤 ${order.customerName}
                </span>
                ${order.customerMobile ? `
                  <button 
                    onclick="AdminController.openWhatsAppModal('${order.orderId}')"
                    class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300 transition-colors"
                    title="Click to WhatsApp customer"
                  >
                    <span>📱</span> ${order.customerMobile}
                  </button>
                ` : `
                  <span class="text-[11px] text-gray-400 italic">No mobile</span>
                `}
              </div>
            </div>

            <div class="text-right">
              <span class="text-xs font-bold text-gray-500 block">⏰ ${order.orderTime}</span>
              <span class="text-[11px] text-amber-800 font-semibold block mt-0.5">⏱️ ${order.estimatedTime}</span>
            </div>
          </div>

          <!-- Items Ordered List -->
          <div class="space-y-1.5 mb-3 bg-amber-50/40 p-3 rounded-xl border border-amber-100">
            ${order.items.map(item => `
              <div class="flex justify-between items-center text-xs">
                <span class="text-gray-800">
                  <b class="text-orange-600">${item.quantity} ×</b> ${item.nameEn} 
                  <span class="text-[10px] text-amber-800 gujarati-font">(${item.nameGu})</span>
                </span>
                <span class="font-bold text-gray-900">₹${item.price * item.quantity}</span>
              </div>
            `).join('')}
          </div>

          ${order.specialInstructions ? `
            <div class="mb-3 px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-1.5">
              <span>⚠️</span>
              <span><b>Special Note:</b> ${order.specialInstructions}</span>
            </div>
          ` : ''}

          <!-- Footer details: Total & Payment Method -->
          <div class="flex justify-between items-center text-xs pt-1 pb-3 mb-3 border-b border-dashed border-gray-200">
            <span class="text-gray-500 font-medium">Payment: <b class="text-gray-800">${order.paymentMethod || 'Cash at Counter'}</b></span>
            <span class="text-base font-black text-orange-700">Total: ₹${order.totalAmount}</span>
          </div>
        </div>

        <!-- Action Controls -->
        <div class="flex flex-wrap gap-1.5 justify-end pt-1">
          ${order.status === 'Order Received' ? `
            <button 
              onclick="AdminController.updateOrderStatus('${order.orderId}', 'Order Accepted')"
              class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs"
            >
              Accept Order
            </button>
            <button 
              onclick="AdminController.updateOrderStatus('${order.orderId}', 'Rejected')"
              class="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-lg text-xs font-bold transition-all"
            >
              Reject
            </button>
          ` : ''}

          ${(order.status === 'Order Received' || order.status === 'Order Accepted') ? `
            <button 
              onclick="AdminController.updateOrderStatus('${order.orderId}', 'Preparing')"
              class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs"
            >
              👨‍🍳 Preparing
            </button>
          ` : ''}

          ${order.status === 'Preparing' ? `
            <button 
              onclick="AdminController.updateOrderStatus('${order.orderId}', 'Ready')"
              class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs animate-pulse"
            >
              🔔 Mark as Ready
            </button>
          ` : ''}

          ${order.status === 'Ready' ? `
            <button 
              onclick="AdminController.updateOrderStatus('${order.orderId}', 'Completed')"
              class="px-4 py-1.5 bg-gray-900 hover:bg-black text-white rounded-lg text-xs font-bold transition-all shadow-2xs"
            >
              ✓ Complete Order
            </button>
          ` : ''}

          ${order.status === 'Completed' ? `
            <span class="text-xs text-emerald-700 font-bold flex items-center gap-1">
              ✓ Served & Settled
            </span>
          ` : ''}

          <!-- WhatsApp Customer Action Button -->
          <button 
            onclick="AdminController.openWhatsAppModal('${order.orderId}')"
            class="px-2.5 py-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
            title="Send WhatsApp update or bill to customer"
          >
            <span>💬</span> WhatsApp Customer
          </button>

          <!-- Quick Print Ticket -->
          <button 
            onclick="AdminController.printOrderKOT('${order.orderId}')"
            class="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-medium transition-all"
            title="Print Kitchen Slip"
          >
            🖨️ Slip
          </button>
        </div>
      </div>
    `;
  },

  selectedOrderForWhatsApp: null,

  openWhatsAppModal(orderId) {
    const orders = this.getOrders();
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;

    this.selectedOrderForWhatsApp = order;

    document.getElementById('adm-wa-order-id').textContent = order.orderId;
    document.getElementById('adm-wa-table').textContent = `Table ${order.tableNumber}`;
    document.getElementById('adm-wa-customer').textContent = order.customerName;
    document.getElementById('adm-wa-status').textContent = order.status;

    const phoneInput = document.getElementById('adm-wa-phone-input');
    if (phoneInput) {
      let raw = order.customerMobile || '';
      let clean = raw.replace(/\D/g, '');
      if (clean.length === 12 && clean.startsWith('91')) clean = clean.substring(2);
      phoneInput.value = clean;
    }

    // Default template based on current order status
    let defaultPreset = 'ready';
    if (order.status === 'Order Accepted') defaultPreset = 'accepted';
    else if (order.status === 'Preparing') defaultPreset = 'preparing';
    else if (order.status === 'Ready') defaultPreset = 'ready';
    else if (order.status === 'Completed') defaultPreset = 'completed';

    this.selectWhatsAppPreset(defaultPreset);

    const modal = document.getElementById('admin-whatsapp-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeWhatsAppModal() {
    const modal = document.getElementById('admin-whatsapp-modal');
    if (modal) modal.classList.add('hidden');
  },

  selectWhatsAppPreset(type) {
    if (!this.selectedOrderForWhatsApp) return;
    const order = this.selectedOrderForWhatsApp;
    let messageText = '';

    if (type === 'ready') {
      messageText = WhatsAppBillManager.generateStatusMessage(order, 'Ready');
    } else if (type === 'preparing') {
      messageText = WhatsAppBillManager.generateStatusMessage(order, 'Preparing');
    } else if (type === 'accepted') {
      messageText = WhatsAppBillManager.generateStatusMessage(order, 'Order Accepted');
    } else if (type === 'completed') {
      messageText = WhatsAppBillManager.generateStatusMessage(order, 'Completed');
    } else if (type === 'bill') {
      messageText = WhatsAppBillManager.generateBillMessage(order);
    }

    const textarea = document.getElementById('adm-wa-message-textarea');
    if (textarea) textarea.value = messageText;
  },

  sendCustomerWhatsAppMessage() {
    if (!this.selectedOrderForWhatsApp) return;

    const phoneInput = document.getElementById('adm-wa-phone-input');
    const textarea = document.getElementById('adm-wa-message-textarea');

    const phone = phoneInput ? phoneInput.value.trim() : '';
    const message = textarea ? textarea.value.trim() : '';

    if (!phone) {
      showToast("Please enter customer's mobile number!");
      if (phoneInput) phoneInput.focus();
      return;
    }

    if (!WhatsAppBillManager.isValidPhone(phone)) {
      showToast("Please enter a valid 10-digit mobile number!");
      if (phoneInput) phoneInput.focus();
      return;
    }

    if (!message) {
      showToast("Message content cannot be empty!");
      return;
    }

    // Update phone in order if changed
    this.selectedOrderForWhatsApp.customerMobile = phone;
    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.orderId === this.selectedOrderForWhatsApp.orderId);
    if (idx !== -1) {
      orders[idx].customerMobile = phone;
      this.saveOrders(orders);
    }

    WhatsAppBillManager.openWhatsAppChat(phone, message);
    this.closeWhatsAppModal();
    showToast("Opening WhatsApp with customer update...");
  },

  updateOrderStatus(orderId, newStatus) {
    const orders = this.getOrders();
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;

    SoundFX.click();
    order.status = newStatus;
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: newStatus,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    this.saveOrders(orders);
    showToast(`Order ${orderId} marked as ${newStatus}`);

    // If ready, play ready sound
    if (newStatus === 'Ready') {
      SoundFX.orderReady();
    }
  },

  printOrderKOT(orderId) {
    const orders = this.getOrders();
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;

    const printableSection = document.getElementById('printable-section');
    if (!printableSection) return;

    printableSection.innerHTML = `
      <div style="font-family: monospace; max-width: 320px; margin: 0 auto; padding: 15px; border: 1px dashed #444;">
        <div style="text-align: center; border-bottom: 1px dashed #444; padding-bottom: 8px; margin-bottom: 10px;">
          <h2 style="margin: 0; font-size: 16px;">SHREEJI CAMPUS CANTEEN</h2>
          <p style="margin: 3px 0 0; font-size: 12px;">KITCHEN ORDER TICKET (KOT)</p>
          <p style="margin: 2px 0 0; font-size: 11px;">Table: <b>${order.tableNumber}</b> | ${order.orderId}</p>
          <p style="margin: 2px 0 0; font-size: 11px;">Time: ${order.orderTime}</p>
          <p style="margin: 2px 0 0; font-size: 11px;">Customer: ${order.customerName}</p>
        </div>
        <div style="margin-bottom: 10px;">
          ${order.items.map(i => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px;">
              <span><b>${i.quantity}x</b> ${i.nameEn}</span>
              <span>₹${i.price * i.quantity}</span>
            </div>
          `).join('')}
        </div>
        ${order.specialInstructions ? `
          <div style="border-top: 1px dashed #444; padding-top: 5px; margin-bottom: 8px; font-size: 11px;">
            <b>INSTRUCTIONS:</b> ${order.specialInstructions}
          </div>
        ` : ''}
        <div style="border-top: 1px dashed #444; padding-top: 8px; text-align: right; font-size: 14px; font-weight: bold;">
          TOTAL: ₹${order.totalAmount}
        </div>
        <div style="text-align: center; margin-top: 15px; font-size: 10px;">
          *** THANK YOU! ***
        </div>
      </div>
    `;

    window.print();
  },

  /**
   * 2. Live incoming orders audio listener
   */
  startLiveOrdersListener() {
    // Populate initial known orders
    this.getOrders().forEach(o => this.knownOrderIds.add(o.orderId));

    window.addEventListener('storage', (e) => {
      if (e.key === 'shreeji_canteen_orders') {
        const currentOrders = this.getOrders();
        // Check if new order arrived
        let hasNew = false;
        currentOrders.forEach(o => {
          if (!this.knownOrderIds.has(o.orderId)) {
            this.knownOrderIds.add(o.orderId);
            hasNew = true;
          }
        });

        if (hasNew) {
          SoundFX.orderPlaced();
          showToast("🔔 New incoming food order received!");
        }

        this.renderOrders();
        this.renderStats();
      }
    });
  },

  /**
   * 3. Menu CRUD Management
   */
  renderMenuItems() {
    const container = document.getElementById('admin-menu-table-body');
    if (!container) return;

    const items = getMenuDatabase();
    container.innerHTML = items.map(item => `
      <tr class="border-b border-amber-100 hover:bg-amber-50/40 transition-colors">
        <td class="p-3">
          <div class="flex items-center gap-3">
            <img src="${item.image}" alt="${item.nameEn}" class="w-10 h-10 rounded-lg object-cover border border-amber-200" onerror="this.src='images/masala-bhakhri.jpg'" />
            <div>
              <div class="font-bold text-gray-900 text-xs">${item.nameEn}</div>
              <div class="text-[11px] text-amber-700 gujarati-font">${item.nameGu}</div>
            </div>
          </div>
        </td>
        <td class="p-3 text-xs text-gray-600 font-medium">${item.category}</td>
        <td class="p-3 text-xs font-black text-orange-600">₹${item.price}</td>
        <td class="p-3 text-xs text-gray-600">${item.prepTime} min</td>
        <td class="p-3">
          <button 
            onclick="AdminController.toggleItemStock('${item.id}')"
            class="px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${item.isAvailable ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-rose-100 text-rose-800 border-rose-300'}"
          >
            ${item.isAvailable ? '✓ In Stock' : '✕ Out of Stock'}
          </button>
        </td>
        <td class="p-3 text-right space-x-1">
          <button 
            onclick="AdminController.editItemPrompt('${item.id}')"
            class="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-semibold"
            title="Edit Price & Time"
          >
            ✏️ Edit
          </button>
          <button 
            onclick="AdminController.deleteItem('${item.id}')"
            class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold"
            title="Delete"
          >
            🗑️
          </button>
        </td>
      </tr>
    `).join('');
  },

  toggleItemStock(itemId) {
    const items = getMenuDatabase();
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    SoundFX.click();
    item.isAvailable = !item.isAvailable;
    saveMenuDatabase(items);
    this.renderMenuItems();
    CanteenApp.loadMenu();
    CanteenApp.renderMenu();
    showToast(`${item.nameEn} is now ${item.isAvailable ? 'Available' : 'Out of Stock'}`);
  },

  editItemPrompt(itemId) {
    const items = getMenuDatabase();
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const newPrice = prompt(`Enter new price for ${item.nameEn} (₹):`, item.price);
    if (newPrice !== null && !isNaN(newPrice) && parseFloat(newPrice) > 0) {
      item.price = parseFloat(newPrice);
    }

    const newTime = prompt(`Enter prep time in minutes for ${item.nameEn}:`, item.prepTime);
    if (newTime !== null && !isNaN(newTime) && parseInt(newTime) > 0) {
      item.prepTime = parseInt(newTime);
    }

    saveMenuDatabase(items);
    this.renderMenuItems();
    CanteenApp.loadMenu();
    CanteenApp.renderMenu();
    showToast(`Updated ${item.nameEn} successfully!`);
  },

  deleteItem(itemId) {
    if (!confirm("Are you sure you want to remove this item from the canteen menu?")) return;
    let items = getMenuDatabase();
    items = items.filter(i => i.id !== itemId);
    saveMenuDatabase(items);
    this.renderMenuItems();
    CanteenApp.loadMenu();
    CanteenApp.renderMenu();
    showToast("Item deleted from menu");
  },

  openAddItemModal() {
    SoundFX.click();
    const modal = document.getElementById('admin-add-item-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeAddItemModal() {
    SoundFX.click();
    const modal = document.getElementById('admin-add-item-modal');
    if (modal) modal.classList.add('hidden');
  },

  saveNewItem(event) {
    if (event) event.preventDefault();

    const nameEn = document.getElementById('new-item-name-en').value.trim();
    const nameGu = document.getElementById('new-item-name-gu').value.trim();
    const category = document.getElementById('new-item-category').value;
    const price = parseFloat(document.getElementById('new-item-price').value);
    const prepTime = parseInt(document.getElementById('new-item-time').value) || 5;
    const desc = document.getElementById('new-item-desc').value.trim();
    const isJain = document.getElementById('new-item-jain').checked;
    const image = document.getElementById('new-item-image').value.trim() || 'images/masala-bhakhri.jpg';

    if (!nameEn || !price) {
      showToast("Please provide item name and price!");
      return;
    }

    const newItem = {
      id: "custom-" + Date.now(),
      nameEn: nameEn,
      nameGu: nameGu || nameEn,
      category: category,
      price: price,
      prepTime: prepTime,
      description: desc || "Freshly prepared campus snack",
      image: image,
      isVeg: true,
      isJain: isJain,
      isPopular: false,
      isAvailable: true,
      badge: "New",
      rating: 4.8
    };

    const items = getMenuDatabase();
    items.unshift(newItem);
    saveMenuDatabase(items);

    this.closeAddItemModal();
    this.renderMenuItems();
    CanteenApp.loadMenu();
    CanteenApp.renderMenu();
    showToast(`Added ${nameEn} to menu!`);
  },

  resetMenuToDefaults() {
    if (!confirm("Reset all menu items to authentic Gujarati defaults?")) return;
    localStorage.removeItem("shreeji_canteen_menu");
    this.renderMenuItems();
    CanteenApp.loadMenu();
    CanteenApp.renderMenu();
    showToast("Menu reset to defaults!");
  },

  /**
   * 4. Operational Hours & Settings
   */
  loadOperatingSettings() {
    const override = localStorage.getItem('shreeji_canteen_open_override') || 'auto';
    const select = document.getElementById('admin-override-select');
    if (select) select.value = override;
  },

  saveOperatingOverride(val) {
    localStorage.setItem('shreeji_canteen_open_override', val);
    showToast("Canteen operating status updated!");
    CanteenApp.updateOperatingStatus();
  },

  /**
   * 5. Analytics & Stats
   */
  renderStats() {
    const orders = this.getOrders();
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'Completed').length;
    const totalRev = orders.filter(o => o.status !== 'Rejected').reduce((sum, o) => sum + o.totalAmount, 0);

    const statRev = document.getElementById('admin-stat-revenue');
    const statTotal = document.getElementById('admin-stat-orders');
    const statActive = document.getElementById('admin-stat-active');
    const statCompleted = document.getElementById('admin-stat-completed');

    if (statRev) statRev.textContent = `₹${totalRev}`;
    if (statTotal) statTotal.textContent = totalOrders;
    if (statActive) {
      const activeCount = orders.filter(o => o.status !== 'Completed' && o.status !== 'Rejected').length;
      statActive.textContent = activeCount;
    }
    if (statCompleted) statCompleted.textContent = completedOrders;
  }
};
