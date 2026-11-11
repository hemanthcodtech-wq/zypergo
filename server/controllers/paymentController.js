const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const Settlement = require('../models/Settlement');
const User = require('../models/User');
const razorpayService = require('../services/razorpayService');

exports.getPublicConfig = (req, res) => {
  const { keyId } = razorpayService.getPaymentGatewayConfig();
  res.status(200).json({
    success: true,
    data: { keyId }
  });
};

exports.createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes = {} } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid payment amount is required.' });
    }

    const { order, keyId } = await razorpayService.createOrder({
      amountInRupees: amount,
      currency,
      receipt,
      notes
    });

    res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        keyId
      }
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to initiate payment order'
    });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
      purpose,
      amount,
      userId
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Missing Razorpay verification fields.' });
    }

    const isValid = razorpayService.verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid Razorpay payment signature.' });
    }

    let updatedWalletBalance = null;
    let updatedTransactions = null;

    if (purpose === 'wallet_topup' && userId && Number(amount) > 0) {
      const topUpAmt = Number(amount);
      const user = await User.findById(userId);
      if (user) {
        const alreadyCredited = Array.isArray(user.walletTransactions)
          && user.walletTransactions.some((t) => t.referenceId === razorpay_payment_id);

        if (!alreadyCredited) {
          const txEntry = {
            title: 'Wallet Top Up (Razorpay)',
            amount: `+₹${topUpAmt.toFixed(2)}`,
            numericAmount: topUpAmt,
            positive: true,
            referenceId: razorpay_payment_id,
            orderId: razorpay_order_id,
            date: new Date().toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: 'numeric',
              minute: '2-digit'
            })
          };

          const updated = await User.findByIdAndUpdate(
            userId,
            {
              $inc: { walletBalance: topUpAmt },
              $push: { walletTransactions: { $each: [txEntry], $position: 0 } }
            },
            { new: true }
          );
          updatedWalletBalance = updated.walletBalance;
          updatedTransactions = updated.walletTransactions;
        } else {
          updatedWalletBalance = user.walletBalance || 0;
          updatedTransactions = user.walletTransactions || [];
        }
      }
    }

    if (bookingId) {
      const booking = await Booking.findByIdAndUpdate(
        bookingId,
        {
          $set: {
            'payment.status': 'Completed',
            'payment.transactionId': razorpay_payment_id,
            'payment.razorpayOrderId': razorpay_order_id
          }
        },
        { new: true }
      );

      if (booking) {
        const existingTx = await Transaction.findOne({ referenceId: razorpay_payment_id });
        if (!existingTx) {
          const total = booking.pricing?.total || Number(amount) || 0;
          await Transaction.create({
            booking: booking._id,
            type: 'Payment',
            method: 'Online',
            amount: total,
            netAmount: total,
            status: 'Completed',
            referenceId: razorpay_payment_id,
            notes: `Razorpay Order ${razorpay_order_id}`
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      verified: true,
      data: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        ...(updatedWalletBalance !== null ? { walletBalance: updatedWalletBalance, walletTransactions: updatedTransactions } : {})
      },
      message: 'Payment verified successfully'
    });
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    res.status(500).json({ success: false, error: 'Failed to verify payment signature' });
  }
};

exports.createPayout = async (req, res) => {
  try {
    const {
      entityType = 'Partner',
      entityId,
      name,
      phone,
      email,
      accountNumber,
      ifscCode,
      vpa,
      amount,
      mode = 'IMPS',
      notes
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid payout amount is required.' });
    }

    const payoutResult = await razorpayService.createRazorpayXPayout({
      name,
      phone,
      email,
      accountNumber,
      ifscCode,
      vpa,
      amountInRupees: amount,
      referenceId: entityId || `payout_${Date.now()}`,
      narration: notes || 'ZyperGo Settlement',
      mode
    });

    if (entityId) {
      await Settlement.create({
        entityType: entityType === 'Rider' ? 'Rider' : 'Partner',
        entityId,
        entityTypeModel: entityType === 'Rider' ? 'User' : 'Partner',
        type: 'Payout',
        amount: Number(amount),
        status: payoutResult.payoutId ? 'Settled' : 'Pending',
        notes: `RazorpayX ${payoutResult.payoutId || payoutResult.fundAccountId || payoutResult.status}${notes ? ` - ${notes}` : ''}`,
        processedBy: req.user?.id
      });
    }

    res.status(200).json({
      success: true,
      data: payoutResult,
      message: payoutResult.payoutId
        ? `Razorpay X payout ${payoutResult.payoutId} initiated.`
        : 'Razorpay X payout queued successfully.'
    });
  } catch (error) {
    console.error('Error creating Razorpay X payout:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to process payout' });
  }
};

