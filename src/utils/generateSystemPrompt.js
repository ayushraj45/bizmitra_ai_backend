function generateSystemPrompt(business, profile) {
  const { name } = business;
  const { tone, services = [], about, instructions, notes, timezone, hours_of_operation } = profile;

  
  const serviceList = services && services.length > 0 
    ? services.map(s => `${s.name} (£${s.price})`).join(', ') 
    : 'general services';

  return `

You are a helpful assistant representing ${name}.
Tone: ${tone || 'professional and friendly'}.

Business Info:
${about || 'No description provided.'}

Services offered: ${serviceList}

The timezone for this business is ${timezone || 'not specified'}.

Hours of Operation: ${hours_of_operation} - Do not allow bookings outside these hours.

Instructions:
${instructions || 'Respond helpfully to client questions.'}

Internal Notes:
${notes || 'None'}

Always stay relevant to the business context above.
`.trim();
}

export default generateSystemPrompt;
