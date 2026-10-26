/**
 * MSG91 SMS & OTP Service
 * Handles DLT-approved SMS and OTP dispatch using MSG91 APIs
 */

class SmsService {
  static getAuthKey() {
    return process.env.MSG91_AUTH_KEY || '577558AYB5KabYVSmM6ac4b7baP1';
  }

  static getTemplateId() {
    return process.env.MSG91_TEMPLATE_ID || '6acbaeae75c8d036880f1b42';
  }

  static getSenderId() {
    return process.env.MSG91_SENDER_ID || 'ZYPERG';
  }

  /**
   * Format phone number to international 91 format for India
   */
  static formatMobile(phone) {
    if (!phone) return '';
    let cleaned = phone.toString().replace(/\D/g, '');
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      // already formatted
    }
    return cleaned;
  }

  /**
   * Send OTP via MSG91 DLT Flow Template
   */
  static async sendOtp(phone, otp) {
    const formattedMobile = this.formatMobile(phone);
    const authKey = this.getAuthKey();
    const templateId = this.getTemplateId();
    const senderId = this.getSenderId();

    console.log(`[MSG91] Sending OTP ${otp} to ${formattedMobile} using Flow Template ${templateId}...`);

    try {
      // 1. Dispatch via MSG91 Flow API (For SMS templates created in MSG91 SMS Portal)
      const flowPayload = {
        template_id: templateId,
        sender: senderId,
        short_url: "0",
        mobiles: formattedMobile,
        OTP: otp,
        otp: otp
      };

      const flowRes = await fetch('https://control.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'authkey': authKey
        },
        body: JSON.stringify(flowPayload)
      });
      const flowData = await flowRes.json();
      console.log('[MSG91 Flow] Response:', flowData);

      // 2. Also dispatch to OTP endpoint for redundancy
      const otpUrl = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${formattedMobile}&otp=${otp}&otp_length=4&otp_expiry=10`;
      fetch(otpUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': authKey
        },
        body: JSON.stringify({ OTP: otp, otp: otp })
      }).then(r => r.json()).then(d => console.log('[MSG91 OTP API] Secondary Response:', d)).catch(() => {});

      console.log(`[LOCAL DEV OTP] Mobile: ${phone} -> OTP: ${otp} (Bypass OTP: 1234)`);
      return { 
        success: flowData.type === 'success' || !!flowData.message, 
        data: flowData 
      };
    } catch (error) {
      console.error('[MSG91] Failed to send OTP:', error);
      console.log(`[LOCAL DEV OTP] Fallback for ${phone} -> OTP: ${otp}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify OTP via MSG91 API
   */
  static async verifyOtp(phone, otp) {
    const formattedMobile = this.formatMobile(phone);
    const authKey = this.getAuthKey();

    try {
      const url = `https://control.msg91.com/api/v5/otp/verify?otp=${otp}&mobile=${formattedMobile}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'authkey': authKey
        }
      });
      const data = await response.json();
      console.log('[MSG91] Verify response:', data);
      return data.type === 'success' || data.message === 'OTP verified success';
    } catch (error) {
      console.error('[MSG91] Verify error:', error);
      return false;
    }
  }
}

module.exports = SmsService;
