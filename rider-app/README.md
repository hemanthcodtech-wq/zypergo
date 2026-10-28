# ZyperGo Rider App 🛵📱

The official React Native & Expo Mobile App for ZyperGo Rider Partners & Delivery Captains.

## Features
- **Duty Toggle**: Instant On-Duty / Off-Duty switch with real-time shift reporting to dispatch.
- **Available Pickups Pool**: Live feed of nearby delivery orders with pickup distance, trip kilometers, and estimated payout.
- **Turn-by-Step Delivery Flow**: 
  - Navigate to Sender Pickup
  - Verify 4-digit pickup code
  - Out for delivery routing
  - Recipient delivery OTP verification & instant handoff
- **Earnings & Wallet**:
  - Live shift earnings tracker
  - Daily incentive milestone tracker
  - Instant UPI bank account withdrawal
  - Past trips ledger & tip receipts
- **Rider Profile & Vehicle Info**: Registration plate, operational city, verified fleet badge, emergency hotline.

## How to Run

### 1. Install Dependencies
```bash
cd rider-app
npm install
```

### 2. Start Expo
```bash
npm start
```

### 3. Running on Devices
- **Mobile (Physical Phone)**: Open the **Expo Go** app on your phone (Android or iOS) and scan the QR code.
- **Android Emulator**: Press `a` in the terminal.
- **iOS Simulator (Mac)**: Press `i` in the terminal.
- **Web Browser**: Press `w` in the terminal or run `npm run web`.

### 4. Backend Connection
The app connects to the ZyperGo Express API:
- When running in an **Android Emulator**: Uses `http://10.0.2.2:5000/api`
- When running on a **Physical Phone (Expo Go)**: Update the backend URL in the Profile screen to your machine's local IP (e.g., `http://192.168.1.X:5000/api`).
