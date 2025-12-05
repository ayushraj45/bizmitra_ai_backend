import { google } from 'googleapis';

// Exchanges authorization code for refresh token
export const handleGoogleAuth = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLEAPI_CLIENT_ID,
      process.env.GOOGLEAPI_CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    // Extract refresh token (this is what you need to store)
    const refreshToken = tokens.refresh_token;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'No refresh token received' });
    }

    // TODO: Store refreshToken for this user in your database
    // Example: await saveUserRefreshToken(userId, refreshToken);
    
    res.status(200).json({ 
      success: true,
      message: 'Google account connected successfully' 
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Failed to authenticate with Google' });
  }
};

// Creates OAuth client using stored refresh token (for calendar operations)
export const createGoogleClient = async (refreshToken) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLEAPI_CLIENT_ID,
    process.env.GOOGLEAPI_CLIENT_SECRET,
    process.env.REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  return oauth2Client;
};