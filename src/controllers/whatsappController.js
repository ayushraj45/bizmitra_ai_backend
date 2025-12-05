import axios from 'axios';
import { models } from '../db.js';


   async function getSignupUrl(req, res) {
    try {
      const { redirect_uri } = req.body;
      const businessId = req.businessId;

      if (!redirect_uri) {
        return res.status(400).json({ error: 'Redirect URI is required' });
      }

      // Generate the embedded signup URL
      // Try the official embedded signup first, then fallback to manual flow
      const signupUrl = 
        `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${process.env.META_APP_ID}&` +
        `redirect_uri=${encodeURIComponent(redirect_uri)}&` +
        `state=${encodeURIComponent(req.headers.authorization.split(' ')[1])}&` +
        `response_type=code&` +
        `scope=whatsapp_business_management,whatsapp_business_messaging&` +
        `config_id=${process.env.META_CONFIG_ID || ''}`;

      res.json({ signup_url: signupUrl });

    } catch (error) {
      console.error('Error generating signup URL:', error);
      res.status(500).json({ error: 'Failed to generate signup URL' });
    }
  }
  
   async function handleEmbeddedSignupCallback(req, res) {
     try {
      const { code } = req.body;
      const businessId = req.businessId; // From authenticateToken middleware

      if (!code) {
        return res.status(400).json({ error: 'Authorization code is required' });
      }

      // Step 1: Exchange code for access token
      const tokenResponse = await axios.post('https://graph.facebook.com/v18.0/oauth/access_token', 
        new URLSearchParams({
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          code: code,
          redirect_uri: `${req.protocol}://${req.get('host')}/whatsapp-callback` // Dynamic redirect URI
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const { access_token } = tokenResponse.data;

      // Step 2: Get WhatsApp Business Account details
      const wabaResponse = await axios.get(`https://graph.facebook.com/v18.0/me/whatsapp_business_accounts`, {
        params: {
          access_token: access_token
        }
      });

      if (!wabaResponse.data.data || wabaResponse.data.data.length === 0) {
        return res.status(400).json({ error: 'No WhatsApp Business Account found' });
      }

      const waba = wabaResponse.data.data[0];
      const wabaId = waba.id;

      // Step 3: Get phone number ID
      const phoneResponse = await axios.get(`https://graph.facebook.com/v18.0/${wabaId}/phone_numbers`, {
        params: {
          access_token: access_token
        }
      });

      if (!phoneResponse.data.data || phoneResponse.data.data.length === 0) {
        return res.status(400).json({ error: 'No phone number found for WhatsApp Business Account' });
      }

      const phoneData = phoneResponse.data.data[0];
      const phoneNumberId = phoneData.id;
      const whatsappPhoneNumber = phoneData.display_phone_number;

      // Step 4: Update business record
      const business = await models.Business.findByPk(businessId);
      
      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }

      await business.update({
        waba_access_token: access_token,
        waba_id: wabaId,
        phone_number_id: phoneNumberId,
        // You might want to add whatsapp_phone_number field to your model
        // whatsapp_phone_number: whatsappPhoneNumber
      });

      res.json({
        success: true,
        message: 'WhatsApp Business integration completed successfully',
        data: {
          waba_id: wabaId,
          phone_number_id: phoneNumberId,
          whatsapp_phone_number: whatsappPhoneNumber
        }
      });

    } catch (error) {
      console.error('WhatsApp embedded signup error:', error.response?.data || error.message);
      
      if (error.response?.data?.error) {
        return res.status(400).json({ 
          error: error.response.data.error.message || 'Facebook API error' 
        });
      }

      res.status(500).json({ 
        error: 'Internal server error during WhatsApp integration' 
      });
    }
}

   async function getSignupStatus(req, res) {
 try {
      const businessId = req.businessId;

      const business = await models.Business.findByPk(businessId);
      
      if (!business) {
        return res.status(404).json({ error: 'Business not found' });
      }

      const hasWhatsAppIntegration = !!(business.waba_access_token && business.waba_id && business.phone_number_id);

      res.json({
        hasWhatsAppIntegration,
        integration_details: hasWhatsAppIntegration ? {
          waba_id: business.waba_id,
          phone_number_id: business.phone_number_id,
          // Don't send the access token to frontend for security
        } : null
      });

    } catch (error) {
      console.error('Error checking WhatsApp signup status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  


export default { handleEmbeddedSignupCallback, getSignupStatus, getSignupUrl };