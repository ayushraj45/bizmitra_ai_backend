import BusinessService from '../services/businessService.js';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecret';

function signToken(business) {
  return jwt.sign(
    { businessId: business.id },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
}

const registerBusiness = asyncHandler(async (req, res) => {
  const { name, email, password, phone_number, business_type, timezone } = req.body;
  if (!name || !email || !password || !phone_number || !business_type || !timezone) {
    res.status(400);
    throw new Error('All fields are required');
  }

  const business = await BusinessService.createBusiness(req.body);
  const token = signToken(business);
  res.status(200).json({ token });
});

const authenticateBusiness = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const business = await BusinessService.getBusinessByEmailAndPassword(email, password);
  if (!business) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  const token = signToken(business);
  res.status(200).json({ token });
});

const getBusinesses = asyncHandler(async (req, res) => {
  const businesses = await BusinessService.getAllBusinesses();
  res.status(200).json({ businesses });
});

const getBusiness = asyncHandler(async (req, res) => {
  const businessId = req.businessId;
  const business = await BusinessService.getBusinessById(businessId);
  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }
  res.status(200).json(business);
});

const getConnectionStatus = asyncHandler(async (req, res) => {
  const businessId = req.businessId;
  const status = await BusinessService.getConnectionStatusForBusiness(businessId);
  res.status(200).json(status);
});

const createApiKey = asyncHandler(async (req, res) => {
  const businessId = req.businessId;
  const business = await BusinessService.getBusinessById(businessId);
  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }
  const apiKey = await BusinessService.createAPIKeyForBusiness(businessId);
  res.status(200).json({ apiKey });
});

const updateWithMeta = asyncHandler(async (req, res) => {
  const businessId = req.businessId;
  const business = await BusinessService.updateWithMeta(businessId, req.body);
  if (!business) {
    res.status(404);
    throw new Error('Business not found');
  }
  res.status(200).json(business);
});

const updateBusiness = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updatedBusiness = await BusinessService.updateBusiness(id, req.body);
  if (!updatedBusiness) {
    res.status(404);
    throw new Error('Business not found');
  }
  res.status(200).json({ business: updatedBusiness });
});

const deleteBusiness = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deletedRows = await BusinessService.deleteBusiness(id);
  if (deletedRows === 0) {
    res.status(404);
    throw new Error('Business not found');
  }
  res.status(204).send();
});

const getAffiliateBusinesses = asyncHandler(async (req, res) => {
  const { affiliate_source } = req.params;
  const businesses = await BusinessService.getAllBusinessesForAffiliateSource(affiliate_source);
  res.status(200).json({ businesses });
});

// Placeholder
const onboardBusiness = asyncHandler(async (req, res) => {
  res.status(501).json({ message: "Not implemented" });
});

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