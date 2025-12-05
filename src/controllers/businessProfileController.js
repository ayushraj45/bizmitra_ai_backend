import { models } from '../db.js';
import businessProfileService from '../services/businessProfileService.js';

/**
 * Registers a new business.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */

async function createProfile(req, res) {
  try {
    const profile = await businessProfileService.createProfile(req.body);
    res.status(201).json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateProfile(req, res) {
  try {
    const { id } = req.params;
    const profile = await businessProfileService.updateProfile(id, req.body);
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getProfile(req, res) {
  try {
    const businessId = req.businessId;
    const profile = await businessProfileService.getProfileByBusinessId(businessId);
    res.status(200).json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function addFromWebsite(req, res) {
  try {
    const businessId = req.businessId;
    const { url } = req.body;
    const profile = await businessProfileService.getProfileByBusinessId(businessId);
    if (!profile) {
      throw new Error('No Profile already exists for this business');
    }
    if (!profile.website) {
      await models.BusinessProfile.update(
        { website: url },
        { where: { id: profile.id } }
      );
    }
    const response = await businessProfileService.scrapeWebsiteText(url);
    res.status(200).json({ content: response }); 
  } catch (err) {
    res.status(500).send(err.message);
  }
}

  

export default{
  createProfile,
  updateProfile,
  getProfile,
  addFromWebsite
};
