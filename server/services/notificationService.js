/**
 * Notification Service
 * A centralized module for sending notifications across the ZyperGo platform.
 * This is currently a stub that logs to the console. 
 * In production, you would connect Twilio/MSG91 for SMS, Firebase for Push, and SendGrid for Email.
 */

const nodemailer = require('nodemailer');

class NotificationService {
  
  static async getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_PORT == 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log('SMTP Transport configured.');
    }
    return this.transporter;
  }

  static async sendSMS(phone, message, otp = null) {
    if (!phone) return { success: false, error: 'Phone number is required' };

    // Format phone: strip everything except digits
    let cleanPhone = phone.toString().replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }

    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;

    // Extract OTP digits if not explicitly passed
    const otpCode = otp || (message && message.match(/\d{4,6}/) ? message.match(/\d{4,6}/)[0] : '1234');

    if (!authKey || !templateId) {
      console.warn(`[SMS][MSG91] Credentials missing. Mock sent to ${cleanPhone}: ${message}`);
      return { success: true, mock: true };
    }

    try {
      console.log(`[SMS][MSG91] Sending SMS/OTP to ${cleanPhone} (OTP: ${otpCode})`);
      
      const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${cleanPhone}&otp=${otpCode}&otp_expiry=10`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          authkey: authKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          OTP: otpCode
        })
      });

      const data = await response.json();
      console.log(`[SMS][MSG91] Result:`, data);
      return { success: data.type === 'success', data };
    } catch (err) {
      console.error(`[SMS][MSG91] Network/API Error:`, err.message);
      return { success: false, error: err.message };
    }
  }

  static sendWhatsApp(phone, message, templateId = null) {
    if (!phone) return;
    console.log(`[WhatsApp] To: ${phone} | Msg: ${message}`);
    // TODO: Integrate WhatsApp Business API (e.g. Meta Graph API or Twilio)
  }

  static sendPushNotification(fcmToken, title, body, data = {}) {
    if (!fcmToken) return;
    console.log(`[Push Notification] To Token: ${fcmToken} | Title: ${title} | Body: ${body}`);
    // TODO: Integrate Firebase Admin SDK
  }

  static async sendEmail(email, subject, htmlBody) {
    if (!email) return;
    console.log(`[${new Date().toISOString()}] Attempting to send to ${email}`);
    
    try {
      const transporter = await this.getTransporter();
      const sender = process.env.EMAIL_FROM || `"ZyperGo Logistics" <${process.env.SMTP_USER || 'noreply@zypergo.com'}>`;
      const info = await transporter.sendMail({
        from: sender,
        to: email,
        subject: subject,
        html: htmlBody,
      });
      console.log(`[${new Date().toISOString()}] Email Success: ${info.messageId}`);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Email Error: ${err.message}`);
      throw err;
    }
  }

  static generateEmailTemplate({ title, message, otpCode = null, buttonText = null, buttonUrl = null, footerNote = null }) {
    let otpSection = '';
    if (otpCode) {
      otpSection = `
        <div style="border: 2px dashed #fb5c00; background-color: #fffaf7; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
          <p style="font-size: 12px; color: #64748b; font-weight: bold; letter-spacing: 1.5px; margin-bottom: 10px; margin-top: 0; text-transform: uppercase;">YOUR 6-DIGIT VERIFICATION CODE</p>
          <div style="font-size: 40px; font-weight: 900; letter-spacing: 8px; color: #0f172a; margin: 0;">${otpCode}</div>
          <p style="font-size: 13px; color: #64748b; margin-top: 15px; margin-bottom: 0;">Enter this code on the application to proceed.</p>
        </div>
      `;
    }

    let buttonSection = '';
    if (buttonText && buttonUrl) {
      buttonSection = `
        <div style="text-align: center; margin: 35px 0;">
          <a href="${buttonUrl}" style="background-color: #fb5c00; color: #ffffff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">${buttonText}</a>
        </div>
      `;
    }

    let footerHtml = footerNote 
      ? `<p style="font-size: 13px; color: #64748b; margin-bottom: 25px; line-height: 1.6;">${footerNote}</p>` 
      : '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0; }
          .header { padding: 30px 40px; text-align: center; border-bottom: 1px solid #f1f5f9; background-color: #ffffff; }
          .logo { font-size: 26px; font-weight: 900; color: #fb5c00; letter-spacing: -0.5px; margin: 0; }
          .content { padding: 40px; }
          .title { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 20px; text-align: center; }
          .message { font-size: 15px; color: #475569; line-height: 1.6; margin: 0; text-align: center; }
          .footer { background-color: #f8fafc; padding: 20px 40px; text-align: center; border-top: 1px solid #e2e8f0; }
          .footer-text { font-size: 12px; color: #94a3b8; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">ZyperGo Logistics</h1>
          </div>
          <div class="content">
            <h2 class="title">${title}</h2>
            <div class="message">${message}</div>
            ${otpSection}
            ${buttonSection}
            ${footerHtml}
          </div>
          <div class="footer">
            <p class="footer-text">ZyperGo Logistics &copy; ${new Date().getFullYear()} | <a href="mailto:${process.env.SUPPORT_EMAIL || 'support@zypergo.com'}" style="color: #fb5c00; text-decoration: none;">${process.env.SUPPORT_EMAIL || 'support@zypergo.com'}</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // --- High Level Event Handlers ---

  static getFrontendBaseUrl() {
    const urlHelper = require('../utils/urlHelper');
    return urlHelper.getFrontendUrl();
  }

  static notifyBookingConfirmed(booking, customerPhone, customerEmail) {
    const trackingUrl = `${this.getFrontendBaseUrl()}/track/${booking.trackingId}`;
    const totalAmount = booking.pricing?.total || 0;
    const origin = booking.pickupLocation?.address || booking.pickupLocation?.city || 'Hub Origin';
    const destination = booking.dropLocation?.address || booking.dropLocation?.city || 'Destination';
    const senderName = booking.senderDetails?.name || 'Customer';
    const receiverName = booking.receiver?.name || 'Receiver';

    this.sendSMS(
      customerPhone, 
      `Your ZyperGo booking (${booking.trackingId}) is confirmed! Total: Rs.${totalAmount}. Track here: ${trackingUrl}`
    );
    this.sendWhatsApp(
      customerPhone, 
      `Hi ${senderName}, your ZyperGo parcel #${booking.trackingId} to ${receiverName} is confirmed! Total: Rs.${totalAmount}. Track shipment live: ${trackingUrl}`
    );

    if (customerEmail) {
      const invoiceTable = `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 20px 0; font-family: sans-serif; text-align: left;">
          <h3 style="margin: 0 0 12px 0; color: #0052cc; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Order & Invoice Receipt</h3>
          
          <table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; color: #64748b;"><strong>Tracking Number:</strong></td>
              <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #0052cc;">#${booking.trackingId}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;"><strong>Sender:</strong></td>
              <td style="padding: 4px 0; text-align: right;">${senderName} (${customerPhone || 'N/A'})</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;"><strong>Receiver:</strong></td>
              <td style="padding: 4px 0; text-align: right;">${receiverName} (${booking.receiver?.phone || 'N/A'})</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;"><strong>Origin:</strong></td>
              <td style="padding: 4px 0; text-align: right;">${origin}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;"><strong>Destination:</strong></td>
              <td style="padding: 4px 0; text-align: right;">${destination}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;"><strong>Package Weight:</strong></td>
              <td style="padding: 4px 0; text-align: right;">${booking.packageDetails?.weight || 1} kg</td>
            </tr>
            <tr style="border-top: 1px dashed #cbd5e1;">
              <td style="padding: 8px 0 4px 0; font-size: 14px; font-weight: bold; color: #0f172a;"><strong>Total Amount:</strong></td>
              <td style="padding: 8px 0 4px 0; text-align: right; font-size: 15px; font-weight: bold; color: #16a34a;">₹${totalAmount}</td>
            </tr>
            <tr>
              <td style="padding: 2px 0; color: #64748b; font-size: 11px;">Payment Mode:</td>
              <td style="padding: 2px 0; text-align: right; font-size: 11px; color: #64748b;">${booking.payment?.mode || 'Paid / COD'}</td>
            </tr>
          </table>
        </div>
      `;

      const htmlBody = this.generateEmailTemplate({
        title: 'Booking Confirmed & Receipt',
        message: `Hello <b>${senderName}</b>,<br>Your ZyperGo booking <b>#${booking.trackingId}</b> has been received and confirmed. Below are your shipment and invoice details:`,
        otpCode: null,
        buttonText: 'Track Shipment Live',
        buttonUrl: trackingUrl,
        footerNote: `${invoiceTable}<p style="font-size: 12px; color: #64748b; margin-top: 10px;">For assistance, contact our 24/7 support at support@zypergo.com</p>`
      });

      this.sendEmail(customerEmail, `Booking Confirmed #${booking.trackingId} - ZyperGo Logistics`, htmlBody)
        .catch(e => console.error(`[Email Error] Failed sending to ${customerEmail}:`, e.message));
    }
  }

  static notifyRiderAssigned(booking, customerPhone) {
    this.sendSMS(customerPhone, `A Rider has been assigned to pickup your ZyperGo shipment (${booking.trackingId}).`);
    this.sendPushNotification('customer_fcm_mock', 'Rider Assigned', 'A rider is assigned for your pickup.');
  }

  static notifyPickupOTP(customerPhone, customerEmail, otp, trackingId) {
    this.sendSMS(customerPhone, `Your pickup OTP for ZyperGo shipment is ${otp}. Do not share this with anyone except the Rider.`, 'Critical');
    if (customerEmail) {
      const htmlBody = this.generateEmailTemplate({
        title: 'Pickup Verification Code',
        message: 'A Rider has arrived to pick up your shipment. Please share this secure code with them.',
        otpCode: otp,
        footerNote: `Tracking ID: <strong>${trackingId}</strong>`
      });
      this.sendEmail(customerEmail, 'Your Pickup OTP - ZyperGo', htmlBody);
    }
  }

  static notifyPickedUp(booking, customerPhone, receiverPhone) {
    const trackingUrl = `${this.getFrontendBaseUrl()}/track/${booking.trackingId}`;
    this.sendSMS(customerPhone, `Your shipment (${booking.trackingId}) has been successfully picked up.`);
    this.sendSMS(receiverPhone, `A ZyperGo shipment (${booking.trackingId}) is on its way to you! Track here: ${trackingUrl}`);
    this.sendWhatsApp(receiverPhone, `Hi! A shipment is heading your way. Track live: ${trackingUrl}`);
  }

  static notifyInTransit(booking, receiverPhone) {
    this.sendSMS(receiverPhone, `Your ZyperGo shipment (${booking.trackingId}) is now in transit.`);
  }

  static notifyOutForDelivery(booking, receiverPhone, receiverEmail, otp) {
    this.sendSMS(receiverPhone, `Your ZyperGo shipment (${booking.trackingId}) is out for delivery! Your delivery OTP is ${otp}.`, 'Critical');
    this.sendWhatsApp(receiverPhone, `Your shipment is out for delivery today. Delivery OTP: ${otp}. Please share this with the rider.`);
    if (receiverEmail) {
      const htmlBody = this.generateEmailTemplate({
        title: 'Delivery Verification Code',
        message: 'Your shipment is out for delivery. Please share this secure code with the Rider upon arrival.',
        otpCode: otp,
        footerNote: `Tracking ID: <strong>${booking.trackingId}</strong>`
      });
      this.sendEmail(receiverEmail, 'Your Delivery OTP - ZyperGo', htmlBody);
    }
  }

  static notifyDelivered(booking, customerPhone, receiverPhone) {
    this.sendSMS(customerPhone, `Your shipment (${booking.trackingId}) was successfully delivered.`);
    this.sendSMS(receiverPhone, `Your ZyperGo shipment (${booking.trackingId}) has been delivered.`);
  }

  static notifyException(booking, adminPhone) {
    this.sendSMS(adminPhone, `ALERT: Exception reported on shipment ${booking.trackingId}. Check Admin Panel immediately.`, 'Alert');
  }
}

module.exports = NotificationService;
