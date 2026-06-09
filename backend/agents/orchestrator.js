require('dotenv').config();
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

const AI_MODEL = 'google/gemini-2.5-flash';
const VISION_MODEL = 'google/gemini-2.5-flash';

async function askAI(prompt, jsonMode = false) {
  const params = {
    messages: [{ role: 'user', content: prompt }],
    model: AI_MODEL,
    temperature: 0.3,
    max_tokens: 1000,
  };
  if (jsonMode) params.response_format = { type: 'json_object' };
  const completion = await openrouter.chat.completions.create(params);
  return completion.choices[0].message.content;
}

/**
 * Image se civic problem extract karo (Vision AI)
 */
async function analyzeImageForComplaint(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const ext = path.extname(imagePath).toLowerCase().replace('.', '');
    const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

    const completion = await openrouter.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64Image}` }
            },
            {
              type: 'text',
              text: `You are an AI assistant for a civic complaint portal in India.
Analyze this image and identify if it shows a civic/infrastructure problem.
Respond with ONLY valid JSON:
{
  "hasCivicIssue": true or false,
  "description": "detailed description of the civic problem visible in Hindi-English mix",
  "problemType": "Water/Road/Electricity/Sanitation/Streetlight/Drainage/Garbage/Other",
  "severity": "Low/Medium/High/Critical",
  "location_hint": "any location visible in image or null"
}
If no civic issue is visible, set hasCivicIssue to false.`
            }
          ]
        }
      ],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content);
  } catch (error) {
    console.error('[Image Analysis Error]:', error.message);
    return null;
  }
}

/**
 * Reverse geocoding - coordinates se address
 */
async function reverseGeocode(lat, lng) {
  try {
    const https = require('https');
    return new Promise((resolve) => {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16&addressdetails=1`;

      const options = {
        headers: {
          'User-Agent': 'LekhSahayak/1.0 (civic-complaint-portal)',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      };

      https.get(url, options, (res) => {
        if (res.statusCode !== 200) {
          console.error(`[Reverse Geocode] Failed with status: ${res.statusCode}`);
          return resolve(`${lat}, ${lng}`);
        }

        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            const addr = json.address || {};
            const parts = [
              addr.road || addr.pedestrian || addr.footway,
              addr.suburb || addr.neighbourhood || addr.quarter,
              addr.village || addr.town || addr.municipality || addr.city_district,
              addr.city || addr.district,
              addr.state,
            ].filter(Boolean);

            const numLat = Number(lat);
            const numLng = Number(lng);
            const addressString = parts.length > 0 ? parts.join(', ') : json.display_name || 'Unknown Address';
            resolve(`${addressString} (Lat: ${numLat.toFixed(5)}, Lng: ${numLng.toFixed(5)})`);
          } catch { resolve(`Unknown Address (Lat: ${Number(lat).toFixed(5)}, Lng: ${Number(lng).toFixed(5)})`); }
        });
      }).on('error', () => resolve(`Error fetching address (Lat: ${Number(lat).toFixed(5)}, Lng: ${Number(lng).toFixed(5)})`));
    });
  } catch { return `Lat: ${lat}, Lng: ${lng}`; }
}

/**
 * Photo se location detect karo — EXIF pehle, phir AI guess
 */
async function detectLocationFromPhoto(imagePath) {
  try {
    // Step 1: EXIF data se GPS coordinates nikalo
    const exifr = require('exifr');
    const exif = await exifr.gps(imagePath);

    if (exif && exif.latitude && exif.longitude) {
      console.log(`[Photo Location] EXIF GPS found: ${exif.latitude}, ${exif.longitude}`);
      const address = await reverseGeocode(exif.latitude, exif.longitude);
      return {
        source: 'exif',
        lat: exif.latitude,
        lng: exif.longitude,
        address
      };
    }

    console.log('[Photo Location] No EXIF GPS — trying AI visual detection...');

    // Step 2: AI se photo dekh ke location guess karo
    const fs = require('fs');
    const path = require('path');
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const ext = path.extname(imagePath).toLowerCase().replace('.', '');
    const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

    const completion = await openrouter.chat.completions.create({
      model: VISION_MODEL,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64Image}` }
          },
          {
            type: 'text',
            text: `Look at this image carefully. Can you identify any location clues?
Look for: street signs, shop names, landmarks, building names, license plates, banners, hoardings, locality names visible in the image.
This is from India.

Respond with ONLY valid JSON:
{
  "locationFound": true or false,
  "locationName": "specific location name if found, else null",
  "confidence": "high/medium/low",
  "clues": "what you saw that helped identify location"
}`
          }
        ]
      }],
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content);

    if (result.locationFound && result.locationName) {
      console.log(`[Photo Location] AI detected: ${result.locationName} (${result.confidence} confidence)`);
      return {
        source: 'ai_visual',
        lat: null,
        lng: null,
        address: result.locationName,
        confidence: result.confidence,
        clues: result.clues
      };
    }

    return null;
  } catch (err) {
    console.error('[Photo Location Error]:', err.message);
    return null;
  }
}

/**
 * Agent 0: Validation
 */
async function validateComplaint(rawInput) {
  const prompt = `
You are a strict content moderator for a Indian government civic complaint portal called LekhSahayak.
Analyze this user input: "${rawInput}"
VALID: real civic/public infrastructure issue (water, road, electricity, garbage, drainage, sanitation, streetlights, sewage, public property, govt services)
REJECT if: abusive/vulgar language, spam/gibberish, personal/private matter, threats/hate speech, illegal content, too short (<5 words), promotional message
Respond with ONLY valid JSON:
{
  "isValid": true or false,
  "reason": "brief reason in Hindi or English why rejected (only if invalid)",
  "category": "civic" or "abusive" or "spam" or "irrelevant" or "gibberish" or "valid"
}`;
  const raw = await askAI(prompt, true);
  return JSON.parse(raw);
}

/**
 * Validates if the citizen provided a complete address in the raw text
 */
async function verifyAddressCompleteness(rawInput) {
  const prompt = `You are a helpful assistant for LekhSahayak, an Indian civic complaint portal.
A citizen has reported an issue. They did not provide GPS coordinates or photo evidence, so their written/spoken text MUST contain a specific, pinpointable location (like a village name, colony, landmark, sector, or street). Simply a city, district, or state name (like "Rewari", "Delhi", "Pune") is NOT sufficient to resolve an issue.
Analyze the user's input: "${rawInput}"
Respond with ONLY valid JSON:
{
  "isAddressComplete": true or false,
  "reason": "If false, politely ask in Hindi/Hinglish to provide the exact village/colony/street name. e.g. 'Aapne shehar ya jile ka naam bataya hai, par kripya exact gaon, colony ya sadak ka naam bhi batayein jese ki Rewari me konsa gaon, taaki hum theek se madad kar sakein.'"
}`;
  const raw = await askAI(prompt, true);
  return JSON.parse(raw);
}

/**
 * Main pipeline
 */
async function processComplaint(rawInput, lat = null, lng = null, imagePaths = [], locationText = null, citizenMeta = null) {
  try {

    // ──────── Image Analysis (if images provided and no text) ────────
    let imageAnalysis = null;
    if (imagePaths && imagePaths.length > 0) {
      console.log('[Image Agent] Analyzing uploaded images...');
      // Pehli image analyze karo
      imageAnalysis = await analyzeImageForComplaint(imagePaths[0]);
      if (imageAnalysis && imageAnalysis.hasCivicIssue) {
        console.log(`[Image Agent] Civic issue detected: ${imageAnalysis.problemType}`);
        // Agar user ne text nahi diya toh image description use karo
        if (!rawInput || rawInput.trim() === '') {
          rawInput = imageAnalysis.description;
          console.log('[Image Agent] Using image description as complaint text');
        } else {
          // User ka text + image info dono combine karo
          rawInput = `${rawInput}. Additional context from photo: ${imageAnalysis.description}`;
        }
      }
    }

    // Agar kuch bhi nahi diya
    if (!rawInput || rawInput.trim() === '') {
      const error = new Error('Kripya apni samasya batayein ya photo upload karein');
      error.isValidationError = true;
      error.category = 'empty';
      throw error;
    }

    // ──────── Agent 0: Validation ────────
    console.log('[Agent 0] Validating complaint...');
    const validation = await validateComplaint(rawInput);
    if (!validation.isValid) {
      console.log(`[Agent 0] Rejected: ${validation.category} — ${validation.reason}`);
      const error = new Error(validation.reason || 'Invalid complaint');
      error.isValidationError = true;
      error.category = validation.category;
      throw error;
    }
    console.log('[Agent 0] Valid. Proceeding...');

    // ──────── GPS Resolve ────────
    let gpsLocation = null;
    if (lat && lng) {
      console.log('[GPS] Resolving coordinates...');
      gpsLocation = await reverseGeocode(lat, lng);
      console.log(`[GPS] Resolved: ${gpsLocation}`);
    } else if (locationText) {
      // Photo se AI detected location text use karo
      gpsLocation = locationText;
      console.log(`[GPS] Using photo-detected location: ${gpsLocation}`);
    }

    // ──────── Address Completeness Check ────────
    if (!gpsLocation) {
      console.log('[Address Check] No GPS/Photo location provided. Checking text for address completeness...');
      const addressCheck = await verifyAddressCompleteness(rawInput);
      if (!addressCheck.isAddressComplete) {
        console.log(`[Address Check] Incomplete address. Prompting user: ${addressCheck.reason}`);
        const error = new Error(addressCheck.reason || 'Kripya pura aur sahi pata (address) likhein, ya GPS location on karein.');
        error.isValidationError = true;
        error.category = 'incomplete_address';
        throw error;
      }
    }

    // ──────── Agent 1: Language & Sentiment ────────
    console.log('[Agent 1] Analyzing language and sentiment...');
    const langSentPrompt = `
Analyze this civic issue report: "${rawInput}"
Respond with ONLY valid JSON:
- "language": 'Hindi', 'English', or 'Hinglish'
- "sentiment_score": -1.0 to 1.0
- "sentiment_label": 'Angry', 'Frustrated', 'Neutral', or 'Polite'`;
    const langSent = JSON.parse(await askAI(langSentPrompt, true));

    // ──────── Agent 2: Concept Extraction ────────
    console.log('[Agent 2] Extracting concepts...');
    // Image analysis se priority hint use karo
    const imagePriorityHint = imageAnalysis ? `Image analysis suggests severity: ${imageAnalysis.severity}.` : '';
    const analysisPrompt = `
Analyze civic issue: "${rawInput}"
${gpsLocation ? `GPS Location: ${gpsLocation}` : ''}
${imagePriorityHint}

Evaluate the issue on THREE metrics (scale 1 to 10). Be EXTREMELY realistic and strict:
1. "safety_risk" (1=No physical risk/Inconvenience, 3=Minor annoyance, 5=Vehicle/Property damage risk, 8=Severe injury risk, 10=Immediate deadly threat)
2. "public_impact" (1=Affects 1 house, 3=Affects a few neighbors, 5=Affects a lane/locality, 8=Affects a major sector, 10=Affects entire city)
3. "urgency" (1=No rush, 3=Fix within months, 5=Fix within weeks, 8=Fix within days, 10=Fix IMMEDIATELY/Minutes)

Respond with ONLY valid JSON:
- "problem_type": "Water/Road/Electricity/Sanitation/Streetlight/Drainage/Garbage/Other"
- "metrics": { "safety_risk": Number, "public_impact": Number, "urgency": Number }
- "location_details": "${gpsLocation || 'any mentioned location or Unknown location'}"`;
    const analysis = JSON.parse(await askAI(analysisPrompt, true));

    // ──────── Advanced Priority Matrix ────────
    // Calculate final score using weighted formula:
    // Safety Risk (35%) + Public Impact (30%) + Urgency (25%) + Sentiment (up to 10%)
    let baseScore = 20; // Default lower base
    if (analysis && analysis.metrics) {
      const s = Math.min(Math.max(analysis.metrics.safety_risk || 3, 1), 10);
      const p = Math.min(Math.max(analysis.metrics.public_impact || 3, 1), 10);
      const u = Math.min(Math.max(analysis.metrics.urgency || 3, 1), 10);

      // Max possible here is 35 + 30 + 25 = 90. 
      // Most average complaints (5,5,5) will score around 45 (Medium).
      baseScore = Math.round((s * 3.5) + (p * 3.0) + (u * 2.5));
    }

    // Minor Sentiment boost
    if ((langSent.sentiment_label === 'Angry' || langSent.sentiment_label === 'Frustrated')) {
      baseScore += 5;
      if (baseScore > 100) baseScore = 100;
    }

    // Deterministic priority label based purely on calculated score
    if (baseScore >= 90) analysis.priority_level = 'Critical';
    else if (baseScore >= 70) analysis.priority_level = 'High';
    else if (baseScore >= 40) analysis.priority_level = 'Medium';
    else analysis.priority_level = 'Low';

    analysis.priority_score = baseScore;

    // ──────── Agent 3: Formal Drafting ────────
    console.log('[Agent 3] Drafting formal complaint...');
    const citizenDetails = citizenMeta ? `${citizenMeta.name} (Ph: ${citizenMeta.phone || 'N/A'})` : 'Citizen / Resident';
    const draftingPrompt = `
You are a professional government correspondence clerk in India.
Convert this citizen's issue into a COMPLETE and structurally proper formal English complaint letter.
Do NOT just write a paragraph. Ensure the letter adapts its tone depending on the priority level and context (e.g. urgent/impactful tone for critical issues, standard polite request for low priority ones). Do not use repetitive robotic template wording.

Include the standard Indian government letter structure:
- Date: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
- To, The Concerned Authority, [Department Name]
- Subject: [Concise and impactful subject line]
- Respected Sir/Madam,
- [Responsive Body Paragraphs detailing the issue, location, and requested action. Use line breaks].
- Yours faithfully,
- ${citizenDetails}

Raw Issue: "${rawInput}"
Department Category: "${analysis.problem_type}"
Location: "${analysis.location_details}"
Priority: "${analysis.priority_level}"
${imageAnalysis ? `Photo Evidence: Citizen has provided photographic evidence showing ${imageAnalysis.description}` : ''}

Output strictly the text of the formal letter, no extra conversational text or markdown blocks.`;
    const formalText = await askAI(draftingPrompt, false);

    console.log('[Agent 3.5] Translating formal draft (Batch 1: North/West)...');
    const translationPrompt1 = `
You are a professional translator for the Indian government.
Translate the following formal complaint draft into these 4 languages: Hindi (hi), Marathi (mr), Bengali (bn), Gujarati (gu).
Keep the formal tone.
Draft: """${formalText.trim()}"""

Respond with ONLY valid JSON strictly matching this format:
{
  "hi": "translation in Hindi",
  "mr": "translation in Marathi",
  "bn": "translation in Bengali",
  "gu": "translation in Gujarati"
}`;

    console.log('[Agent 3.5] Translating formal draft (Batch 2: South/North)...');
    const translationPrompt2 = `
You are a professional translator for the Indian government.
Translate the following formal complaint draft into these 3 languages: Punjabi (pa), Tamil (ta), Telugu (te).
Keep the formal tone.
Draft: """${formalText.trim()}"""

Respond with ONLY valid JSON strictly matching this format:
{
  "pa": "translation in Punjabi",
  "ta": "translation in Tamil",
  "te": "translation in Telugu"
}`;

    let formalTextTranslations = {};
    try {
      const res1 = await askAI(translationPrompt1, true);
      const res2 = await askAI(translationPrompt2, true);

      const data1 = JSON.parse(res1.replace(/```json/gi, '').replace(/```/g, '').trim());
      const data2 = JSON.parse(res2.replace(/```json/gi, '').replace(/```/g, '').trim());
      formalTextTranslations = { ...data1, ...data2 };
    } catch (err) {
      console.error('[Agent 3.5 Error] Translation failed:', err.message);
    }

    // ──────── Agent 4: Routing ────────
    console.log('[Agent 4] Routing to department...');
    const routingPrompt = `
Based on civic problem type in India: "${analysis.problem_type}", which department is responsible?
Must be one of: ["Public Works Department (PWD)", "Municipal Corporation", "Water Supply Board", "Electricity Board", "Sanitation Department", "Traffic Police", "Health Department", "Other"]
Respond with ONLY valid JSON: { "department_name": "..." }`;
    const route = JSON.parse(await askAI(routingPrompt, true));

    const trackingId = 'SS-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    console.log(`[Orchestrator] Done. Tracking ID: ${trackingId}`);
    return {
      trackingId,
      rawInput,
      formalText: formalText.trim(),
      formalTextTranslations,
      problemType: analysis.problem_type,
      priority: analysis.priority_level,
      priorityScore: analysis.priority_score,
      location: analysis.location_details,
      department: route.department_name,
      status: 'Pending',
      language: langSent.language,
      sentiment: { score: langSent.sentiment_score, label: langSent.sentiment_label },
      isDuplicate: false,
      hasImageAnalysis: imageAnalysis !== null && imageAnalysis?.hasCivicIssue
    };

  } catch (error) {
    if (error.isValidationError) throw error;
    console.error('Orchestrator Error:', error);
    throw new Error('Failed to process complaint through the Agent Pipeline');
  }
}

module.exports = { processComplaint, analyzeImageForComplaint, detectLocationFromPhoto };
