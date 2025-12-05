import axios from "axios";
import  {load} from "cheerio";
import { models } from "../db.js";
import { businessDetailsFromWebsite } from "../ai/responsesService.js";
import generateSystemPrompt from "../utils/generateSystemPrompt.js";

async function createProfile(data) {
  return await models.BusinessProfile.create(data);
}

async function updateProfile(id, data) {
  const profile = await models.BusinessProfile.findByPk(id);
  if (!profile) throw new Error('Profile not found');
  return await profile.update(data);
}

async function getProfileByBusinessId(business_id) {
  let profile = await models.BusinessProfile.findOne({ where: { business_id } });

  if (!profile) {
    profile = await createDummyBusinessProfile(business_id);
    console.log('business profile created')
  }

  return profile;
}


async function createDummyBusinessProfile(businessId) {
  const profileData = {
    business_id: businessId,
    tone: "friendly, professional",
    services: [
      { name: "WhatsApp AI Assistant Setup", price: 49 },
      { name: "Smart Appointment Scheduling", price: 29 },
      { name: "Automated CRM & Follow-ups", price: 39 }
    ],
    about: "WABA-AI provides AI-powered WhatsApp assistants for freelancers and small businesses. The assistant helps automate conversations, booking, and CRM.",
    instructions: "Always answer client questions clearly. Offer to help schedule appointments or explain services when relevant.",
    notes: "This is a dummy profile for testing purposes. Based in Glasgow. Works with solo service providers like therapists, coaches, and trainers.",
  };

  profileData.system_prompt = generateSystemPrompt('waba', profileData);

  const profile = await models.BusinessProfile.create(profileData);
  return profile;
}

async function scrapeWebsiteText(url) {
  try {
    // Fetch the HTML content
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000 // 10 second timeout
    });


    // Load HTML into cheerio
    const $ = load(response.data);

    // Remove script, style, and other non-content elements
    $('script, style, nav, footer, header, iframe, noscript').remove();

    // Extract text from body
    const text = $('body').text();

    // Clean up the text: remove extra whitespace and newlines
    const cleanedText = text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .trim();

    
    const information = await businessDetailsFromWebsite(cleanedText);

    return information;

  } catch (error) {
    throw new Error(`Failed to scrape ${url}: ${error.message}`);
  }
}


export default {
  createProfile,
  updateProfile,
  getProfileByBusinessId,
  scrapeWebsiteText
};
