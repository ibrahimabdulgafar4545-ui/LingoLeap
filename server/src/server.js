import app from './app.js';
import { checkDbConnection, isFallbackMode, seedMockLessons, findUserById, readJsonDb, writeJsonDb, findUserByEmail, createUser } from './services/db.service.js';
import { verifyEmailTransporter } from './services/email.service.js';
import { verifyAIConnectionOnStartup, translateChatMessage, transcribeAudioMessage } from './controllers/ai.controller.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Message from './models/Message.js';
import Conversation from './models/Conversation.js';
import User from './models/User.js';
import mongoose from 'mongoose';

const PORT = process.env.PORT || 5000;

// All lesson data - seeded into whichever DB is active
const lessonsData = [
  // ==========================================
  // SPANISH COURSE - Unit 1: First Contact & Basics
  // ==========================================
  {
    title: "Basics - Intro to Spanish", language: "Spanish", category: "Vocabulary",
    difficulty: 1, order: 1, unit: 1, unitTitle: "First Contact & Basics", xpReward: 15,
    questions: [
      { type: "multiple-choice", prompt: "How do you say 'Hello' in Spanish?", options: ["Hola", "Adiós", "Gracias", "Por favor"], correctAnswer: "Hola" },
      { type: "translate", prompt: "Translate: 'El niño come manzanas'", correctAnswer: "The boy eats apples" },
      { type: "fill-blank", prompt: "Yo ____ un estudiante (I am a student).", options: ["soy", "estoy", "tengo", "llamo"], correctAnswer: "soy" },
      { type: "multiple-choice", prompt: "What does 'gracias' mean?", options: ["Thank you", "Please", "Goodbye", "Hello"], correctAnswer: "Thank you" }
    ]
  },
  {
    title: "Greetings & Small Talk", language: "Spanish", category: "Speaking",
    difficulty: 1, order: 2, unit: 1, unitTitle: "First Contact & Basics", xpReward: 15,
    questions: [
      { type: "multiple-choice", prompt: "Which of the following means 'How are you?'", options: ["¿Cómo estás?", "Mucho gusto", "De nada", "Hasta luego"], correctAnswer: "¿Cómo estás?" },
      { type: "translate", prompt: "Translate: '¿De dónde eres?'", correctAnswer: "Where are you from?" },
      { type: "fill-blank", prompt: "Buenos _____, señor (Good morning, sir).", options: ["días", "noches", "tardes", "años"], correctAnswer: "días" },
      { type: "multiple-choice", prompt: "What does 'hasta luego' mean?", options: ["See you later", "Good morning", "Thank you", "Please"], correctAnswer: "See you later" }
    ]
  },
  {
    title: "Numbers & Counting", language: "Spanish", category: "Vocabulary",
    difficulty: 1, order: 3, unit: 1, unitTitle: "First Contact & Basics", xpReward: 15,
    questions: [
      { type: "multiple-choice", prompt: "How do you say 'Five' in Spanish?", options: ["Cinco", "Tres", "Ocho", "Dos"], correctAnswer: "Cinco" },
      { type: "translate", prompt: "Translate: '¿Qué hora es?'", correctAnswer: "What time is it?" },
      { type: "fill-blank", prompt: "Tengo ____ años (I am twenty years old).", options: ["veinte", "treinta", "diez", "cuarenta"], correctAnswer: "veinte" },
      { type: "multiple-choice", prompt: "What is 'diez' in English?", options: ["Ten", "Two", "Seven", "Four"], correctAnswer: "Ten" }
    ]
  },
  {
    title: "Colors & Descriptions", language: "Spanish", category: "Vocabulary",
    difficulty: 1, order: 4, unit: 1, unitTitle: "First Contact & Basics", xpReward: 20,
    questions: [
      { type: "multiple-choice", prompt: "What is 'rojo' in English?", options: ["Red", "Blue", "Green", "Yellow"], correctAnswer: "Red" },
      { type: "translate", prompt: "Translate: 'El cielo es azul'", correctAnswer: "The sky is blue" },
      { type: "fill-blank", prompt: "La manzana es ____ (The apple is red).", options: ["roja", "verde", "azul", "amarilla"], correctAnswer: "roja" },
      { type: "multiple-choice", prompt: "How do you say 'Green' in Spanish?", options: ["Verde", "Amarillo", "Morado", "Naranja"], correctAnswer: "Verde" }
    ]
  },
  {
    title: "Common Phrases", language: "Spanish", category: "Speaking",
    difficulty: 2, order: 5, unit: 1, unitTitle: "First Contact & Basics", xpReward: 20,
    questions: [
      { type: "multiple-choice", prompt: "How do you say 'Please' in Spanish?", options: ["Por favor", "De nada", "Lo siento", "Claro"], correctAnswer: "Por favor" },
      { type: "translate", prompt: "Translate: 'Lo siento mucho'", correctAnswer: "I am very sorry" },
      { type: "fill-blank", prompt: "No ____ español muy bien (I don't speak Spanish very well).", options: ["hablo", "escucho", "entiendo", "leo"], correctAnswer: "hablo" },
      { type: "multiple-choice", prompt: "What does '¿Cuánto cuesta?' mean?", options: ["How much does it cost?", "Where is it?", "What time is it?", "How are you?"], correctAnswer: "How much does it cost?" }
    ]
  },
  // SPANISH - Unit 2: Everyday Spanish Life
  {
    title: "Food & Café Culture", language: "Spanish", category: "Grammar",
    difficulty: 2, order: 6, unit: 2, unitTitle: "Everyday Spanish Life", xpReward: 20,
    questions: [
      { type: "multiple-choice", prompt: "Which word means 'Water'?", options: ["Agua", "Leche", "Cerveza", "Jugo"], correctAnswer: "Agua" },
      { type: "fill-blank", prompt: "Yo quiero una taza de ____ (I want a cup of coffee).", options: ["café", "té", "pan", "queso"], correctAnswer: "café" },
      { type: "translate", prompt: "Translate: 'La cuenta, por favor'", correctAnswer: "The bill, please" },
      { type: "multiple-choice", prompt: "How do you say 'I am hungry' in Spanish?", options: ["Tengo hambre", "Tengo sed", "Estoy cansado", "Me llamo Juan"], correctAnswer: "Tengo hambre" }
    ]
  },
  {
    title: "Family & Relationships", language: "Spanish", category: "Vocabulary",
    difficulty: 2, order: 7, unit: 2, unitTitle: "Everyday Spanish Life", xpReward: 25,
    questions: [
      { type: "multiple-choice", prompt: "What does 'hermano' mean?", options: ["Brother", "Sister", "Father", "Son"], correctAnswer: "Brother" },
      { type: "translate", prompt: "Translate: 'Mi madre es muy amable'", correctAnswer: "My mother is very kind" },
      { type: "fill-blank", prompt: "Mi ____ tiene treinta años (My father is thirty years old).", options: ["padre", "hermano", "abuelo", "hijo"], correctAnswer: "padre" },
      { type: "multiple-choice", prompt: "What does 'abuela' mean?", options: ["Grandmother", "Grandfather", "Aunt", "Mother"], correctAnswer: "Grandmother" }
    ]
  },
  {
    title: "Shopping & Money", language: "Spanish", category: "Grammar",
    difficulty: 3, order: 8, unit: 2, unitTitle: "Everyday Spanish Life", xpReward: 25,
    questions: [
      { type: "multiple-choice", prompt: "How do you ask for the price in Spanish?", options: ["¿Cuánto cuesta?", "¿Dónde está?", "¿Cómo te llamas?", "¿Qué hora es?"], correctAnswer: "¿Cuánto cuesta?" },
      { type: "translate", prompt: "Translate: 'Quiero comprar esto'", correctAnswer: "I want to buy this" },
      { type: "fill-blank", prompt: "Necesito ____ dinero (I need more money).", options: ["más", "menos", "mucho", "poco"], correctAnswer: "más" },
      { type: "multiple-choice", prompt: "What does 'barato' mean?", options: ["Cheap", "Expensive", "Big", "Small"], correctAnswer: "Cheap" }
    ]
  },
  {
    title: "Travel & Directions", language: "Spanish", category: "Reading",
    difficulty: 3, order: 9, unit: 2, unitTitle: "Everyday Spanish Life", xpReward: 25,
    questions: [
      { type: "multiple-choice", prompt: "How do you say 'Where is the hotel?' in Spanish?", options: ["¿Dónde está el hotel?", "¿Cuánto cuesta el hotel?", "¿Cómo es el hotel?", "¿Hay un hotel?"], correctAnswer: "¿Dónde está el hotel?" },
      { type: "translate", prompt: "Translate: 'Gire a la derecha'", correctAnswer: "Turn right" },
      { type: "fill-blank", prompt: "El aeropuerto está ____ lejos (The airport is very far).", options: ["muy", "poco", "nada", "tan"], correctAnswer: "muy" },
      { type: "multiple-choice", prompt: "What does 'cerca' mean?", options: ["Near", "Far", "Left", "Right"], correctAnswer: "Near" }
    ]
  },
  {
    title: "Present Tense Verbs", language: "Spanish", category: "Grammar",
    difficulty: 3, order: 10, unit: 2, unitTitle: "Everyday Spanish Life", xpReward: 30,
    questions: [
      { type: "multiple-choice", prompt: "What is the correct form of 'hablar' for 'yo'?", options: ["hablo", "hablas", "habla", "hablamos"], correctAnswer: "hablo" },
      { type: "translate", prompt: "Translate: 'Ella trabaja en una oficina'", correctAnswer: "She works in an office" },
      { type: "fill-blank", prompt: "Nosotros ____ en Madrid (We live in Madrid).", options: ["vivimos", "vivís", "viven", "vivo"], correctAnswer: "vivimos" },
      { type: "multiple-choice", prompt: "What does 'correr' mean?", options: ["To run", "To eat", "To sleep", "To work"], correctAnswer: "To run" }
    ]
  },

  // ==========================================
  // FRENCH COURSE - Unit 1: Bonjour! First Steps
  // ==========================================
  {
    title: "French Essentials - Greetings", language: "French", category: "Vocabulary",
    difficulty: 1, order: 1, unit: 1, unitTitle: "Bonjour! First Steps", xpReward: 15,
    questions: [
      { type: "multiple-choice", prompt: "How do you say 'Hello' in French?", options: ["Bonjour", "Merci", "Au revoir", "S'il vous plaît"], correctAnswer: "Bonjour" },
      { type: "translate", prompt: "Translate: 'Le chat noir'", correctAnswer: "The black cat" },
      { type: "fill-blank", prompt: "Je ____ un homme (I am a man).", options: ["suis", "es", "ai", "appelle"], correctAnswer: "suis" },
      { type: "multiple-choice", prompt: "What does 'merci' mean?", options: ["Thank you", "Please", "Hello", "Goodbye"], correctAnswer: "Thank you" }
    ]
  },
  {
    title: "Numbers & Colors", language: "French", category: "Vocabulary",
    difficulty: 1, order: 2, unit: 1, unitTitle: "Bonjour! First Steps", xpReward: 15,
    questions: [
      { type: "multiple-choice", prompt: "What is 'rouge' in English?", options: ["Red", "Blue", "Green", "Yellow"], correctAnswer: "Red" },
      { type: "translate", prompt: "Translate: 'Le ciel est bleu'", correctAnswer: "The sky is blue" },
      { type: "multiple-choice", prompt: "How do you say 'Ten' in French?", options: ["Dix", "Cinq", "Huit", "Trois"], correctAnswer: "Dix" },
      { type: "fill-blank", prompt: "J'ai ____ ans (I am twenty years old).", options: ["vingt", "trente", "dix", "quarante"], correctAnswer: "vingt" }
    ]
  },
  {
    title: "Basic Introductions", language: "French", category: "Speaking",
    difficulty: 1, order: 3, unit: 1, unitTitle: "Bonjour! First Steps", xpReward: 15,
    questions: [
      { type: "multiple-choice", prompt: "How do you introduce yourself in French?", options: ["Je m'appelle...", "Tu t'appelles...", "Il s'appelle...", "Nous nous appelons..."], correctAnswer: "Je m'appelle..." },
      { type: "translate", prompt: "Translate: 'Enchanté de vous rencontrer'", correctAnswer: "Nice to meet you" },
      { type: "fill-blank", prompt: "Je viens ____ France (I come from France).", options: ["de", "du", "des", "d'"], correctAnswer: "de" },
      { type: "multiple-choice", prompt: "What does 'au revoir' mean?", options: ["Goodbye", "Hello", "Please", "Thank you"], correctAnswer: "Goodbye" }
    ]
  },
  {
    title: "Family in French", language: "French", category: "Vocabulary",
    difficulty: 2, order: 4, unit: 1, unitTitle: "Bonjour! First Steps", xpReward: 20,
    questions: [
      { type: "multiple-choice", prompt: "What does 'frère' mean?", options: ["Brother", "Sister", "Father", "Son"], correctAnswer: "Brother" },
      { type: "translate", prompt: "Translate: 'Ma mère est belle'", correctAnswer: "My mother is beautiful" },
      { type: "fill-blank", prompt: "Mon ____ s'appelle Pierre (My father's name is Pierre).", options: ["père", "frère", "fils", "oncle"], correctAnswer: "père" },
      { type: "multiple-choice", prompt: "What does 'grand-mère' mean?", options: ["Grandmother", "Mother", "Aunt", "Sister"], correctAnswer: "Grandmother" }
    ]
  },
  {
    title: "Common French Phrases", language: "French", category: "Speaking",
    difficulty: 2, order: 5, unit: 1, unitTitle: "Bonjour! First Steps", xpReward: 20,
    questions: [
      { type: "multiple-choice", prompt: "How do you say 'Excuse me' in French?", options: ["Excusez-moi", "S'il vous plaît", "De rien", "Pardon"], correctAnswer: "Excusez-moi" },
      { type: "translate", prompt: "Translate: 'Je ne comprends pas'", correctAnswer: "I don't understand" },
      { type: "fill-blank", prompt: "Pouvez-vous parler plus ____? (Can you speak more slowly?)", options: ["lentement", "vite", "fort", "doucement"], correctAnswer: "lentement" },
      { type: "multiple-choice", prompt: "What does 'de rien' mean?", options: ["You're welcome", "Thank you", "Please", "Excuse me"], correctAnswer: "You're welcome" }
    ]
  },
  // FRENCH - Unit 2: La Vie Parisienne
  {
    title: "Ordering at a Paris Café", language: "French", category: "Reading",
    difficulty: 2, order: 6, unit: 2, unitTitle: "La Vie Parisienne", xpReward: 20,
    questions: [
      { type: "multiple-choice", prompt: "How do you ask for the bill in French?", options: ["L'addition, s'il vous plaît", "Un café, please", "Bonjour", "Merci beaucoup"], correctAnswer: "L'addition, s'il vous plaît" },
      { type: "translate", prompt: "Translate: 'Un café au lait, s'il vous plaît'", correctAnswer: "A coffee with milk, please" },
      { type: "fill-blank", prompt: "Je voudrais un ____ (I would like a croissant).", options: ["croissant", "sandwich", "gâteau", "baguette"], correctAnswer: "croissant" },
      { type: "multiple-choice", prompt: "What does 'une baguette' refer to?", options: ["French bread", "Coffee", "Butter", "Cheese"], correctAnswer: "French bread" }
    ]
  },
  {
    title: "Shopping in Paris", language: "French", category: "Grammar",
    difficulty: 2, order: 7, unit: 2, unitTitle: "La Vie Parisienne", xpReward: 25,
    questions: [
      { type: "multiple-choice", prompt: "How do you ask the price in French?", options: ["C'est combien?", "Où est-ce?", "Comment vous appelez-vous?", "Quelle heure est-il?"], correctAnswer: "C'est combien?" },
      { type: "translate", prompt: "Translate: 'Je voudrais acheter ça'", correctAnswer: "I would like to buy this" },
      { type: "fill-blank", prompt: "C'est trop ____ (It's too expensive).", options: ["cher", "bon", "beau", "grand"], correctAnswer: "cher" },
      { type: "multiple-choice", prompt: "What does 'bon marché' mean?", options: ["Cheap", "Expensive", "Beautiful", "Large"], correctAnswer: "Cheap" }
    ]
  },
  {
    title: "Travel & Transport", language: "French", category: "Reading",
    difficulty: 3, order: 8, unit: 2, unitTitle: "La Vie Parisienne", xpReward: 25,
    questions: [
      { type: "multiple-choice", prompt: "How do you say 'Where is the metro?' in French?", options: ["Où est le métro?", "Comment allez-vous?", "Quel est le prix?", "Y a-t-il un bus?"], correctAnswer: "Où est le métro?" },
      { type: "translate", prompt: "Translate: 'Tournez à gauche'", correctAnswer: "Turn left" },
      { type: "fill-blank", prompt: "Le train part à ____ heures (The train leaves at two o'clock).", options: ["deux", "trois", "quatre", "cinq"], correctAnswer: "deux" },
      { type: "multiple-choice", prompt: "What does 'tout droit' mean?", options: ["Straight ahead", "Turn right", "Stop", "Go back"], correctAnswer: "Straight ahead" }
    ]
  },
  {
    title: "French Verbs - Present Tense", language: "French", category: "Grammar",
    difficulty: 3, order: 9, unit: 2, unitTitle: "La Vie Parisienne", xpReward: 25,
    questions: [
      { type: "multiple-choice", prompt: "What is the correct form of 'parler' for 'je'?", options: ["parle", "parles", "parlez", "parlons"], correctAnswer: "parle" },
      { type: "translate", prompt: "Translate: 'Elle travaille dans un bureau'", correctAnswer: "She works in an office" },
      { type: "fill-blank", prompt: "Nous ____ à Paris (We live in Paris).", options: ["habitons", "habitez", "habitent", "habite"], correctAnswer: "habitons" },
      { type: "multiple-choice", prompt: "What does 'courir' mean?", options: ["To run", "To eat", "To sleep", "To work"], correctAnswer: "To run" }
    ]
  },
  {
    title: "French Culture & Expressions", language: "French", category: "Vocabulary",
    difficulty: 3, order: 10, unit: 2, unitTitle: "La Vie Parisienne", xpReward: 30,
    questions: [
      { type: "multiple-choice", prompt: "What does 'C'est la vie' mean?", options: ["That's life", "It's beautiful", "Very well", "Of course"], correctAnswer: "That's life" },
      { type: "translate", prompt: "Translate: 'Bon appétit'", correctAnswer: "Enjoy your meal" },
      { type: "fill-blank", prompt: "Je suis très ____ de vous voir (I am very happy to see you).", options: ["content", "triste", "fatigué", "occupé"], correctAnswer: "content" },
      { type: "multiple-choice", prompt: "What does 'voilà' mean?", options: ["There you go", "Hello", "Goodbye", "Thank you"], correctAnswer: "There you go" }
    ]
  },
  // ==========================================
  // ENGLISH COURSE - Unit 1: Basics
  // ==========================================
  {
    title: "Greetings", language: "English", category: "Vocabulary",
    difficulty: 1, order: 1, unit: 1, unitTitle: "Basics", xpReward: 15,
    questions: [
      { type: "multiple-choice", prompt: "Which is the most formal greeting?", options: ["Good morning, how do you do?", "Hey, what's up?", "Yo!", "Howdy!"], correctAnswer: "Good morning, how do you do?" },
      { type: "fill-blank", prompt: "Nice to ____ you! (Said when meeting someone for the first time)", options: ["meet", "see", "hear", "find"], correctAnswer: "meet" },
      { type: "match", prompt: "Match the greetings with their Spanish translations.", options: ["hello - hola", "goodbye - adiós", "morning - mañana"], correctAnswer: "hello:hola;goodbye:adiós;morning:mañana" }
    ]
  },
  {
    title: "Introductions", language: "English", category: "Speaking",
    difficulty: 1, order: 2, unit: 1, unitTitle: "Basics", xpReward: 15,
    questions: [
      { type: "multiple-choice", prompt: "How do you tell someone your name?", options: ["My name is...", "I call me...", "Name is me...", "I am call..."], correctAnswer: "My name is..." },
      { type: "fill-blank", prompt: "I ____ from London.", options: ["come", "am", "live", "born"], correctAnswer: "come" },
      { type: "match", prompt: "Match introduction terms with categories.", options: ["name - nombre", "job - trabajo", "age - edad"], correctAnswer: "name:nombre;job:trabajo;age:edad" }
    ]
  },
  {
    title: "Numbers", language: "English", category: "Vocabulary",
    difficulty: 1, order: 3, unit: 1, unitTitle: "Basics", xpReward: 15,
    questions: [
      { type: "multiple-choice", prompt: "How do you say 10 in English?", options: ["Ten", "Two", "Eight", "Three"], correctAnswer: "Ten" },
      { type: "fill-blank", prompt: "Two plus three equals ____.", options: ["five", "six", "seven", "four"], correctAnswer: "five" },
      { type: "match", prompt: "Match digits to words.", options: ["1 - one", "2 - two", "3 - three"], correctAnswer: "1:one;2:two;3:three" }
    ]
  },
  {
    title: "Colors", language: "English", category: "Vocabulary",
    difficulty: 1, order: 4, unit: 1, unitTitle: "Basics", xpReward: 20,
    questions: [
      { type: "multiple-choice", prompt: "What color is a ripe banana?", options: ["Yellow", "Red", "Blue", "Green"], correctAnswer: "Yellow" },
      { type: "fill-blank", prompt: "The sky on a clear day is ____.", options: ["blue", "green", "red", "black"], correctAnswer: "blue" },
      { type: "match", prompt: "Match color words.", options: ["red - rojo", "green - verde", "black - negro"], correctAnswer: "red:rojo;green:verde;black:negro" }
    ]
  },
  {
    title: "Common Words", language: "English", category: "Vocabulary",
    difficulty: 1, order: 5, unit: 1, unitTitle: "Basics", xpReward: 20,
    questions: [
      { type: "multiple-choice", prompt: "What is the opposite of 'yes'?", options: ["No", "Maybe", "Ok", "Sure"], correctAnswer: "No" },
      { type: "fill-blank", prompt: "Please and thank ____ are polite words.", options: ["you", "them", "him", "her"], correctAnswer: "you" },
      { type: "match", prompt: "Match opposite words.", options: ["hot - cold", "big - small", "fast - slow"], correctAnswer: "hot:cold;big:small;fast:slow" }
    ]
  },
  // ==========================================
  // ENGLISH COURSE - Unit 2: Everyday Life
  // ==========================================
  {
    title: "Family", language: "English", category: "Vocabulary",
    difficulty: 2, order: 6, unit: 2, unitTitle: "Everyday Life", xpReward: 20,
    questions: [
      { type: "multiple-choice", prompt: "Who is your mother's husband?", options: ["Father", "Uncle", "Brother", "Son"], correctAnswer: "Father" },
      { type: "fill-blank", prompt: "My brother's daughter is my ____.", options: ["niece", "nephew", "cousin", "sister"], correctAnswer: "niece" },
      { type: "match", prompt: "Match family members.", options: ["son - hijo", "sister - hermana", "wife - esposa"], correctAnswer: "son:hijo;sister:hermana;wife:esposa" }
    ]
  },
  {
    title: "Food", language: "English", category: "Grammar",
    difficulty: 2, order: 7, unit: 2, unitTitle: "Everyday Life", xpReward: 20,
    questions: [
      { type: "multiple-choice", prompt: "Which of the following is a fruit?", options: ["Apple", "Bread", "Milk", "Beef"], correctAnswer: "Apple" },
      { type: "fill-blank", prompt: "I want a cup of ____ (hot brew).", options: ["coffee", "salad", "cheese", "rice"], correctAnswer: "coffee" },
      { type: "match", prompt: "Match food items with translations.", options: ["bread - pan", "milk - leche", "meat - carne"], correctAnswer: "bread:pan;milk:leche;meat:carne" }
    ]
  },
  {
    title: "Shopping", language: "English", category: "Grammar",
    difficulty: 2, order: 8, unit: 2, unitTitle: "Everyday Life", xpReward: 25,
    questions: [
      { type: "multiple-choice", prompt: "How do you ask for the price?", options: ["How much is this?", "What is time?", "Where is hotel?", "Who are you?"], correctAnswer: "How much is this?" },
      { type: "fill-blank", prompt: "Do you have this shirt in a medium ____?", options: ["size", "color", "price", "brand"], correctAnswer: "size" },
      { type: "match", prompt: "Match shopping terms.", options: ["price - precio", "cheap - barato", "receipt - recibo"], correctAnswer: "price:precio;cheap:barato;receipt:recibo" }
    ]
  },
  {
    title: "Time", language: "English", category: "Grammar",
    difficulty: 2, order: 9, unit: 2, unitTitle: "Everyday Life", xpReward: 25,
    questions: [
      { type: "multiple-choice", prompt: "How do you say 12:00 PM?", options: ["Noon", "Midnight", "Morning", "Evening"], correctAnswer: "Noon" },
      { type: "fill-blank", prompt: "There are sixty minutes in one ____.", options: ["hour", "day", "second", "minute"], correctAnswer: "hour" },
      { type: "match", prompt: "Match time units.", options: ["day - día", "week - semana", "month - mes"], correctAnswer: "day:día;week:semana;month:mes" }
    ]
  },
  {
    title: "Travel", language: "English", category: "Reading",
    difficulty: 2, order: 10, unit: 2, unitTitle: "Everyday Life", xpReward: 25,
    questions: [
      { type: "multiple-choice", prompt: "Where do you board a plane?", options: ["Airport", "Station", "Port", "Library"], correctAnswer: "Airport" },
      { type: "fill-blank", prompt: "The train departs from platform ____.", options: ["three", "red", "car", "air"], correctAnswer: "three" },
      { type: "match", prompt: "Match travel terms.", options: ["ticket - boleto", "hotel - hotel", "map - mapa"], correctAnswer: "ticket:boleto;hotel:hotel;map:mapa" }
    ]
  },
  // ==========================================
  // ENGLISH COURSE - Unit 3: Communication
  // ==========================================
  {
    title: "Questions", language: "English", category: "Grammar",
    difficulty: 3, order: 11, unit: 3, unitTitle: "Communication", xpReward: 25,
    questions: [
      { type: "multiple-choice", prompt: "Which question word asks about a place?", options: ["Where", "Who", "When", "Why"], correctAnswer: "Where" },
      { type: "fill-blank", prompt: "____ is your name?", options: ["What", "Where", "How", "Why"], correctAnswer: "What" },
      { type: "match", prompt: "Match question words to intent.", options: ["who - person", "when - time", "why - reason"], correctAnswer: "who:person;when:time;why:reason" }
    ]
  },
  {
    title: "Conversations", language: "English", category: "Speaking",
    difficulty: 3, order: 12, unit: 3, unitTitle: "Communication", xpReward: 30,
    questions: [
      { type: "multiple-choice", prompt: "What is an appropriate response to 'Thank you'?", options: ["You're welcome", "No", "Goodbye", "Excuse me"], correctAnswer: "You're welcome" },
      { type: "fill-blank", prompt: "Could you please ____ that? (I didn't hear)", options: ["repeat", "speak", "tell", "say"], correctAnswer: "repeat" },
      { type: "match", prompt: "Match conversations phrases.", options: ["hello - hi", "please - por favor", "sorry - disculpa"], correctAnswer: "hello:hi;please:por favor;sorry:disculpa" }
    ]
  },
  {
    title: "Directions", language: "English", category: "Reading",
    difficulty: 3, order: 13, unit: 3, unitTitle: "Communication", xpReward: 30,
    questions: [
      { type: "multiple-choice", prompt: "Which direction is the opposite of left?", options: ["Right", "Straight", "North", "Down"], correctAnswer: "Right" },
      { type: "fill-blank", prompt: "Go straight and turn ____ at the traffic lights.", options: ["left", "around", "over", "across"], correctAnswer: "left" },
      { type: "match", prompt: "Match direction translations.", options: ["straight - derecho", "north - norte", "near - cerca"], correctAnswer: "straight:derecho;north:norte;near:cerca" }
    ]
  },
  {
    title: "Daily Activities", language: "English", category: "Grammar",
    difficulty: 3, order: 14, unit: 3, unitTitle: "Communication", xpReward: 30,
    questions: [
      { type: "multiple-choice", prompt: "What is the first thing you do in the morning?", options: ["Wake up", "Sleep", "Dinner", "Work"], correctAnswer: "Wake up" },
      { type: "fill-blank", prompt: "I usually ____ my teeth after breakfast.", options: ["brush", "wash", "eat", "make"], correctAnswer: "brush" },
      { type: "match", prompt: "Match verbs to nouns.", options: ["read - book", "cook - dinner", "watch - tv"], correctAnswer: "read:book;cook:dinner;watch:tv" }
    ]
  },
  {
    title: "Emotions", language: "English", category: "Vocabulary",
    difficulty: 3, order: 15, unit: 3, unitTitle: "Communication", xpReward: 30,
    questions: [
      { type: "multiple-choice", prompt: "How do you feel when you win a competition?", options: ["Excited", "Sad", "Angry", "Tired"], correctAnswer: "Excited" },
      { type: "fill-blank", prompt: "She was so ____ that she started crying.", options: ["sad", "happy", "brave", "calm"], correctAnswer: "sad" },
      { type: "match", prompt: "Match opposite emotions.", options: ["happy - sad", "calm - angry", "brave - scared"], correctAnswer: "happy:sad;calm:angry;brave:scared" }
    ]
  },

  // ==========================================
  // GERMAN COURSE - Unit 1: Willkommen! Getting Started
  // ==========================================
  {
    title: "German Basics - Guten Tag!", language: "German", category: "Vocabulary",
    difficulty: 1, order: 1, unit: 1, unitTitle: "Willkommen! Getting Started", xpReward: 15,
    questions: [
      { type: "multiple-choice", prompt: "How do you say 'Hello' in German?", options: ["Hallo", "Danke", "Bitte", "Tschüss"], correctAnswer: "Hallo" },
      { type: "translate", prompt: "Translate: 'Ich heiße Anna'", correctAnswer: "My name is Anna" },
      { type: "fill-blank", prompt: "Guten ____ (Good morning).", options: ["Morgen", "Tag", "Nacht", "Abend"], correctAnswer: "Morgen" },
      { type: "multiple-choice", prompt: "What does 'Danke' mean?", options: ["Thank you", "Please", "Hello", "Goodbye"], correctAnswer: "Thank you" }
    ]
  },
  {
    title: "Numbers in German", language: "German", category: "Vocabulary",
    difficulty: 1, order: 2, unit: 1, unitTitle: "Willkommen! Getting Started", xpReward: 15,
    questions: [
      { type: "multiple-choice", prompt: "How do you say 'Five' in German?", options: ["Fünf", "Drei", "Acht", "Zwei"], correctAnswer: "Fünf" },
      { type: "translate", prompt: "Translate: 'Ich bin zwanzig Jahre alt'", correctAnswer: "I am twenty years old" },
      { type: "fill-blank", prompt: "Eins, zwei, ____, vier (One, two, three, four).", options: ["drei", "fünf", "sechs", "sieben"], correctAnswer: "drei" },
      { type: "multiple-choice", prompt: "What is 'zehn' in English?", options: ["Ten", "Two", "Seven", "Four"], correctAnswer: "Ten" }
    ]
  },
  {
    title: "German Colors", language: "German", category: "Vocabulary",
    difficulty: 1, order: 3, unit: 1, unitTitle: "Willkommen! Getting Started", xpReward: 15,
    questions: [
      { type: "multiple-choice", prompt: "What is 'rot' in English?", options: ["Red", "Blue", "Green", "Yellow"], correctAnswer: "Red" },
      { type: "translate", prompt: "Translate: 'Der Himmel ist blau'", correctAnswer: "The sky is blue" },
      { type: "fill-blank", prompt: "Das Gras ist ____ (The grass is green).", options: ["grün", "rot", "blau", "gelb"], correctAnswer: "grün" },
      { type: "multiple-choice", prompt: "How do you say 'Yellow' in German?", options: ["Gelb", "Grün", "Blau", "Schwarz"], correctAnswer: "Gelb" }
    ]
  },
  {
    title: "Family in German", language: "German", category: "Vocabulary",
    difficulty: 2, order: 4, unit: 1, unitTitle: "Willkommen! Getting Started", xpReward: 20,
    questions: [
      { type: "multiple-choice", prompt: "What does 'Bruder' mean?", options: ["Brother", "Sister", "Father", "Son"], correctAnswer: "Brother" },
      { type: "translate", prompt: "Translate: 'Meine Mutter ist sehr nett'", correctAnswer: "My mother is very kind" },
      { type: "fill-blank", prompt: "Mein ____ heißt Thomas (My father is called Thomas).", options: ["Vater", "Bruder", "Sohn", "Onkel"], correctAnswer: "Vater" },
      { type: "multiple-choice", prompt: "What does 'Oma' mean?", options: ["Grandmother", "Mother", "Aunt", "Sister"], correctAnswer: "Grandmother" }
    ]
  },
  {
    title: "German Common Phrases", language: "German", category: "Speaking",
    difficulty: 2, order: 5, unit: 1, unitTitle: "Willkommen! Getting Started", xpReward: 20,
    questions: [
      { type: "multiple-choice", prompt: "How do you say 'Please' in German?", options: ["Bitte", "Danke", "Entschuldigung", "Ja"], correctAnswer: "Bitte" },
      { type: "translate", prompt: "Translate: 'Ich verstehe nicht'", correctAnswer: "I don't understand" },
      { type: "fill-blank", prompt: "Sprechen Sie ____? (Do you speak English?)", options: ["Englisch", "Deutsch", "Französisch", "Spanisch"], correctAnswer: "Englisch" },
      { type: "multiple-choice", prompt: "What does 'Entschuldigung' mean?", options: ["Excuse me", "Thank you", "Please", "Goodbye"], correctAnswer: "Excuse me" }
    ]
  },
  // GERMAN - Unit 2: Auf Reisen! Out & About
  {
    title: "German Travel Phrases", language: "German", category: "Reading",
    difficulty: 2, order: 6, unit: 2, unitTitle: "Auf Reisen! Out & About", xpReward: 20,
    questions: [
      { type: "multiple-choice", prompt: "How do you say 'Where is the station?' in German?", options: ["Wo ist der Bahnhof?", "Ich bin müde", "Was kostet das?", "Danke schön"], correctAnswer: "Wo ist der Bahnhof?" },
      { type: "translate", prompt: "Translate: 'Ich verstehe nicht'", correctAnswer: "I don't understand" },
      { type: "fill-blank", prompt: "Wie viel ____ das? (How much does that cost?)", options: ["kostet", "ist", "hat", "macht"], correctAnswer: "kostet" },
      { type: "multiple-choice", prompt: "What does 'Bahnhof' mean?", options: ["Train station", "Airport", "Bus stop", "Hotel"], correctAnswer: "Train station" }
    ]
  },
  {
    title: "German Food & Drink", language: "German", category: "Grammar",
    difficulty: 2, order: 7, unit: 2, unitTitle: "Auf Reisen! Out & About", xpReward: 25,
    questions: [
      { type: "multiple-choice", prompt: "How do you order a beer in German?", options: ["Ein Bier, bitte.", "Ich will Bier.", "Gib mir Bier!", "Bier haben!"], correctAnswer: "Ein Bier, bitte." },
      { type: "translate", prompt: "Translate: 'Die Rechnung, bitte'", correctAnswer: "The bill, please" },
      { type: "fill-blank", prompt: "Ich hätte gerne ____ (I would like a coffee).", options: ["einen Kaffee", "ein Wasser", "ein Bier", "einen Tee"], correctAnswer: "einen Kaffee" },
      { type: "multiple-choice", prompt: "What does 'lecker' mean?", options: ["Delicious", "Expensive", "Large", "Hot"], correctAnswer: "Delicious" }
    ]
  },
  {
    title: "German Shopping", language: "German", category: "Grammar",
    difficulty: 3, order: 8, unit: 2, unitTitle: "Auf Reisen! Out & About", xpReward: 25,
    questions: [
      { type: "multiple-choice", prompt: "How do you ask for help in a shop?", options: ["Können Sie mir helfen?", "Was kostet das?", "Ich kaufe das!", "Kasse bitte!"], correctAnswer: "Können Sie mir helfen?" },
      { type: "translate", prompt: "Translate: 'Das ist zu teuer'", correctAnswer: "That is too expensive" },
      { type: "fill-blank", prompt: "Haben Sie das in einer anderen ____? (Do you have this in a different size?)", options: ["Größe", "Farbe", "Form", "Art"], correctAnswer: "Größe" },
      { type: "multiple-choice", prompt: "What does 'billig' mean?", options: ["Cheap", "Expensive", "Beautiful", "Small"], correctAnswer: "Cheap" }
    ]
  },
  {
    title: "German Verbs - Present", language: "German", category: "Grammar",
    difficulty: 3, order: 9, unit: 2, unitTitle: "Auf Reisen! Out & About", xpReward: 25,
    questions: [
      { type: "multiple-choice", prompt: "What is the correct form of 'gehen' for 'ich'?", options: ["gehe", "gehst", "geht", "gehen"], correctAnswer: "gehe" },
      { type: "translate", prompt: "Translate: 'Wir wohnen in Berlin'", correctAnswer: "We live in Berlin" },
      { type: "fill-blank", prompt: "Er ____ jeden Tag Deutsch (He studies German every day).", options: ["lernt", "lernst", "lerne", "lernen"], correctAnswer: "lernt" },
      { type: "multiple-choice", prompt: "What does 'schlafen' mean?", options: ["To sleep", "To eat", "To run", "To work"], correctAnswer: "To sleep" }
    ]
  },
  {
    title: "German Culture & Expressions", language: "German", category: "Vocabulary",
    difficulty: 3, order: 10, unit: 2, unitTitle: "Auf Reisen! Out & About", xpReward: 30,
    questions: [
      { type: "multiple-choice", prompt: "What does 'Prost!' mean when clinking glasses?", options: ["Cheers!", "Thanks!", "Hello!", "Goodbye!"], correctAnswer: "Cheers!" },
      { type: "translate", prompt: "Translate: 'Guten Appetit'", correctAnswer: "Enjoy your meal" },
      { type: "fill-blank", prompt: "Das ist ____ (That is great / wonderful)!", options: ["wunderbar", "schrecklich", "langweilig", "schwierig"], correctAnswer: "wunderbar" },
      { type: "multiple-choice", prompt: "What does 'Gemütlichkeit' describe?", options: ["Cozy, pleasant atmosphere", "A type of food", "A festival", "A greeting"], correctAnswer: "Cozy, pleasant atmosphere" }
    ]
  },

  // ==========================================
  // ITALIAN COURSE - Unit 1: Benvenuti! Welcome
  // ==========================================
  {
    title: "Ciao! Italian Basics", language: "Italian", category: "Vocabulary",
    difficulty: 1, order: 1, unit: 1, unitTitle: "Benvenuti! Welcome", xpReward: 15,
    questions: [
      { type: "multiple-choice", prompt: "How do you say 'Hello' in Italian?", options: ["Ciao", "Grazie", "Prego", "Arrivederci"], correctAnswer: "Ciao" },
      { type: "translate", prompt: "Translate: 'Buongiorno, come stai?'", correctAnswer: "Good morning, how are you?" },
      { type: "fill-blank", prompt: "Mi ____ Marco (My name is Marco).", options: ["chiamo", "sono", "ho", "vado"], correctAnswer: "chiamo" },
      { type: "multiple-choice", prompt: "What does 'grazie' mean?", options: ["Thank you", "Please", "Goodbye", "Hello"], correctAnswer: "Thank you" }
    ]
  },
  {
    title: "Italian Numbers", language: "Italian", category: "Vocabulary",
    difficulty: 1, order: 2, unit: 1, unitTitle: "Benvenuti! Welcome", xpReward: 15,
    questions: [
      { type: "multiple-choice", prompt: "How do you say 'Five' in Italian?", options: ["Cinque", "Tre", "Otto", "Due"], correctAnswer: "Cinque" },
      { type: "translate", prompt: "Translate: 'Ho vent'anni'", correctAnswer: "I am twenty years old" },
      { type: "fill-blank", prompt: "Uno, due, ____, quattro (One, two, three, four).", options: ["tre", "cinque", "sei", "sette"], correctAnswer: "tre" },
      { type: "multiple-choice", prompt: "What is 'dieci' in English?", options: ["Ten", "Two", "Seven", "Four"], correctAnswer: "Ten" }
    ]
  },
  {
    title: "Italian Colors & Adjectives", language: "Italian", category: "Vocabulary",
    difficulty: 1, order: 3, unit: 1, unitTitle: "Benvenuti! Welcome", xpReward: 15,
    questions: [
      { type: "multiple-choice", prompt: "What is 'rosso' in English?", options: ["Red", "Blue", "Green", "Yellow"], correctAnswer: "Red" },
      { type: "translate", prompt: "Translate: 'Il cielo è blu'", correctAnswer: "The sky is blue" },
      { type: "fill-blank", prompt: "L'erba è ____ (The grass is green).", options: ["verde", "rossa", "blu", "gialla"], correctAnswer: "verde" },
      { type: "multiple-choice", prompt: "How do you say 'Beautiful' in Italian?", options: ["Bello", "Brutto", "Grande", "Piccolo"], correctAnswer: "Bello" }
    ]
  },
  {
    title: "Italian Family", language: "Italian", category: "Vocabulary",
    difficulty: 2, order: 4, unit: 1, unitTitle: "Benvenuti! Welcome", xpReward: 20,
    questions: [
      { type: "multiple-choice", prompt: "What does 'fratello' mean?", options: ["Brother", "Sister", "Father", "Son"], correctAnswer: "Brother" },
      { type: "translate", prompt: "Translate: 'Mia madre è molto gentile'", correctAnswer: "My mother is very kind" },
      { type: "fill-blank", prompt: "Mio ____ si chiama Giovanni (My father's name is Giovanni).", options: ["padre", "fratello", "figlio", "zio"], correctAnswer: "padre" },
      { type: "multiple-choice", prompt: "What does 'nonna' mean?", options: ["Grandmother", "Mother", "Aunt", "Sister"], correctAnswer: "Grandmother" }
    ]
  },
  {
    title: "Italian Common Phrases", language: "Italian", category: "Speaking",
    difficulty: 2, order: 5, unit: 1, unitTitle: "Benvenuti! Welcome", xpReward: 20,
    questions: [
      { type: "multiple-choice", prompt: "How do you say 'Please' in Italian?", options: ["Per favore", "Grazie", "Prego", "Scusi"], correctAnswer: "Per favore" },
      { type: "translate", prompt: "Translate: 'Non capisco'", correctAnswer: "I don't understand" },
      { type: "fill-blank", prompt: "Parla ____? (Do you speak English?)", options: ["inglese", "italiano", "francese", "spagnolo"], correctAnswer: "inglese" },
      { type: "multiple-choice", prompt: "What does 'scusi' mean?", options: ["Excuse me", "Thank you", "Please", "You're welcome"], correctAnswer: "Excuse me" }
    ]
  },
  // ITALIAN - Unit 2: La Dolce Vita
  {
    title: "Italian Food Culture", language: "Italian", category: "Reading",
    difficulty: 2, order: 6, unit: 2, unitTitle: "La Dolce Vita", xpReward: 20,
    questions: [
      { type: "multiple-choice", prompt: "How do you order a coffee in Italian?", options: ["Un caffè, per favore.", "Voglio caffè.", "Dammi un caffè!", "Caffè adesso!"], correctAnswer: "Un caffè, per favore." },
      { type: "translate", prompt: "Translate: 'Il conto, per favore'", correctAnswer: "The bill, please" },
      { type: "fill-blank", prompt: "Vorrei una ____ (I would like a pizza).", options: ["pizza", "pasta", "bistecca", "insalata"], correctAnswer: "pizza" },
      { type: "multiple-choice", prompt: "What does 'buon appetito' mean?", options: ["Enjoy your meal", "The bill please", "Thank you", "Goodbye"], correctAnswer: "Enjoy your meal" }
    ]
  },
  {
    title: "Italian Shopping", language: "Italian", category: "Grammar",
    difficulty: 2, order: 7, unit: 2, unitTitle: "La Dolce Vita", xpReward: 25,
    questions: [
      { type: "multiple-choice", prompt: "How do you ask the price in Italian?", options: ["Quanto costa?", "Dove si trova?", "Come si chiama?", "Che ora è?"], correctAnswer: "Quanto costa?" },
      { type: "translate", prompt: "Translate: 'Vorrei comprare questo'", correctAnswer: "I would like to buy this" },
      { type: "fill-blank", prompt: "È troppo ____ (It's too expensive).", options: ["caro", "buono", "bello", "grande"], correctAnswer: "caro" },
      { type: "multiple-choice", prompt: "What does 'economico' mean?", options: ["Cheap", "Expensive", "Beautiful", "Large"], correctAnswer: "Cheap" }
    ]
  },
  {
    title: "Italian Travel", language: "Italian", category: "Reading",
    difficulty: 3, order: 8, unit: 2, unitTitle: "La Dolce Vita", xpReward: 25,
    questions: [
      { type: "multiple-choice", prompt: "How do you ask for directions in Italian?", options: ["Dove si trova la stazione?", "Quanto costa?", "Come stai?", "Cosa c'è?"], correctAnswer: "Dove si trova la stazione?" },
      { type: "translate", prompt: "Translate: 'Giri a destra'", correctAnswer: "Turn right" },
      { type: "fill-blank", prompt: "L'aeroporto è molto ____ (The airport is very far).", options: ["lontano", "vicino", "grande", "bello"], correctAnswer: "lontano" },
      { type: "multiple-choice", prompt: "What does 'vicino' mean?", options: ["Near", "Far", "Left", "Right"], correctAnswer: "Near" }
    ]
  },
  {
    title: "Italian Verbs", language: "Italian", category: "Grammar",
    difficulty: 3, order: 9, unit: 2, unitTitle: "La Dolce Vita", xpReward: 25,
    questions: [
      { type: "multiple-choice", prompt: "What is the correct form of 'parlare' for 'io'?", options: ["parlo", "parli", "parla", "parliamo"], correctAnswer: "parlo" },
      { type: "translate", prompt: "Translate: 'Lei lavora in un ufficio'", correctAnswer: "She works in an office" },
      { type: "fill-blank", prompt: "Noi ____ a Roma (We live in Rome).", options: ["abitiamo", "abitate", "abitano", "abito"], correctAnswer: "abitiamo" },
      { type: "multiple-choice", prompt: "What does 'correre' mean?", options: ["To run", "To eat", "To sleep", "To work"], correctAnswer: "To run" }
    ]
  },
  {
    title: "Italian Culture", language: "Italian", category: "Vocabulary",
    difficulty: 3, order: 10, unit: 2, unitTitle: "La Dolce Vita", xpReward: 30,
    questions: [
      { type: "multiple-choice", prompt: "What does 'la dolce vita' mean?", options: ["The sweet life", "The fast life", "The hard life", "The beautiful life"], correctAnswer: "The sweet life" },
      { type: "translate", prompt: "Translate: 'In bocca al lupo!'", correctAnswer: "Good luck! (Into the wolf's mouth)" },
      { type: "fill-blank", prompt: "Sono molto ____ di conoscerti (I am very happy to meet you).", options: ["felice", "triste", "stanco", "occupato"], correctAnswer: "felice" },
      { type: "multiple-choice", prompt: "What does 'mamma mia' express?", options: ["Surprise or shock", "A greeting", "A farewell", "A request"], correctAnswer: "Surprise or shock" }
    ]
  },

  // ==========================================
  // ARABIC COURSE - Unit 1: أهلاً! First Words
  // ==========================================
  {
    title: "Arabic Alphabet & Greetings", language: "Arabic", category: "Vocabulary",
    difficulty: 1, order: 1, unit: 1, unitTitle: "First Words in Arabic", xpReward: 15,
    questions: [
      { type: "multiple-choice", prompt: "How do you say 'Hello' in Arabic?", options: ["مرحبا (Marhaba)", "شكرا (Shukran)", "مع السلامة (Ma'a salama)", "من فضلك (Min fadlak)"], correctAnswer: "مرحبا (Marhaba)" },
      { type: "translate", prompt: "What does 'شكرا' (Shukran) mean?", correctAnswer: "Thank you" },
      { type: "multiple-choice", prompt: "How do you say 'Good morning' in Arabic?", options: ["صباح الخير (Sabah al-khayr)", "مساء الخير (Masa al-khayr)", "مرحبا (Marhaba)", "كيف حالك (Kayfa halak)"], correctAnswer: "صباح الخير (Sabah al-khayr)" },
      { type: "fill-blank", prompt: "The response to 'صباح الخير' is ____.", options: ["صباح النور (Sabah al-nour)", "مع السلامة", "شكرا", "مرحبا"], correctAnswer: "صباح النور (Sabah al-nour)" }
    ]
  },
  {
    title: "Arabic Numbers", language: "Arabic", category: "Vocabulary",
    difficulty: 1, order: 2, unit: 1, unitTitle: "First Words in Arabic", xpReward: 15,
    questions: [
      { type: "multiple-choice", prompt: "What is the Arabic word for 'Five'?", options: ["خمسة (Khamsa)", "ثلاثة (Thalatha)", "ثمانية (Thamaniya)", "اثنان (Ithnan)"], correctAnswer: "خمسة (Khamsa)" },
      { type: "translate", prompt: "What does 'عشرة' (Ashara) mean?", correctAnswer: "Ten" },
      { type: "fill-blank", prompt: "واحد، اثنان، ____، أربعة (1, 2, ?, 4)", options: ["ثلاثة (Thalatha)", "خمسة (Khamsa)", "ستة (Sitta)", "سبعة (Sab'a)"], correctAnswer: "ثلاثة (Thalatha)" },
      { type: "multiple-choice", prompt: "How do you say 'One hundred' in Arabic?", options: ["مائة (Mi'a)", "ألف (Alf)", "عشرة (Ashara)", "خمسون (Khamson)"], correctAnswer: "مائة (Mi'a)" }
    ]
  },
  {
    title: "Arabic Colors", language: "Arabic", category: "Vocabulary",
    difficulty: 1, order: 3, unit: 1, unitTitle: "First Words in Arabic", xpReward: 15,
    questions: [
      { type: "multiple-choice", prompt: "What does 'أحمر' (Ahmar) mean?", options: ["Red", "Blue", "Green", "Yellow"], correctAnswer: "Red" },
      { type: "translate", prompt: "What does 'أزرق' (Azraq) mean?", correctAnswer: "Blue" },
      { type: "fill-blank", prompt: "السماء ____ (The sky is blue).", options: ["زرقاء (Zarqa)", "حمراء (Hamra)", "خضراء (Khadra)", "صفراء (Safra)"], correctAnswer: "زرقاء (Zarqa)" },
      { type: "multiple-choice", prompt: "What is 'أخضر' (Akhdar) in English?", options: ["Green", "Red", "Yellow", "White"], correctAnswer: "Green" }
    ]
  },
  {
    title: "Arabic Family Words", language: "Arabic", category: "Vocabulary",
    difficulty: 2, order: 4, unit: 1, unitTitle: "First Words in Arabic", xpReward: 20,
    questions: [
      { type: "multiple-choice", prompt: "What does 'أخ' (Akh) mean?", options: ["Brother", "Sister", "Father", "Son"], correctAnswer: "Brother" },
      { type: "translate", prompt: "What does 'أم' (Umm) mean?", correctAnswer: "Mother" },
      { type: "fill-blank", prompt: "اسم ____ محمد (My father's name is Muhammad).", options: ["أبي (abi)", "أخي (akhi)", "ابني (ibni)", "عمي (ammi)"], correctAnswer: "أبي (abi)" },
      { type: "multiple-choice", prompt: "What does 'جدة' (Jadda) mean?", options: ["Grandmother", "Mother", "Aunt", "Sister"], correctAnswer: "Grandmother" }
    ]
  },
  {
    title: "Arabic Common Phrases", language: "Arabic", category: "Speaking",
    difficulty: 2, order: 5, unit: 1, unitTitle: "First Words in Arabic", xpReward: 20,
    questions: [
      { type: "multiple-choice", prompt: "How do you say 'Please' in Arabic?", options: ["من فضلك (Min fadlak)", "شكرا (Shukran)", "آسف (Asif)", "نعم (Na'am)"], correctAnswer: "من فضلك (Min fadlak)" },
      { type: "translate", prompt: "What does 'لا أفهم' (La afham) mean?", correctAnswer: "I don't understand" },
      { type: "fill-blank", prompt: "هل تتكلم ____? (Do you speak English?)", options: ["الإنجليزية (al-Injiliziyya)", "العربية (al-Arabiyya)", "الفرنسية (al-Fransiyya)", "الإسبانية (al-Isbaniyya)"], correctAnswer: "الإنجليزية (al-Injiliziyya)" },
      { type: "multiple-choice", prompt: "What does 'عفواً' (Afwan) mean?", options: ["You're welcome / Excuse me", "Thank you", "Please", "Goodbye"], correctAnswer: "You're welcome / Excuse me" }
    ]
  },
  // ARABIC - Unit 2: Daily Life
  {
    title: "Arabic Food & Restaurant", language: "Arabic", category: "Reading",
    difficulty: 2, order: 6, unit: 2, unitTitle: "Arabic Daily Life", xpReward: 20,
    questions: [
      { type: "multiple-choice", prompt: "How do you order food in Arabic?", options: ["أريد... (Ureed...)", "أنا جائع (Ana ja'i)", "الطعام هنا", "من فضلك الطعام"], correctAnswer: "أريد... (Ureed...)" },
      { type: "translate", prompt: "What does 'الحساب من فضلك' (Al-hisab min fadlak) mean?", correctAnswer: "The bill, please" },
      { type: "fill-blank", prompt: "أريد ____ من فضلك (I want water please).", options: ["ماء (Ma'a)", "قهوة (Qahwa)", "شاي (Shay)", "عصير (Aseer)"], correctAnswer: "ماء (Ma'a)" },
      { type: "multiple-choice", prompt: "What does 'بالعافية' (Bil-afiya) mean?", options: ["Enjoy your meal", "Goodbye", "Thank you", "Please"], correctAnswer: "Enjoy your meal" }
    ]
  },
  {
    title: "Arabic Shopping", language: "Arabic", category: "Grammar",
    difficulty: 2, order: 7, unit: 2, unitTitle: "Arabic Daily Life", xpReward: 25,
    questions: [
      { type: "multiple-choice", prompt: "How do you ask for the price in Arabic?", options: ["كم الثمن? (Kam al-thaman?)", "أين هذا?", "ما اسمك?", "كم الوقت?"], correctAnswer: "كم الثمن? (Kam al-thaman?)" },
      { type: "translate", prompt: "What does 'غالي جداً' (Ghali jiddan) mean?", correctAnswer: "Very expensive" },
      { type: "fill-blank", prompt: "هذا ____ جداً (This is very cheap).", options: ["رخيص (Rakhees)", "غالي (Ghali)", "جيد (Jayid)", "سيء (Sayyi)"], correctAnswer: "رخيص (Rakhees)" },
      { type: "multiple-choice", prompt: "What does 'رخيص' (Rakhees) mean?", options: ["Cheap", "Expensive", "Beautiful", "Large"], correctAnswer: "Cheap" }
    ]
  },
  {
    title: "Arabic Directions", language: "Arabic", category: "Reading",
    difficulty: 3, order: 8, unit: 2, unitTitle: "Arabic Daily Life", xpReward: 25,
    questions: [
      { type: "multiple-choice", prompt: "How do you say 'Where is the mosque?' in Arabic?", options: ["أين المسجد? (Ayna al-masjid?)", "كم يبعد?", "هل هناك مسجد?", "المسجد هنا"], correctAnswer: "أين المسجد? (Ayna al-masjid?)" },
      { type: "translate", prompt: "What does 'اليمين' (Al-yameen) mean?", correctAnswer: "Right (direction)" },
      { type: "fill-blank", prompt: "اذهب ____ ثم اليمين (Go straight, then right).", options: ["إلى الأمام (ila al-amam)", "إلى اليسار", "إلى اليمين", "إلى الخلف"], correctAnswer: "إلى الأمام (ila al-amam)" },
      { type: "multiple-choice", prompt: "What does 'قريب' (Qareeb) mean?", options: ["Near", "Far", "Left", "Right"], correctAnswer: "Near" }
    ]
  },
  {
    title: "Arabic Verbs - Present", language: "Arabic", category: "Grammar",
    difficulty: 3, order: 9, unit: 2, unitTitle: "Arabic Daily Life", xpReward: 25,
    questions: [
      { type: "multiple-choice", prompt: "What is 'to go' for 'I' in Arabic?", options: ["أذهب (Adh-hab)", "يذهب (Yad-hab)", "تذهب (Tad-hab)", "نذهب (Nad-hab)"], correctAnswer: "أذهب (Adh-hab)" },
      { type: "translate", prompt: "What does 'هي تعمل في مكتب' mean?", correctAnswer: "She works in an office" },
      { type: "fill-blank", prompt: "نحن ____ في القاهرة (We live in Cairo).", options: ["نسكن (Naskon)", "يسكن (Yaskon)", "أسكن (Askon)", "تسكن (Taskon)"], correctAnswer: "نسكن (Naskon)" },
      { type: "multiple-choice", prompt: "What does 'يأكل' (Ya'kol) mean?", options: ["He eats", "He runs", "He sleeps", "He works"], correctAnswer: "He eats" }
    ]
  },
  {
    title: "Arabic Culture & Expressions", language: "Arabic", category: "Vocabulary",
    difficulty: 3, order: 10, unit: 2, unitTitle: "Arabic Daily Life", xpReward: 30,
    questions: [
      { type: "multiple-choice", prompt: "What does 'إن شاء الله' (Inshallah) mean?", options: ["If God wills / Hopefully", "Thank God", "Praise God", "God is great"], correctAnswer: "If God wills / Hopefully" },
      { type: "translate", prompt: "What does 'الحمد لله' (Al-hamdulillah) mean?", correctAnswer: "Praise/Thanks be to God" },
      { type: "fill-blank", prompt: "مبروك! (Mabrook) is said when someone ____.", options: ["achieves something or gets married", "says goodbye", "orders food", "asks for directions"], correctAnswer: "achieves something or gets married" },
      { type: "multiple-choice", prompt: "What does 'يلا!' (Yalla) mean in colloquial Arabic?", options: ["Let's go! / Come on!", "Goodbye", "Hello", "Thank you"], correctAnswer: "Let's go! / Come on!" }
    ]
  }
];

const startServer = async () => {
  // Attempt MongoDB connection (falls back to JSON automatically)
  await checkDbConnection();

  // Seed database
  if (isFallbackMode()) {
    seedMockLessons(lessonsData);
  } else {
    try {
      const Lesson = (await import('./models/Lesson.js')).default;
      const count = await Lesson.countDocuments();
      if (count === 0) {
        console.log('🍃 MongoDB connected but has no lessons. Seeding lessons...');
        await Lesson.insertMany(lessonsData);
        console.log(`✅ Seeded ${lessonsData.length} lessons into MongoDB.`);
      } else {
        console.log(`🍃 MongoDB contains ${count} lessons. Skipping seeding.`);
      }
    } catch (err) {
      console.error('❌ Failed to check or seed MongoDB lessons:', err);
    }
  }
  const server = app.listen(PORT, async () => {
    console.log(`\n🚀 LingoLeap server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
    if (isFallbackMode()) {
      console.log('📦 Using local filesystem database (data/db.json)\n');
    } else {
      console.log('🍃 Using MongoDB Atlas/local database\n');
    }
    // Verify Brevo SMTP connection
    verifyEmailTransporter();

    // Verify AI connection
    await verifyAIConnectionOnStartup();
  });

  // Socket.io initialization
  const io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174', 'http://localhost:5175'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  // Expose io to routes/controllers
  app.set('io', io);

  // Socket auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET || '123456789');
      const user = await findUserById(decoded.id);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🔌 User connected to sockets: ${socket.user.username} (${userId})`);
    
    // Join personal room
    socket.join(userId);

    // Set online status in DB
    if (!isFallbackMode()) {
      try {
        await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
      } catch (err) {
        console.error('Error updating online presence (Mongo):', err);
      }
    } else {
      const db = readJsonDb();
      const uIdx = db.users.findIndex(u => u._id === userId);
      if (uIdx !== -1) {
        db.users[uIdx].isOnline = true;
        db.users[uIdx].lastSeen = new Date().toISOString();
        writeJsonDb(db);
      }
    }

    // Broadcast status change
    io.emit('user_status', { userId, isOnline: true });

    // Handle typing events
    socket.on('typing', ({ conversationId, recipientId, isTyping }) => {
      socket.to(recipientId).emit('typing', { conversationId, senderId: userId, isTyping });
    });

    // Handle incoming messages
    socket.on('send_message', async ({ conversationId, recipientId, text, messageType, audioUrl, stickerUrl, imageUrl, isViewOnce, replyTo, isForwarded }, callback) => {
      try {
        const isAi = recipientId === '666666666666666666666666' || conversationId === 'ai-conversation-id';
        
        // Enforce friends lock
        let isFriend = false;
        if (isAi) {
          isFriend = true;
          recipientId = '666666666666666666666666';
          conversationId = 'ai-conversation-id';
        } else {
          if (!isFallbackMode()) {
            const sender = await User.findById(userId);
            isFriend = sender && (sender.friends || []).some(id => id.toString() === recipientId.toString());
          } else {
            const db = readJsonDb();
            const sender = db.users.find(u => u._id === userId);
            isFriend = sender && (sender.friends || []).some(id => id.toString() === recipientId.toString());
          }
        }

        if (!isFriend) {
          return callback?.({ success: false, error: 'Chat is locked until you are friends.' });
        }

        if (text && text.length > 2000) {
          return callback?.({ success: false, error: 'Message is too long.' });
        }

        let translatedText = null;
        let sourceLanguage = null;
        let targetLang = 'English'; // fallback

        // Get recipient to find their learning language
        let recipientUser;
        if (isAi) {
          if (!isFallbackMode()) {
            const sender = await User.findById(userId);
            targetLang = sender?.targetLanguage || 'Spanish';
          } else {
            const db = readJsonDb();
            const sender = db.users.find(u => u._id === userId);
            targetLang = sender?.targetLanguage || 'Spanish';
          }
        } else {
          if (!isFallbackMode()) {
            recipientUser = await User.findById(recipientId);
          } else {
            const db = readJsonDb();
            recipientUser = db.users.find(u => u._id === recipientId);
          }
          if (recipientUser && recipientUser.targetLanguage) {
            targetLang = recipientUser.targetLanguage;
          }
        }

        let actualText = text;

        if (messageType === 'audio' && audioUrl) {
          actualText = await transcribeAudioMessage(audioUrl);
        }

        if (actualText && actualText.trim().length > 0 && messageType !== 'sticker') {
          const translationResult = await translateChatMessage(actualText, targetLang);
          translatedText = translationResult.translatedText;
          sourceLanguage = translationResult.sourceLanguage;
        }

        let savedMessage;
        if (!isFallbackMode()) {
          savedMessage = await Message.create({
            conversationId,
            sender: userId,
            recipient: recipientId,
            text: actualText || (messageType === 'image' ? 'Image' : ''),
            translatedText,
            originalLanguage: sourceLanguage,
            targetLanguage: targetLang,
            messageType: messageType || 'text',
            audioUrl,
            stickerUrl,
            imageUrl,
            isViewOnce: !!isViewOnce,
            replyTo: replyTo || null,
            isForwarded: !!isForwarded
          });

          if (savedMessage.replyTo) {
            await savedMessage.populate('replyTo');
          }
          
          await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: savedMessage._id,
            updatedAt: new Date()
          });
        } else {
          const db = readJsonDb();
          db.messages = db.messages || [];
          db.conversations = db.conversations || [];

          savedMessage = {
            _id: new mongoose.Types.ObjectId().toString(),
            conversationId,
            sender: userId,
            recipient: recipientId,
            text: actualText || (messageType === 'image' ? 'Image' : ''),
            translatedText,
            originalLanguage: sourceLanguage,
            targetLanguage: targetLang,
            messageType: messageType || 'text',
            audioUrl,
            stickerUrl,
            imageUrl,
            isViewOnce: !!isViewOnce,
            replyTo: replyTo || null,
            isForwarded: !!isForwarded,
            isRead: false,
            createdAt: new Date().toISOString()
          };
          db.messages.push(savedMessage);

          if (savedMessage.replyTo) {
            const replyMsg = db.messages.find(m => m._id === savedMessage.replyTo);
            if (replyMsg) {
              savedMessage.replyTo = replyMsg;
            }
          }

          const cIdx = db.conversations.findIndex(c => c._id === conversationId);
          if (cIdx !== -1) {
            db.conversations[cIdx].lastMessage = savedMessage._id;
            db.conversations[cIdx].updatedAt = savedMessage.createdAt;
          }
          writeJsonDb(db);
        }

        // Emit message to sender and recipient
        io.to(userId).to(recipientId).emit('new_message', savedMessage);
        callback?.({ success: true, message: savedMessage });

        // Trigger AI Conversation Partner response asynchronously
        if (isAi) {
          (async () => {
            try {
              let userProfile;
              if (!isFallbackMode()) {
                userProfile = await User.findById(userId);
              } else {
                const db = readJsonDb();
                userProfile = db.users.find(u => u._id === userId);
              }

              const targetLanguage = userProfile?.targetLanguage || 'Spanish';
              const skillLevel = userProfile?.difficultyLevel || userProfile?.skillLevel || 'Beginner';

              // Fetch last 8 messages of history for context
              let historyMessages = [];
              if (!isFallbackMode()) {
                historyMessages = await Message.find({ conversationId: 'ai-conversation-id' })
                  .sort({ createdAt: -1 })
                  .limit(8);
              } else {
                const db = readJsonDb();
                historyMessages = (db.messages || [])
                  .filter(m => m.conversationId === 'ai-conversation-id');
                historyMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                historyMessages = historyMessages.slice(0, 8);
              }
              historyMessages.reverse();

              const conversationHistoryStr = historyMessages.map(m => {
                const senderName = m.sender.toString() === userId.toString() ? 'User' : 'AI';
                return `${senderName}: ${m.text}`;
              }).join('\n');

              const systemPrompt = `You are a friendly language conversation partner for LingoLeap named AI Partner.
The student is practicing their target language: ${targetLanguage}.
Student skill level: ${skillLevel} (Beginner, Intermediate, Advanced).

Your task:
1. Respond to the user's message in ${targetLanguage}.
2. Keep your response short and natural (1-3 sentences), matching their level.
3. If they make a grammatical error, spelling error, or construct a sentence awkwardly, provide a brief, polite correction or suggestion in English at the very end of your response.
4. Translate your main response into English.

Respond strictly as a JSON object:
{
  "reply": "your response in ${targetLanguage}",
  "translation": "English translation of your reply",
  "tip": "optional grammar tip or feedback if the user made a mistake, otherwise empty string"
}
`;

              const contents = [{ role: 'user', parts: [{ text: `Here is the conversation history:\n${conversationHistoryStr}\n\nRespond to the last message.` }] }];
              const aiResult = await callAIService(contents, systemPrompt);

              let aiReplyText = "¡Hola! Sigamos practicando.";
              let aiTranslation = "Hello! Let's keep practicing.";
              let aiTip = "";

              if (aiResult.ok) {
                try {
                  let cleaned = aiResult.text.trim();
                  if (cleaned.startsWith('```')) {
                    cleaned = cleaned.replace(/```json/g, '').replace(/```/g, '').trim();
                  }
                  const parsed = JSON.parse(cleaned);
                  if (parsed.reply) {
                    aiReplyText = parsed.reply;
                    aiTranslation = parsed.translation || "";
                    aiTip = parsed.tip || "";
                  }
                } catch (e) {
                  console.error('Error parsing AI chat partner response:', e);
                }
              }

              if (aiTip) {
                aiReplyText += `\n\n💡 Correction tip: ${aiTip}`;
              }

              let savedAiMessage;
              if (!isFallbackMode()) {
                savedAiMessage = await Message.create({
                  conversationId: 'ai-conversation-id',
                  sender: '666666666666666666666666',
                  recipient: userId,
                  text: aiReplyText,
                  translatedText: aiTranslation,
                  originalLanguage: targetLanguage,
                  targetLanguage: 'English',
                  messageType: 'text',
                  isRead: false
                });

                await Conversation.findByIdAndUpdate('ai-conversation-id', {
                  lastMessage: savedAiMessage._id,
                  updatedAt: new Date()
                });
              } else {
                const db = readJsonDb();
                db.messages = db.messages || [];
                savedAiMessage = {
                  _id: new mongoose.Types.ObjectId().toString(),
                  conversationId: 'ai-conversation-id',
                  sender: '666666666666666666666666',
                  recipient: userId,
                  text: aiReplyText,
                  translatedText: aiTranslation,
                  originalLanguage: targetLanguage,
                  targetLanguage: 'English',
                  messageType: 'text',
                  isRead: false,
                  createdAt: new Date().toISOString()
                };
                db.messages.push(savedAiMessage);

                db.conversations = db.conversations || [];
                const cIdx = db.conversations.findIndex(c => c._id === 'ai-conversation-id');
                if (cIdx !== -1) {
                  db.conversations[cIdx].lastMessage = savedAiMessage._id;
                  db.conversations[cIdx].updatedAt = savedAiMessage.createdAt;
                }
                writeJsonDb(db);
              }

              // Emit AI message to recipient
              io.to(userId).emit('new_message', savedAiMessage);
            } catch (innerErr) {
              console.error('Error in async AI response generator:', innerErr);
            }
          })();
        }
      } catch (err) {
        console.error('Socket error sending message:', err);
        callback?.({ success: false, error: 'Server error sending message' });
      }
    });

    // WebRTC Calling Signaling Events
    socket.on('call_user', ({ recipientId, signalData, type }) => {
      console.log(`📞 Socket: Routing call from ${socket.user.username} to ${recipientId} (${type})`);
      socket.to(recipientId).emit('incoming_call', {
        callerId: userId,
        callerUsername: socket.user.username,
        callerAvatarUrl: socket.user.avatarUrl,
        signalData,
        type
      });
    });

    socket.on('answer_call', ({ callerId, signalData, accepted }) => {
      console.log(`📞 Socket: Routing answer from ${socket.user.username} to ${callerId} (Accepted: ${accepted})`);
      socket.to(callerId).emit('call_answered', {
        recipientId: userId,
        signalData,
        accepted
      });
    });

    socket.on('end_call', ({ otherUserId }) => {
      console.log(`📞 Socket: End call session between ${userId} and ${otherUserId}`);
      socket.to(otherUserId).emit('call_ended');
    });

    socket.on('webrtc_signal', ({ recipientId, signalData }) => {
      socket.to(recipientId).emit('webrtc_signal', {
        senderId: userId,
        signalData
      });
    });

    socket.on('call_caption', ({ recipientId, text }) => {
      socket.to(recipientId).emit('incoming_caption', {
        senderId: userId,
        text
      });
    });

    socket.on('log_call', async ({ receiverId, type, status, duration }) => {
      try {
        const callerId = userId;

        // 1. Save Call History
        let callRecord;
        if (!isFallbackMode()) {
          const CallHistory = (await import('./models/CallHistory.js')).default;
          callRecord = await CallHistory.create({
            caller: callerId,
            receiver: receiverId,
            type,
            status,
            duration: duration || 0
          });
        } else {
          const db = readJsonDb();
          db.callHistory = db.callHistory || [];
          callRecord = {
            _id: new mongoose.Types.ObjectId().toString(),
            caller: callerId,
            receiver: receiverId,
            type,
            status,
            duration: duration || 0,
            createdAt: new Date().toISOString()
          };
          db.callHistory.push(callRecord);
          writeJsonDb(db);
        }

        // 2. Find or Create Conversation
        let conversationId;
        if (!isFallbackMode()) {
          const Conversation = (await import('./models/Conversation.js')).default;
          let conversation = await Conversation.findOne({
            participants: { $all: [callerId, receiverId] }
          });
          if (!conversation) {
            conversation = await Conversation.create({
              participants: [callerId, receiverId]
            });
          }
          conversationId = conversation._id;
        } else {
          const db = readJsonDb();
          db.conversations = db.conversations || [];
          let conversation = db.conversations.find(c =>
            c.participants.includes(callerId) && c.participants.includes(receiverId)
          );
          if (!conversation) {
            conversation = {
              _id: new mongoose.Types.ObjectId().toString(),
              participants: [callerId, receiverId],
              lastMessage: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            db.conversations.push(conversation);
            writeJsonDb(db);
          }
          conversationId = conversation._id;
        }

        // 3. Construct text for Call Log
        const formatDuration = (sec) => {
          const m = Math.floor(sec / 60);
          const s = sec % 60;
          return `${m}:${s < 10 ? '0' : ''}${s}`;
        };

        let callText = '';
        if (status === 'missed') {
          callText = `Missed ${type} call`;
        } else if (status === 'declined') {
          callText = `Declined ${type} call`;
        } else {
          callText = `${type === 'audio' ? 'Voice' : 'Video'} call, duration ${formatDuration(duration)}`;
        }

        // 4. Save call_log Message
        let savedMessage;
        if (!isFallbackMode()) {
          const Message = (await import('./models/Message.js')).default;
          const Conversation = (await import('./models/Conversation.js')).default;
          savedMessage = await Message.create({
            conversationId,
            sender: callerId,
            recipient: receiverId,
            text: callText,
            messageType: 'call_log',
            callDuration: duration || 0,
            callStatus: status,
            callType: type
          });
          await Conversation.findByIdAndUpdate(conversationId, {
            lastMessage: savedMessage._id,
            updatedAt: new Date()
          });
        } else {
          const db = readJsonDb();
          db.messages = db.messages || [];
          savedMessage = {
            _id: new mongoose.Types.ObjectId().toString(),
            conversationId: conversationId.toString(),
            sender: callerId,
            recipient: receiverId,
            text: callText,
            messageType: 'call_log',
            callDuration: duration || 0,
            callStatus: status,
            callType: type,
            isRead: false,
            createdAt: new Date().toISOString()
          };
          db.messages.push(savedMessage);

          const cIdx = db.conversations.findIndex(c => c._id === conversationId.toString());
          if (cIdx !== -1) {
            db.conversations[cIdx].lastMessage = savedMessage._id;
            db.conversations[cIdx].updatedAt = savedMessage.createdAt;
          }
          writeJsonDb(db);
        }

        // 5. Emit message to sender and recipient
        io.to(callerId).to(receiverId).emit('new_message', savedMessage);
      } catch (err) {
        console.error('Socket log_call error:', err);
      }
    });

    // Handle read receipts
    socket.on('read_messages', async ({ conversationId, otherUserId }) => {
      if (!isFallbackMode()) {
        await Message.updateMany(
          { conversationId, sender: otherUserId, isRead: false },
          { $set: { isRead: true } }
        );
      } else {
        const db = readJsonDb();
        db.messages = db.messages || [];
        db.messages.forEach(m => {
          if (m.conversationId === conversationId && m.sender === otherUserId && !m.isRead) {
            m.isRead = true;
          }
        });
        writeJsonDb(db);
      }
      socket.to(otherUserId).emit('messages_read', { conversationId, readerId: userId });
    });

    // Handle message delete
    socket.on('delete_message', async ({ messageId, conversationId, recipientId }, callback) => {
      try {
        let isOwner = false;
        if (!isFallbackMode()) {
          const msg = await Message.findById(messageId);
          isOwner = msg && msg.sender.toString() === userId;
          if (isOwner) {
            await Message.findByIdAndDelete(messageId);
            const remaining = await Message.find({ conversationId }).sort({ createdAt: -1 }).limit(1);
            await Conversation.findByIdAndUpdate(conversationId, {
              lastMessage: remaining.length > 0 ? remaining[0]._id : null
            });
          }
        } else {
          const db = readJsonDb();
          db.messages = db.messages || [];
          const idx = db.messages.findIndex(m => m._id === messageId);
          isOwner = idx !== -1 && db.messages[idx].sender === userId;
          if (isOwner) {
            db.messages.splice(idx, 1);
            const remaining = db.messages.filter(m => m.conversationId === conversationId);
            remaining.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const cIdx = db.conversations.findIndex(c => c._id === conversationId);
            if (cIdx !== -1) {
              db.conversations[cIdx].lastMessage = remaining.length > 0 ? remaining[0]._id : null;
            }
            writeJsonDb(db);
          }
        }

        if (isOwner) {
          io.to(userId).to(recipientId).emit('message_deleted', { messageId, conversationId });
          callback?.({ success: true });
        } else {
          callback?.({ success: false, error: 'Unauthorized delete request' });
        }
      } catch (err) {
        console.error('Socket message delete error:', err);
        callback?.({ success: false, error: 'Server error' });
      }
    });

    // Handle message reaction
    socket.on('react_message', async ({ messageId, conversationId, recipientId, emoji }, callback) => {
      try {
        let updatedReactions = [];
        if (!isFallbackMode()) {
          const message = await Message.findById(messageId);
          if (!message) {
            return callback?.({ success: false, error: 'Message not found' });
          }

          // Check if user already reacted
          const existingReactionIndex = (message.reactions || []).findIndex(
            r => r.userId.toString() === userId
          );

          if (existingReactionIndex !== -1) {
            // If same emoji, remove it (toggle)
            if (message.reactions[existingReactionIndex].emoji === emoji) {
              message.reactions.splice(existingReactionIndex, 1);
            } else {
              // Update emoji
              message.reactions[existingReactionIndex].emoji = emoji;
            }
          } else {
            // Add new reaction
            message.reactions = message.reactions || [];
            message.reactions.push({ userId, emoji });
          }

          await message.save();
          updatedReactions = message.reactions;
        } else {
          const db = readJsonDb();
          db.messages = db.messages || [];
          const idx = db.messages.findIndex(m => m._id === messageId);
          if (idx === -1) {
            return callback?.({ success: false, error: 'Message not found' });
          }

          const message = db.messages[idx];
          message.reactions = message.reactions || [];

          const existingReactionIndex = message.reactions.findIndex(
            r => r.userId === userId
          );

          if (existingReactionIndex !== -1) {
            if (message.reactions[existingReactionIndex].emoji === emoji) {
              message.reactions.splice(existingReactionIndex, 1);
            } else {
              message.reactions[existingReactionIndex].emoji = emoji;
            }
          } else {
            message.reactions.push({ userId, emoji });
          }

          writeJsonDb(db);
          updatedReactions = message.reactions;
        }

        // Broadcast reaction to both users
        io.to(userId).to(recipientId).emit('message_reaction', {
          messageId,
          conversationId,
          reactions: updatedReactions
        });

        callback?.({ success: true, reactions: updatedReactions });
      } catch (err) {
        console.error('Socket reaction error:', err);
        callback?.({ success: false, error: 'Server error adding reaction' });
      }
    });

    // Handle message editing
    socket.on('edit_message', async ({ messageId, conversationId, recipientId, newText }, callback) => {
      try {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        let savedMessage;

        if (!isFallbackMode()) {
          const message = await Message.findById(messageId);
          if (!message) {
            return callback?.({ success: false, error: 'Message not found' });
          }
          if (message.sender.toString() !== userId) {
            return callback?.({ success: false, error: 'You can only edit your own messages' });
          }
          if (message.createdAt < fifteenMinutesAgo) {
            return callback?.({ success: false, error: 'Edit time limit (15 mins) exceeded' });
          }

          // Translate if text changed
          let translatedText = message.translatedText;
          let originalLanguage = message.originalLanguage;
          if (newText && newText !== message.text) {
            const translationResult = await translateChatMessage(newText, message.targetLanguage);
            translatedText = translationResult.translatedText;
            originalLanguage = translationResult.sourceLanguage;
          }

          message.text = newText;
          message.translatedText = translatedText;
          message.originalLanguage = originalLanguage;
          message.isEdited = true;
          message.editedAt = new Date();
          await message.save();
          savedMessage = message;
        } else {
          const db = readJsonDb();
          db.messages = db.messages || [];
          const idx = db.messages.findIndex(m => m._id === messageId);
          if (idx === -1) {
            return callback?.({ success: false, error: 'Message not found' });
          }
          const message = db.messages[idx];
          if (message.sender !== userId) {
            return callback?.({ success: false, error: 'You can only edit your own messages' });
          }
          if (new Date(message.createdAt) < fifteenMinutesAgo) {
            return callback?.({ success: false, error: 'Edit time limit (15 mins) exceeded' });
          }

          let translatedText = message.translatedText;
          let originalLanguage = message.originalLanguage;
          if (newText && newText !== message.text) {
            const translationResult = await translateChatMessage(newText, message.targetLanguage);
            translatedText = translationResult.translatedText;
            originalLanguage = translationResult.sourceLanguage;
          }

          message.text = newText;
          message.translatedText = translatedText;
          message.originalLanguage = originalLanguage;
          message.isEdited = true;
          message.editedAt = new Date().toISOString();
          writeJsonDb(db);
          savedMessage = message;
        }

        io.to(userId).to(recipientId).emit('message_edited', savedMessage);
        callback?.({ success: true, message: savedMessage });
      } catch (err) {
        console.error('Socket edit_message error:', err);
        callback?.({ success: false, error: 'Server error editing message' });
      }
    });

    // Handle delete for me
    socket.on('delete_message_for_me', async ({ messageId, conversationId }, callback) => {
      try {
        if (!isFallbackMode()) {
          await Message.findByIdAndUpdate(messageId, {
            $addToSet: { deletedForUsers: userId }
          });
        } else {
          const db = readJsonDb();
          db.messages = db.messages || [];
          const idx = db.messages.findIndex(m => m._id === messageId);
          if (idx !== -1) {
            db.messages[idx].deletedForUsers = db.messages[idx].deletedForUsers || [];
            if (!db.messages[idx].deletedForUsers.includes(userId)) {
              db.messages[idx].deletedForUsers.push(userId);
            }
            writeJsonDb(db);
          }
        }
        callback?.({ success: true });
      } catch (err) {
        console.error('Socket delete_message_for_me error:', err);
        callback?.({ success: false, error: 'Server error deleting message' });
      }
    });

    // Handle delete for everyone
    socket.on('delete_message_for_everyone', async ({ messageId, conversationId, recipientId }, callback) => {
      try {
        let savedMessage;
        if (!isFallbackMode()) {
          const message = await Message.findById(messageId);
          if (!message) {
            return callback?.({ success: false, error: 'Message not found' });
          }
          if (message.sender.toString() !== userId) {
            return callback?.({ success: false, error: 'You can only delete your own messages' });
          }

          message.isDeletedForEveryone = true;
          message.text = 'This message was deleted';
          message.translatedText = 'This message was deleted';
          message.imageUrl = null;
          message.audioUrl = null;
          message.stickerUrl = null;
          await message.save();
          savedMessage = message;
        } else {
          const db = readJsonDb();
          db.messages = db.messages || [];
          const idx = db.messages.findIndex(m => m._id === messageId);
          if (idx === -1) {
            return callback?.({ success: false, error: 'Message not found' });
          }
          const message = db.messages[idx];
          if (message.sender !== userId) {
            return callback?.({ success: false, error: 'You can only delete your own messages' });
          }

          message.isDeletedForEveryone = true;
          message.text = 'This message was deleted';
          message.translatedText = 'This message was deleted';
          message.imageUrl = null;
          message.audioUrl = null;
          message.stickerUrl = null;
          writeJsonDb(db);
          savedMessage = message;
        }

        io.to(userId).to(recipientId).emit('message_deleted_for_everyone', { messageId, conversationId, message: savedMessage });
        callback?.({ success: true });
      } catch (err) {
        console.error('Socket delete_message_for_everyone error:', err);
        callback?.({ success: false, error: 'Server error deleting message' });
      }
    });

    // Handle open view once
    socket.on('open_view_once', async ({ messageId, conversationId, recipientId }, callback) => {
      try {
        let savedMessage;
        if (!isFallbackMode()) {
          const message = await Message.findById(messageId);
          if (!message) {
            return callback?.({ success: false, error: 'Message not found' });
          }
          message.viewOnceOpened = true;
          message.text = 'Opened';
          message.translatedText = 'Opened';
          message.imageUrl = null;
          await message.save();
          savedMessage = message;
        } else {
          const db = readJsonDb();
          db.messages = db.messages || [];
          const idx = db.messages.findIndex(m => m._id === messageId);
          if (idx === -1) {
            return callback?.({ success: false, error: 'Message not found' });
          }
          const message = db.messages[idx];
          message.viewOnceOpened = true;
          message.text = 'Opened';
          message.translatedText = 'Opened';
          message.imageUrl = null;
          writeJsonDb(db);
          savedMessage = message;
        }

        io.to(userId).to(recipientId).emit('message_view_once_opened', { messageId, conversationId, message: savedMessage });
        callback?.({ success: true });
      } catch (err) {
        console.error('Socket open_view_once error:', err);
        callback?.({ success: false, error: 'Server error opening view once message' });
      }
    });

    socket.on('disconnect', async () => {
      console.log(`🔌 User disconnected: ${socket.user.username}`);
      
      // Update offline status in DB
      const logoutTime = new Date();
      if (!isFallbackMode()) {
        try {
          await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: logoutTime });
        } catch (err) {
          console.error('Error updating offline presence (Mongo):', err);
        }
      } else {
        const db = readJsonDb();
        const uIdx = db.users.findIndex(u => u._id === userId);
        if (uIdx !== -1) {
          db.users[uIdx].isOnline = false;
          db.users[uIdx].lastSeen = logoutTime.toISOString();
          writeJsonDb(db);
        }
      }

      // Broadcast presence updates
      io.emit('user_status', { userId, isOnline: false, lastSeen: logoutTime });
    });
  });

  process.on('unhandledRejection', (err) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
  });
};

startServer();
