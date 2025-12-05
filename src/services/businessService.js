import { hash, compare } from 'bcrypt';
import { models } from '../db.js';
import crypto from 'crypto';
import businessProfileService from './businessProfileService.js';
import { subscribeToWebhooks, registerBusinessPhoneNumber, syncWABusinessAppContacts, syncWABusinessAppHistory, getBizPhoneNumer } from '../controllers/businessOnboardController.js';
import { error } from 'console';

async function createBusiness(data) {
  console.log('Creating business with data:', data);
  const {
    name,
    email,
    phone_number,
    business_type,
    password,
    timezone,
    affiliate_source
  } = data;

  const password_hash = await hash(password, 10);

  const business = await models.Business.create({
    name,
    email,
    phone_number,
    business_type,
    password_hash,
    timezone:'Asia/Kolkata',
    affiliate_source
  });

  if(!business) {
    throw new Error('Business creation failed ', error);
  }

  const profile = await businessProfileService.createProfile({
    business_id: business.id,
    name: business.name,
    email: business.email,
    phone_number: business.phone_number,
    timezone: business.timezone,
    service:[{"Replace with service name":"Replace with price"}],
    hours_of_operation: ''
  });

  if(!profile) {
    throw new Error('Business profile creation failed ', error);
  }

  return business;
}

function updateAPIUsageForBusiness(businessId) {
  (async () => {
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
  })();
}

async function createAPIKeyForBusiness(businessId) {
  console.log('Creating API key for business:', businessId);
  const apiKey = 'bm_' + crypto.randomBytes(32).toString('hex');
  const apiKeyCreatedAt = new Date();   
  await models.Business.update({
    api_key: apiKey,
    api_key_created_at: apiKeyCreatedAt,
    api_key_usage_count: 0
  }, {
    where: { id: businessId }
  });

  return apiKey;  
}

async function findBusinessByApiKey(apiKey) {
  return await models.Business.findOne({
    where: {
      api_key: apiKey,
    }
  });
}

async function findOrCreateClientForChat(data) {
  const { business_id, name, email, phone_number } = data;
  
  const [client, created] = await models.BClient.findOrCreate({
    where: {
      business_id,
      phone_number,
    },
    defaults: {
      name,
      email,
      last_interaction_at: new Date()
    }
  });

  if (!created && (client.name !== name || client.email !== email)) {
    // Update existing client info if it has changed
    await client.update({
      name,
      email,
      last_interaction_at: new Date()
    });
  }

  return client;
}

async function getWABAId(businessId) {
  try {
    const business = await models.Business.findByPk(businessId);
    if (!business) {
      throw new Error('Business not found');
    }
    return business.waba_id; // Assuming waba_id is a field in the Business model
  } catch (error) {
    console.error('Error fetching WABA ID:', error);
    throw error;
  }
}

async function getAllBusinesses() {
  const businesses = await models.Business.findAll();
  return businesses;
}

async function getBusinessById(id) {
  const business = await models.Business.findByPk(id);
  return business;
}

async function getAllBusinessesForAffiliateSource(affiliate_source) {
  const businesses = await models.Business.findAll({
    where: { affiliate_source }
  });
  return businesses;
}

async function updateWithMeta(id, data) {
  const business = await models.Business.findByPk(id);
  if (!business) {
    return null;
  }

  console.log('Updating business with data:', data);

  const updateData = {
    waba_id: data.waba_id,
    phone_number_id: data.phone_number_id,
    customer_business_id: data.customer_business_id, // Map business_id to customer_business_id
  };

  const updatedBiz = await business.update(updateData);
if(updatedBiz){
  if(!data.existence){
      const success = await subscribeToWebhooks(updatedBiz);
    if (!success) { 
      console.error('Failed to subscribe to webhooks for business:', id);
    } 

    const successReg = await registerBusinessPhoneNumber(updatedBiz);
    if (!successReg) {  
      console.error('Failed to register phone number for business:', id);
    }
  }
else{
  console.log("we got Business signup")
    const success = await subscribeToWebhooks(updatedBiz);
      if (!success) { 
        console.error('Failed to subscribe to webhooks for business:', id);
      } 
      else {
        console.log('Successfully subscribed to webhooks for business:', id);

      }
    const bizWithPhoneNumber = await getBizPhoneNumer(updatedBiz);
    const contactSync = await syncWABusinessAppContacts(bizWithPhoneNumber);
      if (!contactSync) {  
        console.error('Failed to sync contacts for business:', id);
      }
    const historySync = await syncWABusinessAppHistory(bizWithPhoneNumber);
      if (!historySync) {  
        console.error('Failed to sync history for business:', id);
      }
    console.log('Contact and History sync initiated for business:', id);
  }
}
 
  return business;
}



async function updateBusiness(id, data) {
  const business = await models.Business.findByPk(id);
  if (!business) {
    return null;
  }

  // If password is provided, hash it before updating
  if (data.password) {
    data.password_hash = await hash(data.password, 10);
    delete data.password; // Remove plain password from data
  }

  await business.update(data);
  return business;
}

async function deleteBusiness(id) {
  const deletedRows = await models.Business.destroy({
    where: { id }
  });
  return deletedRows;
}

async function getBusinessByWabaId(waba_id) {
try {
  const business = await models.Business.findOne({ where: { waba_id } });
  return business;
} catch (err) {
  console.error("Failed to find business by waba_id:", err);
  throw err;
}
}

async function getBusinessByEmailAndPassword(email, password) {
  const business = await models.Business.findOne({ where: { email } });
  if (!business) return null;
  const isMatch = await compare(password, business.password_hash);
  if (!isMatch) return null;
  return business;
}

async function getConnectionStatusForBusiness(businessId) {
  try {
    const business = await models.Business.findByPk(businessId);
    if (!business) {
      throw new Error('Business not found');
    }
    const status = {
      WAConnection: !!business.waba_access_token,
      GoogleConnection: !!business.gcal_refresh_token
    };
    return status;

  } catch (err) {
    console.error("Failed to find business:", err);
    throw err;
  }
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
