import { hash, compare } from 'bcrypt';
import { models } from '../db.js';
import crypto from 'crypto';
import businessProfileService from './businessProfileService.js';
import { subscribeToWebhooks, registerBusinessPhoneNumber, syncWABusinessAppContacts, syncWABusinessAppHistory, getBizPhoneNumer } from '../controllers/businessOnboardController.js';

async function createBusiness(data) {
  const { name, email, phone_number, business_type, password, timezone, affiliate_source } = data;

  const password_hash = await hash(password, 10);

  const business = await models.Business.create({
    name,
    email,
    phone_number,
    business_type,
    password_hash,
    timezone: timezone || 'Asia/Kolkata',
    affiliate_source
  });

  if (!business) throw new Error('Business creation failed');

  await businessProfileService.createProfile({
    business_id: business.id,
    name: business.name,
    email: business.email,
    phone_number: business.phone_number,
    timezone: business.timezone,
    service: [{ "Service Name": "Price" }],
    hours_of_operation: ''
  });

  return business;
}

async function updateAPIUsageForBusiness(businessId) {
  try {
    const business = await models.Business.findByPk(businessId);
    if (business) {
      business.api_key_usage_count += 1;
      business.api_key_last_used_at = new Date();
      await business.save();
    }
  } catch (error) {
    console.error('Error updating API usage:', error);
  }
}

async function createAPIKeyForBusiness(businessId) {
  const apiKey = 'bm_' + crypto.randomBytes(32).toString('hex');
  await models.Business.update({
    api_key: apiKey,
    api_key_created_at: new Date(),
    api_key_usage_count: 0
  }, {
    where: { id: businessId }
  });
  return apiKey;
}

async function findBusinessByApiKey(apiKey) {
  return await models.Business.findOne({ where: { api_key: apiKey } });
}

async function findOrCreateClientForChat(data) {
  const { business_id, name, email, phone_number } = data;
  
  const [client, created] = await models.BClient.findOrCreate({
    where: { business_id, phone_number },
    defaults: { name, email, last_interaction_at: new Date() }
  });

  if (!created && (client.name !== name || client.email !== email)) {
    await client.update({ name, email, last_interaction_at: new Date() });
  }

  return client;
}

async function getWABAId(businessId) {
  const business = await models.Business.findByPk(businessId);
  if (!business) throw new Error('Business not found');
  return business.waba_id;
}

async function getAllBusinesses() {
  return await models.Business.findAll();
}

async function getBusinessById(id) {
  return await models.Business.findByPk(id);
}

async function getAllBusinessesForAffiliateSource(affiliate_source) {
  return await models.Business.findAll({ where: { affiliate_source } });
}

// Refactored Helper for updateWithMeta
async function handleMetaSync(business, data) {
  if (!data.existence) {
    // New Signup Flow
    const successSub = await subscribeToWebhooks(business);
    if (!successSub) console.error(`Failed webhook subscription: ${business.id}`);

    const successReg = await registerBusinessPhoneNumber(business);
    if (!successReg) console.error(`Failed phone registration: ${business.id}`);
  } else {
    // Existing Business Sync Flow
    console.log("Processing Business Signup Sync");
    const successSub = await subscribeToWebhooks(business);
    if (successSub) console.log(`Subscribed to webhooks: ${business.id}`);
    
    const bizWithPhoneNumber = await getBizPhoneNumer(business);
    if(bizWithPhoneNumber) {
        await syncWABusinessAppContacts(bizWithPhoneNumber);
        await syncWABusinessAppHistory(bizWithPhoneNumber);
        console.log(`Sync initiated for: ${business.id}`);
    }
  }
}

async function updateWithMeta(id, data) {
  const business = await models.Business.findByPk(id);
  if (!business) return null;

  console.log('Updating business with Meta data:', data);

  const updateData = {
    waba_id: data.waba_id,
    phone_number_id: data.phone_number_id,
    customer_business_id: data.customer_business_id,
  };

  const updatedBiz = await business.update(updateData);
  
  if (updatedBiz) {
     // Run async without blocking response, or await if consistency is critical. 
     // Usually better to await to catch errors unless it's a very long process.
     await handleMetaSync(updatedBiz, data);
  }

  return updatedBiz;
}

async function updateBusiness(id, data) {
  const business = await models.Business.findByPk(id);
  if (!business) return null;

  if (data.password) {
    data.password_hash = await hash(data.password, 10);
    delete data.password;
  }

  await business.update(data);
  return business;
}

async function deleteBusiness(id) {
  return await models.Business.destroy({ where: { id } });
}

async function getBusinessByWabaId(waba_id) {
  return await models.Business.findOne({ where: { waba_id } });
}

async function getBusinessByEmailAndPassword(email, password) {
  const business = await models.Business.findOne({ where: { email } });
  if (!business) return null;
  const isMatch = await compare(password, business.password_hash);
  return isMatch ? business : null;
}

async function getConnectionStatusForBusiness(businessId) {
  const business = await models.Business.findByPk(businessId);
  if (!business) throw new Error('Business not found');
  return {
    WAConnection: !!business.waba_access_token,
    GoogleConnection: !!business.gcal_refresh_token
  };
}

export default {
  createBusiness,
  getAllBusinesses,
  getBusinessById,
  updateBusiness,
  deleteBusiness,
  findBusinessByApiKey,
  findOrCreateClientForChat,
  getBusinessByWabaId,
  getBusinessByEmailAndPassword,
  getWABAId,
  createAPIKeyForBusiness,
  updateWithMeta,
  updateAPIUsageForBusiness,
  getConnectionStatusForBusiness,
  getAllBusinessesForAffiliateSource
};