import fetch from 'node-fetch';
import dotenv from 'dotenv';
import businessService from '../services/businessService.js';
dotenv.config();

/**
 * Step 1: Exchange token code for business access token
 * @param {string} code - The authorization code from Embedded Signup
 * @returns {Promise<string>} Business access token
 */
export async function exchangeTokenForBusinessToken(req, res) {

    console.log('Exchanging code for business token:', req.body.waba_access_code);
  try {
    const url = new URL(`https://graph.facebook.com/${process.env.API_VERSION}/oauth/access_token`);
    url.searchParams.append('client_id', process.env.META_APP_ID);
    url.searchParams.append('client_secret', process.env.META_APP_SECRET);
    url.searchParams.append('code', req.body.waba_access_code);

    const response = await fetch(url, {
      method: 'GET'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token exchange failed: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Exchanged token data:', data);

    console.log('Business ID from request:', req.businessId); 

    const id  = req.businessId;
    const business = await businessService.updateBusiness(id, { waba_access_token: data.access_token });

    if (!business) {
      throw new Error('Business not found for updating access token');
    }

    return data.access_token;

  } catch (error) {
    console.error('Error exchanging token:', error);
    throw error;
  }
}

/**
 * Step 2: Subscribe app to webhooks for the business WABA
 * @param {Object} business - Business entity with waba_id and waba_access_token
 * @returns {Promise<boolean>} Success status
 */
export async function subscribeToWebhooks(business) {
  try {
    const url = `https://graph.facebook.com/${process.env.API_VERSION}/${business.waba_id}/subscribed_apps`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${business.waba_access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Webhook subscription failed: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Webhook subscription response:', data);
    return data.success;
  } catch (error) {
    console.error('Error subscribing to webhooks:', error);
    throw error;
  }
}

export async function getBizPhoneNumer(business) {
  if(business){
    console.log('Getting phone numbers for business:', business.id);
  
    const url = `https://graph.facebook.com/${process.env.API_VERSION}/${business.waba_id}/phone_numbers`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${business.waba_access_token}`,
            }
    });

    console.log('Phone numbers if from response:', response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Fetching phone numbers failed: ${error.error?.message || response.statusText}`);
    }
    const data = await response.json();
    console.log('Fetched phone numbers data:', data);
    if(data && data.data && data.data.length > 0){
      const phoneNumberId = data.data[0].id;
      console.log('Updating business with phone number ID:', phoneNumberId);
      const updatedBusiness = await businessService.updateBusiness(business.id, { phone_number_id: phoneNumberId });
      return updatedBusiness;
    }
}
else console.log("Business is undefined");

}

export async function syncWABusinessAppContacts(business) {
  try {
    const url = `https://graph.facebook.com/${process.env.API_VERSION}/${business.phone_number_id}/smb_app_data`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${business.waba_access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        sync_type: 'smb_app_state_sync'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Contacts sync failed: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Contacts sync response:', data);
    return data.request_id || true; // Return request_id if present for support tracking
  } catch (error) {
    console.error('Error syncing WhatsApp contacts:', error);
    throw error;
  }
}

export async function syncWABusinessAppHistory(business) {
  try {
    const url = `https://graph.facebook.com/${process.env.API_VERSION}/${business.phone_number_id}/smb_app_data`;
    console.log("Syncing history for business:", business.id);
    console.log("Using URL:", url);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${business.waba_access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        sync_type: 'history'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`History sync failed: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('History sync response:', data);
    return data.request_id || true; // For support traceability
  } catch (error) {
    console.error('Error syncing WhatsApp message history:', error);
    throw error;
  }
}


/**
 * Step 3: Register business phone number for Cloud API
 * @param {Object} business - Business entity with phone_number_id and waba_access_token
 * @param {string} pin - 6-digit PIN for two-step verification
 * @returns {Promise<boolean>} Success status
 */
export async function registerBusinessPhoneNumber(business) {

  const pin = business.phone_number_id.slice(-6); // Use last 6 digits of phone_number_id as PIN

  try {
    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      throw new Error('PIN must be a 6-digit number');
    }

    const url = `https://graph.facebook.com/${process.env.API_VERSION}/${business.phone_number_id}/register`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${business.waba_access_token}`
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        pin: pin
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Phone number registration failed: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    console.log('Phone number registration response:', data);
    
    return data.success;
  } catch (error) {
    console.error('Error registering phone number:', error);
    throw error;
  }
}

/**
 * Step 4 (Optional): Send test message to verify messaging capabilities
 * @param {Object} business - Business entity with phone_number_id and waba_access_token
 * @param {string} recipientNumber - WhatsApp number to send test message to
 * @param {string} messageText - Text message to send
 * @returns {Promise<Object>} Message response with message ID
 */
export async function sendTestMessage(business, recipientNumber, messageText) {
  try {
    if (messageText.length > 4096) {
      throw new Error('Message text cannot exceed 4096 characters');
    }

    const url = `https://graph.facebook.com/${API_VERSION}/${business.phone_number_id}/messages`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${business.waba_access_token}`
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipientNumber,
        type: 'text',
        text: {
          body: messageText
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Test message failed: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      messageId: data.messages[0]?.id,
      contacts: data.contacts,
      success: true
    };
  } catch (error) {
    console.error('Error sending test message:', error);
    throw error;
  }
}

/**
 * Complete onboarding process for a business customer
 * @param {string} authCode - Authorization code from Embedded Signup
 * @param {Object} business - Business entity with waba_id, phone_number_id
 * @param {string} pin - 6-digit PIN for phone number registration
 * @param {Object} options - Optional parameters
 * @param {string} options.testRecipient - Phone number for test message (optional)
 * @param {string} options.testMessage - Test message text (optional)
 * @returns {Promise<Object>} Onboarding results
 */
export async function completeBusinessOnboarding(authCode, business, pin, options = {}) {
  try {
    console.log('Starting business onboarding process...');
    
    // Step 1: Exchange token code for business token
    // console.log('Step 1: Exchanging authorization code for business token...');
    // const businessToken = await exchangeTokenForBusinessToken(authCode);
    
    // Update business entity with the token
    business.waba_access_token = businessToken;
    
    // Step 2: Subscribe to webhooks
    console.log('Step 2: Subscribing to webhooks...');
    const webhookSuccess = await subscribeToWebhooks(business);
    
    // Step 3: Register phone number
    console.log('Step 3: Registering business phone number...');
    const registrationSuccess = await registerBusinessPhoneNumber(business, pin);
    
    let testResult = null;
    
    // Step 4: Optional test message
    if (options.testRecipient && options.testMessage) {
      console.log('Step 4: Sending test message...');
      testResult = await sendTestMessage(business, options.testRecipient, options.testMessage);
    }
    
    console.log('Business onboarding completed successfully!');
    
    return {
      success: true,
      businessToken,
      webhookSubscribed: webhookSuccess,
      phoneRegistered: registrationSuccess,
      testMessage: testResult,
      nextSteps: [
        'Customer should add payment method in WhatsApp Manager',
        'Customer can now use your app to access WhatsApp assets',
        'Customer can begin sending and receiving messages'
      ]
    };
    
  } catch (error) {
    console.error('Business onboarding failed:', error);
    throw error;
  }
}

/**
 * Helper function to validate business entity structure
 * @param {Object} business - Business entity to validate
 * @returns {boolean} Whether business entity is valid
 */
export function validateBusinessEntity(business) {
  const requiredFields = ['waba_id', 'phone_number_id'];
  const missingFields = requiredFields.filter(field => !business[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Business entity missing required fields: ${missingFields.join(', ')}`);
  }
  
  return true;
}

// Example usage:
/*
import { completeBusinessOnboarding, validateBusinessEntity } from './meta-onboarding.js';

// Your business entity (from your database/system)
const business = {
  waba_id: 'your_waba_id',
  phone_number_id: 'your_phone_number_id', // PIN will be auto-generated from last 6 digits
  waba_access_token: null // Will be set during onboarding
};

// Complete onboarding process
try {
  validateBusinessEntity(business);
  
  const result = await completeBusinessOnboarding(
    'auth_code_from_embedded_signup',
    business,
    {
      testRecipient: '+1234567890', // Optional
      testMessage: 'Hello! Your WhatsApp Business is now set up.' // Optional
    }
  );
  
  console.log('Onboarding result:', result);
  console.log('Generated PIN:', result.pin); // The last 6 digits of phone_number_id
  
  // Save the updated business entity with the access token
  // business.waba_access_token is now populated
  
} catch (error) {
  console.error('Onboarding failed:', error.message);
}
*/