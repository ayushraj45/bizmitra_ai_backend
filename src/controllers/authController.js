import { google } from 'googleapis';
import dotenv from 'dotenv';
import businessService from '../services/businessService.js';
dotenv.config();

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLEAPI_CLIENT_ID,
  process.env.GOOGLEAPI_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

export default {
  startGoogleOAuth(req, res) {
    console.log('Starting Google OAuth - Business ID from token:', req.businessId);
    // Generate the url that will be used for the consent dialog.
    
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar']
    });
    res.redirect(authUrl);
    return authUrl;
  },

  async handleGoogleCallback(req, res) {
    console.log('Callback method was called - Business ID from token:', req.businessId);
    const { code , state} = req.query;
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    const businessId = state;

    console.log('Business ID from state parameter:', businessId);

    if (!businessId) {
      return res.status(400).json({ error: 'Business ID is required in state parameter' });
    }
    const buziness = await businessService.updateBusiness(businessId, { gcal_refresh_token: tokens.refresh_token });

    console.log('Business updated with Google refresh token:', buziness);

    if (!buziness) {
      return res.status(404).json({ error: 'Business not found' });
    }
    // Store tokens somewhere safe (DB, encrypted)
    console.log('Tokens:', tokens);
    res.send('Google Calendar connected!');
  }
};
