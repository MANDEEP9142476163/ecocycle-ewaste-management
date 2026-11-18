/**
 * Meta WhatsApp Cloud API Service for EcoCycle
 * Official Meta Graph API v21.0 integration
 */

const normalizeWhatsAppNumber = (phone) => {
  if (!phone) return null;
  // Strip all non-digit characters
  let digits = phone.toString().replace(/\D/g, '');
  // If Indian 10-digit number without country code, prepend 91
  if (digits.length === 10) {
    digits = `91${digits}`;
  }
  // If starts with 0 and followed by 10 digits
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = `91${digits.slice(1)}`;
  }
  return digits;
};

class WhatsAppService {
  constructor() {
    this.apiUrl = 'https://graph.facebook.com/v21.0';
  }

  getCredentials() {
    return {
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID
    };
  }

  isConfigured() {
    const { accessToken, phoneNumberId } = this.getCredentials();
    return Boolean(accessToken && phoneNumberId);
  }

  /**
   * Send WhatsApp Message (Template or Text)
   * @param {Object} options
   * @param {string} options.to - Recipient phone number
   * @param {string} options.message - Text message content
   * @param {string} [options.templateName] - Optional Meta approved template name
   * @param {Array<string>} [options.templateParams] - Body parameters for template
   * @param {boolean} [options.dryRun] - Force dry-run simulation
   */
  async sendMessage({ to, message, templateName = null, templateParams = [], dryRun = false }) {
    const normalizedPhone = normalizeWhatsAppNumber(to);

    if (!normalizedPhone) {
      return {
        success: false,
        status: 'skipped',
        error: 'Invalid or missing phone number for WhatsApp'
      };
    }

    const { accessToken, phoneNumberId } = this.getCredentials();
    const shouldDryRun = dryRun || !this.isConfigured();

    if (shouldDryRun) {
      console.log(`[WhatsApp:DryRun] Recipient: ${normalizedPhone} | Template: ${templateName || 'None'}`);
      console.log(`[WhatsApp:DryRun] Message: ${message.slice(0, 100)}...`);
      return {
        success: true,
        status: 'dry_run',
        destination: normalizedPhone,
        providerResponseId: `dryrun_wa_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        note: this.isConfigured()
          ? 'Message simulated in dry-run mode.'
          : 'Meta WhatsApp Cloud API credentials not configured in environment. Safe simulation logged.'
      };
    }

    try {
      let payload;
      if (templateName) {
        payload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en_US' },
            components: templateParams.length > 0 ? [
              {
                type: 'body',
                parameters: templateParams.map(param => ({
                  type: 'text',
                  text: String(param).slice(0, 1000)
                }))
              }
            ] : []
          }
        };
      } else {
        payload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: message
          }
        };
      }

      const response = await fetch(`${this.apiUrl}/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data?.error?.message || `HTTP ${response.status}: Meta API request failed`;
        console.warn(`[WhatsApp:Error] ${errorMsg}`);
        return {
          success: false,
          status: 'failed',
          destination: normalizedPhone,
          error: errorMsg,
          rawResponse: data
        };
      }

      const messageId = data?.messages?.[0]?.id || `wa_${Date.now()}`;
      return {
        success: true,
        status: 'sent',
        destination: normalizedPhone,
        providerResponseId: messageId,
        rawResponse: data
      };
    } catch (err) {
      console.error('[WhatsApp:Exception]', err.message);
      return {
        success: false,
        status: 'failed',
        destination: normalizedPhone,
        error: err.message
      };
    }
  }
}

module.exports = new WhatsAppService();
