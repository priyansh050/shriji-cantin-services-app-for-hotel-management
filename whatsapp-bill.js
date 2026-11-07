/**
 * Shreeji Campus Canteen - WhatsApp Bill & Notification Integration
 * Generates beautifully formatted WhatsApp bills and order updates
 * according to official WhatsApp formatting standards.
 */

const WhatsAppBillManager = {
  /**
   * Format date into DD/MM/YYYY
   */
  formatDate(dateObj = new Date()) {
    const d = new Date(dateObj);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  },

  /**
   * Format time into hh:mm A
   */
  formatTime(dateObj = new Date()) {
    const d = new Date(dateObj);
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12
    const strHours = String(hours).padStart(2, '0');
    return `${strHours}:${minutes} ${ampm}`;
  },

  /**
   * Clean and normalize phone number for WhatsApp international format
   * (e.g. 9876543210 -> 919876543210)
   */
  cleanPhoneNumber(phone) {
    if (!phone) return '';
    let digits = String(phone).replace(/\D/g, '');
    
    // If entered as 10-digit Indian number
    if (digits.length === 10) {
      return `91${digits}`;
    }
    // If entered with leading 0 (e.g. 09876543210)
    if (digits.length === 11 && digits.startsWith('0')) {
      return `91${digits.substring(1)}`;
    }
    // If already has 91 country code (12 digits)
    if (digits.length === 12 && digits.startsWith('91')) {
      return digits;
    }
    return digits;
  },

  /**
   * Validate Indian mobile number
   */
  isValidPhone(phone) {
    const cleaned = this.cleanPhoneNumber(phone);
    // Standard Indian mobile: 91 followed by 6, 7, 8, 9 and 9 digits (total 12 digits)
    return /^91[6-9]\d{9}$/.test(cleaned);
  },

  /**
   * Generate exact formatted WhatsApp Bill message matching requirements:
   * 
   * 🍽️ *GUJARATI COLLEGE CANTEEN*
   * 
   * ━━━━━━━━━━━━━━━━
   * 🧾 *ORDER BILL*
   * ━━━━━━━━━━━━━━━━
   * 
   * *Order ID:* #ORD1025
   * *Table:* Table 4
   * *Date:* 06/10/2026
   * *Time:* 06:25 PM
   * 
   * *Items:*
   * • Masala Bhakhri × 2 — ₹60
   * • Samosa × 2 — ₹40
   * • Masala Chaas × 1 — ₹25
   * 
   * ━━━━━━━━━━━━━━━━
   * *Subtotal:* ₹125
   * *Total:* ₹125
   * ━━━━━━━━━━━━━━━━
   * 
   * ⏱️ *Estimated Preparation Time:* 10–15 minutes
   * 
   * 📍 *Table:* 4
   * 
   * ✅ *Order Confirmed*
   * 
   * Thank you for ordering from our canteen! 🙏
   */
  generateBillMessage(order) {
    const dateStr = order.createdAt ? this.formatDate(order.createdAt) : this.formatDate();
    const timeStr = order.orderTime || (order.createdAt ? this.formatTime(order.createdAt) : this.formatTime());

    // Generate formatted item lines
    const itemLines = order.items.map(item => {
      const lineTotal = item.price * item.quantity;
      return `• ${item.nameEn} × ${item.quantity} — ₹${lineTotal}`;
    }).join('\n');

    const sep = '━━━━━━━━━━━━━━━━';

    const message = 
`🍽️ *GUJARATI COLLEGE CANTEEN*

${sep}
🧾 *ORDER BILL*
${sep}

*Order ID:* ${order.orderId}
*Table:* Table ${order.tableNumber}
*Date:* ${dateStr}
*Time:* ${timeStr}

*Items:*
${itemLines}

${sep}
*Subtotal:* ₹${order.totalAmount}
*Total:* ₹${order.totalAmount}
${sep}

⏱️ *Estimated Preparation Time:* ${order.estimatedTime || '10–15 minutes'}

📍 *Table:* ${order.tableNumber}

✅ *Order Confirmed*

Thank you for ordering from our canteen! 🙏`;

    return message;
  },

  /**
   * Generate Admin status update message:
   * 
   * Order Accepted:
   * "Your order #ORD1025 has been accepted and is being prepared."
   * 
   * Preparing:
   * "Your order #ORD1025 is currently being prepared. 👨🍳"
   * 
   * Ready:
   * "Your order #ORD1025 is ready! 🎉 Please collect it from the canteen."
   * 
   * Completed:
   * "Your order #ORD1025 has been completed. Thank you for visiting our canteen! 🙏"
   */
  generateStatusMessage(order, status) {
    let statusText = '';
    if (status === 'Order Accepted') {
      statusText = `Your order ${order.orderId} for *Table ${order.tableNumber}* has been accepted and is being prepared. 👨‍🍳`;
    } else if (status === 'Preparing') {
      statusText = `Your order ${order.orderId} for *Table ${order.tableNumber}* is currently being prepared in the kitchen. 👨‍🍳`;
    } else if (status === 'Ready') {
      statusText = `Your order ${order.orderId} for *Table ${order.tableNumber}* is now ready! 🎉\n\nPlease collect your order from the canteen counter.`;
    } else if (status === 'Completed') {
      statusText = `Your order ${order.orderId} for *Table ${order.tableNumber}* has been completed.\n\nThank you for visiting our canteen! 🙏`;
    } else if (status === 'Rejected') {
      statusText = `Notice regarding your order ${order.orderId} for *Table ${order.tableNumber}*: Order could not be prepared at this time. Please check with the counter.`;
    } else {
      statusText = `Update on your order ${order.orderId} for *Table ${order.tableNumber}*: Current status is *${status}*.`;
    }

    const message = 
`🍽️ *GUJARATI COLLEGE CANTEEN*

Order *${order.orderId}*

${statusText}

Thank you! 🙏`;

    return message;
  },

  /**
   * Open WhatsApp with click-to-chat URL format
   * Supports both mobile app and WhatsApp web
   */
  openWhatsAppChat(phone, text) {
    const encodedText = encodeURIComponent(text);
    const cleanedPhone = this.cleanPhoneNumber(phone);

    let url;
    if (cleanedPhone) {
      url = `https://wa.me/${cleanedPhone}?text=${encodedText}`;
    } else {
      url = `https://wa.me/?text=${encodedText}`;
    }

    // Open WhatsApp in a new tab/window
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  /**
   * Send Bill to customer via WhatsApp
   */
  sendBill(order, inputPhone = null) {
    const targetPhone = inputPhone || order.customerMobile || '';
    
    // Check validation if phone is provided
    if (targetPhone) {
      if (!this.isValidPhone(targetPhone)) {
        showToast("Please enter a valid 10-digit mobile number!");
        return false;
      }
    } else {
      // Prompt user for mobile number
      const entered = prompt("Enter your 10-digit WhatsApp number to receive bill:", "");
      if (!entered) return false;
      if (!this.isValidPhone(entered)) {
        showToast("Please enter a valid 10-digit mobile number (e.g. 9876543210)");
        return false;
      }
      order.customerMobile = entered;
      // Update order in storage
      const orders = CanteenApp.getAllOrders();
      const idx = orders.findIndex(o => o.orderId === order.orderId);
      if (idx !== -1) {
        orders[idx].customerMobile = entered;
        localStorage.setItem('shreeji_canteen_orders', JSON.stringify(orders));
      }
    }

    const billMsg = this.generateBillMessage(order);
    this.openWhatsAppChat(order.customerMobile, billMsg);
    showToast("Opening WhatsApp with your order bill...");
    return true;
  },

  /**
   * Render Digital Bill Modal for "View Bill"
   */
  openBillModal(order) {
    const modal = document.getElementById('digital-bill-modal');
    if (!modal) return;

    const dateStr = order.createdAt ? this.formatDate(order.createdAt) : this.formatDate();
    const timeStr = order.orderTime || (order.createdAt ? this.formatTime(order.createdAt) : this.formatTime());

    document.getElementById('bill-order-id').textContent = order.orderId;
    document.getElementById('bill-table-number').textContent = `Table ${order.tableNumber}`;
    document.getElementById('bill-customer-name').textContent = order.customerName;
    document.getElementById('bill-customer-phone').textContent = order.customerMobile || 'Not provided';
    document.getElementById('bill-date-time').textContent = `${dateStr} • ${timeStr}`;
    document.getElementById('bill-est-time').textContent = order.estimatedTime || '10–15 mins';
    document.getElementById('bill-payment-method').textContent = order.paymentMethod || 'Cash at Counter';
    document.getElementById('bill-subtotal').textContent = `₹${order.totalAmount}`;
    document.getElementById('bill-total').textContent = `₹${order.totalAmount}`;
    
    // Status badge
    const statusElem = document.getElementById('bill-order-status');
    if (statusElem) {
      statusElem.textContent = order.status;
      if (order.status === 'Ready') {
        statusElem.className = 'px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800';
      } else if (order.status === 'Preparing') {
        statusElem.className = 'px-2 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-900';
      } else {
        statusElem.className = 'px-2 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-900';
      }
    }

    // Populate Items
    const itemsTable = document.getElementById('bill-items-body');
    if (itemsTable) {
      itemsTable.innerHTML = order.items.map(item => `
        <tr class="border-b border-gray-100">
          <td class="py-2 text-left font-semibold text-gray-800">
            ${item.nameEn}
            <span class="block text-[11px] text-gray-400 gujarati-font">${item.nameGu || ''}</span>
          </td>
          <td class="py-2 text-center text-gray-600 font-bold">${item.quantity}</td>
          <td class="py-2 text-right text-gray-600">₹${item.price}</td>
          <td class="py-2 text-right font-black text-gray-900">₹${item.price * item.quantity}</td>
        </tr>
      `).join('');
    }

    // Bind WhatsApp action for modal button
    const waBtn = document.getElementById('bill-whatsapp-btn');
    if (waBtn) {
      waBtn.onclick = () => {
        this.sendBill(order);
      };
    }

    // Bind Print action for modal button
    const printBtn = document.getElementById('bill-print-btn');
    if (printBtn) {
      printBtn.onclick = () => {
        this.printCustomerBill(order);
      };
    }

    modal.classList.remove('hidden');
  },

  closeBillModal() {
    const modal = document.getElementById('digital-bill-modal');
    if (modal) modal.classList.add('hidden');
  },

  /**
   * Print formatted Customer Bill
   */
  printCustomerBill(order) {
    const printableSection = document.getElementById('printable-section');
    if (!printableSection) return;

    const dateStr = order.createdAt ? this.formatDate(order.createdAt) : this.formatDate();
    const timeStr = order.orderTime || (order.createdAt ? this.formatTime(order.createdAt) : this.formatTime());

    printableSection.innerHTML = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 340px; margin: 0 auto; padding: 20px; border: 1px dashed #777; background: #fff; color: #111;">
        <div style="text-align: center; border-bottom: 2px dashed #444; padding-bottom: 12px; margin-bottom: 12px;">
          <h2 style="margin: 0; font-size: 18px; font-weight: 900; letter-spacing: 0.5px;">SHREEJI CAMPUS CANTEEN</h2>
          <p style="margin: 3px 0 0; font-size: 11px; color: #555;">College Food Court • Block B Ground Floor</p>
          <p style="margin: 2px 0 0; font-size: 11px; font-weight: bold; color: #0a7c3e;">100% Pure Vegetarian</p>
          <div style="margin-top: 8px; font-size: 14px; font-weight: 800; background: #f0f0f0; padding: 4px; border-radius: 4px;">
            TAX INVOICE / ORDER BILL
          </div>
        </div>

        <div style="font-size: 12px; line-height: 1.6; margin-bottom: 12px; border-bottom: 1px solid #ddd; padding-bottom: 8px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Order ID: <b>${order.orderId}</b></span>
            <span>Table: <b>Table ${order.tableNumber}</b></span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Date: ${dateStr}</span>
            <span>Time: ${timeStr}</span>
          </div>
          <div>Customer: <b>${order.customerName}</b> ${order.customerMobile ? `(${order.customerMobile})` : ''}</div>
          <div>Payment: <b>${order.paymentMethod || 'Cash at Counter'}</b></div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 12px;">
          <thead>
            <tr style="border-bottom: 1px solid #333; text-align: left;">
              <th style="padding: 4px 0;">Item</th>
              <th style="padding: 4px 0; text-align: center;">Qty</th>
              <th style="padding: 4px 0; text-align: right;">Price</th>
              <th style="padding: 4px 0; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(i => `
              <tr style="border-bottom: 1px dotted #ccc;">
                <td style="padding: 5px 0;">${i.nameEn}</td>
                <td style="padding: 5px 0; text-align: center;">${i.quantity}</td>
                <td style="padding: 5px 0; text-align: right;">₹${i.price}</td>
                <td style="padding: 5px 0; text-align: right; font-weight: bold;">₹${i.price * i.quantity}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="border-top: 2px dashed #444; padding-top: 8px; font-size: 13px; line-height: 1.6;">
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal:</span>
            <span>₹${order.totalAmount}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #555;">
            <span>Student Subsidy / Tax:</span>
            <span>₹0 (Included)</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 900; margin-top: 4px; padding-top: 4px; border-top: 1px solid #333;">
            <span>TOTAL:</span>
            <span>₹${order.totalAmount}</span>
          </div>
        </div>

        <div style="text-align: center; margin-top: 16px; padding-top: 10px; border-top: 1px dashed #777; font-size: 11px; color: #555;">
          <p style="margin: 0; font-weight: bold;">Estimated Prep Time: ${order.estimatedTime || '10–15 mins'}</p>
          <p style="margin: 4px 0 0;">Thank you for ordering from our canteen! 🙏</p>
          <p style="margin: 2px 0 0; font-style: italic;">જય શ્રી કૃષ્ણ • Have a Great Day!</p>
        </div>
      </div>
    `;

    window.print();
  }
};
