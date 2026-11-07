# 🍲 Shreeji Campus Canteen (શ્રીજી કેમ્પસ કેન્ટીન)
### Modern, Responsive Gujarati & Indian College Canteen Food Ordering Website

A complete, production-ready web application for a college food canteen serving authentic Gujarati snacks, breakfast, fast food, beverages, and traditional thalis. Students scan a QR code placed on their table to browse the digital menu, customize their order, view dynamic preparation times, and track their order status in real time.

---

## 🌟 Key Features

### 1. 📱 Table QR Code System (Tables 1 to 10)
- **Automatic Table Detection**: URL query parameter `?table=1` through `?table=10` is automatically detected upon scanning.
- **Table Welcome Banner**: Displays `"Table [N] – Welcome to Our Canteen (આપનું હાર્દિક સ્વાગત છે)"`.
- **Interactive Table Switcher**: Students can switch tables easily if they moved.
- **Printable QR Standees Hub**: Staff or students can view and print scannable QR standee cards for Tables 1 to 10.

### 2. 🥟 Authentic Gujarati & Indian Menu
- **All Required Categories Included**:
  - **Gujarati Snacks (ફરસાણ)**: Masala Bhakhri, Plain Bhakhri, Methi Thepla, Fafda with Sambharo & Kadhi, Khakhra, Khandvi, Live Khatta Dhokla, Nylon Khaman, Patra, Surti Sev Khamani.
  - **Breakfast (નાસ્તો)**: Gujarati Bataka Poha, Masala Poha, Upma, Steamed Idli Sambhar, Medu Vada, Punjabi Samosa, Khasta Dal Kachori.
  - **Fast Food (ફાસ્ટ ફૂડ)**: Desi Vada Pav, Kutchhi Dabeli, Cheese Samosa, Pav Bhaji, Veg Grilled Sandwich, Cheese Sandwich, Amdavadi Masala Toast, Masala Maggi, Cheese Maggi.
  - **Beverages (ચા અને છાસ)**: Cutting Chai, Special Masala Tea, Hot Filter Coffee, Cold Coffee with Ice Cream, Lemon Water (Shikanji), Desi Chaas, Masala Jeera Chaas, Soft Drinks.
  - **Gujarati Special (કાઠિયાવાડી વાનગી)**: Royal Gujarati Thali, Authentic Dal Dhokli, Sev Tameta Nu Shaak, Bajra Rotla with Gud & Makhan, Gujarati Kadhi, Vaghareli Khichdi with Kadhi, Gujarati Farsan Platter.
- **Bilingual Food Names**: English + Gujarati scripts (e.g. `મસાલા ભાખરી • Masala Bhakhri`).
- **100% Pure Veg Indicator & Jain Diet Badges**: Indian standard green dot veg symbol + Jain friendly badge.

### 3. ⏱️ Intelligent Timing & Canteen Schedule System
- **Per-Item Preparation Times**:
  - Tea – 3 minutes
  - Samosa – 5 minutes
  - Poha – 7 minutes
  - Masala Bhakhri – 10 minutes
  - Sandwich – 8 minutes
  - Gujarati Thali – 20 minutes
- **Dynamic Order Prep Calculation**: Evaluates the highest prep time item in the cart plus item-count scaling to give a realistic range (e.g., `10–15 minutes`).
- **Canteen Opening Hours**:
  - **Monday–Saturday**: `8:00 AM – 8:00 PM`
  - **Sunday**: `Closed`
- **Closed Canteen Alert**: Shows `"Canteen is currently closed. Please place your order during opening hours."` and safely locks checkout.
- **Staff Override**: Kitchen admin can toggle "Force Open (Testing Mode)" to test orders anytime.

### 4. 🛒 Intuitive Cart & Ordering Experience
- Side drawer + floating mobile cart pill with live item counter and subtotal.
- Quantity steppers `[-] [qty] [+]` directly on food cards and in the cart.
- Customer Details modal asking for:
  - Student / Customer Name (required)
  - Mobile Number (optional)
  - Table Number (automatically populated and verified)
  - Special Instructions (e.g., "Less spicy", "No onion garlic - Jain", "Chai extra kadak")
- **Payment Methods**:
  - Cash / Card at Counter
  - Instant UPI QR simulator (Google Pay, PhonePe, Paytm with `canteen@okhdfcbank`)

### 5. 🔔 Order Confirmation & Live 5-Stage Status Tracking
Fulfills the exact prompt specification:
```
🔔 CANTEEN ORDER NOTICE
Your order has been received successfully.

Order ID: #ORD1025
Table: 4

Please wait approximately 10–15 minutes.
You will receive an update when your order is ready.
Thank you for ordering from our canteen! ❤️
```
- **Live 5-Step Order Progress Tracker**:
  1. 🟡 **Order Received**
  2. 🔵 **Order Accepted**
  3. 🟠 **Preparing**
  4. 🟢 **Ready for Pickup** (triggers audio bell alert & banner!)
  5. ✅ **Completed**
- **Real-Time Cross-Tab Synchronization**: When kitchen staff changes status in the Admin Dashboard, the customer's tab updates immediately via `storage` events!

### 5B. 💬 “Send Bill on WhatsApp” Feature
- **Automatic Bill Generation**: Dynamically formats the complete itemized bill using official WhatsApp text formatting (`*bold*`, emojis, bullet points, clean layout).
- **Exact Bill Format**:
```text
🍽️ *GUJARATI COLLEGE CANTEEN*

━━━━━━━━━━━━━━━━
🧾 *ORDER BILL*
━━━━━━━━━━━━━━━━

*Order ID:* #ORD1025
*Table:* Table 4
*Date:* 06/10/2026
*Time:* 06:25 PM

*Items:*
• Masala Bhakhri × 2 — ₹60
• Samosa × 2 — ₹40
• Masala Chaas × 1 — ₹25

━━━━━━━━━━━━━━━━
*Subtotal:* ₹125
*Total:* ₹125
━━━━━━━━━━━━━━━━

⏱️ *Estimated Preparation Time:* 10–15 minutes

📍 *Table:* 4

✅ *Order Confirmed*

Thank you for ordering from our canteen! 🙏
```
- **Official Click-to-Chat Link (`wa.me`)**:
  - Automatically handles Indian country code prefix (`+91`).
  - Mobile: Launches the WhatsApp app directly.
  - Desktop: Opens WhatsApp Web seamlessly.
  - Validates 10-digit mobile number before generating links.
  - No secret background sending: opens WhatsApp with pre-filled message for customer review and one-tap send.
- **Convenient Customer Action Buttons**:
  - 🟢 **Send Bill on WhatsApp**
  - 📄 **View Bill** (opens high-quality digital tax invoice modal)
  - 🖨️ **Print Bill** (print-styled customer receipt)
  - 🏠 **Back to Menu**

### 6. 👨‍🍳 Kitchen & Admin Dashboard
- **Protected Access**: Quick access with Staff PIN (Default: `1234`).
- **Live Orders Feed**: Kitchen Display System (KDS) showing order ID, table #, customer name, WhatsApp mobile, items, timestamp, and notes.
- **💬 WhatsApp Customer Messenger**:
  - Direct 1-click **WhatsApp Customer** button on every order card.
  - Send dynamic status update notifications:
    - **Order Accepted**: `"Your order #ORD... has been accepted and is being prepared."`
    - **Preparing**: `"Your order #ORD... is currently being prepared. 👨‍🍳"`
    - **Ready**: `"Your order #ORD... is ready! 🎉 Please collect it from the canteen."`
    - **Completed**: `"Your order #ORD... has been completed. Thank you! 🙏"`
    - **Full Bill**: Re-send the full itemized bill anytime from the kitchen.
- **Audio Chime**: Melodic canteen bell plays automatically when a new student order arrives.
- **Status Controls**: `[Accept Order]`, `[Reject]`, `[Preparing]`, `[Mark as Ready]`, `[Complete Order]`.
- **Kitchen Order Ticket (KOT)**: 1-click printable receipt slip.
- **Menu Management**: Add new dishes, edit prices, edit prep times, toggle stock availability (In Stock / Out of Stock), and delete items.
- **Daily Analytics**: Real-time revenue counter, order count, and kitchen load metrics.

---

## 🚀 How to Run the Website

### Option 1: Double-Click Launcher (Windows)
Double-click `start-canteen.bat` in the project folder. It launches the built-in PowerShell web server on `http://localhost:8080/?table=1` and automatically opens your browser.

### Option 2: Direct Browser File
Double-click `index.html` to open it in Chrome, Edge, Firefox, or Safari. All features (QR codes, menu, cart, admin, audio alerts) work completely out of the box with zero setup!

### Option 3: PowerShell Command
```powershell
powershell -ExecutionPolicy Bypass -File .\start-server.ps1
```

---

## 🧪 Testing the Complete Workflow

1. **Open Table 1 Menu**:
   Visit `http://localhost:8080/?table=1` (or click on the Table switcher in the header).
2. **Add Items to Cart**:
   Add **Masala Bhakhri** (₹30), **Punjabi Samosa** (₹25), and **Special Masala Chai** (₹20).
3. **Review Cart & Estimated Time**:
   Open cart to see the calculated estimated prep time (e.g., `10–15 minutes`).
4. **Place Order**:
   Click **Confirm & Order**, enter name (e.g. `Rahul`), and click **Place Order**.
5. **View Order Notice**:
   Notice the confetti and the **🔔 CANTEEN ORDER NOTICE** with unique Order ID (e.g. `#ORD1025`).
6. **Open Admin Dashboard**:
   Click **Kitchen Admin** in the header (PIN: `1234`).
7. **Process Order**:
   Click `[Accept Order]` ➔ `[Preparing]` ➔ `[Mark as Ready]`.
8. **Check Customer Tracker**:
   Watch the live 5-step status bar update to 🟢 **Ready for Pickup** with audio bell chime!

---

## 📁 Project Structure

```
├── index.html            # Main responsive single-page application & modals
├── images/               # Authentic, high-resolution local images for all 41 menu items
├── css/
│   └── styles.css        # Gujarati cultural theme, animations, veg indicators, print styles
├── js/
│   ├── menu-data.js      # Authentic Gujarati & Indian food items database
│   ├── qr-generator.js   # Dynamic QR code generation for Tables 1 to 10 & standees
│   ├── app.js            # Customer app: URL table detection, cart, prep time, order placement
│   └── admin.js          # Kitchen staff KDS, status actions, menu CRUD, live sync
├── start-canteen.bat     # 1-click Windows launcher
├── start-server.ps1      # Zero-dependency local HTTP server
└── README.md             # Documentation
```
