import axios from 'axios';
import businessService from '../services/businessService.js';

// Helper for Meta Graph API calls
const graphApi = axios.create({
  baseURL: `https://graph.facebook.com/${process.env.API_VERSION || 'v18.0'}`,
});

export async function exchangeTokenForBusinessToken(req, res) {
  try {
    const { waba_access_code } = req.body;
    console.log('Exchanging code for token:', waba_access_code);

    const response = await graphApi.get('/oauth/access_token', {
      params: {
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        code: waba_access_code
      }
    });

    const { access_token } = response.data;
    const businessId = req.businessId;

    const business = await businessService.updateBusiness(businessId, { waba_access_token: access_token });
    if (!business) throw new Error('Business not found');

    return access_token;
  } catch (error) {
    console.error('Error exchanging token:', error.response?.data || error.message);
    throw error;
  }
}

export async function subscribeToWebhooks(business) {
  try {
    const response = await graphApi.post(`/${business.waba_id}/subscribed_apps`, {}, {
      headers: { Authorization: `Bearer ${business.waba_access_token}` }
    });
    return response.data.success;
  } catch (error) {
    console.error('Webhook subscription failed:', error.response?.data || error.message);
    return false;
  }
}

export async function getBizPhoneNumer(business) {
  try {
    const response = await graphApi.get(`/${business.waba_id}/phone_numbers`, {
      headers: { Authorization: `Bearer ${business.waba_access_token}` }
    });

    if (response.data?.data?.length > 0) {
      const phoneNumberId = response.data.data[0].id;
      return await businessService.updateBusiness(business.id, { phone_number_id: phoneNumberId });
    }
    return business;
  } catch (error) {
    console.error('Fetch phone numbers failed:', error.response?.data || error.message);
    return null;
  }
}

export async function syncWABusinessAppContacts(business) {
  try {
    const response = await graphApi.post(`/${business.phone_number_id}/smb_app_data`, {
      messaging_product: 'whatsapp',
      sync_type: 'smb_app_state_sync'
    }, {
      headers: { Authorization: `Bearer ${business.waba_access_token}` }
    });
    return response.data.request_id || true;
  } catch (error) {
    console.error('Contact sync failed:', error.response?.data || error.message);
    return false;
  }
}

export async function syncWABusinessAppHistory(business) {
  try {
    const response = await graphApi.post(`/${business.phone_number_id}/smb_app_data`, {
      messaging_product: 'whatsapp',
      sync_type: 'history'
    }, {
      headers: { Authorization: `Bearer ${business.waba_access_token}` }
    });
    return response.data.request_id || true;
  } catch (error) {
    console.error('History sync failed:', error.response?.data || error.message);
    return false;
  }
}

export async function registerBusinessPhoneNumber(business) {
  const pin = business.phone_number_id.slice(-6);
  try {
    const response = await graphApi.post(`/${business.phone_number_id}/register`, {
      messaging_product: 'whatsapp',
      pin: pin
    }, {
      headers: { Authorization: `Bearer ${business.waba_access_token}` }
    });
    return response.data.success;
  } catch (error) {
    console.error('Register phone failed:', error.response?.data || error.message);
    return false;
  }
}