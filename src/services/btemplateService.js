import { language } from "googleapis/build/src/apis/language/index.js";
import { models } from "../db.js";
import businessService from "./businessService.js";


const createTemplate = async (data) => {
  return await models.BTemplate.create(data);
};

const getTemplates = async (business_id) => {
  return await models.BTemplate.findAll({ where: { business_id } });
};

const getTemplate = async (id) => {
  return await models.BTemplate.findByPk(id);
};

const updateTemplate = async (id, data) => {
  const template = await models.BTemplate.findByPk(id);
  if (!template) return null;
  return await template.update(data);
};

const deleteTemplate = async (id) => {
  const template = await models.BTemplate.findByPk(id);
  if (!template) return null;
  return await template.destroy();
};

async function createWhatsAppTemplate(businessId, templateData) {

  console.log('Creating WhatsApp template with data:', templateData);
// const templateData = {
//   "name": "template_test1",
//   "language": "en_US",
//   "category": "UTILITY", // or TRANSACTIONAL, OTP
//   "components": [
//       {
//     "type": "BODY",
//     "text": "Your appointment with {{1}} for the service {{2}} is confirmed for tomorrow! Please respond to this chat if you want to amend your booking. Thank you for being a customer!",
//     "example": {
//       "body_text": [
//         [
//           "Break The Wall Agency","Website creation"
//         ]
//       ]
//     }
//   }
//   ]
// }

  

  const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
  const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID; 
  const WABA_BIZ_ID= await businessService.getWABAId(businessId);
  const WHATSAPP_API_URL = `https://graph.facebook.com/v19.0/${WABA_BIZ_ID}/message_templates`;

  try {
    const response = await fetch(WHATSAPP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(templateData)
    });

    const result = await response.json();

    console.log('returned from graph about the template: ', result);

    if (response.ok) {
      console.log('Template submitted:', result);

      const created = await createTemplate({
        template_id: result.id,
        status: result.status,
        business_id: businessId,
        category: result.category,
        name: templateData.name,
        language: templateData.language,
        components: templateData.components,
      })

      return result;
    } else {
      console.error('Error creating template:', result);
      return result;
    }
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

export default {
  createTemplate,
  getTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate,
  createWhatsAppTemplate
};
