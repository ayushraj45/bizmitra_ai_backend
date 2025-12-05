import messageService from "../services/messageService.js";
import businessService from "../services/businessService.js";
import bclientService from "../services/bclientService.js";

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'waba_ai_verify';

const handleVerification = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
};

async function handleIncoming(req, res) {
  console.log('Received WhatsApp message:', req.body);
  res.sendStatus(200);
}

async function handleWebhook(req, res) {
  try {
    const { object, entry } = req.body;
    if (object === 'whatsapp_business_account' && entry) {
      for (const ent of entry) {
        for (const change of ent.changes) {
          await processChange(req.body, change);
        }
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook processing error:', err);
    res.sendStatus(500);
  }
}

async function processChange(body, change) {
  switch (change.field) {
    case 'messages':
      await messageService.processIncomingMessage(body);
      break;
    case 'smb_app_state_sync':
      await handleSmbAppStateSyncWebhook(body);
      break;
    case 'history':
      await handleHistoryWebhook(body);
      break;
    default:
      console.log('Unhandled webhook field:', change.field);
  }
}

async function handleHistoryWebhook(payload) {
  if (!payload?.entry) return;

  for (const entry of payload.entry) {
    if (!entry.changes) continue;
    
    const business = await businessService.getBusinessByWabaId(entry.id);
    if (!business) continue;

    for (const change of entry.changes) {
      const history = change.value?.history;
      if (!history) continue;

      for (const item of history) {
        if (!item.threads) continue;
        for (const thread of item.threads) {
          if (!thread.messages) continue;
          
          for (const msg of thread.messages) {
            const phoneNumber = msg.to || thread.id;
            if (phoneNumber) {
               await safeCreateClient(phoneNumber, '', business.id);
            }
          }
        }
      }
    }
  }
}

async function handleSmbAppStateSyncWebhook(payload) {
  if (!payload?.entry) return;

  for (const entry of payload.entry) {
    if (!entry.changes) continue;
    
    const business = await businessService.getBusinessByWabaId(entry.id);
    if (!business) continue;

    for (const change of entry.changes) {
      const stateSync = change.value?.state_sync;
      if (!stateSync) continue;

      for (const item of stateSync) {
        if (item.type === 'contact' && item.contact?.phone_number) {
          await safeCreateClient(item.contact.phone_number, item.contact.full_name, business.id);
        }
      }
    }
  }
}

async function safeCreateClient(phoneNumber, name, businessId) {
  try {
    await bclientService.createBClient({
      phone_number: phoneNumber,
      name: name || '',
      business_id: businessId
    });
  } catch (err) {
    console.error(`Failed to create client ${phoneNumber}:`, err.message);
  }
}

export default { handleIncoming, handleVerification, handleWebhook };