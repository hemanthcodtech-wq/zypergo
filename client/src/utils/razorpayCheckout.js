import api from '../api';

const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function openRazorpayCheckout({
  amount,
  currency = 'INR',
  name = 'ZyperGo Logistics',
  description = 'ZyperGo Payment',
  prefill = {},
  purpose = 'booking',
  userId,
  bookingId,
  notes = {},
  receipt
}) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error('Please enter a valid payment amount.');
  }

  const loaded = await loadRazorpayScript();
  if (!loaded || !window.Razorpay) {
    throw new Error('Unable to load Razorpay Checkout. Check your internet connection.');
  }

  const orderRes = await api.post('/payments/create-order', {
    amount: numericAmount,
    currency,
    receipt,
    notes: { purpose, ...notes }
  });

  if (!orderRes.data?.success || !orderRes.data?.data?.orderId) {
    throw new Error(orderRes.data?.error || 'Failed to create Razorpay payment order.');
  }

  const orderData = orderRes.data.data;
  const key = orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (!key) {
    throw new Error('Razorpay Key ID is not configured.');
  }

  const cleanPhone = String(prefill.contact || '').replace(/\D/g, '').slice(-10);

  return new Promise((resolve, reject) => {
    let settled = false;

    const rzp = new window.Razorpay({
      key,
      amount: orderData.amount,
      currency: orderData.currency || currency,
      name,
      description,
      order_id: orderData.orderId,
      prefill: {
        name: prefill.name || '',
        email: prefill.email || '',
        contact: cleanPhone || ''
      },
      notes: { purpose, ...notes },
      theme: { color: '#0052CC' },
      handler: async (response) => {
        try {
          const verifyRes = await api.post('/payments/verify', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            bookingId,
            purpose,
            amount: numericAmount,
            userId
          });

          if (!verifyRes.data?.success || !verifyRes.data?.verified) {
            throw new Error(verifyRes.data?.error || 'Payment verification failed.');
          }

          settled = true;
          resolve({
            ...verifyRes.data,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
        } catch (err) {
          settled = true;
          reject(new Error(err.response?.data?.error || err.message || 'Payment verification failed.'));
        }
      },
      modal: {
        ondismiss: () => {
          if (!settled) {
            settled = true;
            reject(new Error('Payment cancelled by user.'));
          }
        }
      }
    });

    rzp.on('payment.failed', (failEvent) => {
      if (!settled) {
        settled = true;
        reject(new Error(failEvent?.error?.description || 'Payment failed. Please try again.'));
      }
    });

    rzp.open();
  });
}

