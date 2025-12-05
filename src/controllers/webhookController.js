import messageService from "../services/messageService.js";
import businessService from "../services/businessService.js";
import bclientService from "../services/bclientService.js";
/**
 * Creates a new Thread.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */

const VERIFY_TOKEN = 'waba_ai_verify';

const handleVerification = (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified');
    return res.status(200).send(challenge);
  } else {
    console.warn('Webhook verification failed');
    return res.sendStatus(403);
  }
};

async function handleIncoming(req, res) {
  const message = req.body;
  console.log('Received WhatsApp message:', message);

  // TODO: Add logic to forward to LLM, send reply, store in DB
  res.sendStatus(200);
}

async function handleWebhook(req, res) {
  console.log('Webhook payload:', JSON.stringify(req.body, null, 2));
 try {
 if (req.body.object === 'whatsapp_business_account' && req.body.entry) {
      for (const entry of req.body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            console.log('Processing messages webhook: change');
            messageService.processIncomingMessage(req.body)
              .catch(err => console.error('Async processing error:', err));
          } else if (change.field === 'smb_app_state_sync') {
            handleSmbAppStateSyncWebhook(req.body);
          } else if (change.field === 'history') {
            handleHistoryWebhook(req.body);
          } else {
            console.log('Unhandled webhook field:', change.field);
          }
        }
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.sendStatus(500);
  }
}

async function handleHistoryWebhook(payload){
  
  if (!payload || !Array.isArray(payload.entry)) return;
  for (const entry of payload.entry) {
    if (!entry || !entry.id || !Array.isArray(entry.changes)) continue;
    const business = await businessService.getBusinessByWabaId(entry.id);
    if (!business) continue;
    for (const change of entry.changes) {
      const val = change && change.value;
      if (!val || !Array.isArray(val.history)) continue;
      for (const historyItem of val.history) {
        if (!historyItem || !Array.isArray(historyItem.threads)) continue;
        for (const thread of historyItem.threads) {
          if (!thread || !Array.isArray(thread.messages)) continue;
          for (const msg of thread.messages) {
            try {
              // Defensive: pick phone number to create client for
              const phoneNumber = msg.to || thread.id;
              if (!phoneNumber) continue;
              await bclientService.createBClient({
                phone_number: phoneNumber,
                business_id: business.id
              });
            } catch (err) {
              console.error('Failed to create client for message', msg, err);
              continue;
            }
          }
        }
      }
    }
  }


}

async function handleSmbAppStateSyncWebhook(payload){

  if (!payload || !Array.isArray(payload.entry)) return;
  for (const entry of payload.entry) {
    if (!entry || !entry.id || !Array.isArray(entry.changes)) continue;
    const business = await businessService.getBusinessByWabaId(entry.id);
    if (!business) continue;
    for (const change of entry.changes) {
      const value = change && change.value;
      if (!value || !Array.isArray(value.state_sync)) continue;
      for (const item of value.state_sync) {
        try {
          if (
            !item ||
            item.type !== 'contact' ||
            !item.contact ||
            !item.contact.phone_number
          ) continue;
          await bclientService.createBClient({
            phone_number: item.contact.phone_number,
            name: item.contact.full_name || '',
            business_id: business.id
          });
        } catch (err) {
          console.error('Failed to create client for smb_app_state_sync contact', item, err);
          continue;
        }
      }
    }
  }
}

export default {handleIncoming, handleVerification, handleWebhook};