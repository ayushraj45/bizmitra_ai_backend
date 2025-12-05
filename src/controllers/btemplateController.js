// controllers/btemplateController.js
import templateService from '../services/btemplateService.js';

const createBTemplate = async (req, res) => {
  try {
    console.log('Creating BTemplate with data:', req.body);
    const businessId = req.businessId; // Comes from token via middleware
    const template = await templateService.createWhatsAppTemplate(businessId, req.body);
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getBTemplates = async (req, res) => {
  try {
    const businessId = req.businessId; // Comes from token via middleware
    const templates = await templateService.getTemplates(businessId);
    res.status(200).json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 

const getBTemplate = async (req, res) => {
  try {
    const template = await templateService.getTemplate(req.params.id);
    if (!template) return res.status(404).json({ error: 'Not found' });
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateBTemplate = async (req, res) => {
  try {
    const updated = await templateService.updateTemplate(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteBTemplate = async (req, res) => {
  try {
    const deleted = await templateService.deleteTemplate(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export default {
  createBTemplate,
  getBTemplates,
  getBTemplate,
  updateBTemplate,
  deleteBTemplate
};
