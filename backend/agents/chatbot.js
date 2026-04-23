require('dotenv').config();
const OpenAI = require('openai');
const Complaint = require('../models/Complaint');

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

async function askGroq(prompt) {
  try {
    const params = {
      messages: [{ role: 'user', content: prompt }],
      model: 'google/gemini-2.5-flash',
      temperature: 0.5,
    };
    const completion = await openrouter.chat.completions.create(params);
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter chatbot error:', error);
    return "Maaf kijiye, abhi server thoda busy hai. Baad mein try karein. (Sorry, the server is busy right now. Please try again later.)";
  }
}

async function discussWithChatbot(trackingId, question) {
  let context = "User wants to file a complaint or ask a question.";
  
  if (trackingId) {
    const complaint = await Complaint.findOne({ trackingId })
      .select('trackingId problemType department status priority location formalText timeline createdAt slaDeadline');
      
    if (complaint) {
      context = `Here are the details of the user's complaint:
      - Tracking ID: ${complaint.trackingId}
      - Problem Type: ${complaint.problemType}
      - Department: ${complaint.department}
      - Priority: ${complaint.priority}
      - Status: ${complaint.status}
      - Location: ${complaint.location}
      - Filed on: ${new Date(complaint.createdAt).toLocaleString()}
      - SLA Deadline: ${complaint.slaDeadline ? new Date(complaint.slaDeadline).toLocaleString() : 'N/A'}
      
      Timeline of updates from newest to oldest:
      ${complaint.timeline.reverse().map(t => `- [${t.status}] ${t.note}`).join('\n')}`;
    } else {
      context = `The tracking ID ${trackingId} provided by the user is invalid or not found in our system.`;
    }
  }

  const prompt = `You are a helpful and polite virtual assistant for LekhSahayak, a civic complaint resolving portal in India.
  
  Context:
  ${context}

  User's Message: "${question}"

  Instructions:
  - Respond politely and cheerfully.
  - Mix Hindi and English (Hinglish) appropriately to sound natural to an Indian user.
  - Provide specific answers based on their complaint status, avoiding generic answers if context is provided.
  - If they ask when it will be resolved, check the SLA deadline.
  - If the tracking ID is invalid, politely ask them to check again.
  - Keep the response concise, under 4-5 sentences.

  Assistant's response:`;

  return await askGroq(prompt);
}

module.exports = { discussWithChatbot };
