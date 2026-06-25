import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Lesson from '../models/Lesson.js';
import connectDB from '../config/db.js';

dotenv.config();

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
  // FRENCH COURSE
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
  // GERMAN COURSE
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
  // ITALIAN COURSE
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
  // ARABIC COURSE
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

const seedDatabase = async () => {
  try {
    await connectDB();
    await Lesson.deleteMany({});
    console.log('✅ Cleared existing lessons.');
    const inserted = await Lesson.insertMany(lessonsData);
    console.log(`✅ Seeded ${inserted.length} lessons across all languages:`);
    const byLang = {};
    inserted.forEach(l => { byLang[l.language] = (byLang[l.language] || 0) + 1; });
    Object.entries(byLang).forEach(([lang, count]) => console.log(`   ${lang}: ${count} lessons`));
    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
