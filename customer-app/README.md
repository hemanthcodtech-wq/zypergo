# ZyperGo Customer App (React Native)

Modern React Native mobile application for ZyperGo customers, built with Expo.

## Features
- **User Authentication**: Sign In / Registration with demo credentials support.
- **Home & Dashboard**: Service highlights (Hyperlocal, Intercity, Cargo), live order status, and instant tracking search.
- **Shipment Booking**: 3-step streamlined parcel booking (Pickup address, Delivery address, Parcel weight/type/vehicle, Dynamic price estimation).
- **Live Tracking**: Visual timeline (Booked, Picked Up, In Transit, Out for Delivery, Delivered) and assigned delivery driver contact card.
- **My Shipments**: Order history with filter tabs (All, Active, Completed), search by order ID, and fare details.
- **Profile & Wallet**: User account, saved addresses, wallet balance top-up, support center, and secure logout.

## How to Run

1. Navigate to the project directory:
   ```bash
   cd customer-app
   ```
2. Start the Expo development server:
   ```bash
   npm start
   ```
   Or from the root directory:
   ```bash
   npm run dev:customer
   ```
3. Scan the QR code using the **Expo Go** app on your Android or iOS device, or run:
   - `npm run android` to launch in Android Emulator
   - `npm run ios` to launch in iOS Simulator
   - `npm run web` to preview in your web browser
