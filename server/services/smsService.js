/**
 * MSG91 SMS & OTP Service
 * Handles DLT-approved SMS and OTP dispatch using MSG91 APIs
 */

class SmsService {
  static getAuthKey() {
    return process.env.MSG91_AUTH_KEY || '577558AYB5KabYVSmM6ac4b7baP1';
  }

  static getTemplateId() {
    return process.env.MSG91_TEMPLATE_ID || '6ac4b0f9bd697732c0065b32';
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
   * Send OTP via MSG91 DLT Template
   */
  static async sendOtp(phone, otp) {
    const formattedMobile = this.formatMobile(phone);
    const authKey = this.getAuthKey();
    const templateId = this.getTemplateId();

    console.log(`[MSG91] Sending OTP ${otp} to ${formattedMobile} using Template ${templateId}...`);

    try {
      const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${formattedMobile}&otp=${otp}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': authKey
        },
        body: JSON.stringify({ otp })
      });
      const data = await response.json();
      console.log('[MSG91] Response:', data);
      return { success: data.type === 'success', data };
    } catch (error) {
      console.error('[MSG91] Failed to send OTP:', error);
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
