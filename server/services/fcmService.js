const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let fcmInitialized = false;

try {
  const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    fcmInitialized = true;
    console.log('[FCM] Firebase Admin initialized successfully for ZyperGo');
  } else {
    console.warn('[FCM] Warning: firebase-service-account.json not found in server directory');
  }
} catch (error) {
  console.error('[FCM] Error initializing Firebase Admin:', error.message);
}

/**
 * Send High-Priority Order Buzzer Notification to Captains
 * @param {Array<string>} tokens - Array of FCM Device registration tokens
 * @param {Object} order - Booking order details
 */
async function sendOrderBuzzerNotification(tokens, order) {
  if (!fcmInitialized) {
    console.warn('[FCM] Firebase Admin not initialized, skipping FCM send.');
    return { success: false, reason: 'FCM not initialized' };
  }

  const validTokens = (Array.isArray(tokens) ? tokens : [tokens]).filter(t => t && typeof t === 'string' && t.length > 10);
  if (validTokens.length === 0) {
    console.log('[FCM] No valid captain FCM tokens to notify.');
    return { success: false, reason: 'No valid tokens' };
  }

  const fareText = order.fare || order.totalFare || order.pricing?.totalPrice || order.estimatedFare || '50';
  const pickupText = order.pickupAddress || order.pickupLocation?.address || order.pickup?.address || 'Pickup location';
  const dropText = order.deliveryAddress || order.deliveryLocation?.address || order.drop?.address || 'Drop location';
  const orderId = String(order._id || order.id || order.bookingId || '');

  const payload = {
    tokens: validTokens,
    notification: {
      title: '🚨 New Order Alert! (Tap to View)',
      body: `₹${fareText} • ${pickupText.substring(0, 45)}...`
    },
    data: {
      type: 'NEW_ORDER_ALERT',
      orderId,
      fare: String(fareText),
      pickup: String(pickupText),
      drop: String(dropText),
      sound: 'order_buzzer',
      channelId: 'order_buzzer'
    },
    android: {
      priority: 'high',
      ttl: 60 * 1000, // 60 seconds delivery window
      notification: {
        channelId: 'order_buzzer',
        sound: 'order_buzzer',
        defaultSound: false,
        priority: 'max',
        visibility: 'public',
        notificationCount: 1
      }
    }
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(payload);
    console.log(`[FCM] Sent order buzzer notifications. Success: ${response.successCount}, Failure: ${response.failureCount}`);
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount
    };
  } catch (err) {
    console.error('[FCM] Failed to send multicast message:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendOrderBuzzerNotification,
  isFcmInitialized: () => fcmInitialized
};

