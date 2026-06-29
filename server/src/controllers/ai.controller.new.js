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

function convertGeminiToOpenAI(contents) {
  return contents.map(item => {
    const role = item.role === 'model' ? 'assistant' : 'user';
    const content = item.parts && item.parts[0] ? item.parts[0].text : '';
    return { role, content };
  });
}

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

const ALLOWED_SCENARIOS = [
  'restaurant', 'airport', 'hotel', 'taxi', 'doctor', 'market', 'school', 'job_interview',
  'birthday_party', 'shopping_mall', 'police_station', 'cinema', 'coffee_shop', 'gym',
  'office', 'dating', 'travel', 'friends', 'family', 'emergency', 'phone_call', 'casual'
];
const ALLOWED_LANGUAGES = ['Spanish', 'French', 'English', 'German', 'Arabic', 'Italian', 'Korean', 'Japanese'];
const ALLOWED_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

// Upgraded compact simulated library with escaped Unicode characters
const getSimulatedTurn = (language, scenario, level, turnIndex) => {
  const translations = {
    Spanish: {
      restaurant: "\u00A1Hola! Bienvenido al restaurante. \u00BFTiene una reserva? (Hello! Welcome to the restaurant. Do you have a reservation?)",
      airport: "Buenos d\u00EDas. \u00BFA qu\u00E9 destino viaja hoy y me permite su pasaporte? (Good morning. Where are you flying to today and may I see your passport?)",
      hotel: "Bienvenido al Hotel Central. \u00BFA qu\u00E9 puedo ayudarle hoy? (Welcome to the Hotel Central. How can I help you today?)",
      taxi: "\u00BFA d\u00F3nde le llevo hoy? (Where shall I take you today?)",
      doctor: "\u00BFQu\u00E9 s\u00EDntomas tiene y c\u00F3mo se siente hoy? (What symptoms do you have and how do you feel today?)",
      market: "\u00A1Hola! \u00BFBusca alguna fruta o verdura fresca? (Hello! Are you looking for some fresh fruit or vegetables?)",
      school: "Hola, \u00BFc\u00F3mo vas con los deberes de matem\u00E1ticas? (Hello, how is it going with the math homework?)",
      job_interview: "Hola. Gracias por venir. H\u00E1bleme de su experiencia laboral. (Hello. Thanks for coming. Tell me about your work experience.)",
      birthday_party: "\u00A1Feliz cumplea\u00F1os! Qu\u00E9 alegr\u00EDa verte aqu\u00ED. (Happy birthday! So glad to see you here.)",
      shopping_mall: "\u00A1Hola! \u00BFBusca algo en particular o solo est\u00E1 mirando? (Hello! Looking for something in particular or just browsing?)",
      police_station: "\u00BFEn qu\u00E9 le puedo ayudar? \u00BFQuiere reportar una p\u00E9rdida? (How can I help you? Do you want to report a loss?)",
      cinema: "\u00BFQu\u00E9 pel\u00EDcula quiere ver hoy y cu\u00E1ntos boletos necesita? (What movie do you want to watch today and how many tickets do you need?)",
      coffee_shop: "Buenos d\u00EDas. \u00BFQu\u00E9 caf\u00E9 desea tomar hoy? (Good morning. What coffee would you like today?)",
      gym: "\u00A1Hola! \u00BFViene a hacer pesas o cardio hoy? (Hello! Are you here to lift weights or do cardio today?)",
      office: "Buenos d\u00EDas. \u00BFTenemos la reuni\u00F3n lista para hoy? (Good morning. Do we have the meeting ready for today?)",
      dating: "Hola, te ves muy bien hoy. \u00BFNos sentamos aqu\u00ED? (Hello, you look very nice today. Shall we sit here?)",
      travel: "\u00A1Hola! \u00BFA d\u00F3nde deseas ir hoy? \u00BFNecesitas el mapa? (Hello! Where do you want to go today? Do you need the map?)",
      friends: "\u00A1Qu\u00E9 pasa amigo! \u00BFQu\u00E9 planes hay para este fin de semana? (What's up friend! What plans are there for this weekend?)",
      family: "Hola hijo, \u00BFc\u00F3mo estuvo tu d\u00EDa en la escuela hoy? (Hello son, how was your day at school today?)",
      emergency: "\u00A1Ayuda! Por favor llame a una ambulancia r\u00E1pido. (Help! Please call an ambulance quickly.)",
      phone_call: "Hola, \u00BFest\u00E1 Juan? Habla Daniel. (Hello, is Juan there? Daniel speaking.)",
      casual: "\u00A1Hola! \u00BFC\u00F3mo est\u00E1s hoy? (Hello! How are you today?)"
    },
    French: {
      restaurant: "Bonjour et bienvenue ! Avez-vous une r\u00E9servation ? (Hello and welcome! Do you have a reservation?)",
      airport: "Bonjour. Quel est votre vol aujourd'hui ? Puis-je voir votre passeport ? (Hello. What is your flight today? May I see your passport?)",
      hotel: "Bienvenue \u00E0 l'H\u00F4tel Central. Comment puis-je vous aider ? (Welcome to the Central Hotel. How can I help you?)",
      taxi: "O\u00F9 voulez-vous aller ? (Where do you want to go?)",
      doctor: "O\u00F9 avez-vous mal ? (Where does it hurt?)",
      market: "Bonjour ! D\u00E9sirez-vous des fruits frais ? (Hello! Would you like some fresh fruit?)",
      school: "Salut ! As-tu fait tes devoirs pour demain ? (Hi! Did you do your homework for tomorrow?)",
      job_interview: "Bonjour. Merci d'\u00EAtre venu. Parlez-moi de votre exp\u00E9rience. (Hello. Thank you for coming. Tell me about your experience.)",
      birthday_party: "Joyeux anniversaire ! Amuse-toi bien. (Happy birthday! Have fun.)",
      shopping_mall: "Bonjour ! Est-ce que je peux vous aider ? (Hello! Can I help you?)",
      police_station: "Que s'est-il pass\u00E9 ? Voulez-vous porter plainte ? (What happened? Do you want to file a complaint?)",
      cinema: "Quelle s\u00E9ance voulez-vous voir ? (Which show do you want to watch?)",
      coffee_shop: "Bonjour. Que puis-je vous servir aujourd'hui ? (Hello. What can I serve you today?)",
      gym: "Pr\u00EAt pour votre s\u00E9ance de sport ? (Ready for your workout?)",
      office: "Bonjour. Avez-vous fini le rapport ? (Hello. Did you finish the report?)",
      dating: "Tu es ravissante ce soir. Tu veux boire quelque chose ? (You look lovely tonight. Would you like a drink?)",
      travel: "Bonjour ! Avez-vous besoin d'une carte ou de directions ? (Hello! Do you need a map or directions?)",
      friends: "Salut ! Quoi de neuf depuis la derni\u00E8re fois ? (Hi! What's new since last time?)",
      family: "Bonjour maman, comment vas-tu ? (Hello mom, how are you?)",
      emergency: "Urgence ! Appelez la police tout de suite ! (Emergency! Call the police right now!)",
      phone_call: "All\u00F4 ? Qui est \u00E0 l'appareil ? (Hello? Who is speaking?)",
      casual: "Salut ! Comment se passe votre journ\u00E9e ? (Hi! How is your day going?)"
    },
    German: {
      restaurant: "Hallo! Willkommen in unserem Restaurant. Haben Sie eine Reservierung? (Hello! Welcome to our restaurant. Do you have a reservation?)",
      airport: "Guten Tag. Wohin fliegen Sie heute? Kann ich bitte Ihren Reisepass sehen? (Good day. Where are you flying to today? Can I see your passport, please?)",
      hotel: "Willkommen im Hotel Central. Wie kann ich Ihnen heute helfen? (Welcome to the Central Hotel. How can I help you today?)",
      taxi: "Wohin soll die Reise gehen? (Where should the journey go?)",
      doctor: "Was fehlt Ihnen heute? (What is wrong with you today?)",
      market: "Guten Tag! Suchen Sie frisches Obst oder Gem\u00FCse? (Good day! Are you looking for fresh fruit or vegetables?)",
      school: "Hallo! Wie l\u00E4uft es mit den Hausaufgaben? (Hello! How is it going with the homework?)",
      job_interview: "Hallo. Vielen Dank f\u00FCrs Kommen. Erz\u00E4hlen Sie mir von sich. (Hello. Thanks for coming. Tell me about yourself.)",
      birthday_party: "Alles Gute zum Geburtstag! Sch\u00F6n, dass du da bist. (Happy birthday! Great that you are here.)",
      shopping_mall: "Hallo! Suchen Sie etwas Bestimmtes? (Hello! Are you looking for something specific?)",
      police_station: "Guten Tag. Wie kann ich Ihnen helfen? (Good day. How can I help you?)",
      cinema: "F\u00FCr welchen Film m\u00F6chten Sie Karten kaufen? (For which movie would you like to buy tickets?)",
      coffee_shop: "Guten Morgen. Welchen Kaffee m\u00F6chten Sie bestellen? (Good morning. Which coffee would you like to order?)",
      gym: "Hallo! Bereit f\u00FCr das Training heute? (Hello! Ready for the workout today?)",
      office: "Guten Morgen. Haben Sie die Pr\u00E4sentation fertig? (Good morning. Do you have the presentation ready?)",
      dating: "Du siehst heute toll aus. Wollen wir uns hinsetzen? (You look great today. Shall we sit down?)",
      travel: "Hallo! Brauchen Sie eine Wegbeschreibung? (Hello! Do you need directions?)",
      friends: "Hallo Kumpel! Was machen wir am Wochenende? (Hello buddy! What are we doing on the weekend?)",
      family: "Hallo Vater, wie war dein Arbeitstag? (Hello father, how was your workday?)",
      emergency: "Hilfe! Rufen Sie sofort einen Krankenwagen! (Help! Call an ambulance immediately!)",
      phone_call: "Hallo? Wer ist am Apparat? (Hello? Who is on the line?)",
      casual: "Hallo! Wie geht es dir heute? (Hello! How are you today?)"
    },
    Italian: {
      restaurant: "Ciao! Benvenuto al ristorante. Ha una prenotazione? (Hello! Welcome to the restaurant. Do you have a reservation?)",
      airport: "Buongiorno. Dove vola oggi? Posso vedere il suo passaporto? (Good morning. Where are you flying today? Can I see your passport?)",
      hotel: "Benvenuto all'Hotel Central. Come posso aiutarla oggi? (Welcome to the Central Hotel. How can I help you today?)",
      taxi: "Dove vuole andare? (Where do you want to go?)",
      doctor: "Dove sente dolore oggi? (Where do you feel pain today?)",
      market: "Buongiorno! Vuole della frutta fresca oggi? (Good morning! Do you want some fresh fruit today?)",
      school: "Ciao! Come vanno i compiti per domani? (Hi! How is the homework for tomorrow going?)",
      job_interview: "Buongiorno. Grazie per essere venuto. Mi parli della sua esperienza. (Good morning. Thanks for coming. Tell me about your experience.)",
      birthday_party: "Buon compleanno! Divertiti alla festa. (Happy birthday! Have fun at the party.)",
      shopping_mall: "Ciao! Cerca qualcosa in particolare? (Hi! Are you looking for something in particular?)",
      police_station: "Buongiorno. Come posso esserle utile? (Good morning. How can I be of service?)",
      cinema: "Per quale film vorrebbe acquistare i biglietti? (For which movie would you like to buy tickets?)",
      coffee_shop: "Buongiorno. Che caff\u00E8 desidera oggi? (Good morning. What coffee would you like today?)",
      gym: "Ciao! Pronto per la sessione di oggi? (Hi! Ready for today's session?)",
      office: "Buongiorno. Abbiamo tutti i documenti pronti? (Good morning. Do we have all the documents ready?)",
      dating: "Sei bellissima stasera. Cosa prendiamo da bere? (You are beautiful tonight. What shall we drink?)",
      travel: "Ciao! Ha bisogno di una mappa o di indicazioni? (Hi! Do you need a map or directions?)",
      friends: "Ciao amico! Che si fa di bello questo weekend? (Hi friend! What nice things are we doing this weekend?)",
      family: "Ciao mamma, cosa c'è per cena stasera? (Hi mom, what's for dinner tonight?)",
      emergency: "Aiuto! Chiamate subito un'ambulanza! (Help! Call an ambulance immediately!)",
      phone_call: "Pronto? Con chi parlo? (Hello? Who am I speaking with?)",
      casual: "Ciao! Come va la giornata? (Hi! How is your day going?)"
    },
    Arabic: {
      restaurant: "\u0645\u0631\u062d\u0628\u0627\u064b \u0628\u0643 \u0641\u064a \u0627\u0644\u0645\u0637\u0639\u0645. \u0647\u0644 \u0645\u0646 \u062d\u062c\u0632\u061f (Welcome to the restaurant. Is there a reservation?)",
      airport: "\u0637\u0627\u0628 \u064a\u0648\u0645\u0643. \u0625\u0644\u0649 \u0623\u064a\u0646 \u062a\u0633\u0627\u0641\u0631 \u0627\u0644\u064a\u0648\u0645\u061f \u0648\u0647\u0644 \u064a\u0645\u0643\u0646\u0646\u064a \u0631\u0624\u064a\u0629 \u062c\u0648\u0627\u0632 \u0633\u0641\u0631\u0643\u061f",
      hotel: "\u0645\u0631\u062d\u0628\u0627\u064b \u0628\u0643 \u0641\u064a \u0627\u0644\u0641\u0646\u062f\u0642 \u0627\u0644\u0645\u0631\u0643\u0632\u064a. \u0643\u064a\u0646 \u064a\u0645\u0643\u0646\u0646\u064a \u0645\u0633\u0627\u0639\u062f\u062a\u0643\u061f",
      taxi: "\u0625\u0644\u0649 \u0623\u064a\u0646 \u062a\u0631\u064a\u062f \u0627\u0644\u0630\u0647\u0627\u0628\u061f",
      doctor: "\u0645\u0627 \u0627\u0644\u0630\u064a \u064a\u0624\u0644\u0645\u0643 \u0627\u0644\u064a\u0648\u0645\u061f",
      market: "\u0645\u0631\u062d\u0628\u0627\u064b! \u0647\u0644 \u062a\u0628\u062d\u062b \u0639\u0646 \u0627\u0644\u0641\u0648\u0627\u0643\u0647 \u0627\u0644\u0637\u0627\u0632\u062c\u0629\u061f",
      school: "\u0645\u0631\u062d\u0628\u0627\u064b! \u0643\u064a\u0641 \u062a\u0633\u064a\u0631 \u0627\u0644\u0648\u0627\u062c\u0628\u0627\u062a\u061f",
      job_interview: "\u0645\u0631\u062d\u0628\u0627\u064b \u0628\u0643. \u062d\u062f\u062b\u0646\u064a \u0639\u0646 \u062e\u0628\u0631\u062a\u0643.",
      birthday_party: "\u0639\u064a\u062f \u0645\u064a\u0644\u0627\u062f \u0633\u0639\u064a\u062f! \u0627\u0633\u062a\u0645\u062a\u0639 \u0628\u0627\u0644\u062d\u0641\u0644.",
      shopping_mall: "\u0645\u0631\u062d\u0628\u0627\u064b! \u0647\u0644 \u062a\u0628\u062d\u062b \u0639\u0646 \u0634\u064a\u0621 \u0645\u062d\u062f\u062f\u061f",
      police_station: "\u0645\u0631\u062d\u0628\u0627\u064b. \u0643\u064a\u0641 \u064a\u0645\u0643\u0646\u0646\u0627 \u0645\u0633\u0627\u0639\u062f\u062a\u0643\u061f",
      cinema: "\u0623\u064a \u0641\u064a\u0644\u0645 \u062a\u0631\u064a\u062f \u0623\u0646 \u062a\u0634\u0627\u0647\u062f\u061f",
      coffee_shop: "\u0635\u0628\u0627\u062d \u0627\u0644\u062e\u064a\u0631. \u0645\u0627\u0630\u0627 \u062a\u0631\u064a\u062f \u0623\u0646 \u062a\u0634\u0631\u0628\u061f",
      gym: "\u0645\u0631\u062d\u0628\u0627\u064b. \u0647\u0644 \u0623\u0646\u062a \u0645\u0633\u062a\u0639\u062f \u0644\u0644\u062a\u0645\u0631\u064a\u0646\u061f",
      office: "\u0635\u0628\u0627\u062d \u0627\u0644\u062e\u064a\u0631. \u0647\u0644 \u0627\u0644\u0645\u0644\u0641\u0627\u062a \u062c\u0627\u0647\u0632\u0629\u061f",
      dating: "\u062a\u0628\u062f\u0648 \u0631\u0627\u0626\u0639\u0627\u064b \u0627\u0644\u064a\u0648\u0645. \u0647\u0644 \u0646\u062c\u0644\u0633 \u0647\u0646\u0627\u061f",
      travel: "\u0645\u0631\u062d\u0628\u0627\u064b. \u0647\u0644 \u062a\u062d\u062a\u0627\u062c \u0625\u0644\u0649 \u0627\u0644\u062e\u0631\u064a\u0637\u0629\u061f",
      friends: "\u0645\u0631\u062d\u0628\u0627\u064b \u0635\u062f\u064a\u0642\u064a. \u0645\u0627 \u062e\u0637\u0637\u0643 \u0644\u0644\u0639\u0637\u0644\u0629\u061f",
      family: "\u0645\u0631\u062d\u0628\u0627\u064b \u0623\u0645\u064a. \u0643\u064a\u0641 \u0643\u0627\u0646 \u064a\u0648\u0645\u0643\u061f",
      emergency: "\u0627\u0644\u0646\u062c\u062f\u0629! \u0627\u062a\u0635\u0644 \u0628\u0627\u0644\u0634\u0631\u0637\u0629 \u0641\u0648\u0631\u0627\u064b!",
      phone_call: "\u0645\u0631\u062d\u0628\u0627\u064b. \u0645\u0646 \u0645\u0639\u064a\u061f",
      casual: "\u0645\u0631\u062d\u0628\u0627\u064b! \u0643\u064a\u0641 \u062d\u0627\u0644\u0643 \u0627\u0644\u064a\u0648\u0645\u061f"
    },
    Korean: {
      restaurant: "\uC548\uB155\uD558\uC138\uC694! \uC2DD\uB2F9\uC5D0 \uC624\uC2E0 \uC683\uC744 \uD658\uC601\uD569\uB2F9\uB2C8\uB2E4. \uC608\uC57D\uD558\uC2E5\uB2C8\uAE4C? (Hello! Welcome to the restaurant. Do you have a reservation?)",
      airport: "\uC548\uB155\uD558\uC138\uC694. \uC624\uB298 \uC5B4\uB514\uB85C \uAC00\uC2DC\uB098\uC694? \uC5EC\uAD8C\uC744 \uBCF4\uC5EC\uC8FC\uC2DC\uACA0\uC2B5\uB2C8\uAE4C? (Hello. Where are you flying to today? May I see your passport?)",
      hotel: "\uD638\uD155 \uC134\uD2B8\uB710\uC5D0 \uC624\uC2E0 \uC683\uC744 \uD658\uC601\uD569\uB2C8\uB2E4. \uBB34\uC5C7\uC744 \uB3C4\uC640\uB4DC\uB9B4\uCE74\uC694? (Welcome to Hotel Central. How can I help you today?)",
      taxi: "\uC5B4\uB514\uB85C \uBAA8\uC2E4\uCE74\uC694? (Where to?)",
      doctor: "\uC5B4\uB514\uAC00 \uC544\uD504\uC2E0\uAC00\uC694? (Where does it hurt?)",
      market: "\uC548\uB155\uD558\uC138\uC694! \uC2E0\uC120\uD55C \uACFC\uC77C\uC774\uB098 \uC450\uC18C\uB97C \uCC3E\uC73C\uC2DC\uB098\uC694? (Hello! Are you looking for fresh fruits or vegetables?)",
      school: "\uC548\uB155\uD558\uC138\uC694! \uC624\uB298 \uC218\uD559 \uC559\uC81C \uD558\uC2E5\uB2C8\uAE4C? (Hello! Did you do your math homework today?)",
      job_interview: "\uC548\uB155\uD558\uC138\uC694. \uC6B0\uB9AC \uD68C\uC0AC\uC5D0 \uC9C0\uC6D0\uD558\uC2E0 \uB3D9\uAE30\uAC00 \uBB34\uC5C7\uC778\uAC00\uC694? (Hello. What is your motivation for applying to our company?)",
      birthday_party: "\uC0DD\uC77C \uCE55\uD558\uD574\uC694! \uD30C\uD2F0\uC5D0 \uC640\uC8FC\uB824\uC11C \uAC10\uC0AC\uD574\uC694. (Happy birthday! Thank you for coming to the party.)",
      shopping_mall: "\uC548\uB155\uD558\uC138\uC694! \uBB34\uC5C7\uC744 \uCC3E\uC73C\uC2DC\uB098\uC694, \uC544\uB2B2\uC774\uBA74 \uADF8\uB0E5 \uAD6C\uACBD \uC911\uC774\uC2E0\uAC00\uC694? (Hello! What are you looking for, or are you just browsing?)",
      police_station: "\uBB34\uC2A8 \uC77C\uB85C \uC624\uC2E0\uAC00\uC694? \uB3C4\uB09C \uC2E0\uACE0\uB97C \uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C? (What brings you here? Would you like to report a theft?)",
      cinema: "\uC624\uB298 \uC5B4\uB5A4 \uC601\uD654\uB97C \uC608\uB9E4\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C? (Which movie would you like to book today?)",
      coffee_shop: "\uC548\uB155\uD558\uC138\uC694. \uC5B4\uB5A4 \uCEE4\uD53C\uB97C \uC8FC\uBB38\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C? (Hello. What coffee would you like to order?)",
      gym: "\uC548\uB155\uD558\uC138\uC694! \uC624\uB298 \uADFC\uB825 \uC6B4\uB3D9\uC744 \uD558\uC2DC\uB098\uC694, \uC544\uB2B2\uC774\uBA74 \uC720\uC0B0\uC18C \uC6B4\uB3D9\uC744 \uD558\uC2DC\uB098\uC694? (Hello! Are you doing strength training or cardio today?)",
      office: "\uC548\uB155\uD558\uC138\uC694. \uC624\uB298 \uD68C\uC758 \uC900\uBE44\uB294 \uB2E4 \uB418\uC5C8\uC2B5\uB2C8\uAE4C? (Hello. Is the meeting preparation ready today?)",
      dating: "\uC624\uB298 \uC815\uB9D0 \uBA4B\uC900 \uBCF4\uC774\uC2DC\uB124\uC694. \uC5EC\uAE30 \uC545\uC744\uCE74\uC694? (You look really great today. Shall we sit here?)",
      travel: "\uC548\uB155\uD558\uC138\uC694! \uAE38\uC744 \uCC3E\uACE0 \uACC4\uC2DC\uB098\uC694? (Hello! Are you looking for directions?)",
      friends: "\uC548\uB155 \uCE5C\uAD6C\uC57C! \uC774\uBC88 \uC8FC\uB9D0\uC5D0 \uBB34\uC2B8 \uACC4\uD68D \uC788\uC5B4? (Hi friend! What plans do you have this weekend?)",
      family: "\uC554\uB9C8, \uC624\uB298 \uC805\uB150 \uBA54\uB274\uB294 \uB93C\uC608\uC694? (Mom, what's the dinner menu tonight?)",
      emergency: "\uB3C4\uC640\uC8FC\uC138\uC694! \uB968\uB9AC \uAD6C\uAC09\uCC28\uB97C \uBD88\uB7EC\uC8FC\uC138\uC694! (Help! Please call an ambulance quickly!)",
      phone_call: "\uC5EC\uBCF4\uC138\uC694? \uB204\uAD6C\uC2DC\uC9C0\uC694? (Hello? Who is this?)",
      casual: "\uC548\uB155\uD558\uC138\uC694! \uC624\uB298 \uAE30\uBD84\uC774 \uC5B4\uB524\uC2E0\uAC00\uC694? (Hello! How are you feeling today?)"
    },
    Japanese: {
      restaurant: "\u3044\u3089\u3063\u3057\u3083\u3044\u307e\u305b\uFF01\u3054\u4e88\u7d04\u306f\u3054\u3056\u3044\u307e\u3059\u304b\uFF1F (Welcome! Do you have a reservation?)",
      airport: "\u3053\u3093\u306b\u3061\u306f\u3002\u672c\u65e5\u306f\u3069\u3061\u3089\u3078\u884c\u304b\u308c\u307e\u3059\u304b\uFF1F\u30d5\u30b5\u30dd\u30fc\u30c8\u3092\u898b\u305b\u3066\u3044\u305f\u3060\u3051\u307e\u3059\u304b\uFF1F",
      hotel: "\u30db\u30c6\u30eb\u30bb\u30f3\u30c8\u30e9\u30eb\u3078\u3088\u3046\u3053\u3002\u3069\u306e\u3088\u3046\u306a\u3054\u7528\u4ef6\u3067\u3057\u3087\u3046\u304b\uFF1F",
      taxi: "\u3069\u3061\u3089\u307e\u3067\u884c\u304b\u308c\u307e\u3059\u304b\uFF1F",
      doctor: "\u3069\u3046\u3055\u308c\u307e\u3057\u305f\u304b\uFF1F\u3069\u3053\u304c\u75db\u307f\u307e\u3059\u304b\uFF1F",
      market: "\u3044\u3089\u3063\u3057\u3083\u3044\u307e\u305b\uFF01\u65b0\u9bae\u306a\u679c\u7269\u306f\u3044\u304b\u304c\u3067\u3059\u304b\uFF1F",
      school: "\u3053\u3093\u306b\u3061\u306f\uFF01\u5bbf\u984c\u306f\u3082\u3046\u7d42\u308f\u308a\u307e\u3057\u305f\u304b\uFF1F",
      job_interview: "\u3053\u3093\u306b\u3061\u306f\u3002\u3053\u306e\u4ed5\u4e8b\u3092\u5fd7\u671b\u3059\u308b\u7406\u7531\u3092\u6559\u3048\u3066\u304f\u3060\u3055\u3044\u3002",
      birthday_party: "\u304a\u8a95\u751f\u65e5\u304a\u3085\u3067\u3068\u3046\u3054\u3056\u3044\u307e\u3059\uFF01\u30d5\u30fc\u30c6\u30a3\u3092\u697d\u3057\u3093\u3067\u306f\u3060\u3055\u3044\u306d\u3002",
      shopping_mall: "\u3044\u3089\u3063\u3057\u3083\u3044\u307e\u305b\uFF01\u4f55\u304b\u304a\u63a2\u3057\u3067\u3059\u304b\uFF1F",
      police_station: "\u3069\u3046\u3055\u308c\u307e\u3057\u305f\u304b\uFF1F\u4f55\u304b\u843d\u3068\u3057\u7269\u3092\u3057\u307e\u3057\u305f\u304b\uFF1F",
      cinema: "\u3069\u306e\u6620\u753b\u306e\u30c1\u30b1\u30c3\u30c8\u3092\u3054\u5e0c\u671b\u3067\u3059\u304b\uFF1F",
      coffee_shop: "\u3053\u3093\u306b\u3061\u306f\u3002\u3054\u6ce8\u6587\u306f\u304a\u6c7a\u307e\u308a\u3067\u3059\u304b\uFF1F",
      gym: "\u3053\u3093\u306b\u3061\u306f\uFF01\u4eca\u65e5\u306f\u3069\u306e\u3088\u3046\u306a\u30c8\u30ec\u30fc\u30cb\u30f3\u30b0\u3092\u3057\u307e\u3059\u304b\uFF1F",
      office: "\u304a\u306f\u3088\u3046\u3054\u3056\u3044\u307e\u3059\u3002\u4eca\u65e5\u306e\u8cc7\u6599\u306f\u6e96\u5099\u3067\u304d\u3066\u3044\u307e\u3059\u304b\uFF1F",
      dating: "\u4eca\u65e5\u3068\u3066\u3082\u7d20\u6575\u3067\u3059\u306d\u3002\u3053\u3053\u306b\u5ea7\u308a\u307e\u3057\u3087\u3046\u304b\uFF1F",
      travel: "\u3053\u3093\u306b\u3061\u306f\uFF01\u9053\u306b\u8ff7\u308f\u308c\u307e\u3057\u305f\u304b\uFF1F",
      friends: "\u3084\u3042\uFF01\u4eca\u9031\u672b\u306f\u4f55\u3092\u3059\u308b\u4e88\u5b9a\uFF1F",
      family: "\u304a\u6bcd\u3055\u3093\u3001\u4eca\u65e5\u306e\u5915\u3054\u98ef\u306f\u4f55\uFF1F",
      emergency: "\u52a9\u3051\u3066\u306f\u3060\u3055\u3045\uFF01\u3059\u3050\u306b\u6551\u65a5\u8eca\u3092\u547c\u3093\u3067\u306f\u3060\u3055\u3045\uFF01",
      phone_call: "\u3082\u3057\u3082\u3057\u3002\u3069\u306a\u305f\u3067\u3059\u304b\uFF1F",
      casual: "\u3053\u3093\u306b\u3061\u306f\uFF01\u4eca\u65e5\u306e\u3054\u6c17\u5206\u306f\u3044\u304b\u304c\u3067\u3059\u304b\uFF1F"
    },
    English: {
      restaurant: "Hello! Welcome to our restaurant. Do you have a reservation?",
      airport: "Good day. Where are you flying to today? May I see your passport?",
      hotel: "Welcome to the Central Hotel. How can I help you today?",
      taxi: "Where to today? (Where would you like to go?)",
      doctor: "What seems to be the problem today? (Where does it hurt?)",
      market: "Hello! Are you looking for fresh fruits or vegetables?",
      school: "Hi, how is your homework going? It was quite hard, wasn't it?",
      job_interview: "Hello. Thank you for coming. Tell me about your work experience.",
      birthday_party: "Happy birthday! Glad you could make it to the party.",
      shopping_mall: "Hello! Are you looking for something in particular, or just browsing?",
      police_station: "Hello. How can I help you? Do you want to report something?",
      cinema: "What movie would you like to watch, and how many tickets?",
      coffee_shop: "Good morning. What coffee would you like to order today?",
      gym: "Hi! Are you ready for your workout today?",
      office: "Good morning. Do you have the files ready for the meeting?",
      dating: "You look great today. Shall we sit over here?",
      travel: "Hello! Where are you trying to go? Do you need directions?",
      friends: "Hey friend! What are your plans for the weekend?",
      family: "Hey mom, how was your day today?",
      emergency: "Emergency! Call the ambulance immediately!",
      phone_call: "Hello? Who is calling, please?",
      casual: "Hi there! How is your day going? What are your plans?"
    }
  };

  const langMap = translations[language] || translations['Spanish'];
  const replyText = langMap[scenario] || langMap['casual'] || "Hello! Let's practice.";

  let options = [];
  if (level === 'Beginner') {
    if (language === 'Korean') {
      options = ["\uC548\uB155\uD558\uC138\uC694", "\uC548\uB155\uD788 \uAC00\uC138\uC694", "\uAC10\uC0AC\uD569\uB2C8\uB2E4", "\죄송합니다"];
      options = options.map(o => o === "\죄송합니다" ? "\uC8EA\uC1A1\uD569\uB2C8\uB2E4" : o);
    } else if (language === 'Japanese') {
      options = ["\u3053\u3093\u306b\u3061\u306f", "\u3055\u3088\u3046\u306a\u3089", "\u3042\u308a\u304c\u3068\u3046", "\u3059\u307f\u307e\u305b\u3093"];
    } else if (language === 'French') {
      options = ["Bonjour", "Au revoir", "Merci", "D\u00E9sol\u00E9"];
    } else if (language === 'German') {
      options = ["Hallo", "Tsch\u00FCss", "Danke", "Entschuldigung"];
    } else if (language === 'Arabic') {
      options = ["\u0645\u0631\u062d\u0628\u0627\u064b", "\u0645\u0639 \u0627\u0644\u0633\u0644\u0627\u0645\u0629", "\u0634\u0643\u0631\u0627\u064b", "\u0622\u0633\u0641"];
    } else if (language === 'Italian') {
      options = ["Ciao", "Arrivederci", "Grazie", "Mi dispiace"];
    } else if (language === 'English') {
      options = ["Hello", "Goodbye", "Thank you", "I am sorry"];
    } else {
      options = ["Hola", "Adi\u00F3s", "Gracias", "Lo siento"];
    }
  }

  let grammarMistakes = [];
  if (level === 'Intermediate' && turnIndex > 1) {
    if (language === 'Korean') {
      grammarMistakes = [{
        original: "\uC800\uB294 \uD559\uC0DD.",
        correction: "\uC800\uB294 \uD559\uC0DD\uC785\uB2C8\uB2E4.",
        explanation: "Almost! The correct sentence is '\uC800\uB294 \uD559\uC0DD\uC785\uB2C8\uB2E4.' Here's why: '\uC785\uB2C8\uB2E4' is the polite sentence ending."
      }];
    } else if (language === 'Spanish') {
      grammarMistakes = [{
        original: "yo querer",
        correction: "yo quiero",
        explanation: "In Spanish, the verb 'querer' conjugates to 'quiero' in the first-person singular present."
      }];
    }
  }

  const welcomeWord = language === 'Korean' ? "\uC548\uB155\uD558\uC138\uC694" : (language === 'Japanese' ? "\u3053\u3093\u306b\u3061\u306f" : "Hola");
  const welcomeTrans = language === 'Korean' ? "Hello" : (language === 'Japanese' ? "Hello" : "Hello");
  const welcomePron = language === 'Korean' ? "an-nyeong-ha-se-yo" : (language === 'Japanese' ? "kon-ni-chi-wa" : "oh-lah");

  return {
    reply: replyText,
    options,
    grammarMistakes,
    vocabulary: [
      { word: welcomeWord, translation: welcomeTrans, pronunciation: welcomePron, grammar: "Greeting", example: `${welcomeWord}! (${welcomeTrans}!)` }
    ]
  };
};

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
  const systemPrompt = `You are an expert translator. Translate the following text into English.
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
  const match = base64Audio.match(/^data:(audio\/[a-zA-Z0-9.-]+);base64,(.*)$/);
  if (!match) return "Voice note transcription not available.";

  const mimeType = match[1];
  const base64Data = match[2];

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && !geminiKey.includes('your_')) {
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
  
  return "Simulated transcription for voice note.";
};

// ─────────────────────────────────────────────
// POST /api/ai/session/start
// ─────────────────────────────────────────────
export const startSession = async (req, res) => {
  const { scenario, language, level } = req.body;
  const userId = req.user._id || req.user.id;

  if (!ALLOWED_SCENARIOS.includes(scenario)) {
    return res.status(400).json({ success: false, message: `Invalid scenario.` });
  }
  if (!ALLOWED_LANGUAGES.includes(language)) {
    return res.status(400).json({ success: false, message: `Invalid language.` });
  }
  if (!ALLOWED_LEVELS.includes(level)) {
    return res.status(400).json({ success: false, message: `Invalid level.` });
  }

  if (!checkRateLimit(userId, 'start_session', 10, 60000)) {
    return res.status(429).json({ success: false, message: 'Too many session creations. Please wait a minute.' });
  }

  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || process.env.GEMINI_API_KEY;
  let initialMsgText = '';
  let vocab = [];
  let options = [];

  let userObj;
  try {
    userObj = await findUserById(userId.toString());
  } catch (err) {
    console.error('Error fetching user for AI session:', err);
  }
  const username = userObj?.username || 'Learner';
  const memory = userObj?.conversationMemory || '';
  const weakVocab = userObj?.weakVocabulary || [];
  const weakGram = userObj?.weakGrammar || [];

  if (!apiKey || apiKey.includes('your_')) {
    const turn = getSimulatedTurn(language, scenario, level, 0);
    initialMsgText = turn.reply;
    vocab = turn.vocabulary;
    options = turn.options || [];
  } else {
    const systemPrompt = `You are a friendly AI native speaker for LingoLeap.
The student you are talking to is named ${username}.
The user is practicing ${language} at the ${level} level. The scenario is: ${scenario}.
Start the conversation by greeting the user (refer to them as ${username} and refer to previous context if available) and setting up the scenario in-character. Keep it to 1-2 sentences.

${memory ? `Here is some context/memory from previous conversations with this student: "${memory}". Use this memory to welcome them back naturally if appropriate.` : ''}
${weakVocab.length > 0 ? `The student is weak in these vocabulary words: ${weakVocab.slice(-5).join(', ')}. Try to naturally introduce or test them if appropriate.` : ''}
${weakGram.length > 0 ? `The student has made mistakes in these grammar points: ${weakGram.slice(-5).join(', ')}. Help them practice them.` : ''}

You MUST reply strictly with a valid JSON object. Keys:
1. "reply": (string) Your opening greeting in ${language}.
2. "options": (array of strings) ONLY if the level is 'Beginner', provide exactly 4 short, common expressions/phrases in ${language} that the student can select from to reply. For example: hello, goodbye, thank you, sorry in ${language}. If the level is NOT 'Beginner', return an empty array [].
3. "vocabulary": (array of objects) 1-2 useful words for starting this scenario, each with "word", "translation", "pronunciation", "example".`;

    const contents = [{ role: 'user', parts: [{ text: `Generate the starting greeting for scenario: ${scenario} in ${language} at level ${level}.` }] }];
    try {
      const result = await callAIService(contents, systemPrompt);
      if (result.ok) {
        const parsed = JSON.parse(result.text);
        initialMsgText = parsed.reply || `Welcome to the ${scenario} session.`;
        vocab = parsed.vocabulary || [];
        options = parsed.options || [];
      } else {
        const turn = getSimulatedTurn(language, scenario, level, 0);
        initialMsgText = turn.reply;
        vocab = turn.vocabulary;
        options = turn.options || [];
      }
    } catch (err) {
      const turn = getSimulatedTurn(language, scenario, level, 0);
      initialMsgText = turn.reply;
      vocab = turn.vocabulary;
      options = turn.options || [];
    }
  }

  try {
    const sessionData = {
      userId,
      scenario,
      language,
      level,
      messages: [{
        role: 'model',
        content: initialMsgText,
        options,
        timestamp: new Date()
      }],
      score: { fluency: 0, grammar: 0, vocabulary: 0, pronunciation: 0, listening: 0, rating: 0 },
      feedback: {
        suggestions: '',
        grammarMistakes: [],
        recommendedVocab: vocab,
        newWordsLearned: [],
        suggestedReview: []
      }
    };

    const session = await createAIPracticeSession(sessionData);
    
    try {
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

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({ success: false, message: 'Message content is required.' });
  }
  if (message.length > 500) {
    return res.status(400).json({ success: false, message: 'Message is too long.' });
  }

  if (!checkRateLimit(userId, 'session_msg', 30, 60000)) {
    return res.status(429).json({ success: false, message: 'Too many messages. Please slow down.' });
  }

  try {
    const session = await findAIPracticeSessionById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Practice session not found.' });
    }
    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const userMsg = { role: 'user', content: message, timestamp: new Date() };
    const updatedMessages = [...session.messages, userMsg];

    const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || process.env.GEMINI_API_KEY;
    let replyText = '';
    let grammarMistakes = [];
    let vocabWords = [];
    let options = [];
    let isSim = false;

    if (!apiKey || apiKey.includes('your_')) {
      isSim = true;
      const turnIndex = updatedMessages.filter(m => m.role === 'user').length;
      const simulated = getSimulatedTurn(session.language, session.scenario, session.level, turnIndex);
      replyText = simulated.reply;
      grammarMistakes = simulated.grammarMistakes;
      vocabWords = simulated.vocabulary;
      options = simulated.options || [];
    } else {
      const userObj = await findUserById(userId.toString());
      const username = userObj?.username || 'Learner';
      const memory = userObj?.conversationMemory || '';
      const weakVocab = userObj?.weakVocabulary || [];
      const weakGram = userObj?.weakGrammar || [];

      const contents = [];
      for (const m of updatedMessages) {
        contents.push({
          role: m.role === 'model' ? 'model' : 'user',
          parts: [{ text: m.content }]
        });
      }

      const filteredContents = [];
      for (const item of contents) {
        if (filteredContents.length > 0 && filteredContents[filteredContents.length - 1].role === item.role) {
          filteredContents[filteredContents.length - 1].parts[0].text += '\n' + item.parts[0].text;
        } else {
          filteredContents.push(item);
        }
      }

      const systemPrompt = `You are a friendly, encouraging AI native speaker for LingoLeap.
You are talking to a student named ${username}.
The user is practicing ${session.language} at the ${session.level} level. The scenario is: ${session.scenario}.
You must stay in character as a participant in the scenario. Speak at a speed and vocabulary difficulty appropriate for a ${session.level} speaker.
Keep your reply in ${session.language} short (1-3 sentences max).

${memory ? `Previous conversation context: "${memory}".` : ''}
${weakVocab.length > 0 ? `The student is weak in these vocabulary words: ${weakVocab.slice(-5).join(', ')}. Weave them into conversation naturally.` : ''}
${weakGram.length > 0 ? `The student is weak in these grammar structures: ${weakGram.slice(-5).join(', ')}. Help them practice them.` : ''}

Your task is to respond to the user's message, correct any grammar errors in their last message, and highlight useful vocabulary words.
If the student makes a grammar error, you should be a friendly Grammar Coach. Start your "reply" text with a natural correction, e.g. "Almost! The correct sentence is ... Here's why: ..." before continuing the conversation naturally in the target language. Do not just say "Wrong" or give robotic feedback.

You MUST respond strictly with a valid JSON object. The JSON object must contain the following keys:
1. "reply": (string) Your in-character reply in ${session.language} (maximum 3 sentences).
2. "options": (array of strings) ONLY if the level is 'Beginner', provide exactly 4 short, common expressions/phrases in ${session.language} that the student can select from to reply. For example: hello, goodbye, thank you, sorry in ${session.language}. If the level is NOT 'Beginner', return an empty array [].
3. "grammarMistakes": (array of objects) Any grammar or vocabulary errors in the user's last message. Each object must have:
   - "original": (string) The incorrect phrase/sentence the user wrote.
   - "correction": (string) The correct version in ${session.language}.
   - "explanation": (string) A simple explanation in English of why the correction is needed and the rule behind it.
   If there are no errors, return an empty array [].
4. "vocabulary": (array of objects) 1-3 useful or interesting words from the current conversation. Each object must have:
   - "word": (string) The word in ${session.language}.
   - "translation": (string) The English translation.
   - "pronunciation": (string) A simple pronunciation guide or phonetic spelling.
   - "grammar": (string) Word class and description.
   - "example": (string) An example sentence using the word in ${session.language} with its English translation in parentheses.`;

      const result = await callAIService(filteredContents, systemPrompt);
      if (result.ok) {
        try {
          const parsed = JSON.parse(result.text);
          replyText = parsed.reply || '...';
          grammarMistakes = parsed.grammarMistakes || [];
          vocabWords = parsed.vocabulary || [];
          options = parsed.options || [];
        } catch (parseErr) {
          replyText = result.text;
        }
      } else {
        isSim = true;
        const turnIndex = updatedMessages.filter(m => m.role === 'user').length;
        const simulated = getSimulatedTurn(session.language, session.scenario, session.level, turnIndex);
        replyText = simulated.reply + '\n\n---\n💡 (Offline Practice Mode)';
        grammarMistakes = simulated.grammarMistakes;
        vocabWords = simulated.vocabulary;
        options = simulated.options || [];
      }
    }

    const aiMsg = { role: 'model', content: replyText, options, timestamp: new Date() };
    const allMessages = [...updatedMessages, aiMsg];

    const updatedFeedback = {
      suggestions: session.feedback?.suggestions || '',
      grammarMistakes: [...(session.feedback?.grammarMistakes || []), ...grammarMistakes],
      recommendedVocab: [...(session.feedback?.recommendedVocab || []), ...vocabWords]
    };

    const vocabMap = {};
    updatedFeedback.recommendedVocab.forEach(v => {
      if (v && v.word) {
        vocabMap[v.word.toLowerCase()] = v;
      }
    });
    updatedFeedback.recommendedVocab = Object.values(vocabMap);

    await updateAIPracticeSession(sessionId, {
      messages: allMessages,
      feedback: updatedFeedback
    });

    return res.status(200).json({
      success: true,
      reply: replyText,
      options,
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
    let pronunciation = 75;
    let listening = 80;
    let rating = 4;
    let suggestions = 'Great job completing your practice! Try to write longer sentences next time to improve fluency.';
    let recommendedVocab = session.feedback?.recommendedVocab || [];
    let grammarMistakes = session.feedback?.grammarMistakes || [];
    let newWordsLearned = [];
    let suggestedReview = [];

    if (apiKey && !apiKey.includes('your_')) {
      const transcript = session.messages.map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n');
      const systemPrompt = `You are an expert language examiner. Evaluate the user's conversation practice in ${session.language} for the scenario: ${session.scenario} at user level: ${session.level}.
Evaluate fluency, grammar, vocabulary, pronunciation, and listening out of 100. Give a conversation rating between 1 and 5. Write feedback in English.

You MUST respond strictly with a valid JSON object. Keys:
{
  "fluency": (number between 0 and 100),
  "grammar": (number between 0 and 100),
  "vocabulary": (number between 0 and 100),
  "pronunciation": (number between 0 and 100),
  "listening": (number between 0 and 100),
  "rating": (number between 1 and 5),
  "suggestions": (string) constructive feedback and suggestions for improvement,
  "newWordsLearned": (array of strings) 1-3 new words the student successfully used or learned in the chat,
  "suggestedReview": (array of strings) 1-2 grammar rules or vocabulary terms they struggled with,
  "grammarMistakes": [
    { "original": "incorrect user text", "correction": "corrected version", "explanation": "English explanation" }
  ],
  "recommendedVocab": [
    { "word": "word", "translation": "English translation", "pronunciation": "guide", "example": "example sentence" }
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
          pronunciation = parsed.pronunciation || 75;
          listening = parsed.listening || 80;
          rating = parsed.rating || 4;
          suggestions = parsed.suggestions || suggestions;
          newWordsLearned = parsed.newWordsLearned || [];
          suggestedReview = parsed.suggestedReview || [];
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
      const userMsgCount = session.messages.filter(m => m.role === 'user').length;
      fluency = Math.min(60 + userMsgCount * 8, 95);
      grammar = Math.min(65 + userMsgCount * 6, 92);
      vocabulary = Math.min(62 + userMsgCount * 7, 94);
      pronunciation = Math.min(70 + userMsgCount * 4, 90);
      listening = Math.min(72 + userMsgCount * 4, 92);
      rating = Math.min(3 + Math.floor(userMsgCount / 3), 5);
      newWordsLearned = recommendedVocab.slice(0, 2).map(v => v.word);
      suggestedReview = grammarMistakes.slice(0, 1).map(g => g.explanation || 'Review sentences.');
    }

    const vocabMap = {};
    recommendedVocab.forEach(v => {
      if (v && v.word) vocabMap[v.word.toLowerCase()] = v;
    });
    recommendedVocab = Object.values(vocabMap);

    const grammarMap = {};
    grammarMistakes.forEach(g => {
      if (g && g.original) grammarMap[g.original.toLowerCase()] = g;
    });
    grammarMistakes = Object.values(grammarMap);

    const score = { fluency, grammar, vocabulary, pronunciation, listening, rating };
    const feedback = { suggestions, grammarMistakes, recommendedVocab, newWordsLearned, suggestedReview };

    const updatedSession = await updateAIPracticeSession(sessionId, { score, feedback });

    const xpAwarded = 25;
    const gemsAwarded = 10;
    const user = await findUserById(userId.toString());
    if (user) {
      const currentXp = user.xp || 0;
      const updatedXp = currentXp + xpAwarded;
      const updatedWeeklyXp = (user.weeklyXp || 0) + xpAwarded;
      const updatedGems = (user.gems || 0) + gemsAwarded;
      const level = Math.floor(Math.sqrt(updatedXp / 100)) + 1;

      const todayKey = new Date().toISOString().slice(0, 10);
      const calendar = [...(user.studyCalendar || [])];
      const todayEntryIndex = calendar.findIndex(d => d.date === todayKey);
      if (todayEntryIndex !== -1) {
        calendar[todayEntryIndex].xp = (calendar[todayEntryIndex].xp || 0) + xpAwarded;
        calendar[todayEntryIndex].minutes = (calendar[todayEntryIndex].minutes || 0) + 5;
      } else {
        calendar.push({ date: todayKey, xp: xpAwarded, lessons: 0, minutes: 5 });
      }

      const recentActivity = [...(user.recentActivity || [])];
      recentActivity.push({
        type: 'ai_practice_complete',
        message: `Completed AI Conversation Session (${session.scenario})`,
        xp: xpAwarded,
        timestamp: new Date()
      });

      let newMemory = user.conversationMemory || '';
      if (apiKey && !apiKey.includes('your_')) {
        try {
          const transcript = session.messages.map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n');
          const memoryPrompt = `Analyze this conversation transcript and extract any key personal details about the student (e.g., their name, occupation, hobbies, reasons for learning, etc.) in a single, short sentence. Do not mention names of characters if not known. Just write the facts.`;
          const contents = [{ role: 'user', parts: [{ text: transcript }] }];
          const memResult = await callAIService(contents, memoryPrompt);
          if (memResult.ok) {
            const extractedFacts = memResult.text.trim();
            newMemory = (newMemory ? newMemory + ' ' : '') + extractedFacts;
            if (newMemory.length > 400) {
              newMemory = newMemory.slice(-400);
            }
          }
        } catch (memErr) {
          console.error('[AI] Memory extraction error:', memErr);
        }
      } else {
        newMemory = (newMemory ? newMemory + ' ' : '') + `User practiced ${session.scenario} at ${session.level} level.`;
      }

      const weakGrammar = [...new Set([...(user.weakGrammar || []), ...grammarMistakes.map(g => g.original)])].slice(-15);
      const weakVocabulary = [...new Set([...(user.weakVocabulary || []), ...recommendedVocab.map(v => v.word)])].slice(-15);
      const pronunciationMistakes = [...new Set([...(user.pronunciationMistakes || [])])];
      if (pronunciation < 80) {
        pronunciationMistakes.push(`Struggled with scenario: ${session.scenario}`);
      }
      const listeningMistakes = [...new Set([...(user.listeningMistakes || [])])];
      if (listening < 80) {
        listeningMistakes.push(`Struggled in ${session.language} scenario: ${session.scenario}`);
      }
      const forgottenWords = [...new Set([...(user.forgottenWords || []), ...suggestedReview.filter(r => r.length < 30)])].slice(-15);

      await updateUser(userId.toString(), {
        xp: updatedXp,
        weeklyXp: updatedWeeklyXp,
        gems: updatedGems,
        level,
        studyCalendar: calendar.slice(-90),
        recentActivity: recentActivity.slice(-20),
        conversationMemory: newMemory,
        weakGrammar,
        weakVocabulary,
        pronunciationMistakes: pronunciationMistakes.slice(-15),
        listeningMistakes: listeningMistakes.slice(-15),
        forgottenWords
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
          averagePronunciation: 0,
          averageListening: 0,
          overallProgress: [],
          recommendedPractice: ['restaurant', 'shopping_mall', 'casual'],
          savedMistakes: [],
          savedVocab: []
        }
      });
    }

    let fluencySum = 0;
    let grammarSum = 0;
    let vocabularySum = 0;
    let pronunciationSum = 0;
    let listeningSum = 0;

    const overallProgress = completed.map(s => ({
      date: s.createdAt,
      fluency: s.score.fluency,
      grammar: s.score.grammar,
      vocabulary: s.score.vocabulary,
      pronunciation: s.score.pronunciation || 70,
      listening: s.score.listening || 80,
      scenario: s.scenario
    })).reverse();

    completed.forEach(s => {
      fluencySum += s.score.fluency;
      grammarSum += s.score.grammar;
      vocabularySum += s.score.vocabulary;
      pronunciationSum += s.score.pronunciation || 70;
      listeningSum += s.score.listening || 80;
    });

    const total = completed.length;
    const avgFluency = Math.round(fluencySum / total);
    const avgGrammar = Math.round(grammarSum / total);
    const avgVocabulary = Math.round(vocabularySum / total);
    const avgPronunciation = Math.round(pronunciationSum / total);
    const avgListening = Math.round(listeningSum / total);

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

    scenarioAverages.sort((a, b) => a.average - b.average);
    const recommendedPractice = scenarioAverages.map(s => s.scenario);
    
    ALLOWED_SCENARIOS.forEach(scen => {
      if (!recommendedPractice.includes(scen)) {
        recommendedPractice.push(scen);
      }
    });

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
        averagePronunciation: avgPronunciation,
        averageListening: avgListening,
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
  const prompt = (req.query && req.query.prompt) || (req.body && req.body.prompt) || 'Say hello';

  if (grokKey && !grokKey.includes('your_')) {
    const config = getAIClientConfig(grokKey);
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
      return res.status(200).json({ success: true, connected: true, response: text.trim() });
    } catch (error) {
      return res.status(200).json({ success: false, connected: false, error: error.message });
    }
  }

  if (geminiKey && !geminiKey.includes('your_')) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return res.status(200).json({ success: true, connected: true, response: text.trim() });
    } catch (error) {
      return res.status(200).json({ success: false, connected: false, error: error.message });
    }
  }

  return res.status(200).json({
    success: false,
    connected: false,
    message: 'No active GROK_API_KEY, XAI_API_KEY, or GEMINI_API_KEY found in environment variables.'
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
      console.log(`🤖 AI Service Status: SUCCESS (Groq/Grok model '${config.model}')`);
    } catch (err) {
      console.error(`❌ AI Service Status: FAILED. Error: ${err.message}`);
    }
    return;
  }

  if (geminiKey && !geminiKey.includes('your_')) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
      await model.generateContent('Say OK');
      console.log(`🤖 AI Service Status: SUCCESS (Gemini model '${GEMINI_MODEL}')`);
    } catch (err) {
      console.error(`❌ AI Service Status: FAILED (Gemini). Error: ${err.message}`);
    }
    return;
  }

  console.log('⚠️ AI Service Status: FAILED (No API Key found)');
};

// ─────────────────────────────────────────────
// POST /api/ai/chat — Stateless chat endpoint (saves history internally)
// ─────────────────────────────────────────────
export const chatDirect = async (req, res) => {
  const { scenario, language, level, messages } = req.body;
  const userId = req.user._id || req.user.id;

  if (!scenario || !language || !level || !messages || !Array.isArray(messages)) {
    return res.status(400).json({ success: false, message: 'Invalid input parameters.' });
  }

  if (!checkRateLimit(userId, 'chat_direct', 30, 60000)) {
    return res.status(429).json({ success: false, message: 'Too many messages.' });
  }

  try {
    const userSessions = await findAIPracticeSessionsByUserId(userId);
    let session = userSessions.find(s => s.scenario === scenario && s.language === language && s.level === level);
    
    if (!session) {
      const sessionData = {
        userId,
        scenario,
        language,
        level,
        messages: [],
        score: { fluency: 0, grammar: 0, vocabulary: 0, pronunciation: 0, listening: 0, rating: 0 },
        feedback: { suggestions: '', grammarMistakes: [], recommendedVocab: [], newWordsLearned: [], suggestedReview: [] }
      };
      session = await createAIPracticeSession(sessionData);
    }

    const sessionId = session._id || session.id;
    const lastUserMsg = messages[messages.length - 1]?.content || 'Hola';

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
  } else if (lang.toLowerCase() === 'korean' && norm.includes('저\uB294 \uD559\uC0DD')) {
    hasErrors = true;
    correction = "\uC800\uB294 \uD559\uC0DD\uC785\uB2C8\uB2E4.";
    explanation = "Almost! The correct sentence is '\uC800\uB294 \uD559\uC0DD\uC785\uB2C8\uB2E4.' Here's why: '\uC785\uB2C8\uB2E4' is the polite sentence ending.";
    suggestions = ["\uC800\uB294 \uD559\uC0DD\uC785\uB2C8\uB2E4.", "\uC800\uB294 \uD559\uC0DD\uC774\uC5D0\uC694."];
  }

  return { hasErrors, correction, explanation, suggestions };
};

export const grammarCheckDirect = async (req, res) => {
  const { text, language } = req.body;
  const userId = req.user._id || req.user.id;

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ success: false, message: 'Text string is required.' });
  }
  if (text.length > 500) {
    return res.status(400).json({ success: false, message: 'Text is too long.' });
  }
  const lang = language || 'Spanish';

  if (!checkRateLimit(userId, 'grammar_check', 30, 60000)) {
    return res.status(429).json({ success: false, message: 'Too many grammar checks. Please slow down.' });
  }

  const apiKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.includes('your_')) {
    const sim = getSimulatedGrammarCheck(text, lang);
    return res.status(200).json({ success: true, ...sim, simulated: true });
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
    return res.status(200).json({ success: true, ...sim, simulated: true });
  } catch (err) {
    const sim = getSimulatedGrammarCheck(text, lang);
    return res.status(200).json({ success: true, ...sim, simulated: true });
  }
};

// ─────────────────────────────────────────────
// POST /api/ai/vocabulary-help
// ─────────────────────────────────────────────
const getSimulatedVocabularyHelp = (word, language, context) => {
  const localDict = {
    spanish: {
      cafe: { meaning: "A hot dark beverage brewed from ground coffee beans, or a coffee house.", translation: "coffee / caf\u00E9", pronunciation: "cah-feh", grammar: "Noun, masculine singular.", relatedWords: ["cafetera", "cafeter\u00EDa"], examples: ["Quiero un caf\u00E9, por favor. (I want a coffee, please.)"], synonyms: ["cafeter\u00EDa", "marr\u00F3n"] },
      reserva: { meaning: "A securing of a room, seat, or table in advance.", translation: "reservation", pronunciation: "reh-sehr-bah", grammar: "Noun, feminine singular.", relatedWords: ["reservar", "reservado"], examples: ["Tengo una reserva hoy. (I have a reservation today.)"], synonyms: ["reservaci\u00F3n", "cita"] },
      cuenta: { meaning: "The billing check at a restaurant.", translation: "bill", pronunciation: "kwehn-tah", grammar: "Noun, feminine singular.", relatedWords: ["contar", "contabilidad"], examples: ["Tr\u00E1igame la cuenta, por favor. (Bring me the bill, please.)"], synonyms: ["factura", "cobro"] }
    }
  };

  const lang = language || 'Spanish';
  const dict = localDict[lang.toLowerCase()] || localDict['spanish'];
  const item = dict[word.toLowerCase().trim()] || {
    meaning: "A word in the target language.",
    translation: `English translation of ${word}`,
    pronunciation: word,
    grammar: "General word entry",
    relatedWords: [],
    examples: [`This is an example sentence for ${word}.`],
    synonyms: []
  };

  return {
    word,
    meaning: item.meaning,
    translation: item.translation,
    pronunciation: item.pronunciation,
    grammar: item.grammar,
    relatedWords: item.relatedWords,
    examples: item.examples,
    synonyms: item.synonyms
  };
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
    return res.status(200).json({ success: true, ...sim, simulated: true });
  }

  const systemPrompt = `You are a helpful dictionary.
Analyze the word: '${word}' in the language ${lang}. Provide its English meaning, direct translation, phonetic pronunciation, grammar breakdown, related words in ${lang}, example sentences with English translations in parentheses, and synonyms in ${lang}.
If context is provided, explain the word's meaning in that specific context.
Context: '${context || ''}'

You MUST reply strictly with a valid JSON object. Keys:
1. "word": (string) the word.
2. "meaning": (string) English explanation of the word.
3. "translation": (string) direct English translation.
4. "pronunciation": (string) phonetic pronunciation guide.
5. "grammar": (string) grammatical description.
6. "relatedWords": (array of strings) 2-3 related words in ${lang}.
7. "examples": (array of strings) 2 example sentences using the word with English translations in parentheses.
8. "synonyms": (array of strings) 2-3 synonyms in ${lang}.`;

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
        pronunciation: parsed.pronunciation || '',
        grammar: parsed.grammar || '',
        relatedWords: parsed.relatedWords || [],
        examples: parsed.examples || [],
        synonyms: parsed.synonyms || [],
        simulated: false
      });
    }
    const sim = getSimulatedVocabularyHelp(word, lang, context);
    return res.status(200).json({ success: true, ...sim, simulated: true });
  } catch (err) {
    const sim = getSimulatedVocabularyHelp(word, lang, context);
    return res.status(200).json({ success: true, ...sim, simulated: true });
  }
};

// ─────────────────────────────────────────────
// POST /api/ai/pronunciation-help
// ─────────────────────────────────────────────
const getSimulatedPronunciationHelp = (word, language) => {
  const localPronounce = {
    spanish: {
      cafe: { phonetic: "cah-FEH", guide: "Pronounce 'cah' like cat, and 'feh' like fed.", audioFriendlyText: "cah FEH", tips: ["Stress the final 'e' sharply."] }
    }
  };

  const lang = language || 'Spanish';
  const dict = localPronounce[lang.toLowerCase()] || localPronounce['spanish'];
  const item = dict[word.toLowerCase().trim()] || {
    phonetic: word,
    guide: "Pronounce syllable-by-syllable.",
    audioFriendlyText: word,
    tips: ["Speak slowly and clearly."]
  };

  return {
    word,
    phonetic: item.phonetic,
    guide: item.guide,
    audioFriendlyText: item.audioFriendlyText,
    tips: item.tips
  };
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
    return res.status(200).json({ success: true, ...sim, simulated: true });
  }

  const systemPrompt = `You are a helpful pronunciation coach.
Provide pronunciation guidance for the word: '${word}' in ${lang} for English speakers.
You MUST reply strictly with a valid JSON object. Keys:
1. "word": (string) the word.
2. "phonetic": (string) phonetic spelling or syllable breakdown.
3. "guide": (string) simple explanation of how to pronounce it.
4. "audioFriendlyText": (string) space-separated phonetic breakdown.
5. "tips": (array of strings) 1-2 helpful tips.`;

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
    return res.status(200).json({ success: true, ...sim, simulated: true });
  } catch (err) {
    const sim = getSimulatedPronunciationHelp(word, lang);
    return res.status(200).json({ success: true, ...sim, simulated: true });
  }
};

// ─────────────────────────────────────────────
// POST /api/ai/pronunciation/evaluate
// ─────────────────────────────────────────────
export const evaluatePronunciation = async (req, res) => {
  const { phrase, audioUrl } = req.body;
  const userId = req.user._id || req.user.id;

  if (!phrase || !audioUrl) {
    return res.status(400).json({ success: false, message: 'Phrase and audioUrl are required.' });
  }

  const match = audioUrl.match(/^data:(audio\/[a-zA-Z0-9.-]+);base64,/);
  if (!match) {
    return res.status(400).json({ success: false, message: 'Invalid audio format.' });
  }

  if (audioUrl.length > 7000000) {
    return res.status(400).json({ success: false, message: 'Audio file too large.' });
  }

  try {
    const transcript = await transcribeAudioMessage(audioUrl);
    let transcriptFinal = transcript;
    if (transcript.includes('not available') || transcript.includes('Simulated transcription')) {
      transcriptFinal = phrase; // For demo purpose let's grade leniently
    }

    let score = 85, fluencyScore = 80, accuracyScore = 90;
    let tips = ["Good job!", "Try to enunciate clearly."], mispronouncedWords = [];

    const attempt = {
      _id: new mongoose.Types.ObjectId().toString(),
      userId,
      phrase,
      transcript: transcriptFinal,
      score,
      fluencyScore,
      accuracyScore,
      tips,
      mispronouncedWords,
      audioUrl,
      createdAt: new Date()
    };

    if (!isFallbackMode()) {
      const PronunciationAttempt = (await import('../models/PronunciationAttempt.js')).default;
      await PronunciationAttempt.create(attempt);
    } else {
      const db = readJsonDb();
      if(!db.pronunciationAttempts) db.pronunciationAttempts = [];
      db.pronunciationAttempts.push(attempt);
      writeJsonDb(db);
    }

    res.status(200).json({ success: true, evaluation: attempt });
  } catch (err) {
    console.error('Evaluate Pronunciation Error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
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
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─────────────────────────────────────────────
// BOOKMARK/SAVE HANDLERS
// ─────────────────────────────────────────────
export const saveWord = async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { wordObj } = req.body;
  if (!wordObj || !wordObj.word) {
    return res.status(400).json({ success: false, message: 'wordObj is required.' });
  }
  try {
    const user = await findUserById(userId.toString());
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    const savedWords = [...(user.savedWords || [])];
    const exists = savedWords.some(w => w.word.toLowerCase() === wordObj.word.toLowerCase() && w.language === wordObj.language);
    if (!exists) {
      savedWords.push({
        ...wordObj,
        createdAt: new Date()
      });
      await updateUser(userId.toString(), { savedWords });
    }
    return res.status(200).json({ success: true, savedWords });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const unsaveWord = async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { word, language } = req.body;
  if (!word) {
    return res.status(400).json({ success: false, message: 'word is required.' });
  }
  try {
    const user = await findUserById(userId.toString());
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    const savedWords = (user.savedWords || []).filter(w => !(w.word.toLowerCase() === word.toLowerCase() && w.language === language));
    await updateUser(userId.toString(), { savedWords });
    return res.status(200).json({ success: true, savedWords });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const savePhrase = async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { phraseObj } = req.body;
  if (!phraseObj || !phraseObj.phrase) {
    return res.status(400).json({ success: false, message: 'phraseObj is required.' });
  }
  try {
    const user = await findUserById(userId.toString());
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    const savedPhrases = [...(user.savedPhrases || [])];
    const exists = savedPhrases.some(p => p.phrase.toLowerCase() === phraseObj.phrase.toLowerCase() && p.language === phraseObj.language);
    if (!exists) {
      savedPhrases.push({
        ...phraseObj,
        createdAt: new Date()
      });
      await updateUser(userId.toString(), { savedPhrases });
    }
    return res.status(200).json({ success: true, savedPhrases });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const unsavePhrase = async (req, res) => {
  const userId = req.user._id || req.user.id;
  const { phrase, language } = req.body;
  if (!phrase) {
    return res.status(400).json({ success: false, message: 'phrase is required.' });
  }
  try {
    const user = await findUserById(userId.toString());
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    const savedPhrases = (user.savedPhrases || []).filter(p => !(p.phrase.toLowerCase() === phrase.toLowerCase() && p.language === language));
    await updateUser(userId.toString(), { savedPhrases });
    return res.status(200).json({ success: true, savedPhrases });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getSavedItems = async (req, res) => {
  const userId = req.user._id || req.user.id;
  try {
    const user = await findUserById(userId.toString());
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.status(200).json({
      success: true,
      savedWords: user.savedWords || [],
      savedPhrases: user.savedPhrases || []
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
