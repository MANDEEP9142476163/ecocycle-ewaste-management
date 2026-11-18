/**
 * Central Notification Service for EcoCycle
 * Orchestrates WhatsApp, SMS (Indian DLT), and In-App notification channels
 */

const { pool } = require('../config/db');
const whatsappService = require('./whatsappService');
const smsService = require('./smsService');

class NotificationService {
  constructor() {
    this.settingsCache = null;
    this.cacheTimestamp = 0;
    this.cacheTTL = 30000; // 30 seconds TTL
  }

  /**
   * Load notification settings from DB (with caching)
   */
  async getSettings(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this.settingsCache && (now - this.cacheTimestamp < this.cacheTTL)) {
      return this.settingsCache;
    }

    try {
      const [rows] = await pool.query('SELECT setting_key, setting_value, setting_group, description FROM notification_settings');
      const settings = {};
      rows.forEach(r => {
        settings[r.setting_key] = r.setting_value;
      });
      this.settingsCache = settings;
      this.cacheTimestamp = now;
      return settings;
    } catch (err) {
      console.warn('[NotificationService] Failed to load settings from DB, using fallback defaults:', err.message);
      return {
        whatsapp_enabled: 'true',
        sms_enabled: 'true',
        in_app_enabled: 'true',
        dry_run_mode: 'false',
        admin_alert_mobile: '+919876543210',
        admin_alert_whatsapp: '+919876543210',
        sms_sender_id: 'ECOCYC'
      };
    }
  }

  /**
   * Update settings in DB and invalidate cache
   */
  async updateSettings(settingsMap) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      for (const [key, value] of Object.entries(settingsMap)) {
        await connection.query(
          `INSERT INTO notification_settings (setting_key, setting_value)
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP`,
          [key, String(value)]
        );
      }
      await connection.commit();
      this.settingsCache = null; // Invalidate cache
      return await this.getSettings(true);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Record notification attempt in notification_logs
   */
  async logAttempt({
    channel,
    eventType,
    recipientRole,
    recipientId = null,
    recipientDestination = null,
    titleOrTemplate = null,
    messageContent,
    status,
    providerResponseId = null,
    errorMessage = null
  }) {
    try {
      await pool.query(
        `INSERT INTO notification_logs (
          channel, event_type, recipient_role, recipient_id, recipient_destination,
          title_or_template, message_content, status, provider_response_id, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          channel,
          eventType,
          recipientRole,
          recipientId,
          recipientDestination,
          titleOrTemplate,
          messageContent,
          status,
          providerResponseId,
          errorMessage
        ]
      );
    } catch (err) {
      console.error('[NotificationService] Failed to record log in DB:', err.message);
    }
  }

  /**
   * Send In-App notification
   */
  async sendInApp({ recipientRole, recipientId = null, title, message, eventType = null, entityId = null }) {
    try {
      const [result] = await pool.query(
        `INSERT INTO notifications (recipient_role, recipient_id, event_type, entity_id, title, message, is_read)
         VALUES (?, ?, ?, ?, ?, ?, FALSE)`,
        [recipientRole, recipientId, eventType, entityId, title, message]
      );

      await this.logAttempt({
        channel: 'in_app',
        eventType: eventType || 'general',
        recipientRole,
        recipientId,
        recipientDestination: `role:${recipientRole}${recipientId ? `:${recipientId}` : ''}`,
        titleOrTemplate: title,
        messageContent: message,
        status: 'sent',
        providerResponseId: `db_notif_${result.insertId}`
      });

      return { success: true, channel: 'in_app', status: 'sent', id: result.insertId };
    } catch (err) {
      console.error('[NotificationService] In-app error:', err.message);
      await this.logAttempt({
        channel: 'in_app',
        eventType: eventType || 'general',
        recipientRole,
        recipientId,
        recipientDestination: `role:${recipientRole}`,
        titleOrTemplate: title,
        messageContent: message,
        status: 'failed',
        errorMessage: err.message
      });
      return { success: false, channel: 'in_app', status: 'failed', error: err.message };
    }
  }

  /**
   * Unified dispatcher: sends In-App, WhatsApp, and SMS according to settings
   */
  async dispatch({
    eventType,
    recipientRole,
    recipientId = null,
    recipientPhone = null,
    title,
    message,
    whatsappTemplate = null,
    whatsappParams = [],
    smsDltTemplateId = null,
    entityId = null,
    userConsented = true
  }) {
    const settings = await this.getSettings();
    const eventFlagKey = `event_${eventType}`;
    const isEventEnabled = settings[eventFlagKey] !== 'false';
    const isDryRun = settings.dry_run_mode === 'true';

    const results = {
      event: eventType,
      inApp: null,
      whatsapp: null,
      sms: null
    };

    // 1. In-App Notification
    if (settings.in_app_enabled !== 'false' && isEventEnabled && recipientRole !== 'visitor') {
      results.inApp = await this.sendInApp({
        recipientRole,
        recipientId,
        title,
        message,
        eventType,
        entityId
      });
    }

    // 2. WhatsApp Notification
    if (settings.whatsapp_enabled !== 'false' && isEventEnabled && recipientPhone && userConsented) {
      try {
        const waResult = await whatsappService.sendMessage({
          to: recipientPhone,
          message,
          templateName: whatsappTemplate,
          templateParams: whatsappParams,
          dryRun: isDryRun
        });

        await this.logAttempt({
          channel: 'whatsapp',
          eventType,
          recipientRole,
          recipientId,
          recipientDestination: waResult.destination || recipientPhone,
          titleOrTemplate: whatsappTemplate || title,
          messageContent: message,
          status: waResult.status,
          providerResponseId: waResult.providerResponseId,
          errorMessage: waResult.error
        });

        results.whatsapp = waResult;
      } catch (waErr) {
        console.error('[NotificationService] WhatsApp exception:', waErr.message);
      }
    }

    // 3. SMS Notification
    if (settings.sms_enabled !== 'false' && isEventEnabled && recipientPhone && userConsented) {
      try {
        const smsResult = await smsService.sendSMS({
          to: recipientPhone,
          message,
          dltTemplateId: smsDltTemplateId,
          dryRun: isDryRun
        });

        await this.logAttempt({
          channel: 'sms',
          eventType,
          recipientRole,
          recipientId,
          recipientDestination: smsResult.destination || recipientPhone,
          titleOrTemplate: smsDltTemplateId || title,
          messageContent: message,
          status: smsResult.status,
          providerResponseId: smsResult.providerResponseId,
          errorMessage: smsResult.error
        });

        results.sms = smsResult;
      } catch (smsErr) {
        console.error('[NotificationService] SMS exception:', smsErr.message);
      }
    }

    return results;
  }

  // ==========================================
  // BUSINESS EVENT DISPATCHERS
  // ==========================================

  /**
   * A1. Citizen Registration
   */
  async notifyUserRegistered({ user }) {
    const settings = await this.getSettings();

    // Notify Citizen
    await this.dispatch({
      eventType: 'user_registered',
      recipientRole: 'user',
      recipientId: user.id,
      recipientPhone: user.mobile_number,
      title: 'Welcome to EcoCycle! 🌱',
      message: `Welcome to EcoCycle, ${user.name || user.full_name}! Your citizen profile is active. Ready to recycle your electronic waste? Schedule your first pickup at: https://ecocycle-ewaste-management.vercel.app/user/submit-product`
    });

    // Notify Admin
    const adminPhone = settings.admin_alert_mobile || settings.admin_alert_whatsapp;
    await this.dispatch({
      eventType: 'user_registered',
      recipientRole: 'admin',
      recipientPhone: adminPhone,
      title: 'New Citizen Registered',
      message: `EcoCycle Alert: New citizen registered - ${user.name || user.full_name} (${user.email}, ${user.mobile_number}).`
    });
  }

  /**
   * A2 & B2. E-Waste Pickup Request Submitted
   */
  async notifyPickupSubmitted({ product, user }) {
    const settings = await this.getSettings();

    // Notify Citizen
    await this.dispatch({
      eventType: 'pickup_submitted',
      recipientRole: 'user',
      recipientId: user.id || product.user_id,
      recipientPhone: product.contact_number || user.mobile_number,
      entityId: product.id,
      title: 'E-Waste Pickup Request Received',
      message: `EcoCycle Request Confirmed: We received your request for "${product.product_name}" (Code: ${product.product_code}). Scheduled pickup date: ${product.pickup_date}. Our operations team will assign a field officer soon. Track live: https://ecocycle-ewaste-management.vercel.app/user/track`
    });

    // Notify Admin
    const adminPhone = settings.admin_alert_mobile || settings.admin_alert_whatsapp;
    await this.dispatch({
      eventType: 'pickup_submitted',
      recipientRole: 'admin',
      recipientPhone: adminPhone,
      entityId: product.id,
      title: 'New E-Waste Pickup Request',
      message: `New Pickup Request [${product.product_code}]: ${product.product_name} listed by ${user.name || user.full_name || 'Citizen'} (${product.contact_number || user.mobile_number}). Address: ${product.pickup_address}.`
    });
  }

  /**
   * A3 & C1. Employee Assigned
   */
  async notifyEmployeeAssigned({ product, employee, user }) {
    // Notify Citizen
    await this.dispatch({
      eventType: 'employee_assigned',
      recipientRole: 'user',
      recipientId: product.user_id,
      recipientPhone: product.contact_number || (user && user.mobile_number),
      entityId: product.id,
      title: 'Field Officer Assigned',
      message: `EcoCycle Update: Officer ${employee.name} (${employee.contact_number || employee.phone}) has been assigned to verify and collect your e-waste item "${product.product_name}" (${product.product_code}).`
    });

    // Notify Employee
    await this.dispatch({
      eventType: 'employee_assigned',
      recipientRole: 'employee',
      recipientId: employee.id,
      recipientPhone: employee.contact_number,
      entityId: product.id,
      title: 'New Task Assignment',
      message: `New EcoCycle Task: You are assigned to investigate "${product.product_name}" (${product.product_code}). Pickup Location: ${product.pickup_address}. Citizen: ${product.contact_person || 'Citizen'} (${product.contact_number}).`
    });
  }

  /**
   * A4 & C2. Under Investigation
   */
  async notifyUnderInvestigation({ product, employee, user, remarks }) {
    await this.dispatch({
      eventType: 'under_investigation',
      recipientRole: 'user',
      recipientId: product.user_id,
      recipientPhone: product.contact_number || (user && user.mobile_number),
      entityId: product.id,
      title: 'Inspection In Progress',
      message: `EcoCycle Inspection: Officer ${employee.name} has initiated physical/technical verification of your item "${product.product_name}" (${product.product_code}). Notes: ${remarks || 'Standard safety and component check in progress.'}`
    });
  }

  /**
   * A5 & C2. Pickup Scheduled or Details Updated
   */
  async notifyPickupScheduledOrUpdated({ product, user, employee }) {
    // Notify Citizen
    await this.dispatch({
      eventType: 'pickup_scheduled',
      recipientRole: 'user',
      recipientId: product.user_id,
      recipientPhone: product.contact_number || (user && user.mobile_number),
      entityId: product.id,
      title: 'Pickup Schedule Updated',
      message: `EcoCycle Schedule Notice: Pickup details for "${product.product_name}" (${product.product_code}) have been updated. Date: ${product.pickup_date}, Address: ${product.pickup_address}.`
    });

    // Notify Employee (if assigned)
    if (employee) {
      await this.dispatch({
        eventType: 'pickup_scheduled',
        recipientRole: 'employee',
        recipientId: employee.id,
        recipientPhone: employee.contact_number,
        entityId: product.id,
        title: 'Task Details Updated',
        message: `Task Updated [${product.product_code}]: New pickup date: ${product.pickup_date}, Address: ${product.pickup_address}.`
      });
    }
  }

  /**
   * A6 & B4. Product Collected
   */
  async notifyProductCollected({ product, employee, user, remarks }) {
    const settings = await this.getSettings();

    // Notify Citizen
    await this.dispatch({
      eventType: 'product_collected',
      recipientRole: 'user',
      recipientId: product.user_id,
      recipientPhone: product.contact_number || (user && user.mobile_number),
      entityId: product.id,
      title: 'E-Waste Item Collected 🌱',
      message: `Success! Your electronic item "${product.product_name}" (${product.product_code}) was collected by officer ${employee.name}. Thank you for diverting hazardous e-waste away from landfills!`
    });

    // Notify Admin
    const adminPhone = settings.admin_alert_mobile || settings.admin_alert_whatsapp;
    await this.dispatch({
      eventType: 'product_collected',
      recipientRole: 'admin',
      recipientPhone: adminPhone,
      entityId: product.id,
      title: 'Item Collected by Officer',
      message: `EcoCycle Operations: Item ${product.product_code} (${product.product_name}) collected by ${employee.name}. ${remarks ? `Remarks: ${remarks}` : ''}`
    });
  }

  /**
   * A7. Sent for Recycling
   */
  async notifySentForRecycling({ product, employee, user, remarks }) {
    await this.dispatch({
      eventType: 'sent_recycling',
      recipientRole: 'user',
      recipientId: product.user_id,
      recipientPhone: product.contact_number || (user && user.mobile_number),
      entityId: product.id,
      title: 'Dispatched to Recycling Center',
      message: `Recycling Plant Dispatch: Your item "${product.product_name}" (${product.product_code}) is now en route to our authorized recovery center for sustainable dismantling and mineral extraction.`
    });
  }

  /**
   * A8. Recycling Completed
   */
  async notifyRecyclingCompleted({ product, employee, user, remarks }) {
    const settings = await this.getSettings();

    // Notify Citizen
    await this.dispatch({
      eventType: 'recycled',
      recipientRole: 'user',
      recipientId: product.user_id,
      recipientPhone: product.contact_number || (user && user.mobile_number),
      entityId: product.id,
      title: '100% Sustainable Recycling Completed! 🏆',
      message: `Zero-Landfill Milestone: Your e-waste item "${product.product_name}" (${product.product_code}) has been 100% recycled! Valuable copper, silicon, and aluminum have entered the circular economy. View your green badge on EcoCycle.`
    });

    // Notify Admin
    const adminPhone = settings.admin_alert_mobile || settings.admin_alert_whatsapp;
    await this.dispatch({
      eventType: 'recycled',
      recipientRole: 'admin',
      recipientPhone: adminPhone,
      entityId: product.id,
      title: 'Recycling Cycle Completed',
      message: `Milestone: Product ${product.product_code} (${product.product_name}) is certified 100% recycled.`
    });
  }

  /**
   * A9. Product Rejected
   */
  async notifyProductRejected({ product, employee, user, rejectionReason }) {
    await this.dispatch({
      eventType: 'rejected',
      recipientRole: 'user',
      recipientId: product.user_id,
      recipientPhone: product.contact_number || (user && user.mobile_number),
      entityId: product.id,
      title: 'Pickup Request Status Update',
      message: `EcoCycle Notice: Your pickup request for "${product.product_name}" (${product.product_code}) could not be collected. Reason: ${rejectionReason}. Need help? Contact us: mandeepkumar12032005@gmail.com`
    });
  }

  /**
   * D. Contact Form Inquiry
   */
  async notifyContactInquiry({ inquiry }) {
    const settings = await this.getSettings();
    const adminPhone = settings.admin_alert_mobile || settings.admin_alert_whatsapp;

    // 1. Notify Admin via In-App, WhatsApp, SMS
    await this.dispatch({
      eventType: 'contact_inquiry',
      recipientRole: 'admin',
      recipientPhone: adminPhone,
      entityId: inquiry.id,
      title: 'New Visitor Contact Inquiry',
      message: `New Inquiry from ${inquiry.name} (${inquiry.email}${inquiry.phone ? `, ${inquiry.phone}` : ''}): "${inquiry.subject || 'General'}" - ${inquiry.message.slice(0, 150)}...`
    });

    // 2. If visitor provided phone and consented, send immediate confirmation
    if (inquiry.phone && inquiry.consent_sms_whatsapp) {
      await this.dispatch({
        eventType: 'contact_inquiry',
        recipientRole: 'visitor',
        recipientPhone: inquiry.phone,
        entityId: inquiry.id,
        userConsented: true,
        title: 'Thank You for Contacting EcoCycle',
        message: `Hello ${inquiry.name}, thank you for reaching out to EcoCycle. We received your message: "${inquiry.subject || 'General inquiry'}". Our green recovery team will get back to you within 24 hours.`
      });
    }
  }

  /**
   * Channel Diagnostics
   */
  async getChannelStatus() {
    const settings = await this.getSettings();
    return {
      whatsapp: {
        configured: whatsappService.isConfigured(),
        enabled: settings.whatsapp_enabled !== 'false',
        hasPhoneNumberId: Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID),
        hasAccessToken: Boolean(process.env.WHATSAPP_ACCESS_TOKEN)
      },
      sms: {
        configured: smsService.isConfigured(),
        enabled: settings.sms_enabled !== 'false',
        provider: (process.env.SMS_PROVIDER || 'fast2sms').toLowerCase(),
        senderId: settings.sms_sender_id || 'ECOCYC',
        hasApiKey: Boolean(process.env.SMS_API_KEY || process.env.FAST2SMS_API_KEY || process.env.MSG91_AUTH_KEY)
      },
      inApp: {
        configured: true,
        enabled: settings.in_app_enabled !== 'false'
      },
      dryRunMode: settings.dry_run_mode === 'true'
    };
  }
}

module.exports = new NotificationService();
