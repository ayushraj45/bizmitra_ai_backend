// controllers/businessController.js
import BusinessService from '../services/businessService.js';
import jwt from 'jsonwebtoken'; // Importing JWT for token generation

const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecret'; // Use environment variable or default value

function signToken(business) {
  return jwt.sign(
    { businessId: business.id }, // only include what you need
    JWT_SECRET,
    { expiresIn: '1d' }
  );
}

/**
 * Registers a new business.
 */
async function registerBusiness(req, res) {
  try {
    const { name, email, password, phone_number, business_type, timezone } = req.body;
    if (!name || !email || !password || !phone_number || !business_type || !timezone ) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const business = await BusinessService.createBusiness(req.body);
    if (!business) {
      return res.status(401).json({ error: 'Something went wrong, please try again' });
    }

    const token = signToken(business);
    res.status(200).json({ token }); // ✅ Return token
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

/**
 * Authenticates a business by email and password.
 */
async function authenticateBusiness(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const business = await BusinessService.getBusinessByEmailAndPassword(email, password);
    if (!business) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken(business);
    res.status(200).json({ token }); // ✅ Return token
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

/**
 * Retrieves all businesses.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function getBusinesses(req, res) {
  try {
    const businesses = await BusinessService.getAllBusinesses();
    res.status(200).json({ businesses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

/**
 * Retrieves a single business by ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function getBusiness(req, res) {
  try {
    const businessId = req.businessId;
    const business = await BusinessService.getBusinessById(businessId);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.status(200).json(business);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

async function getConnectionStatus(req, res) {
  try {
    const businessId = req.businessId;
    const status = await BusinessService.getConnectionStatusForBusiness(businessId);
    res.status(200).json({ WAConnection: status.WAConnection, GoogleConnection: status.GoogleConnection });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
} 

async function createApiKey(req, res) {
  console.log('Creating API key request received');
  try {
    const businessId = await req.businessId;
    const business = await BusinessService.getBusinessById(businessId);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    const apiKey = await BusinessService.createAPIKeyForBusiness(businessId);
    res.status(200).json({ apiKey } );
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

/** Onboard a business here */
async function updateWithMeta(req, res) {
  try {
    const businessId = req.businessId;
    const business = await BusinessService.updateWithMeta(businessId, req.body);
    if (!business) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.status(200).json(business);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

async function onboardBusiness(req, res) {
    
}

/**
 * Updates an existing business.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function updateBusiness(req, res) {
  try {
    const { id } = req.params;
    const updatedBusiness = await BusinessService.updateBusiness(id, req.body);
    if (!updatedBusiness) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.status(200).json({ business: updatedBusiness });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

/**
 * Deletes a business by ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
async function deleteBusiness(req, res) {
  try {
    const { id } = req.params;
    const deletedRows = await BusinessService.deleteBusiness(id);
    if (deletedRows === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.status(204).send(); // No content for successful deletion
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
}

async function getAffiliateBusinesses(req, res) {
  try {
    const { affiliate_source } = req.params;  
    const businesses = await BusinessService.getAllBusinessesForAffiliateSource(affiliate_source);
    res.status(200).json({ businesses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  } 
}


export default {
  registerBusiness,
  getBusinesses,
  getBusiness,
  updateBusiness,
  deleteBusiness,
  authenticateBusiness,
  onboardBusiness,
  updateWithMeta,
  createApiKey,
  getConnectionStatus,
  getAffiliateBusinesses
};
