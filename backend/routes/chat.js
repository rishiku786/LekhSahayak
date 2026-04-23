const express = require('express');
const router = express.Router();
const { discussWithChatbot } = require('../agents/chatbot');

// Chat endpoint
router.post('/', async (req, res) => {
  try {
    const { trackingId, question } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const response = await discussWithChatbot(trackingId, question);
    
    res.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Chat service unavailable' });
  }
});

module.exports = router;
