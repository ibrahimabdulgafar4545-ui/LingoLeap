import dotenv from 'dotenv';
import https from 'https';
import mongoose from 'mongoose';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import AIPracticeSession from '../models/AIPracticeSession.js';
import { 
  isFallbackMode, 
  readJsonDb, 
  writeJsonDb, 
  findUserById, 
  updateUser,
  createAIPracticeSession,
  findAIPracticeSessionById,
  updateAIPracticeSession,
  findAIPracticeSessionsByUserId
} from '../services/db.service.js';

dotenv.config();

const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_BASE = 'generativelanguage.googleapis.com';
const GROK_MODEL = process.env.GROK_MODEL || 'grok-beta';

// Helper to convert Gemini alternating roles message structure to OpenAI structure
function convertGeminiToOpenAI(contents) {
  return contents.map(item => {
    const role = item.role === 'model' ? 'assistant' : 'user';
    const content = item.parts && item.parts[0] ? item.parts[0].text : '';
    return { role, content };
  });
}

// Helper: Get base URL and model for OpenAI-compatible client (Grok vs Groq)
function getAIClientConfig(apiKey) {
  if (apiKey && apiKey.startsWith('gsk_')) {
    return {
      baseURL: 'https://api.groq.com/openai/v1',
      model: 'llama-3.3-70b-versatile'
    };
  }
  return {
    baseURL: 'https://api.xai.com/v1',
    model: process.env.GROK_MODEL || 'grok-beta'
  };
}

// Helper: Call Grok/Groq API (via OpenAI compatible SDK)
async function callGrokAPI(apiKey, contents, systemPrompt) {
  try {
    const config = getAIClientConfig(apiKey);
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: config.baseURL
    });

    const openAiMessages = [
      { role: 'system', content: systemPrompt },
      ...convertGeminiToOpenAI(contents)
    ];

    const completion = await openai.chat.completions.create({
      model: config.model,
      messages: openAiMessages,
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const textResponse = completion.choices[0]?.message?.content || '{}';
    return { ok: true, text: textResponse };
  } catch (error) {
    console.error('[AI] Grok/Groq API Error:', error);
    return { ok: false, error: error.message || String(error) };
  }
}

// Simple in-memory rate limiter
const rateLimits = {};
const checkRateLimit = (userId, type = 'chat', maxRequests = 30, timeWindowMs = 60000) => {
  const now = Date.now();
  const key = `${userId}:${type}`;
  if (!rateLimits[key]) {
    rateLimits[key] = [];
  }
  rateLimits[key] = rateLimits[key].filter(ts => now - ts < timeWindowMs);
  if (rateLimits[key].length >= maxRequests) {
    return false;
  }
  rateLimits[key].push(now);
  return true;
};

// Allowed scenarios, languages, levels
const ALLOWED_SCENARIOS = ['restaurant', 'airport', 'hotel', 'shopping', 'job_interview', 'casual', 'travel', 'school'];
const ALLOWED_LANGUAGES = ['Spanish', 'French', 'English', 'German', 'Arabic', 'Italian'];
const ALLOWED_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

// Simulated response library for fallback and offline modes
const simulatedLibrary = {
  Spanish: {
    restaurant: [
      { reply: "¡Hola! Bienvenido al restaurante 'El Sol'. ¿Tiene una reserva?", grammarMistakes: [], vocabulary: [{ word: "reserva", translation: "reservation", pronunciation: "reh-sehr-bah", example: "Tengo una reserva a las ocho. (I have a reservation at eight.)" }] },
      { reply: "Perfecto. Aquí tiene la carta. Hoy recomendamos la paella marinera. ¿Qué desea tomar para empezar?", grammarMistakes: [], vocabulary: [{ word: "carta", translation: "menu", pronunciation: "kahr-tah", example: "¿Me trae la carta, por favor? (Can you bring me the menu, please?)" }] },
      { reply: "Excelente elección. ¿Y de segundo plato?", grammarMistakes: [], vocabulary: [{ word: "plato", translation: "dish / plate", pronunciation: "plah-toh", example: "Este plato está delicioso. (This dish is delicious.)" }] },
      { reply: "¿Desea algún postre o café para terminar?", grammarMistakes: [], vocabulary: [{ word: "postre", translation: "dessert", pronunciation: "pohs-treh", example: "¿Tienen helado de postre? (Do you have ice cream for dessert?)" }] },
      { reply: "Muy bien. Enseguida le traigo la cuenta. ¿Desea pagar con tarjeta o en efectivo?", grammarMistakes: [], vocabulary: [{ word: "cuenta", translation: "bill", pronunciation: "kwehn-tah", example: "La cuenta, por favor. (The bill, please.)" }] }
    ],
    airport: [
      { reply: "Buenos días. ¿A qué destino viaja hoy y me permite su pasaporte?", grammarMistakes: [], vocabulary: [{ word: "pasaporte", translation: "passport", pronunciation: "pah-sah-pohr-teh", example: "No pierdas tu pasaporte. (Don't lose your passport.)" }] },
      { reply: "Gracias. ¿Tiene equipaje para facturar o solo lleva equipaje de mano?", grammarMistakes: [], vocabulary: [{ word: "equipaje de mano", translation: "carry-on luggage", pronunciation: "eh-kee-pah-heh deh mah-noh", example: "Solo llevo equipaje de mano. (I only carry carry-on luggage.)" }] },
      { reply: "Entendido. Por favor coloque su maleta en la báscula. Todo está correcto.", grammarMistakes: [], vocabulary: [{ word: "báscula", translation: "scale", pronunciation: "bahs-koo-lah", example: "Ponga la maleta en la báscula. (Put the suitcase on the scale.)" }] },
      { reply: "Aquí tiene su tarjeta de embarque. Su puerta de salida es la B12. ¡Buen viaje!", grammarMistakes: [], vocabulary: [{ word: "tarjeta de embarque", translation: "boarding pass", pronunciation: "tahr-heh-tah deh ehm-bahr-keh", example: "Aquí está mi tarjeta de embarque. (Here is my boarding pass.)" }] }
    ],
    hotel: [
      { reply: "Bienvenido al Hotel Central. ¿En qué puedo ayudarle hoy?", grammarMistakes: [], vocabulary: [{ word: "bienvenido", translation: "welcome", pronunciation: "byehn-beh-nee-doh", example: "Bienvenido a nuestro hotel. (Welcome to our hotel.)" }] },
      { reply: "Claro, tengo una habitación doble a su nombre para tres noches. ¿Me firma aquí?", grammarMistakes: [], vocabulary: [{ word: "habitación doble", translation: "double room", pronunciation: "ah-bee-tah-syohn doh-bleh", example: "Reservamos una habitación doble. (We reserved a double room.)" }] },
      { reply: "Perfecto. Su habitación es la número 304 en el tercer piso. Aquí tiene su llave electrónica.", grammarMistakes: [], vocabulary: [{ word: "llave", translation: "key", pronunciation: "yah-beh", example: "Perdí la llave de mi habitación. (I lost my room key.)" }] }
    ],
    shopping: [
      { reply: "¡Hola! ¿Busca algo en particular o solo está mirando?", grammarMistakes: [], vocabulary: [{ word: "mirando", translation: "looking", pronunciation: "mee-rahn-doh", example: "Solo estoy mirando, gracias. (I'm just looking, thank you.)" }] },
      { reply: "Tenemos chaquetas y camisas con descuento esta semana. ¿Qué talla necesita?", grammarMistakes: [], vocabulary: [{ word: "talla", translation: "size", pronunciation: "tah-yah", example: "¿Qué talla es esta camisa? (What size is this shirt?)" }] },
      { reply: "Claro, los probadores están al fondo a la derecha. Pruébeselo sin compromiso.", grammarMistakes: [], vocabulary: [{ word: "probadores", translation: "fitting rooms", pronunciation: "proh-bah-doh-rehs", example: "¿Dónde están los probadores? (Where are the fitting rooms?)" }] }
    ],
    job_interview: [
      { reply: "Hola. Gracias por venir. Hábleme de su experiencia laboral y por qué le interesa este puesto.", grammarMistakes: [], vocabulary: [{ word: "puesto", translation: "position / job", pronunciation: "pwehs-toh", example: "Quiero solicitar este puesto. (I want to apply for this position.)" }] },
      { reply: "Interesante. ¿Cuáles considera que son sus mayores fortalezas y debilidades profesionales?", grammarMistakes: [], vocabulary: [{ word: "fortalezas", translation: "strengths", pronunciation: "fohr-tah-leh-zahs", example: "Mis fortalezas son el trabajo en equipo. (My strengths are teamwork.)" }] }
    ],
    casual: [
      { reply: "¡Hola! ¿Qué tal tu día? ¿Qué planes tienes para el fin de semana?", grammarMistakes: [], vocabulary: [{ word: "planes", translation: "plans", pronunciation: "plah-nehs", example: "¿Qué planes tienes hoy? (What plans do you have today?)" }] },
      { reply: "¡Qué bien! A mí me gusta leer y caminar por la montaña. ¿Tienes algún pasatiempo favorito?", grammarMistakes: [], vocabulary: [{ word: "pasatiempo", translation: "hobby", pronunciation: "pah-sah-tyehm-poh", example: "Mi pasatiempo es pintar. (My hobby is painting.)" }] }
    ],
    travel: [
      { reply: "¡Hola! ¿A dónde deseas ir hoy? ¿Necesitas ayuda con el mapa o direcciones?", grammarMistakes: [], vocabulary: [{ word: "direcciones", translation: "directions", pronunciation: "dee-rehk-syoh-nehs", example: "Necesito direcciones para ir al museo. (I need directions to go to the museum.)" }] },
      { reply: "Para llegar a la plaza principal, camina recto dos cuadras y gira a la izquierda. ¿Te queda claro?", grammarMistakes: [], vocabulary: [{ word: "cuadras", translation: "blocks", pronunciation: "kwah-drahs", example: "El banco está a tres cuadras. (The bank is three blocks away.)" }] }
    ],
    school: [
      { reply: "Hola, ¿cómo vas con los deberes de matemáticas para mañana? Estaban difíciles.", grammarMistakes: [], vocabulary: [{ word: "deberes", translation: "homework", pronunciation: "deh-beh-rehs", example: "Tengo muchos deberes hoy. (I have a lot of homework today.)" }] },
      { reply: "Sí, yo también tardé mucho en resolver el último problema. ¿Quieres que estudiemos juntos?", grammarMistakes: [], vocabulary: [{ word: "resolver", translation: "solve", pronunciation: "rreh-sohl-behr", example: "Debemos resolver este problema. (We must solve this problem.)" }] }
    ]
  }
};

// Fill in fallback template for other languages to ensure safety
const getSimulatedTurn = (language, scenario, turnIndex) => {
  const langData = simulatedLibrary[language] || simulatedLibrary['Spanish'];
  const scenData = langData[scenario] || langData['casual'] || langData['intro'];
  const item = scenData[Math.min(turnIndex, scenData.length - 1)];

  if (language !== 'Spanish') {
    const translations = {
      French: {
        restaurant: "Bonjour et bienvenue ! Avez-vous une réservation ?",
        airport: "Bonjour. Quel est votre vol aujourd'hui ? Puis-je voir votre passeport ?",
        hotel: "Bienvenue à l'Hôtel Central. Comment puis-je vous aider ?",
        shopping: "Bonjour ! Est-ce que je peux vous aider à trouver quelque chose ?",
        job_interview: "Bonjour. Merci d'être venu. Parlez-moi de votre expérience professionnelle.",
        casual: "Salut ! Comment se passe votre journée ? Qu'allez-vous faire ce week-end ?",
        travel: "Bonjour ! Où voulez-vous aller aujourd'hui ? Avez-vous besoin d'aide ?",
        school: "Salut ! As-tu fait tes devoirs pour demain ?"
      },
      English: {
        restaurant: "Hello! Welcome to our restaurant. Do you have a reservation?",
        airport: "Good day. Where are you flying to today? May I see your passport?",
        hotel: "Welcome to the Central Hotel. How can I help you today?",
        shopping: "Hello! Are you looking for something in particular, or just browsing?",
        job_interview: "Hello. Thank you for coming. Tell me about your work experience.",
        casual: "Hi there! How is your day going? What are your plans for the weekend?",
        travel: "Hello! Where are you trying to go today? Do you need a map or directions?",
        school: "Hi, how is your homework going? It was quite hard, wasn't it?"
      },
      German: {
        restaurant: "Hallo! Willkommen in unserem Restaurant. Haben Sie eine Reservierung?",
        airport: "Guten Tag. Wohin fliegen Sie heute? Kann ich bitte Ihren Reisepass sehen?",
        hotel: "Willkommen im Hotel Central. Wie kann ich Ihnen heute helfen?",
        shopping: "Hallo! Suchen Sie etwas Bestimmtes oder schauen Sie sich nur um?",
        job_interview: "Hallo. Vielen Dank fürs Kommen. Erzählen Sie mir von Ihrer Berufserfahrung.",
        casual: "Hallo! Wie läuft dein Tag? Was hast du am Wochenende vor?",
        travel: "Hallo! Wohin möchten Sie reisen? Brauchen Sie eine Wegbeschreibung?",
        school: "Hallo! Wie läuft es mit den Hausaufgaben für morgen?"
      },
      Italian: {
        restaurant: "Ciao! Benvenuto al ristorante. Ha una prenotazione?",
        airport: "Buongiorno. Dove vola oggi? Posso vedere il suo passaporto?",
        hotel: "Benvenuto all'Hotel Central. Come posso aiutarla oggi?",
        shopping: "Ciao! Cerca qualcosa in particolare o sta solo dando un'occhiata?",
        job_interview: "Buongiorno. Grazie per essere venuto. Mi parli della sua esperienza.",
        casual: "Ciao! Come va la giornata? Che programmi hai per il fine settimana?",
        travel: "Ciao! Dove vuole andare oggi? Ha bisogno di indicazioni o di una mappa?",
        school: "Ciao! Come vanno i compiti per domani? Erano difficili."
      },
      Arabic: {
        restaurant: "مرحباً بك في المطعم. هل لديك حجز مسبق؟",
        airport: "طاب يومك. إلى أين تسافر اليوم؟ هل يمكنني رؤية جواز سفرك؟",
        hotel: "مرحباً بك في الفندق المركزي. كيف يمكنني مساعدتك اليوم؟",
        shopping: "مرحباً! هل تبحث عن شيء معين أم تتصفح فقط؟",
        job_interview: "مرحباً. شكراً لحضورك. حدثني عن خبرتك المهنية.",
        casual: "مرحباً! كيف حالك اليوم؟ ما هي خططك لعطلة نهاية الأسبوع؟",
        travel: "مرحباً! إلى أين تريد الذهاب اليوم؟ هل تحتاج إلى اتجاهات؟",
        school: "مرحباً! كيف تسير واجباتك المدرسية لغد؟"
      }
    };

    const nativeReply = translations[language]?.[scenario] || "Hello! Let's practice conversation.";
    return {
      reply: nativeReply,
      grammarMistakes: [],
      vocabulary: [{ word: "conversation", translation: "practice talk", pronunciation: "con-ver-sa-tion", example: "Let's practice conversation." }]
    };
  }

  return item;
};

// Helper: Native Call to Gemini API
function callGeminiAPI(apiKey, contents, systemPrompt) {
  return new Promise((resolve) => {
    const bodyObj = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
        responseMimeType: "application/json"
      }
    };
    const body = JSON.stringify(bodyObj);
    const path = `/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const options = {
      hostname: GEMINI_API_BASE,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200 && parsed.candidates) {
            const textResponse = parsed.candidates[0]?.content?.parts[0]?.text || '{}';
            resolve({ ok: true, text: textResponse });
          } else {
            const errMsg = parsed.error?.message || `HTTP ${res.statusCode}`;
            resolve({ ok: false, error: errMsg, status: res.statusCode });
          }
        } catch (e) {
          resolve({ ok: false, error: 'Failed to parse Gemini API JSON response', raw: data });
        }
      });
    });

    req.on('error', (e) => resolve({ ok: false, error: e.message }));
    req.write(body);
    req.end();
  });
}

// Dispatcher: Redirect to Grok or Gemini based on active env key
export async function callAIService(contents, systemPrompt) {
  const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (grokKey && !grokKey.includes('your_')) {
    return await callGrokAPI(grokKey, contents, systemPrompt);
  } else if (geminiKey && !geminiKey.includes('your_')) {
    return await callGeminiAPI(geminiKey, contents, systemPrompt);
  } else {
    return { ok: false, error: 'No active AI API key found in environment variables.' };
  }
}

// ─────────────────────────────────────────────
// Translation and Language Detection Utilities
// ─────────────────────────────────────────────
export const translateChatMessage = async (text, targetLanguage) => {
  const systemPrompt = `You are an expert translator. Translate the following text into ${targetLanguage}.
Respond strictly with a JSON object: {"translatedText": "your translation", "sourceLanguage": "detected source language"}. Do not add any markdown.`;
  const contents = [{ role: 'user', parts: [{ text }] }];
  try {
    const result = await callAIService(contents, systemPrompt);
    if (result.ok) {
      let cleaned = result.text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return parsed;
    }
  } catch (error) {
    console.error('[AI] Translation Error:', error);
  }
  return { translatedText: text, sourceLanguage: 'Unknown' };
};

export const transcribeAudioMessage = async (base64Audio) => {
  // Extract base64 part
  const match = base64Audio.match(/^data:(audio\/[a-zA-Z0-9.-]+);base64,(.*)$/);
  if (!match) return "Voice note transcription not available.";

  const mimeType = match[1];
  const base64Data = match[2];

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && !geminiKey.includes('your_')) {
    // We can try to use Gemini for audio transcription
    const systemPrompt = "You are an expert transcriber. Transcribe the following audio accurately. If the audio is unclear, write '[Audio Unclear]'.";
    const contents = [{
      role: 'user',
      parts: [
        { inlineData: { mimeType, data: base64Data } },
        { text: "Please transcribe this audio." }
      ]
    }];
    try {
      const bodyObj = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 500, temperature: 0.1 }
      };
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyObj)
      });
      const data = await response.json();
      if (data.candidates && data.candidates[0]) {
        return data.candidates[0].content.parts[0].text.trim();
      }
    } catch (e) {
      console.error('[AI] Transcription error:', e);
    }
  }
  
  return "Simulated transcription for voice note (no active Gemini key).";
};

// ─────────────────────────────────────────────
// POST /api/ai/session/start
// ─────────────────────────────────────────────
export const startSession = async (req, res) => {
  const { scenario, language, level } = req.body;
  const userId = req.user._id || req.user.id;

  // 1. Input Validation
  if (!ALLOWED_SCENARIOS.includes(scenario)) {
    return res.status(400).json({ success: false, message: `Invalid scenario. Choose from: ${ALLOWED_SCENARIOS.join(', ')}` });
  }
  if (!ALLOWED_LANGUAGES.includes(language)) {
    return res.status(400).json({ success: false, message: `Invalid language. Choose from: ${ALLOWED_LANGUAGES.join(', ')}` });
  }
  if (!ALLOWED_LEVELS.includes(level)) {
    return res.status(400).json({ success: false, message: `Invalid level. Choose from: ${ALLOWED_LEVELS.join(', ')}` });
  }

  // 2. Rate Limiting
  if (!checkRateLimit(userId, 'start_session', 10, 60000)) {
    return res.status(429).json({ success: false, message: 'Too many session creations. Please wait a minute.' });
  }

  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || process.env.GEMINI_API_KEY;
  let initialMsgText = '';
  let vocab = [];

  // Generate initial bot greeting message
  if (!apiKey || apiKey.includes('your_')) {
    const turn = getSimulatedTurn(language, scenario, 0);
    initialMsgText = turn.reply;
    vocab = turn.vocabulary;
  } else {
    const systemPrompt = `You are a friendly AI language tutor for LingoLeap.
The user is practicing ${language} at the ${level} level. The scenario is: ${scenario}.
Start the conversation by greeting the user and setting up the scenario in-character. Keep it to 1-2 sentences.
You MUST reply strictly with a JSON object. Keys:
1. "reply": (string) Your opening greeting in ${language}.
2. "vocabulary": (array of objects) 1-2 useful words for starting this scenario, each with "word", "translation", "pronunciation", "example".`;

    const contents = [{ role: 'user', parts: [{ text: `Generate the starting greeting for scenario: ${scenario} in ${language} at level ${level}.` }] }];
    try {
      const result = await callAIService(contents, systemPrompt);
      if (result.ok) {
        const parsed = JSON.parse(result.text);
        initialMsgText = parsed.reply || `Welcome to the ${scenario} session.`;
        vocab = parsed.vocabulary || [];
      } else {
        const turn = getSimulatedTurn(language, scenario, 0);
        initialMsgText = turn.reply;
        vocab = turn.vocabulary;
      }
    } catch (err) {
      const turn = getSimulatedTurn(language, scenario, 0);
      initialMsgText = turn.reply;
      vocab = turn.vocabulary;
    }
  }

  try {
    // Create new session object
    const sessionData = {
      userId,
      scenario,
      language,
      level,
      messages: [{
        role: 'model',
        content: initialMsgText,
        timestamp: new Date()
      }],
      score: { fluency: 0, grammar: 0, vocabulary: 0 },
      feedback: {
        suggestions: '',
        grammarMistakes: [],
        recommendedVocab: vocab
      }
    };

    const session = await createAIPracticeSession(sessionData);
    
    // Log user activity
    try {
      const userObj = await findUserById(userId.toString());
      if (userObj) {
        const activities = [...(userObj.recentActivity || [])];
        activities.push({
          type: 'ai_chat_start',
          message: `Started ${scenario} conversation in ${language}`,
          xp: 0,
          timestamp: new Date()
        });
        await updateUser(userId.toString(), { recentActivity: activities.slice(-20) });
      }
    } catch (actErr) {
      console.error('[AI] Activity logging error:', actErr);
    }

    return res.status(201).json({
      success: true,
      session,
      simulated: !apiKey || apiKey === 'your_gemini_api_key_here'
    });
  } catch (error) {
    console.error('[AI] Start session error:', error);
    return res.status(500).json({ success: false, message: 'Could not create practice session' });
  }
};

// ─────────────────────────────────────────────
// POST /api/ai/session/:sessionId/message
// ─────────────────────────────────────────────
export const sendMessageToSession = async (req, res) => {
  const { sessionId } = req.params;
  const { message } = req.body;
  const userId = req.user._id || req.user.id;

  // 1. Input Validation
  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ success: false, message: 'Message content is required.' });
  }
  if (message.length > 500) {
    return res.status(400).json({ success: false, message: 'Message is too long (maximum 500 characters).' });
  }

  // 2. Rate Limiting
  if (!checkRateLimit(userId, 'session_msg', 30, 60000)) {
    return res.status(429).json({ success: false, message: 'Too many messages. Please slow down.' });
  }

  try {
    const session = await findAIPracticeSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Practice session not found.' });
    }
    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this session.' });
    }

    // Append user message
    const userMsg = { role: 'user', content: message, timestamp: new Date() };
    const updatedMessages = [...session.messages, userMsg];

    const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || process.env.GEMINI_API_KEY;
    let replyText = '';
    let grammarMistakes = [];
    let vocabWords = [];
    let isSim = false;

    if (!apiKey || apiKey.includes('your_')) {
      isSim = true;
      const turnIndex = updatedMessages.filter(m => m.role === 'user').length;
      const simulated = getSimulatedTurn(session.language, session.scenario, turnIndex);
      replyText = simulated.reply;
      grammarMistakes = simulated.grammarMistakes;
      vocabWords = simulated.vocabulary;
    } else {
      // Setup Gemini contents. Need strictly alternating roles.
      const contents = [];
      for (const m of updatedMessages) {
        contents.push({
          role: m.role === 'model' ? 'model' : 'user',
          parts: [{ text: m.content }]
        });
      }

      // Filter contents to guarantee strict alternation
      const filteredContents = [];
      for (const item of contents) {
        if (filteredContents.length > 0 && filteredContents[filteredContents.length - 1].role === item.role) {
          // Merge content if consecutive roles
          filteredContents[filteredContents.length - 1].parts[0].text += '\n' + item.parts[0].text;
        } else {
          filteredContents.push(item);
        }
      }

      const systemPrompt = `You are a friendly, encouraging AI language tutor for LingoLeap.
The user is practicing ${session.language} at the ${session.level} level. The scenario is: ${session.scenario}.
You must stay in character as a participant in the scenario. Speak at a speed and vocabulary difficulty appropriate for a ${session.level} speaker.
Keep your reply in ${session.language} short (1-3 sentences max).

Your task is to respond to the user's message, correct any grammar errors in their last message, and highlight useful vocabulary words.

You MUST respond strictly with a valid JSON object. The JSON object must contain the following keys:
1. "reply": (string) Your in-character reply in ${session.language} (maximum 3 sentences).
2. "grammarMistakes": (array of objects) Any grammar or vocabulary errors in the user's last message. Each object must have:
   - "original": (string) The incorrect phrase/sentence the user wrote.
   - "correction": (string) The correct version in ${session.language}.
   - "explanation": (string) A simple explanation in English of why the correction is needed and the rule behind it.
   If there are no errors, return an empty array [].
3. "vocabulary": (array of objects) 1-3 useful or interesting words from the current conversation. Each object must have:
   - "word": (string) The word in ${session.language}.
   - "translation": (string) The English translation.
   - "pronunciation": (string) A simple pronunciation guide or phonetic spelling.
   - "example": (string) An example sentence using the word in ${session.language} with its English translation.`;

      const result = await callAIService(filteredContents, systemPrompt);
      if (result.ok) {
        try {
          const parsed = JSON.parse(result.text);
          replyText = parsed.reply || '...';
          grammarMistakes = parsed.grammarMistakes || [];
          vocabWords = parsed.vocabulary || [];
        } catch (parseErr) {
          console.warn('[AI] JSON parse failed, treating as raw string');
          replyText = result.text;
        }
      } else {
        isSim = true;
        const turnIndex = updatedMessages.filter(m => m.role === 'user').length;
        const simulated = getSimulatedTurn(session.language, session.scenario, turnIndex);
        replyText = simulated.reply + '\n\n---\n💡 (Offline Practice Mode)';
        grammarMistakes = simulated.grammarMistakes;
        vocabWords = simulated.vocabulary;
      }
    }

    const aiMsg = { role: 'model', content: replyText, timestamp: new Date() };
    const allMessages = [...updatedMessages, aiMsg];

    // Merge grammar mistakes and recommended vocabulary into session feedback
    const updatedFeedback = {
      suggestions: session.feedback?.suggestions || '',
      grammarMistakes: [...(session.feedback?.grammarMistakes || []), ...grammarMistakes],
      recommendedVocab: [...(session.feedback?.recommendedVocab || []), ...vocabWords]
    };

    // Keep unique list of recommended vocab
    const vocabMap = {};
    updatedFeedback.recommendedVocab.forEach(v => {
      if (v && v.word) {
        vocabMap[v.word.toLowerCase()] = v;
      }
    });
    updatedFeedback.recommendedVocab = Object.values(vocabMap);

    // Save session
    await updateAIPracticeSession(sessionId, {
      messages: allMessages,
      feedback: updatedFeedback
    });

    return res.status(200).json({
      success: true,
      reply: replyText,
      grammarMistakes,
      vocabulary: vocabWords,
      simulated: isSim,
      messages: allMessages
    });
  } catch (error) {
    console.error('[AI] Send message error:', error);
    return res.status(500).json({ success: false, message: 'Could not send message' });
  }
};

// ─────────────────────────────────────────────
// POST /api/ai/session/:sessionId/complete
// ─────────────────────────────────────────────
export const completeSession = async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user._id || req.user.id;

  try {
    const session = await findAIPracticeSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Practice session not found.' });
    }
    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || process.env.GEMINI_API_KEY;
    let fluency = 70;
    let grammar = 70;
    let vocabulary = 70;
    let suggestions = 'Great job completing your practice! Try to write longer sentences next time to improve fluency.';
    let recommendedVocab = session.feedback?.recommendedVocab || [];
    let grammarMistakes = session.feedback?.grammarMistakes || [];

    if (apiKey && !apiKey.includes('your_')) {
      const transcript = session.messages.map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n');
      const systemPrompt = `You are an expert language examiner. Evaluate the user's conversation practice in ${session.language} for the scenario: ${session.scenario} at user level: ${session.level}.
Evaluate fluency, grammar, and vocabulary out of 100. Write feedback in English.

You MUST respond strictly with a valid JSON object. Keys:
{
  "fluency": (number between 0 and 100),
  "grammar": (number between 0 and 100),
  "vocabulary": (number between 0 and 100),
  "suggestions": (string) constructive feedback and suggestions for improvement,
  "grammarMistakes": [
    { "original": "incorrect user text", "correction": "corrected version", "explanation": "English explanation" }
  ],
  "recommendedVocab": [
    { "word": "word", "translation": "English translation", "example": "example sentence with English translation" }
  ]
}`;

      const contents = [{ role: 'user', parts: [{ text: `Here is the transcript to evaluate:\n\n${transcript}` }] }];
      const result = await callAIService(contents, systemPrompt);
      if (result.ok) {
        try {
          const parsed = JSON.parse(result.text);
          fluency = parsed.fluency || 70;
          grammar = parsed.grammar || 70;
          vocabulary = parsed.vocabulary || 70;
          suggestions = parsed.suggestions || suggestions;
          if (parsed.grammarMistakes) {
            grammarMistakes = [...grammarMistakes, ...parsed.grammarMistakes];
          }
          if (parsed.recommendedVocab) {
            recommendedVocab = [...recommendedVocab, ...parsed.recommendedVocab];
          }
        } catch (err) {
          console.error('[AI] Complete evaluation parse error:', err);
        }
      }
    } else {
      // Mock scores based on chat length
      const userMsgCount = session.messages.filter(m => m.role === 'user').length;
      fluency = Math.min(60 + userMsgCount * 8, 95);
      grammar = Math.min(65 + userMsgCount * 6, 92);
      vocabulary = Math.min(62 + userMsgCount * 7, 94);
    }

    // Keep unique list of recommended vocab
    const vocabMap = {};
    recommendedVocab.forEach(v => {
      if (v && v.word) vocabMap[v.word.toLowerCase()] = v;
    });
    recommendedVocab = Object.values(vocabMap);

    // Keep unique list of grammar mistakes
    const grammarMap = {};
    grammarMistakes.forEach(g => {
      if (g && g.original) grammarMap[g.original.toLowerCase()] = g;
    });
    grammarMistakes = Object.values(grammarMap);

    const score = { fluency, grammar, vocabulary };
    const feedback = { suggestions, grammarMistakes, recommendedVocab };

    // Update Session
    const updatedSession = await updateAIPracticeSession(sessionId, { score, feedback });

    // Update User XP & Gems & Activity
    const xpAwarded = 25; // 25 XP for completing a session
    const gemsAwarded = 10; // 10 Gems
    const user = await findUserById(userId.toString());
    if (user) {
      const currentXp = user.xp || 0;
      const updatedXp = currentXp + xpAwarded;
      const updatedWeeklyXp = (user.weeklyXp || 0) + xpAwarded;
      const updatedGems = (user.gems || 0) + gemsAwarded;
      const level = Math.floor(Math.sqrt(updatedXp / 100)) + 1;

      // Update study calendar
      const todayKey = new Date().toISOString().slice(0, 10);
      const calendar = [...(user.studyCalendar || [])];
      const todayEntryIndex = calendar.findIndex(d => d.date === todayKey);
      if (todayEntryIndex !== -1) {
        calendar[todayEntryIndex].xp = (calendar[todayEntryIndex].xp || 0) + xpAwarded;
        calendar[todayEntryIndex].minutes = (calendar[todayEntryIndex].minutes || 0) + 5;
      } else {
        calendar.push({ date: todayKey, xp: xpAwarded, lessons: 0, minutes: 5 });
      }

      // Add recent activity
      const recentActivity = [...(user.recentActivity || [])];
      recentActivity.push({
        type: 'ai_practice_complete',
        message: `Completed AI Practice Session (${session.scenario})`,
        xp: xpAwarded,
        timestamp: new Date()
      });

      await updateUser(userId.toString(), {
        xp: updatedXp,
        weeklyXp: updatedWeeklyXp,
        gems: updatedGems,
        level,
        studyCalendar: calendar.slice(-90),
        recentActivity: recentActivity.slice(-20)
      });
    }

    return res.status(200).json({
      success: true,
      session: updatedSession,
      xpAwarded,
      gemsAwarded
    });
  } catch (error) {
    console.error('[AI] Complete session error:', error);
    return res.status(500).json({ success: false, message: 'Could not complete session' });
  }
};

// ─────────────────────────────────────────────
// GET /api/ai/sessions
// ─────────────────────────────────────────────
export const getUserSessions = async (req, res) => {
  const userId = req.user._id || req.user.id;
  try {
    const sessions = await findAIPracticeSessionsByUserId(userId);
    return res.status(200).json({ success: true, sessions });
  } catch (error) {
    console.error('[AI] Get sessions error:', error);
    return res.status(500).json({ success: false, message: 'Could not retrieve sessions' });
  }
};

// ─────────────────────────────────────────────
// GET /api/ai/stats
// ─────────────────────────────────────────────
export const getUserStats = async (req, res) => {
  const userId = req.user._id || req.user.id;
  try {
    const sessions = await findAIPracticeSessionsByUserId(userId);
    
    // Filter completed sessions (we assume any session completed has average scores > 0)
    const completed = sessions
      .filter(s => s.score && (s.score.fluency > 0 || s.score.grammar > 0 || s.score.vocabulary > 0))
      .map(s => typeof s.toObject === 'function' ? s.toObject() : JSON.parse(JSON.stringify(s)));

    if (completed.length === 0) {
      return res.status(200).json({
        success: true,
        stats: {
          totalSessions: 0,
          averageFluency: 0,
          averageGrammar: 0,
          averageVocabulary: 0,
          overallProgress: [],
          recommendedPractice: ['restaurant', 'shopping', 'casual'],
          savedMistakes: [],
          savedVocab: []
        }
      });
    }

    let fluencySum = 0;
    let grammarSum = 0;
    let vocabularySum = 0;

    const overallProgress = completed.map(s => ({
      date: s.createdAt,
      fluency: s.score.fluency,
      grammar: s.score.grammar,
      vocabulary: s.score.vocabulary,
      scenario: s.scenario
    })).reverse();

    completed.forEach(s => {
      fluencySum += s.score.fluency;
      grammarSum += s.score.grammar;
      vocabularySum += s.score.vocabulary;
    });

    const total = completed.length;
    const avgFluency = Math.round(fluencySum / total);
    const avgGrammar = Math.round(grammarSum / total);
    const avgVocabulary = Math.round(vocabularySum / total);

    // Group mistakes and vocab
    const allMistakes = [];
    const allVocab = [];

    completed.forEach(s => {
      if (s.feedback?.grammarMistakes) {
        s.feedback.grammarMistakes.forEach(m => {
          if (m && m.original) {
            allMistakes.push({ ...m, scenario: s.scenario, language: s.language });
          }
        });
      }
      if (s.feedback?.recommendedVocab) {
        s.feedback.recommendedVocab.forEach(v => {
          if (v && v.word) {
            allVocab.push({ ...v, scenario: s.scenario, language: s.language });
          }
        });
      }
    });

    // Recommend practice based on lowest average scores per scenario
    const scenarioScores = {};
    completed.forEach(s => {
      const avg = (s.score.fluency + s.score.grammar + s.score.vocabulary) / 3;
      if (!scenarioScores[s.scenario]) {
        scenarioScores[s.scenario] = { sum: 0, count: 0 };
      }
      scenarioScores[s.scenario].sum += avg;
      scenarioScores[s.scenario].count += 1;
    });

    const scenarioAverages = Object.keys(scenarioScores).map(scen => ({
      scenario: scen,
      average: scenarioScores[scen].sum / scenarioScores[scen].count
    }));

    // Sort by lowest score
    scenarioAverages.sort((a, b) => a.average - b.average);
    const recommendedPractice = scenarioAverages.map(s => s.scenario);
    
    // Add any scenarios not practiced yet to the end of recommendation list
    ALLOWED_SCENARIOS.forEach(scen => {
      if (!recommendedPractice.includes(scen)) {
        recommendedPractice.push(scen);
      }
    });

    // Make mistakes and vocab unique
    const uniqueMistakesMap = {};
    allMistakes.forEach(m => {
      uniqueMistakesMap[m.original.toLowerCase()] = m;
    });

    const uniqueVocabMap = {};
    allVocab.forEach(v => {
      uniqueVocabMap[v.word.toLowerCase()] = v;
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalSessions: total,
        averageFluency: avgFluency,
        averageGrammar: avgGrammar,
        averageVocabulary: avgVocabulary,
        overallProgress,
        recommendedPractice: recommendedPractice.slice(0, 3),
        savedMistakes: Object.values(uniqueMistakesMap).slice(-15),
        savedVocab: Object.values(uniqueVocabMap).slice(-15)
      }
    });
  } catch (error) {
    console.error('[AI] Get stats error:', error);
    return res.status(500).json({ success: false, message: 'Could not retrieve stats' });
  }
};

// ─────────────────────────────────────────────
// GET /api/ai/test  — Public connection check
// ─────────────────────────────────────────────
export const testGeminiConnection = async (req, res) => {
  const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  console.log('[AI Tutor Diagnosis] Connection test request received.');
  console.log('[AI Tutor Diagnosis] GROK_API_KEY present:', !!grokKey);
  console.log('[AI Tutor Diagnosis] GEMINI_API_KEY present:', !!geminiKey);

  const prompt = (req.query && req.query.prompt) || (req.body && req.body.prompt) || 'Say hello from Gemini';

  if (grokKey && !grokKey.includes('your_')) {
    const config = getAIClientConfig(grokKey);
    console.log(`[AI Tutor Diagnosis] Testing Grok/Groq connection with model '${config.model}' via ${config.baseURL}...`);
    try {
      const openai = new OpenAI({
        apiKey: grokKey,
        baseURL: config.baseURL
      });

      const completion = await openai.chat.completions.create({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      });

      const text = completion.choices[0]?.message?.content || '';
      console.log('[AI Tutor Diagnosis] Connection success response:', text.trim());
      return res.status(200).json({
        success: true,
        connected: true,
        response: text.trim()
      });
    } catch (error) {
      console.error('[AI Tutor Diagnosis] Connection test failed:', error);
      return res.status(200).json({
        success: false,
        connected: false,
        message: `❌ API test failed (Model: ${config.model}, URL: ${config.baseURL}).`,
        error: error.message || String(error),
        response: null
      });
    }
  }

  if (geminiKey && !geminiKey.includes('your_')) {
    console.log(`[AI Tutor Diagnosis] Testing Gemini connection with model '${GEMINI_MODEL}'...`);
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('[AI Tutor Diagnosis] Gemini Success response:', text.trim());
      return res.status(200).json({
        success: true,
        connected: true,
        response: text.trim()
      });
    } catch (error) {
      console.error('[AI Tutor Diagnosis] Gemini connection failed with error details:', error);
      const errorStr = error.message || String(error);
      let customMsg = '❌ Gemini SDK test failed.';
      if (errorStr.includes('quota') || errorStr.includes('429')) {
        customMsg = '❌ API key is valid but has ZERO quota or has been rate limited.';
      }
      return res.status(200).json({
        success: false,
        connected: false,
        message: customMsg,
        error: errorStr,
        response: null
      });
    }
  }

  return res.status(200).json({
    success: false,
    connected: false,
    message: 'No active GROK_API_KEY, XAI_API_KEY, or GEMINI_API_KEY found in environment variables.',
    hint: 'Add GROK_API_KEY=your_key to server/.env and restart the server.',
    response: null
  });
};

// ─────────────────────────────────────────────
// Startup Verification: Test AI service connection
// ─────────────────────────────────────────────
export const verifyAIConnectionOnStartup = async () => {
  const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (grokKey && !grokKey.includes('your_')) {
    const config = getAIClientConfig(grokKey);
    try {
      const openai = new OpenAI({
        apiKey: grokKey,
        baseURL: config.baseURL
      });
      await openai.chat.completions.create({
        model: config.model,
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 5,
        temperature: 0.1
      });
      console.log(`🤖 AI Service Status: SUCCESS (Connected to Groq/Grok model '${config.model}' via ${config.baseURL})`);
    } catch (err) {
      console.error(`❌ AI Service Status: FAILED (Model: ${config.model}, URL: ${config.baseURL}). Error: ${err.message || err}`);
    }
    return;
  }

  if (geminiKey && !geminiKey.includes('your_')) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
      await model.generateContent('Say OK');
      console.log(`🤖 AI Service Status: SUCCESS (Connected to Gemini model '${GEMINI_MODEL}')`);
    } catch (err) {
      console.error(`❌ AI Service Status: FAILED (Gemini). Error: ${err.message || err}`);
    }
    return;
  }

  console.log('⚠️ AI Service Status: FAILED (No API Key found in server/.env)');
};

// ─────────────────────────────────────────────
// POST /api/ai/chat — Stateless chat endpoint (saves history internally)
// ─────────────────────────────────────────────
export const chatDirect = async (req, res) => {
  const { scenario, language, level, messages } = req.body;
  const userId = req.user._id || req.user.id;

  // Validate inputs
  if (!scenario || !language || !level || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ success: false, message: 'Invalid input parameters. Must provide scenario, language, level, and messages array.' });
  }

  // Rate Limiting
  if (!checkRateLimit(userId, 'chat_direct', 30, 60000)) {
    return res.status(429).json({ success: false, message: 'Too many messages. Please slow down.' });
  }

  try {
    // Find or create session history
    const userSessions = await findAIPracticeSessionsByUserId(userId);
    let session = userSessions.find(s => s.scenario === scenario && s.language === language && s.level === level);
    
    if (!session) {
      const sessionData = {
        userId,
        scenario,
        language,
        level,
        messages: [],
        score: { fluency: 0, grammar: 0, vocabulary: 0 },
        feedback: { suggestions: '', grammarMistakes: [], recommendedVocab: [] }
      };
      session = await createAIPracticeSession(sessionData);
    }

    const sessionId = session._id || session.id;
    const lastUserMsg = messages[messages.length - 1]?.content || 'Hola';

    // Route to sendMessageToSession logic directly
    req.params = { sessionId };
    req.body = { message: lastUserMsg };
    return await sendMessageToSession(req, res);
  } catch (error) {
    console.error('[AI] Direct chat error:', error);
    return res.status(500).json({ success: false, message: 'Could not process chat request' });
  }
};

// ─────────────────────────────────────────────
// POST /api/ai/grammar-check — Direct grammar checker
// ─────────────────────────────────────────────
const getSimulatedGrammarCheck = (text, language) => {
  let hasErrors = false;
  let correction = text;
  let explanation = '';
  let suggestions = [];

  const norm = text.toLowerCase().trim();
  const lang = language || 'Spanish';

  if (lang.toLowerCase() === 'spanish' && (norm.includes('yo querer') || norm.includes('yo quiere'))) {
    hasErrors = true;
    correction = text.replace(/yo querer/i, 'quiero').replace(/yo quiere/i, 'quiero');
    explanation = "In Spanish, subject pronouns (like 'yo') are often omitted. Also, the verb 'querer' conjugates to 'quiero' in the first-person singular present.";
    suggestions = ["Quiero ordenar la comida.", "Me gustaría pedir un plato, por favor."];
  } else if (lang.toLowerCase() === 'french' && (norm.includes('je vouloir') || norm.includes('je veut'))) {
    hasErrors = true;
    correction = text.replace(/je vouloir/i, 'je veux').replace(/je veut/i, 'je veux');
    explanation = "In French, the verb 'vouloir' conjugates to 'veux' for the first-person singular 'je'.";
    suggestions = ["Je veux un croissant, s'il vous plaît.", "Je voudrais commander."];
  } else if (lang.toLowerCase() === 'english' && (norm.includes('i wants') || norm.includes('i is'))) {
    hasErrors = true;
    correction = text.replace(/i wants/i, 'I want').replace(/i is/i, 'I am');
    explanation = "In English, the first-person singular subject pronoun 'I' takes 'want' (not 'wants') and 'am' (not 'is').";
    suggestions = ["I want to order a coffee.", "I would like to order a coffee."];
  }

  return {
    hasErrors,
    correction,
    explanation,
    suggestions
  };
};

const getSimulatedVocabularyHelp = (word, language, context) => {
  const localDict = {
    spanish: {
      cafe: { meaning: "A hot dark beverage brewed from ground coffee beans, or a coffee house.", translation: "coffee / café", examples: ["Quiero un café, por favor. (I want a coffee, please.)", "Nos encontramos en el café. (We meet at the café.)"], synonyms: ["cafetería", "marrón"] },
      reserva: { meaning: "A securing of a room, seat, or table in advance.", translation: "reservation", examples: ["Tengo una reserva hoy. (I have a reservation today.)"], synonyms: ["reservación", "cita"] },
      cuenta: { meaning: "The billing check at a restaurant.", translation: "bill", examples: ["Tráigame la cuenta, por favor. (Bring me the bill, please.)"], synonyms: ["factura", "cobro"] }
    },
    french: {
      cafe: { meaning: "A dark hot coffee drink, or Bistro.", translation: "coffee / café", examples: ["Je bois du café. (I am drinking coffee.)"], synonyms: ["bistrot", "cafétéria"] }
    }
  };

  const lang = language || 'Spanish';
  const dict = localDict[lang.toLowerCase()] || localDict['spanish'];
  const item = dict[word.toLowerCase().trim()] || {
    meaning: "A word in the target language.",
    translation: `English translation of ${word}`,
    examples: [`This is an example sentence for ${word}.`],
    synonyms: []
  };

  return {
    word,
    meaning: item.meaning,
    translation: item.translation,
    examples: item.examples,
    synonyms: item.synonyms
  };
};

const getSimulatedPronunciationHelp = (word, language) => {
  const localPronounce = {
    spanish: {
      cafe: { phonetic: "cah-FEH", guide: "Pronounce 'cah' like cat, and 'feh' like fed. Emphasize the final syllable.", audioFriendlyText: "cah FEH", tips: ["Stress the final 'e' sharply.", "Keep vowel sounds short."] },
      reserva: { phonetic: "reh-SEHR-bah", guide: "Roll the start 'r'. Pronounce 'sehr' like share with a short 'e'.", audioFriendlyText: "reh SEHR bah", tips: ["Practice rolling the 'r'.", "Spanish 'v' sounds like 'b'."] }
    }
  };

  const lang = language || 'Spanish';
  const dict = localPronounce[lang.toLowerCase()] || localPronounce['spanish'];
  const item = dict[word.toLowerCase().trim()] || {
    phonetic: word,
    guide: "Pronounce word syllable-by-syllable matching native vowel structures.",
    audioFriendlyText: word,
    tips: ["Practice speaking slowly.", "Stress matching accents if present."]
  };

  return {
    word,
    phonetic: item.phonetic,
    guide: item.guide,
    audioFriendlyText: item.audioFriendlyText,
    tips: item.tips
  };
};

export const grammarCheckDirect = async (req, res) => {
  const { text, language } = req.body;
  const userId = req.user._id || req.user.id;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ success: false, message: 'Text string is required.' });
  }
  if (text.length > 500) {
    return res.status(400).json({ success: false, message: 'Text is too long (maximum 500 characters).' });
  }
  const lang = language || 'Spanish';

  if (!checkRateLimit(userId, 'grammar_check', 30, 60000)) {
    return res.status(429).json({ success: false, message: 'Too many grammar checks. Please slow down.' });
  }

  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.includes('your_')) {
    const sim = getSimulatedGrammarCheck(text, lang);
    return res.status(200).json({
      success: true,
      ...sim,
      simulated: true
    });
  }

  const systemPrompt = `You are a helpful language tutor checking student grammar.
Analyze the following sentence written in ${lang}. Detect if there are spelling, conjugation, gender agreement, or phrasing errors.
You MUST reply strictly with a valid JSON object. Keys:
1. "hasErrors": (boolean) true if any error is found, false otherwise.
2. "correction": (string) the corrected text, or the original text if no errors exist.
3. "explanation": (string) a simple English explanation of the error and rules, or empty string if correct.
4. "suggestions": (array of strings) 1-2 native/natural alternatives to express the same thought.`;

  const contents = [{ role: 'user', parts: [{ text: `Check this sentence: "${text}"` }] }];

  try {
    const result = await callAIService(contents, systemPrompt);
    if (result.ok) {
      const parsed = JSON.parse(result.text);
      return res.status(200).json({
        success: true,
        hasErrors: parsed.hasErrors ?? false,
        correction: parsed.correction || text,
        explanation: parsed.explanation || '',
        suggestions: parsed.suggestions || [],
        simulated: false
      });
    }
    const sim = getSimulatedGrammarCheck(text, lang);
    return res.status(200).json({
      success: true,
      ...sim,
      simulated: true
    });
  } catch (err) {
    console.error('[AI] AI service grammar check error:', err);
    const sim = getSimulatedGrammarCheck(text, lang);
    return res.status(200).json({
      success: true,
      ...sim,
      simulated: true
    });
  }
};

export const vocabularyHelpDirect = async (req, res) => {
  const { word, language, context } = req.body;
  const userId = req.user._id || req.user.id;

  if (!word || typeof word !== 'string') {
    return res.status(400).json({ success: false, message: 'Word is required.' });
  }
  if (word.length > 100) {
    return res.status(400).json({ success: false, message: 'Word is too long.' });
  }
  const lang = language || 'Spanish';

  if (!checkRateLimit(userId, 'vocab_help', 30, 60000)) {
    return res.status(429).json({ success: false, message: 'Too many vocabulary lookups. Please slow down.' });
  }

  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.includes('your_')) {
    const sim = getSimulatedVocabularyHelp(word, lang, context);
    return res.status(200).json({
      success: true,
      ...sim,
      simulated: true
    });
  }

  const systemPrompt = `You are a helpful dictionary.
Analyze the word: '${word}' in the language ${lang}. Provide its English meaning, direct translation, example sentences with English translations in parentheses, and synonyms in ${lang}.
If context is provided, explain the word's meaning in that specific context.
Context: '${context || ''}'

You MUST reply strictly with a valid JSON object. Keys:
1. "word": (string) the word.
2. "meaning": (string) English explanation of the word.
3. "translation": (string) direct English translation.
4. "examples": (array of strings) 2 example sentences using the word with English translations in parentheses.
5. "synonyms": (array of strings) 2-3 synonyms in ${lang}.`;

  const contents = [{ role: 'user', parts: [{ text: `Provide vocab info for: "${word}"` }] }];

  try {
    const result = await callAIService(contents, systemPrompt);
    if (result.ok) {
      const parsed = JSON.parse(result.text);
      return res.status(200).json({
        success: true,
        word: parsed.word || word,
        meaning: parsed.meaning || '',
        translation: parsed.translation || '',
        examples: parsed.examples || [],
        synonyms: parsed.synonyms || [],
        simulated: false
      });
    }
    const sim = getSimulatedVocabularyHelp(word, lang, context);
    return res.status(200).json({
      success: true,
      ...sim,
      simulated: true
    });
  } catch (err) {
    console.error('[AI] AI service vocab help error:', err);
    const sim = getSimulatedVocabularyHelp(word, lang, context);
    return res.status(200).json({
      success: true,
      ...sim,
      simulated: true
    });
  }
};

export const pronunciationHelpDirect = async (req, res) => {
  const { word, language } = req.body;
  const userId = req.user._id || req.user.id;

  if (!word || typeof word !== 'string') {
    return res.status(400).json({ success: false, message: 'Word is required.' });
  }
  const lang = language || 'Spanish';

  if (!checkRateLimit(userId, 'pronounce_help', 30, 60000)) {
    return res.status(429).json({ success: false, message: 'Too many requests. Please slow down.' });
  }

  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.includes('your_')) {
    const sim = getSimulatedPronunciationHelp(word, lang);
    return res.status(200).json({
      success: true,
      ...sim,
      simulated: true
    });
  }

  const systemPrompt = `You are a helpful pronunciation coach.
Provide pronunciation guidance for the word: '${word}' in ${lang} for English speakers.
You MUST reply strictly with a valid JSON object. Keys:
1. "word": (string) the word.
2. "phonetic": (string) phonetic spelling or syllable breakdown.
3. "guide": (string) simple explanation of how to pronounce it.
4. "audioFriendlyText": (string) space-separated phonetic breakdown for screen reader/speech synthesis.
5. "tips": (array of strings) 1-2 helpful tips for native-like pronunciation.`;

  const contents = [{ role: 'user', parts: [{ text: `Provide pronunciation info for: "${word}"` }] }];

  try {
    const result = await callAIService(contents, systemPrompt);
    if (result.ok) {
      const parsed = JSON.parse(result.text);
      return res.status(200).json({
        success: true,
        word: parsed.word || word,
        phonetic: parsed.phonetic || '',
        guide: parsed.guide || '',
        audioFriendlyText: parsed.audioFriendlyText || word,
        tips: parsed.tips || [],
        simulated: false
      });
    }
    const sim = getSimulatedPronunciationHelp(word, lang);
    return res.status(200).json({
      success: true,
      ...sim,
      simulated: true
    });
  } catch (err) {
    console.error('[AI] AI service pronounce help error:', err);
    const sim = getSimulatedPronunciationHelp(word, lang);
    return res.status(200).json({
      success: true,
      ...sim,
      simulated: true
    });
  }
};

export const evaluatePronunciation = async (req, res) => {
  const { phrase, audioUrl } = req.body;
  const userId = req.user._id || req.user.id;

  if (!phrase || !audioUrl) {
    return res.status(400).json({ success: false, message: 'Phrase and audioUrl are required.' });
  }

  // Security: Check supported audio formats only
  const match = audioUrl.match(/^data:(audio\/[a-zA-Z0-9.-]+);base64,/);
  if (!match) {
    return res.status(400).json({ success: false, message: 'Invalid audio format. Must be a base64 encoded audio file.' });
  }
  const allowedFormats = ['audio/webm', 'audio/ogg', 'audio/mp3', 'audio/mp4', 'audio/wav', 'audio/x-wav'];
  if (!allowedFormats.includes(match[1])) {
    return res.status(400).json({ success: false, message: `Unsupported audio format: ${match[1]}` });
  }

  // Security: Limit file size to ~5MB (Base64 length ~ 6.6MB)
  if (audioUrl.length > 7000000) {
    return res.status(400).json({ success: false, message: 'Audio file too large. Maximum size is 5MB.' });
  }

  try {
    const transcript = await transcribeAudioMessage(audioUrl);
    
    // Fallback if transcription completely failed
    let transcriptFinal = transcript;
    if (transcript.includes('not available') || transcript.includes('Simulated transcription')) {
      transcriptFinal = "I couldn't hear you clearly.";
    }

    // Now evaluate the transcript vs phrase using AI
    let score = 0, fluencyScore = 0, accuracyScore = 0;
    let tips = [], mispronouncedWords = [];

    const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || process.env.GEMINI_API_KEY;
    if (apiKey && !apiKey.includes('your_')) {
      const systemPrompt = `You are a strict but helpful pronunciation coach.
The user was asked to pronounce the phrase: "${phrase}".
The speech-to-text transcript generated from their audio is: "${transcriptFinal}".

Compare them and respond strictly in JSON format with these keys:
- "score": (number 0-100) Overall score
- "fluencyScore": (number 0-100) How smoothly they spoke
- "accuracyScore": (number 0-100) How accurate the words were to the prompt
- "tips": (array of strings) 1-2 tips for improvement
- "mispronouncedWords": (array of strings) words they missed or struggled with`;

      const contents = [{ role: 'user', parts: [{ text: "Evaluate my pronunciation." }] }];
      const result = await callAIService(contents, systemPrompt);
      if (result.ok) {
        try {
          const parsed = JSON.parse(result.text.replace(/```json/g, '').replace(/```/g, '').trim());
          score = parsed.score || Math.floor(Math.random() * 40) + 40;
          fluencyScore = parsed.fluencyScore || score;
          accuracyScore = parsed.accuracyScore || score;
          tips = parsed.tips || ["Keep practicing!"];
          mispronouncedWords = parsed.mispronouncedWords || [];
        } catch(e) {
          // parse error
          score = 65; fluencyScore = 60; accuracyScore = 70; tips = ["Keep practicing your pronunciation."];
        }
      } else {
        score = 65; fluencyScore = 60; accuracyScore = 70; tips = ["Keep practicing your pronunciation."];
      }
    } else {
      // Simulated evaluation
      score = transcriptFinal.length > 5 ? 85 : 45;
      fluencyScore = 80;
      accuracyScore = 90;
      tips = ["Great job!", "Try speaking a bit louder next time."];
      mispronouncedWords = [];
    }

    // Save attempt
    let attempt;
    if (!isFallbackMode()) {
      const PronunciationAttempt = (await import('../models/PronunciationAttempt.js')).default;
      attempt = await PronunciationAttempt.create({
        userId,
        phrase,
        transcript: transcriptFinal,
        score,
        fluencyScore,
        accuracyScore,
        tips,
        mispronouncedWords,
        audioUrl
      });
    } else {
      const db = readJsonDb();
      attempt = {
        _id: new Date().getTime().toString(),
        userId,
        phrase,
        transcript: transcriptFinal,
        score,
        fluencyScore,
        accuracyScore,
        tips,
        mispronouncedWords,
        audioUrl,
        createdAt: new Date().toISOString()
      };
      if(!db.pronunciationAttempts) db.pronunciationAttempts = [];
      db.pronunciationAttempts.push(attempt);
      writeJsonDb(db);
    }

    res.status(200).json({
      success: true,
      evaluation: attempt
    });
  } catch (err) {
    console.error('Evaluate Pronunciation Error:', err);
    res.status(500).json({ success: false, message: 'Server error while evaluating pronunciation' });
  }
};

export const getPronunciationHistory = async (req, res) => {
  const userId = req.user._id || req.user.id;
  try {
    let history = [];
    if (!isFallbackMode()) {
      const PronunciationAttempt = (await import('../models/PronunciationAttempt.js')).default;
      history = await PronunciationAttempt.find({ userId }).sort({ createdAt: -1 }).limit(20);
    } else {
      const db = readJsonDb();
      history = (db.pronunciationAttempts || [])
        .filter(p => p.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 20);
    }
    res.status(200).json({ success: true, history });
  } catch (err) {
    console.error('Get Pronunciation History Error:', err);
    res.status(500).json({ success: false, message: 'Server error while fetching pronunciation history' });
  }
};
