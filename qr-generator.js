/**
 * QR Code Generator & Table Standee Management
 * Handles generating QR codes for Tables 1 to 10
 */

// Simple robust QRCode generator helper
const QRManager = {
  /**
   * Returns URL for a specific table
   */
  getTableUrl(tableNumber) {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    // Handle local file:// protocol or http://
    if (origin === 'null' || !origin || origin.startsWith('file')) {
      return `?table=${tableNumber}`;
    }
    return `${origin}${pathname}?table=${tableNumber}`;
  },

  /**
   * Generates QR Code inside a container element
   */
  renderQR(containerId, text, size = 180) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    // If QRCode.js library is loaded via CDN
    if (typeof QRCode !== 'undefined') {
      try {
        new QRCode(container, {
          text: text,
          width: size,
          height: size,
          colorDark: "#1e293b",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H
        });
        return;
      } catch (e) {
        console.warn("QRCode lib error, using SVG fallback", e);
      }
    }

    // High reliability QR Image via Google Charts / QuickChart API with SVG fallback
    const encodedText = encodeURIComponent(text);
    const qrImg = document.createElement('img');
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}&margin=10&color=1e293b`;
    qrImg.alt = `QR Code for ${text}`;
    qrImg.className = "rounded-lg border border-amber-200 mx-auto shadow-sm";
    qrImg.style.width = `${size}px`;
    qrImg.style.height = `${size}px`;
    
    // Fallback if offline
    qrImg.onerror = () => {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center p-4 bg-amber-50 border-2 border-dashed border-amber-300 rounded-xl" style="width: ${size}px; height: ${size}px;">
          <svg class="w-12 h-12 text-amber-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path>
          </svg>
          <span class="text-xs font-bold text-amber-800 text-center">Table QR Code</span>
          <span class="text-[10px] text-amber-600 text-center mt-1 font-mono">${text.substring(0, 20)}...</span>
        </div>
      `;
    };
    container.appendChild(qrImg);
  },

  /**
   * Render the Printable Standees modal for Tables 1 to 10
   */
  renderAllStandees(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';

    for (let tableNum = 1; tableNum <= 10; tableNum++) {
      const targetUrl = this.getTableUrl(tableNum);
      const card = document.createElement('div');
      card.className = "bg-white rounded-2xl p-6 border-2 border-amber-300 shadow-md flex flex-col items-center text-center relative overflow-hidden transition-all hover:shadow-xl hover:border-orange-500 standee-card";
      
      card.innerHTML = `
        <div class="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600"></div>
        
        <div class="flex items-center gap-2 mb-2 mt-1">
          <span class="text-xl">🪔</span>
          <h4 class="font-extrabold text-orange-800 tracking-wide text-sm uppercase">Shreeji Campus Canteen</h4>
        </div>
        <p class="text-xs text-amber-700 font-medium mb-3 gujarati-font">શ્રીજી કેમ્પસ કેન્ટીન • ડિજિટલ મેનુ</p>
        
        <div class="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-black text-2xl shadow-md mb-3 border-2 border-white ring-2 ring-orange-200">
          ${tableNum}
        </div>
        
        <span class="inline-block px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-amber-200">
          Table Number ${tableNum}
        </span>

        <div id="qr-table-box-${tableNum}" class="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 mb-4 flex items-center justify-center min-h-[160px] min-w-[160px]">
          <!-- QR inserted dynamically -->
        </div>

        <div class="space-y-1 mb-4">
          <p class="font-bold text-gray-800 text-sm">📱 Scan with Phone Camera</p>
          <p class="text-xs text-gray-500 gujarati-font">કેમેરા વડે સ્કેન કરી ઓર્ડર કરો</p>
        </div>

        <div class="w-full pt-3 border-t border-dashed border-gray-200 flex gap-2 justify-center">
          <a href="?table=${tableNum}" class="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            Open Menu
          </a>
          <button onclick="QRManager.copyTableLink(${tableNum})" class="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold rounded-lg transition-all flex items-center gap-1">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
            Copy Link
          </button>
        </div>
      `;

      container.appendChild(card);
      // Generate QR after DOM element exists
      setTimeout(() => {
        this.renderQR(`qr-table-box-${tableNum}`, targetUrl, 140);
      }, 50 * tableNum);
    }
  },

  copyTableLink(tableNum) {
    const url = window.location.origin + window.location.pathname + `?table=${tableNum}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast(`Copied Table ${tableNum} link to clipboard!`);
    }).catch(() => {
      showToast(`Table ${tableNum} URL: ${url}`);
    });
  }
};
