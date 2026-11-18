/**
 * Indian DLT-Compliant SMS Gateway Service for EcoCycle
 * Supports Fast2SMS (v2 Quick & DLT routes), MSG91, and generic Indian REST gateways
 */

const normalizeIndianPhoneNumber = (phone) => {
  if (!phone) return null;
  let digits = phone.toString().replace(/\D/g, '');
  // If prefixed with 91 and 12 digits total
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }
  // If prefixed with 0 and 11 digits total
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  // Standard Indian mobile numbers are 10 digits starting with 6, 7, 8, or 9
  if (digits.length === 10) {
    return digits;
  }
  return digits.length >= 10 ? digits.slice(-10) : null;
};

class SMSService {
  constructor() {
    this.defaultSenderId = 'ECOCYC';
  }

  getCredentials() {
    return {
      provider: (process.env.SMS_PROVIDER || 'fast2sms').toLowerCase(),
      apiKey: process.env.SMS_API_KEY || process.env.FAST2SMS_API_KEY || process.env.MSG91_AUTH_KEY,
      senderId: process.env.SMS_SENDER_ID || this.defaultSenderId,
      entityId: process.env.SMS_DLT_ENTITY_ID || '',
      gatewayUrl: process.env.SMS_GATEWAY_URL || ''
    };
  }

  isConfigured() {
    const { apiKey } = this.getCredentials();
    return Boolean(apiKey);
  }

  /**
   * Send SMS via Indian Gateway
   * @param {Object} options
   * @param {string} options.to - Recipient phone number (10 digit Indian format)
   * @param {string} options.message - SMS message body (must conform to DLT template if live)
   * @param {string} [options.dltTemplateId] - Indian DLT approved Template ID
   * @param {boolean} [options.dryRun] - Force dry-run simulation
   */
  async sendSMS({ to, message, dltTemplateId = null, dryRun = false }) {
    const normalizedPhone = normalizeIndianPhoneNumber(to);

    if (!normalizedPhone) {
      return {
        success: false,
        status: 'skipped',
        error: 'Invalid or missing Indian 10-digit mobile number'
      };
    }

    const creds = this.getCredentials();
    const shouldDryRun = dryRun || !this.isConfigured();

    if (shouldDryRun) {
      console.log(`[SMS:DryRun] Recipient: +91-${normalizedPhone} | SenderID: ${creds.senderId}`);
      console.log(`[SMS:DryRun] Message: ${message.slice(0, 100)}...`);
      return {
        success: true,
        status: 'dry_run',
        destination: `+91${normalizedPhone}`,
        providerResponseId: `dryrun_sms_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        note: this.isConfigured()
          ? 'SMS simulated in dry-run mode.'
          : 'SMS Gateway API key not configured in environment. Safe simulation logged.'
      };
    }

    try {
      if (creds.provider === 'fast2sms') {
        // Fast2SMS API v2 integration
        const fast2smsPayload = {
          route: dltTemplateId ? 'dlt' : 'q',
          message: message,
          language: 'english',
          flash: 0,
          numbers: normalizedPhone
        };

        if (dltTemplateId) {
          fast2smsPayload.sender_id = creds.senderId;
          fast2smsPayload.message_id = dltTemplateId;
          if (creds.entityId) fast2smsPayload.entity_id = creds.entityId;
        }

        const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            'authorization': creds.apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(fast2smsPayload)
        });

        const data = await response.json();

        if (!response.ok || data.return === false) {
          const errMsg = data?.message?.[0] || data?.message || `HTTP ${response.status}: Fast2SMS request rejected`;
          console.warn(`[SMS:Fast2SMS:Error] ${errMsg}`);
          return {
            success: false,
            status: 'failed',
            destination: `+91${normalizedPhone}`,
            error: errMsg,
            rawResponse: data
          };
        }

        const requestId = data.request_id || `f2s_${Date.now()}`;
        return {
          success: true,
          status: 'sent',
          destination: `+91${normalizedPhone}`,
          providerResponseId: requestId,
          rawResponse: data
        };
      } else if (creds.provider === 'msg91') {
        // MSG91 API v5 integration
        const response = await fetch('https://control.msg91.com/api/v5/flow/', {
          method: 'POST',
          headers: {
            'authkey': creds.apiKey,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            template_id: dltTemplateId || process.env.MSG91_DEFAULT_TEMPLATE_ID,
            short_url: '0',
            recipients: [{ mobiles: `91${normalizedPhone}`, message }]
          })
        });

        const data = await response.json();
        const success = response.ok && data.type !== 'error';
        return {
          success,
          status: success ? 'sent' : 'failed',
          destination: `+91${normalizedPhone}`,
          providerResponseId: data.message || `msg91_${Date.now()}`,
          error: success ? null : data.message,
          rawResponse: data
        };
      } else {
        // Generic Indian DLT REST Gateway integration
        const targetUrl = creds.gatewayUrl || 'https://api.sms-gateway.in/send';
        const params = new URLSearchParams({
          apikey: creds.apiKey,
          sender: creds.senderId,
          numbers: `91${normalizedPhone}`,
          message: message
        });
        if (dltTemplateId) params.append('template_id', dltTemplateId);
        if (creds.entityId) params.append('entity_id', creds.entityId);

        const response = await fetch(`${targetUrl}?${params.toString()}`);
        const text = await response.text();

        return {
          success: response.ok,
          status: response.ok ? 'sent' : 'failed',
          destination: `+91${normalizedPhone}`,
          providerResponseId: `generic_${Date.now()}`,
          rawResponse: text
        };
      }
    } catch (err) {
      console.error('[SMS:Exception]', err.message);
      return {
        success: false,
        status: 'failed',
        destination: `+91${normalizedPhone}`,
        error: err.message
      };
    }
  }
}

module.exports = new SMSService();
