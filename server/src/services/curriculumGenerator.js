import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const languages = ['English', 'French', 'Spanish', 'German', 'Arabic', 'Italian', 'Korean', 'Japanese'];

const langKeys = {
  English: 'en',
  Spanish: 'es',
  French: 'fr',
  German: 'de',
  Arabic: 'ar',
  Italian: 'it',
  Korean: 'ko',
  Japanese: 'ja'
};

const curriculumData = [
  // 1. Greetings
  {
    title: 'Greetings',
    unit: 1,
    unitTitle: 'Greetings & Basics',
    category: 'Speaking',
    words: [
      {
        picture: '👋',
        translations: { en: 'Hello', es: 'Hola', fr: 'Bonjour', de: 'Hallo', it: 'Ciao', ar: 'مرحباً', ko: '안녕하세요', ja: 'こんにちは' },
        pronunciations: { en: 'Hello', es: 'oh-lah', fr: 'bohn-zhoor', de: 'hah-loh', it: 'chow', ar: 'mar-ha-ban', ko: 'an-nyeong-ha-se-yo', ja: 'kon-ni-chi-wa' },
        exampleSentences: { en: 'Hello, how are you?', es: '¡Hola! ¿Cómo estás?', fr: 'Bonjour, comment ça va?', de: 'Hallo, wie geht es dir?', it: 'Ciao, come stai?', ar: 'مرحباً، كيف حالك؟', ko: '안녕하세요, 어떻게 지내세요?', ja: 'こんにちは、お元気ですか？' }
      },
      {
        picture: '👋',
        translations: { en: 'Goodbye', es: 'Adiós', fr: 'Au revoir', de: 'Tschüss', it: 'Arrivederci', ar: 'مع السلامة', ko: '안녕히 계세요', ja: 'さようなら' },
        pronunciations: { en: 'Goodbye', es: 'ah-dyohs', fr: 'oh-ruh-vwahr', de: 'tshoos', it: 'ah-ree-veh-dair-chee', ar: 'ma-as-sa-lah-mah', ko: 'an-nyeong-hi gye-se-yo', ja: 'sa-you-na-ra' },
        exampleSentences: { en: 'Goodbye, see you tomorrow.', es: 'Adiós, nos vemos mañana.', fr: 'Au revoir, à demain.', de: 'Tschüss, bis morgen.', it: 'Arrivederci, a domani.', ar: 'مع السلامة، أراك غداً.', ko: '안녕히 계세요, 내일 봐요.', ja: 'さようなら、また明日。' }
      },
      {
        picture: '🙏',
        translations: { en: 'Thank you', es: 'Gracias', fr: 'Merci', de: 'Danke', it: 'Grazie', ar: 'شكراً', ko: '감사합니다', ja: 'ありがとう' },
        pronunciations: { en: 'Thank you', es: 'grah-syahs', fr: 'mair-see', de: 'dahn-kuh', it: 'grah-tsyeh', ar: 'shook-ran', ko: 'gam-sa-ham-ni-da', ja: 'a-ri-ga-tou' },
        exampleSentences: { en: 'Thank you for your help.', es: 'Gracias por tu ayuda.', fr: 'Merci pour votre aide.', de: 'Danke für deine Hilfe.', it: 'Grazie per il tuo aiuto.', ar: 'شكراً على مساعدتك.', ko: '도와주셔서 감사합니다.', ja: '助けてくれてありがとう。' }
      },
      {
        picture: '🙌',
        translations: { en: 'Please', es: 'Por favor', fr: "S'il vous plaît", de: 'Bitte', it: 'Per favore', ar: 'من فضلك', ko: '주세요', ja: 'お願いします' },
        pronunciations: { en: 'Please', es: 'por fah-vor', fr: 'seel voo pleh', de: 'bit-tuh', it: 'pair fah-voh-ray', ar: 'min fad-lik', ko: 'ju-se-yo', ja: 'o-ne-gai-shi-masu' },
        exampleSentences: { en: 'Water, please.', es: 'Agua, por favor.', fr: "De l'eau, s'il vous plaît.", de: 'Wasser, bitte.', it: 'Acqua, per favore.', ar: 'ماء، من فضلك.', ko: '물 주세요.', ja: '水をお願いします。' }
      },
      {
        picture: '✅',
        translations: { en: 'Yes', es: 'Sí', fr: 'Oui', de: 'Ja', it: 'Sì', ar: 'نعم', ko: '네', ja: 'はい' },
        pronunciations: { en: 'Yes', es: 'see', fr: 'wee', de: 'yah', it: 'see', ar: 'na-am', ko: 'neh', ja: 'hai' },
        exampleSentences: { en: 'Yes, I understand.', es: 'Sí, entiendo.', fr: 'Oui, je comprends.', de: 'Ja, ich verstehe.', it: 'Sì, capisco.', ar: 'نعم، أنا أفهم.', ko: '네, 이해합니다.', ja: 'はい、理解しました。' }
      },
      {
        picture: '❌',
        translations: { en: 'No', es: 'No', fr: 'Non', de: 'Nein', it: 'No', ar: 'لا', ko: '아니요', ja: 'いいえ' },
        pronunciations: { en: 'No', es: 'noh', fr: 'nohn', de: 'nine', it: 'noh', ar: 'lah', ko: 'a-ni-yo', ja: 'ee-eh' },
        exampleSentences: { en: 'No, thank you.', es: 'No, gracias.', fr: 'Non, merci.', de: 'Nein, danke.', it: 'No, grazie.', ar: 'لا، شكراً.', ko: '아니요, 감사합니다.', ja: 'いいえ、結構です。' }
      }
    ]
  },
  // 2. Everyday words
  {
    title: 'Everyday words',
    unit: 1,
    unitTitle: 'Greetings & Basics',
    category: 'Vocabulary',
    words: [
      {
        picture: '🚗',
        translations: { en: 'Car', es: 'Coche', fr: 'Voiture', de: 'Auto', it: 'Macchina', ar: 'سيارة', ko: '차', ja: '車' },
        pronunciations: { en: 'Car', es: 'coh-cheh', fr: 'vwah-tyur', de: 'ow-toh', it: 'mahk-kee-nah', ar: 'say-yah-rah', ko: 'cha', ja: 'ku-ru-ma' },
        exampleSentences: { en: 'The car is red.', es: 'El coche es rojo.', fr: 'La voiture est rouge.', de: 'Das Auto ist rot.', it: 'La macchina è rossa.', ar: 'السيارة حمراء.', ko: '차가 빨간색입니다.', ja: '車は赤いです。' }
      },
      {
        picture: '🏠',
        translations: { en: 'House', es: 'Casa', fr: 'Maison', de: 'Haus', it: 'Casa', ar: 'بيت', ko: '집', ja: '家' },
        pronunciations: { en: 'House', es: 'cah-sah', fr: 'meh-zohn', de: 'hows', it: 'cah-sah', ar: 'bayt', ko: 'jip', ja: 'ee-eh' },
        exampleSentences: { en: 'This is my house.', es: 'Esta es mi casa.', fr: "C'est ma maison.", de: 'Das ist mein Haus.', it: 'Questa è la mia casa.', ar: 'هذا بيتي.', ko: '이곳은 제 집입니다.', ja: 'これは私の家です。' }
      },
      {
        picture: '💧',
        translations: { en: 'Water', es: 'Agua', fr: 'Eau', de: 'Wasser', it: 'Acqua', ar: 'ماء', ko: '물', ja: '水' },
        pronunciations: { en: 'Water', es: 'ah-gwah', fr: 'oh', de: 'vahs-ser', it: 'ahk-kwah', ar: 'maa', ko: 'mool', ja: 'mi-zu' },
        exampleSentences: { en: 'I drink water.', es: 'Bebo agua.', fr: "Je bois de l'eau.", de: 'Ich trinke Wasser.', it: 'Bevo acqua.', ar: 'أنا أشرب الماء.', ko: '저는 물을 마십니다.', ja: '私は水を飲みます。' }
      },
      {
        picture: '🍎',
        translations: { en: 'Apple', es: 'Manzana', fr: 'Pomme', de: 'Apfel', it: 'Mela', ar: 'تفاحة', ko: '사과', ja: 'りんご' },
        pronunciations: { en: 'Apple', es: 'mahn-thah-nah', fr: 'puhm', de: 'ahp-fel', it: 'meh-lah', ar: 'tuf-fah-hah', ko: 'sa-gwa', ja: 'rin-go' },
        exampleSentences: { en: 'He eats an apple.', es: 'Él come una manzana.', fr: 'Il mange une pomme.', de: 'Er isst einen Apfel.', it: 'Lui mangia una mela.', ar: 'هو يأكل تفاحة.', ko: '그는 사과를 먹습니다.', ja: '彼はリンゴを食べます。' }
      },
      {
        picture: '🥛',
        translations: { en: 'Milk', es: 'Leche', fr: 'Lait', de: 'Milch', it: 'Latte', ar: 'حليب', ko: '우유', ja: '牛乳' },
        pronunciations: { en: 'Milk', es: 'leh-cheh', fr: 'leh', de: 'milkh', it: 'laht-teh', ar: 'ha-leeb', ko: 'oo-yoo', ja: 'gyuu-nyuu' },
        exampleSentences: { en: 'Fresh milk is good.', es: 'La leche fresca es buena.', fr: 'Le lait frais est bon.', de: 'Frische Milch ist gut.', it: 'Il latte fresco è buono.', ar: 'الحليب الطازج مفيد.', ko: '신선한 우유는 좋습니다.', ja: '新鮮な牛乳は良いです。' }
      },
      {
        picture: '📖',
        translations: { en: 'Book', es: 'Libro', fr: 'Livre', de: 'Buch', it: 'Libro', ar: 'كتاب', ko: '책', ja: '本' },
        pronunciations: { en: 'Book', es: 'lee-broh', fr: 'lee-vr', de: 'bookh', it: 'lee-broh', ar: 'ki-tab', ko: 'chaek', ja: 'hon' },
        exampleSentences: { en: 'I read a book.', es: 'Leo un libro.', fr: 'Je lis un livre.', de: 'Ich lese ein Buch.', it: 'Leggo un libro.', ar: 'أنا أقرأ كتاباً.', ko: '저는 책을 읽습니다.', ja: '私は本を読みます。' }
      }
    ]
  },
  // 3. Animals
  {
    title: 'Animals',
    unit: 1,
    unitTitle: 'Greetings & Basics',
    category: 'Vocabulary',
    words: [
      {
        picture: '🐶',
        translations: { en: 'Dog', es: 'Perro', fr: 'Chien', de: 'Hund', it: 'Cane', ar: 'كلب', ko: '개', ja: '犬' },
        pronunciations: { en: 'Dog', es: 'pe-rro', fr: 'shee-an', de: 'hoond', it: 'kah-neh', ar: 'kalb', ko: 'gae', ja: 'ee-nu' },
        exampleSentences: { en: 'The dog barks.', es: 'El perro ladra.', fr: 'Le chien aboie.', de: 'Der Hund bellt.', it: 'Il cane abbaia.', ar: 'الكلب ينبح.', ko: '개가 짖습니다.', ja: '犬が吠えます。' }
      },
      {
        picture: '🐱',
        translations: { en: 'Cat', es: 'Gato', fr: 'Chat', de: 'Katze', it: 'Gatto', ar: 'قط', ko: '고양이', ja: '猫' },
        pronunciations: { en: 'Cat', es: 'gah-toh', fr: 'shah', de: 'kaht-tsuh', it: 'gaht-toh', ar: 'qitt', ko: 'go-yang-i', ja: 'neh-ko' },
        exampleSentences: { en: 'The cat sleeps.', es: 'El gato duerme.', fr: 'Le chat dort.', de: 'Die Katze schläft.', it: 'Il gatto dorme.', ar: 'القط ينام.', ko: '고양이가 잡니다.', ja: '猫が寝ています。' }
      },
      {
        picture: '🐐',
        translations: { en: 'Goat', es: 'Cabra', fr: 'Chèvre', de: 'Ziege', it: 'Capra', ar: 'ماعز', ko: '염소', ja: '山羊' },
        pronunciations: { en: 'Goat', es: 'cah-brah', fr: 'sheh-vr', de: 'tsee-guh', it: 'cah-prah', ar: 'ma-iz', ko: 'yeom-so', ja: 'ya-gi' },
        exampleSentences: { en: 'The goat eats grass.', es: 'La cabra come hierba.', fr: 'La chèvre mange de l\'herbe.', de: 'Die Ziege frisst Gras.', it: 'La capra mangia l\'erba.', ar: 'الماعز يأكل العشب.', ko: '염소가 풀을 먹습니다.', ja: '山羊が草を食べます。' }
      },
      {
        picture: '🐦',
        translations: { en: 'Bird', es: 'Pájaro', fr: 'Oiseau', de: 'Vogel', it: 'Uccello', ar: 'طائر', ko: '새', ja: '鳥' },
        pronunciations: { en: 'Bird', es: 'pah-hah-roh', fr: 'wah-zoh', de: 'foh-gel', it: 'oot-chel-loh', ar: 'ta-ir', ko: 'sae', ja: 'toh-ri' },
        exampleSentences: { en: 'The bird sings.', es: 'El pájaro canta.', fr: 'L\'oiseau chante.', de: 'Der Vogel singt.', it: 'L\'uccello canta.', ar: 'الطائر يغرد.', ko: '새가 노래합니다.', ja: '鳥が歌います。' }
      },
      {
        picture: '🐟',
        translations: { en: 'Fish', es: 'Pez', fr: 'Poisson', de: 'Fisch', it: 'Pesce', ar: 'سمكة', ko: '물고기', ja: '魚' },
        pronunciations: { en: 'Fish', es: 'peth', fr: 'pwah-sohn', de: 'fish', it: 'peh-sheh', ar: 'sa-ma-kah', ko: 'mool-go-gi', ja: 'sa-ka-na' },
        exampleSentences: { en: 'The fish swims.', es: 'El pez nada.', fr: 'Le poisson nage.', de: 'Der Fisch schwimmt.', it: 'Il pesce nuota.', ar: 'السمكة تسبح.', ko: '물고기가 헤엄칩니다.', ja: '魚が泳ぎます。' }
      },
      {
        picture: '🐴',
        translations: { en: 'Horse', es: 'Caballo', fr: 'Cheval', de: 'Pferd', it: 'Cavallo', ar: 'حصان', ko: '말', ja: '馬' },
        pronunciations: { en: 'Horse', es: 'cah-bah-yoh', fr: 'shuh-vahl', de: 'pfairt', it: 'cah-vahl-loh', ar: 'hi-san', ko: 'mahl', ja: 'oo-ma' },
        exampleSentences: { en: 'The horse runs fast.', es: 'El caballo corre rápido.', fr: 'Le cheval court vite.', de: 'Das Pferd läuft schnell.', it: 'Il cavallo corre veloce.', ar: 'الحصان يجري سريعاً.', ko: '말이 빠르게 달립니다.', ja: '馬が速く走ります。' }
      }
    ]
  },
  // 4. Food
  {
    title: 'Food',
    unit: 1,
    unitTitle: 'Greetings & Basics',
    category: 'Vocabulary',
    words: [
      {
        picture: '🍚',
        translations: { en: 'Rice', es: 'Arroz', fr: 'Riz', de: 'Reis', it: 'Riso', ar: 'أرز', ko: '밥', ja: 'ご飯' },
        pronunciations: { en: 'Rice', es: 'ah-rroth', fr: 'ree', de: 'rice', it: 'ree-zoh', ar: 'a-ruzz', ko: 'bap', ja: 'go-han' },
        exampleSentences: { en: 'I like rice.', es: 'Me gusta el arroz.', fr: 'J\'aime le riz.', de: 'Ich mag Reis.', it: 'Mi piace il riso.', ar: 'أنا أحب الأرز.', ko: '저는 밥을 좋아합니다.', ja: '私はご飯が好きです。' }
      },
      {
        picture: '🍞',
        translations: { en: 'Bread', es: 'Pan', fr: 'Pain', de: 'Brot', it: 'Pane', ar: 'خبز', ko: '빵', ja: 'パン' },
        pronunciations: { en: 'Bread', es: 'pan', fr: 'pan', de: 'brot', it: 'pah-neh', ar: 'khubz', ko: 'ppang', ja: 'pan' },
        exampleSentences: { en: 'We buy fresh bread.', es: 'Compramos pan fresco.', fr: 'Nous achetons du pain frais.', de: 'Wir kaufen frisches Brot.', it: 'Compriamo pane fresco.', ar: 'نحن نشتري خبزاً طازجاً.', ko: '우리는 신선한 빵을 삽니다.', ja: '私たちは新鮮なパンを買います。' }
      },
      {
        picture: '🥚',
        translations: { en: 'Egg', es: 'Huevo', fr: 'Œuf', de: 'Ei', it: 'Uovo', ar: 'بيض', ko: '계란', ja: '卵' },
        pronunciations: { en: 'Egg', es: 'weh-voh', fr: 'uhf', de: 'eye', it: 'woh-voh', ar: 'bayd', ko: 'gye-ran', ja: 'ta-ma-go' },
        exampleSentences: { en: 'An egg for breakfast.', es: 'Un huevo para el desayuno.', fr: 'Un œuf pour le petit-déjeuner.', de: 'Ein Ei zum Frühstück.', it: 'Un uovo a colazione.', ar: 'بيضة لوجبة الإفطار.', ko: '아침 식사로 계란을 먹습니다.', ja: '朝食に卵を食べます。' }
      },
      {
        picture: '🥩',
        translations: { en: 'Meat', es: 'Carne', fr: 'Viande', de: 'Fleisch', it: 'Carne', ar: 'لحم', ko: '고기', ja: '肉' },
        pronunciations: { en: 'Meat', es: 'car-neh', fr: 'vee-and', de: 'fly-sh', it: 'car-neh', ar: 'lahm', ko: 'go-gi', ja: 'ni-ku' },
        exampleSentences: { en: 'I do not eat meat.', es: 'No como carne.', fr: 'Je ne mange pas de viande.', de: 'Ich esse kein Fleisch.', it: 'Non mangio carne.', ar: 'أنا لا آكل اللحم.', ko: '저는 고기를 먹지 않습니다.', ja: '私は肉を食べません。' }
      },
      {
        picture: '🍓',
        translations: { en: 'Fruit', es: 'Fruta', fr: 'Fruit', de: 'Obst', it: 'Frutta', ar: 'فاكهة', ko: '과일', ja: '果物' },
        pronunciations: { en: 'Fruit', es: 'froo-tah', fr: 'froo-ee', de: 'ohbst', it: 'froot-tah', ar: 'fa-ki-hah', ko: 'gwa-il', ja: 'ku-da-mo-no' },
        exampleSentences: { en: 'Eat fresh fruit daily.', es: 'Come fruta fresca todos los días.', fr: 'Mangez des fruits frais chaque jour.', de: 'Iss täglich frisches Obst.', it: 'Mangia frutta fresca ogni giorno.', ar: 'تناول الفاكهة الطازجة يومياً.', ko: '매일 신선한 과일을 드세요.', ja: '毎日新鮮な果物を食べましょう。' }
      },
      {
        picture: '☕',
        translations: { en: 'Coffee', es: 'Café', fr: 'Café', de: 'Kaffee', it: 'Caffè', ar: 'قهوة', ko: '커피', ja: 'コーヒー' },
        pronunciations: { en: 'Coffee', es: 'cah-feh', fr: 'cah-feh', de: 'kah-fee', it: 'cahf-feh', ar: 'qah-wah', ko: 'keo-pi', ja: 'koo-hii' },
        exampleSentences: { en: 'Black coffee, please.', es: 'Café solo, por favor.', fr: 'Café noir, s\'il vous plaît.', de: 'Schwarzer Kaffee, bitte.', it: 'Caffè nero, per favore.', ar: 'قهوة سوداء، من فضلك.', ko: '블랙 커피 주세요.', ja: 'ブラックコーヒーをお願いします。' }
      }
    ]
  },
  // 5. Family
  {
    title: 'Family',
    unit: 1,
    unitTitle: 'Greetings & Basics',
    category: 'Vocabulary',
    words: [
      {
        picture: '👩',
        translations: { en: 'Mother', es: 'Madre', fr: 'Mère', de: 'Mutter', it: 'Madre', ar: 'أم', ko: '어머니', ja: 'お母さん' },
        pronunciations: { en: 'Mother', es: 'ma-dreh', fr: 'mair', de: 'moot-ter', it: 'mah-dreh', ar: 'umm', ko: 'eo-meo-ni', ja: 'o-kaa-san' },
        exampleSentences: { en: 'My mother is nice.', es: 'Mi madre es amable.', fr: 'Ma mère est gentille.', de: 'Meine Mutter ist nett.', it: 'Mia madre è gentile.', ar: 'أمي لطيفة.', ko: '저의 어머니는 친절하십니다.', ja: '私の母は親切です。' }
      },
      {
        picture: '👨',
        translations: { en: 'Father', es: 'Padre', fr: 'Père', de: 'Vater', it: 'Padre', ar: 'أب', ko: '아버지', ja: 'お父さん' },
        pronunciations: { en: 'Father', es: 'pa-dreh', fr: 'pair', de: 'fah-ter', it: 'pah-dreh', ar: 'ab', ko: 'a-beo-ji', ja: 'o-tou-san' },
        exampleSentences: { en: 'My father is tall.', es: 'Mi padre es alto.', fr: 'Mon père es grand.', de: 'Mein Vater ist groß.', it: 'Mio padre è alto.', ar: 'أبي طويل القامة.', ko: '저의 아버지는 키가 크십니다.', ja: '私の父は背が高いです。' }
      },
      {
        picture: '👦',
        translations: { en: 'Brother', es: 'Hermano', fr: 'Frère', de: 'Bruder', it: 'Fratello', ar: 'أخ', ko: '형제', ja: '兄弟' },
        pronunciations: { en: 'Brother', es: 'air-mah-noh', fr: 'frair', de: 'broo-der', it: 'frah-tel-loh', ar: 'akh', ko: 'hyeong-je', ja: 'kyou-dai' },
        exampleSentences: { en: 'He has one brother.', es: 'Tiene un hermano.', fr: 'Il a un frère.', de: 'Er hat einen Bruder.', it: 'Lui ha un fratello.', ar: 'لديه أخ واحد.', ko: '그는 남자 형제가 한 명 있습니다.', ja: '彼には兄弟が一人います。' }
      },
      {
        picture: '👧',
        translations: { en: 'Sister', es: 'Hermana', fr: 'Sœur', de: 'Schwester', it: 'Sorella', ar: 'أخت', ko: '자매', ja: '姉妹' },
        pronunciations: { en: 'Sister', es: 'air-mah-nah', fr: 'suhr', de: 'shves-ter', it: 'soh-rel-lah', ar: 'ukht', ko: 'ja-mae', ja: 'shi-mai' },
        exampleSentences: { en: 'She is my sister.', es: 'Ella es mi hermana.', fr: 'Elle est ma sœur.', de: 'Sie ist meine Schwester.', it: 'Lei è mia sorella.', ar: 'هي أختي.', ko: '그녀는 제 여자 자매입니다.', ja: '彼女は私の姉妹です。' }
      },
      {
        picture: '👵',
        translations: { en: 'Grandmother', es: 'Abuela', fr: 'Grand-mère', de: 'Großmutter', it: 'Nonna', ar: 'جدة', ko: '할머니', ja: '祖母' },
        pronunciations: { en: 'Grandmother', es: 'ah-bweh-lah', fr: 'grahn-mair', de: 'grohs-moot-ter', it: 'nohn-nah', ar: 'jad-dah', ko: 'hal-meo-ni', ja: 'so-bo' },
        exampleSentences: { en: 'My grandmother cooks well.', es: 'Mi abuela cocina bien.', fr: 'Ma grand-mère cuisine bien.', de: 'Meine Großmutter kocht gut.', it: 'Mia nonna cucina bene.', ar: 'جدتي تطهو جيداً.', ko: '저의 할머니는 요리를 잘하십니다.', ja: '私の祖母は料理が上手です。' }
      },
      {
        picture: '👴',
        translations: { en: 'Grandfather', es: 'Abuelo', fr: 'Grand-père', de: 'Großvater', it: 'Nonno', ar: 'جد', ko: '할아버지', ja: '祖부' },
        pronunciations: { en: 'Grandfather', es: 'ah-bweh-loh', fr: 'grahn-pair', de: 'grohs-fah-ter', it: 'nohn-noh', ar: 'jadd', ko: 'hal-a-beo-ji', ja: 'so-fu' },
        exampleSentences: { en: 'My grandfather is wise.', es: 'Mi abuelo es sabio.', fr: 'Mon grand-père est sage.', de: 'Mein Großvater ist weise.', it: 'Mio nonno è saggio.', ar: 'جدّي حكيم.', ko: '저의 할아버지는 지혜로우십니다.', ja: '私の祖父は賢いです。' }
      }
    ]
  },
  // 6. Numbers
  {
    title: 'Numbers',
    unit: 1,
    unitTitle: 'Greetings & Basics',
    category: 'Vocabulary',
    words: [
      {
        picture: '1️⃣',
        translations: { en: 'One', es: 'Uno', fr: 'Un', de: 'Eins', it: 'Uno', ar: 'واحد', ko: '하나', ja: '一' },
        pronunciations: { en: 'One', es: 'oo-noh', fr: 'un', de: 'eyns', it: 'oo-noh', ar: 'wa-hid', ko: 'ha-na', ja: 'ichi' },
        exampleSentences: { en: 'I have one apple.', es: 'Tengo una manzana.', fr: 'J\'ai une pomme.', de: 'Ich habe einen Apfel.', it: 'Ho una mela.', ar: 'عندي تفاحة واحدة.', ko: '저는 사과 한 개를 가지고 있습니다.', ja: '私はリンゴを一つ持っています。' }
      },
      {
        picture: '2️⃣',
        translations: { en: 'Two', es: 'Dos', fr: 'Deux', de: 'Zwei', it: 'Due', ar: 'اثنان', ko: '둘', ja: '二' },
        pronunciations: { en: 'Two', es: 'dohs', fr: 'duh', de: 'tsvey', it: 'doo-eh', ar: 'ith-nan', ko: 'dool', ja: 'ni' },
        exampleSentences: { en: 'Two cups of coffee.', es: 'Dos tazas de café.', fr: 'Deux tasses de café.', de: 'Zwei Tassen Kaffee.', it: 'Due tazze di caffè.', ar: 'كوبان من القهوة.', ko: '커피 두 잔 주세요.', ja: 'コーヒーを二つお願いします。' }
      },
      {
        picture: '3️⃣',
        translations: { en: 'Three', es: 'Tres', fr: 'Trois', de: 'Drei', it: 'Tre', ar: 'ثلاثة', ko: '셋', ja: '三' },
        pronunciations: { en: 'Three', es: 'trehs', fr: 'trwah', de: 'drey', it: 'treh', ar: 'tha-lah-tha', ko: 'set', ja: 'san' },
        exampleSentences: { en: 'Three books here.', es: 'Tres libros aquí.', fr: 'Trois livres ici.', de: 'Drei Bücher hier.', it: 'Tre libri qui.', ar: 'ثلاثة كتب هنا.', ko: '여기에 책 세 권이 있습니다.', ja: 'ここに本が三冊あります。' }
      },
      {
        picture: '4️⃣',
        translations: { en: 'Four', es: 'Cuatro', fr: 'Quatre', de: 'Vier', it: 'Quattro', ar: 'أربعة', ko: '넷', ja: '四' },
        pronunciations: { en: 'Four', es: 'cwah-troh', fr: 'katr', de: 'feer', it: 'qwaht-troh', ar: 'ar-bah-ah', ko: 'net', ja: 'yon' },
        exampleSentences: { en: 'Four white cars.', es: 'Cuatro coches blancos.', fr: 'Quatre voitures blanches.', de: 'Vier weiße Autos.', it: 'Quattro macchine bianche.', ar: 'أربع سيارات بيضاء.', ko: '하얀 차 네 대가 있습니다.', ja: '白い車が四台あります。' }
      },
      {
        picture: '5️⃣',
        translations: { en: 'Five', es: 'Cinco', fr: 'Cinq', de: 'Fünf', it: 'Cinque', ar: 'خمسة', ko: '다섯', ja: '五' },
        pronunciations: { en: 'Five', es: 'theen-coh', fr: 'sank', de: 'funf', it: 'cheen-qweh', ar: 'kham-sah', ko: 'da-seot', ja: 'go' },
        exampleSentences: { en: 'I see five birds.', es: 'Veo cinco pájaros.', fr: 'Je vois javais cinq oiseaux.', de: 'Ich sehe fünf Vögel.', it: 'Vedo cinque uccelli.', ar: 'أنا أرى خمسة طيور.', ko: '저는 새 다섯 마리를 봅니다.', ja: '私は鳥を五羽見ています。' }
      },
      {
        picture: '6️⃣',
        translations: { en: 'Six', es: 'Seis', fr: 'Six', de: 'Sechs', it: 'Sei', ar: 'ستة', ko: '여섯', ja: '六' },
        pronunciations: { en: 'Six', es: 'seys', fr: 'sees', de: 'zeks', it: 'say', ar: 'sit-tah', ko: 'yeo-seot', ja: 'roku' },
        exampleSentences: { en: 'Six chairs in the room.', es: 'Seis sillas en la habitación.', fr: 'Six chaises dans la pièce.', de: 'Sechs Stühle im Zimmer.', it: 'Sei sedie nella stanza.', ar: 'ستة كراسٍ في الغرفة.', ko: '방에 의자 여섯 개가 있습니다.', ja: '部屋に椅子が六つあります。' }
      }
    ]
  },
  // 7. Colors
  {
    title: 'Colors',
    unit: 1,
    unitTitle: 'Greetings & Basics',
    category: 'Vocabulary',
    words: [
      {
        picture: '🔴',
        translations: { en: 'Red', es: 'Rojo', fr: 'Rouge', de: 'Rot', it: 'Rosso', ar: 'أحمر', ko: '빨간색', ja: '赤' },
        pronunciations: { en: 'Red', es: 'roh-hoh', fr: 'roozh', de: 'roht', it: 'rohs-soh', ar: 'ah-mar', ko: 'ppal-gan-saek', ja: 'aka' },
        exampleSentences: { en: 'The rose is red.', es: 'La rosa es roja.', fr: 'La rose est rouge.', de: 'Die Rose ist rot.', it: 'La rosa è rossa.', ar: 'الوردة حمراء.', ko: '장미는 빨간색입니다.', ja: 'バラは赤いです。' }
      },
      {
        picture: '🔵',
        translations: { en: 'Blue', es: 'Azul', fr: 'Bleu', de: 'Blau', it: 'Blu', ar: 'أزرق', ko: '파란색', ja: '青' },
        pronunciations: { en: 'Blue', es: 'ah-thool', fr: 'bluh', de: 'blow', it: 'bloo', ar: 'az-raq', ko: 'pa-ran-saek', ja: 'ao' },
        exampleSentences: { en: 'The sky is blue.', es: 'El cielo es azul.', fr: 'Le ciel est bleu.', de: 'Der Himmel ist blau.', it: 'Il cielo è blu.', ar: 'السماء زرقاء.', ko: '하늘은 파란색입니다.', ja: '空は青いです。' }
      },
      {
        picture: '🟢',
        translations: { en: 'Green', es: 'Verde', fr: 'Vert', de: 'Grün', it: 'Verde', ar: 'أخضر', ko: '초록색', ja: '緑' },
        pronunciations: { en: 'Green', es: 'bair-deh', fr: 'vair', de: 'groon', it: 'vair-deh', ar: 'akh-dar', ko: 'cho-rok-saek', ja: 'midori' },
        exampleSentences: { en: 'Grass is green.', es: 'La hierba es verde.', fr: "L'herbe est verte.", de: 'Gras ist grün.', it: 'L\'erba è verde.', ar: 'العشب أخضر.', ko: '풀은 초록색입니다.', ja: '芝生は緑色です。' }
      },
      {
        picture: '🟡',
        translations: { en: 'Yellow', es: 'Amarillo', fr: 'Jaune', de: 'Gelb', it: 'Giallo', ar: 'أصفر', ko: '노란색', ja: '黄色' },
        pronunciations: { en: 'Yellow', es: 'ah-mah-ree-yoh', fr: 'zhohn', de: 'gelb', it: 'jahl-loh', ar: 'as-far', ko: 'no-ran-saek', ja: 'kiiro' },
        exampleSentences: { en: 'The sun is yellow.', es: 'El sol es amarillo.', fr: 'Le soleil est jaune.', de: 'Die Sonne ist gelb.', it: 'Il sole è giallo.', ar: 'الشمس صفراء.', ko: '태양은 노란색입니다.', ja: '太陽は黄色いです。' }
      },
      {
        picture: '⚫',
        translations: { en: 'Black', es: 'Negro', fr: 'Noir', de: 'Schwarz', it: 'Nero', ar: 'أسود', ko: '검은색', ja: '黒' },
        pronunciations: { en: 'Black', es: 'neh-groh', fr: 'nwahr', de: 'shvarts', it: 'neh-roh', ar: 'as-wad', ko: 'geom-eun-saek', ja: 'kuro' },
        exampleSentences: { en: 'A black cat.', es: 'Un gato negro.', fr: 'Un chat noir.', de: 'Eine schwarze Katze.', it: 'Un gatto nero.', ar: 'قط أسود.', ko: '검은 고양이.', ja: '黒い猫。' }
      },
      {
        picture: '⚪',
        translations: { en: 'White', es: 'Blanco', fr: 'Blanc', de: 'Weiß', it: 'Bianco', ar: 'أبيض', ko: '흰색', ja: '白' },
        pronunciations: { en: 'White', es: 'blahn-coh', fr: 'blahn', de: 'veys', it: 'byahn-coh', ar: 'ab-yad', ko: 'huin-saek', ja: 'shiro' },
        exampleSentences: { en: 'White snow falls.', es: 'Cae nieve blanca.', fr: 'La neige blanche tombe.', de: 'Weißer Schnee fällt.', it: 'Cade neve bianca.', ar: 'يتساقط الثلج الأبيض.', ko: '하얀 눈이 내립니다.', ja: '白い雪が降っています。' }
      }
    ]
  },
  // 8. Clothing
  {
    title: 'Clothing',
    unit: 1,
    unitTitle: 'Greetings & Basics',
    category: 'Vocabulary',
    words: [
      {
        picture: '👕',
        translations: { en: 'Shirt', es: 'Camisa', fr: 'Chemise', de: 'Hemd', it: 'Camicia', ar: 'قميص', ko: '셔츠', ja: 'シャツ' },
        pronunciations: { en: 'Shirt', es: 'cah-mee-sah', fr: 'shuh-meez', de: 'hemd', it: 'cah-mee-chah', ar: 'qa-mees', ko: 'syeo-tsu', ja: 'shatsu' },
        exampleSentences: { en: 'I wear a shirt.', es: 'Llevo una camisa.', fr: 'Je porte une chemise.', de: 'Ich trage ein Hemd.', it: 'Indosso una camicia.', ar: 'أنا أرتدي قميصاً.', ko: '저는 셔츠를 입습니다.', ja: '私はシャツを着ています。' }
      },
      {
        picture: '👖',
        translations: { en: 'Pants', es: 'Pantalones', fr: 'Pantalon', de: 'Hose', it: 'Pantaloni', ar: 'بنطال', ko: '바지', ja: 'ズ본' },
        pronunciations: { en: 'Pants', es: 'pahn-tah-loh-nehs', fr: 'pahn-tah-lohn', de: 'hoh-zeh', it: 'pahn-tah-loh-nee', ar: 'bin-tal', ko: 'ba-ji', ja: 'zubon' },
        exampleSentences: { en: 'Blue pants.', es: 'Pantalones azules.', fr: 'Un pantalon bleu.', de: 'Eine blaue Hose.', it: 'Pantaloni blu.', ar: 'بنطال أزرق.', ko: '파란색 바지.', ja: '青いズボン。' }
      },
      {
        picture: '👞',
        translations: { en: 'Shoes', es: 'Zapatos', fr: 'Chaussures', de: 'Schuhe', it: 'Scarpe', ar: 'حذاء', ko: '신발', ja: '靴' },
        pronunciations: { en: 'Shoes', es: 'thah-pah-tohs', fr: 'shoh-syur', de: 'shoo-huh', it: 'scahr-peh', ar: 'hi-da', ko: 'sin-bal', ja: 'kutsu' },
        exampleSentences: { en: 'New shoes.', es: 'Zapatos nuevos.', fr: 'Des chaussures neuves.', de: 'Neue Schuhe.', it: 'Scarpe nuove.', ar: 'حذاء جديد.', ko: '새 신발.', ja: '新しい靴。' }
      },
      {
        picture: '👒',
        translations: { en: 'Hat', es: 'Sombrero', fr: 'Chapeau', de: 'Hut', it: 'Cappello', ar: 'قبعة', ko: '모자', ja: '帽子' },
        pronunciations: { en: 'Hat', es: 'sohm-breh-roh', fr: 'shah-poh', de: 'hoot', it: 'cahp-pel-loh', ar: 'qub-bah-ah', ko: 'mo-ja', ja: 'bou-shi' },
        exampleSentences: { en: 'A warm hat.', es: 'Un sombrero cálido.', fr: 'Un chapeau chaud.', de: 'Ein warmer Hut.', it: 'Un cappello caldo.', ar: 'قبعة دافئة.', ko: '따뜻한 모자.', ja: '温かい帽子。' }
      },
      {
        picture: '👗',
        translations: { en: 'Dress', es: 'Vestido', fr: 'Robe', de: 'Kleid', it: 'Vestito', ar: 'فستان', ko: '드레스', ja: 'ドレス' },
        pronunciations: { en: 'Dress', es: 'bes-tee-doh', fr: 'rohb', de: 'klayd', it: 'ves-tee-toh', ar: 'fus-tan', ko: 'deu-re-seu', ja: 'doresu' },
        exampleSentences: { en: 'A beautiful dress.', es: 'Un vestido hermoso.', fr: 'Une belle robe.', de: 'Ein schönes Kleid.', it: 'Un bel vestito.', ar: 'فستان جميل.', ko: '예쁜 드레스.', ja: '美しいドレス。' }
      },
      {
        picture: '🧥',
        translations: { en: 'Coat', es: 'Abrigo', fr: 'Manteau', de: 'Mantel', it: 'Cappotto', ar: 'معطف', ko: '코트', ja: 'コート' },
        pronunciations: { en: 'Coat', es: 'ah-bree-goh', fr: 'mahn-toh', de: 'mahn-tel', it: 'cahp-pot-toh', ar: 'mi-taf', ko: 'ko-teu', ja: 'kooto' },
        exampleSentences: { en: 'Wear a coat today.', es: 'Lleva un abrigo hoy.', fr: 'Porte un manteau aujourd\'hui.', de: 'Trage heute einen Mantel.', it: 'Indossa un cappotto oggi.', ar: 'ارتدِ معطفاً اليوم.', ko: '오늘 코트를 입으세요.', ja: '今日コートを着なさい。' }
      }
    ]
  },
  // 9. Body parts
  {
    title: 'Body parts',
    unit: 1,
    unitTitle: 'Greetings & Basics',
    category: 'Vocabulary',
    words: [
      {
        picture: '👤',
        translations: { en: 'Head', es: 'Cabeza', fr: 'Tête', de: 'Kopf', it: 'Testa', ar: 'رأس', ko: '머리', ja: '頭' },
        pronunciations: { en: 'Head', es: 'cah-beh-thah', fr: 'teht', de: 'kopf', it: 'tehs-tah', ar: 'ra-as', ko: 'meo-ri', ja: 'atama' },
        exampleSentences: { en: 'Hold your head.', es: 'Sostén tu cabeza.', fr: 'Tiens ta tête.', de: 'Halte deinen Kopf.', it: 'Tieni la testa.', ar: 'أمسك رأسك.', ko: '머리를 잡으세요.', ja: '頭を抱えなさい。' }
      },
      {
        picture: '😊',
        translations: { en: 'Face', es: 'Cara', fr: 'Visage', de: 'Gesicht', it: 'Viso', ar: 'وجه', ko: '얼굴', ja: '顔' },
        pronunciations: { en: 'Face', es: 'cah-rah', fr: 'vee-zahzh', de: 'guh-zikht', it: 'vee-zoh', ar: 'wajh', ko: 'eol-gool', ja: 'kao' },
        exampleSentences: { en: 'A smiling face.', es: 'Una cara sonriente.', fr: 'Un visage souriant.', de: 'Ein lächelndes Gesicht.', it: 'Un viso sorridente.', ar: 'وجه مبتسم.', ko: '웃는 얼굴.', ja: '笑顔。' }
      },
      {
        picture: '👁️',
        translations: { en: 'Eye', es: 'Ojo', fr: 'Œil', de: 'Auge', it: 'Occhio', ar: 'عين', ko: '눈', ja: '目' },
        pronunciations: { en: 'Eye', es: 'oh-hoh', fr: 'uhy', de: 'ow-guh', it: 'ohk-kyoh', ar: 'ayn', ko: 'noon', ja: 'me' },
        exampleSentences: { en: 'An eye for details.', es: 'Un ojo para los detalles.', fr: 'Un œil pour les détails.', de: 'Ein Auge für Details.', it: 'Un occhio per i dettagli.', ar: 'عين للتفاصيل.', ko: '세부 사항에 대한 눈.', ja: '細部へのこだわり。' }
      },
      {
        picture: '👂',
        translations: { en: 'Ear', es: 'Oreja', fr: 'Oreille', de: 'Ohr', it: 'Orecchio', ar: 'أذن', ko: '귀', ja: '耳' },
        pronunciations: { en: 'Ear', es: 'oh-reh-hah', fr: 'oh-ray', de: 'ohr', it: 'oh-rek-kyoh', ar: 'u-dhun', ko: 'gwi', ja: 'mimi' },
        exampleSentences: { en: 'Listen with your ear.', es: 'Escucha con tu oreja.', fr: 'Écoute avec ton oreille.', de: 'Hör mit deinem Ohr zu.', it: 'Ascolta con l\'orecchio.', ar: 'استمع بأذنك.', ko: '귀로 들으세요.', ja: '耳で聞きなさい。' }
      },
      {
        picture: '👃',
        translations: { en: 'Nose', es: 'Nariz', fr: 'Nez', de: 'Nase', it: 'Naso', ar: 'أنف', ko: '코', ja: '鼻' },
        pronunciations: { en: 'Nose', es: 'nah-reeth', fr: 'nay', de: 'nah-zeh', it: 'nah-zoh', ar: 'anf', ko: 'ko', ja: 'hana' },
        exampleSentences: { en: 'A cold nose.', es: 'Una nariz fría.', fr: 'Un nez froid.', de: 'Eine kalte Nase.', it: 'Un naso freddo.', ar: 'أنف بارد.', ko: '차가운 코.', ja: '冷たい鼻。' }
      },
      {
        picture: '👄',
        translations: { en: 'Mouth', es: 'Boca', fr: 'Bouche', de: 'Mund', it: 'Bocca', ar: 'فم', ko: '입', ja: '口' },
        pronunciations: { en: 'Mouth', es: 'boh-cah', fr: 'boosh', de: 'moont', it: 'bohk-cah', ar: 'fam', ko: 'ip', ja: 'kuchi' },
        exampleSentences: { en: 'Open your mouth.', es: 'Abre tu boca.', fr: 'Ouvre ta bouche.', de: 'Öffne deinen Mund.', it: 'Apri la bocca.', ar: 'افتح فمك.', ko: '입을 여세요.', ja: '口を開けなさい。' }
      }
    ]
  },
  // 10. Weather
  {
    title: 'Weather',
    unit: 1,
    unitTitle: 'Greetings & Basics',
    category: 'Vocabulary',
    words: [
      {
        picture: '☀️',
        translations: { en: 'Sun', es: 'Sol', fr: 'Soleil', de: 'Sonne', it: 'Sole', ar: 'شمس', ko: '태양', ja: '太陽' },
        pronunciations: { en: 'Sun', es: 'sohl', fr: 'soh-ley', de: 'zohn-nuh', it: 'soh-leh', ar: 'shams', ko: 'tae-yang', ja: 'taiyou' },
        exampleSentences: { en: 'The sun shines.', es: 'El sol brilla.', fr: 'Le soleil brille.', de: 'Die Sonne scheint.', it: 'Il sole splende.', ar: 'الشمس تشرق.', ko: '태양이 빛납니다.', ja: '太陽が輝いています。' }
      },
      {
        picture: '🌧️',
        translations: { en: 'Rain', es: 'Lluvia', fr: 'Pluie', de: 'Regen', it: 'Pioggia', ar: 'مطر', ko: '비', ja: '雨' },
        pronunciations: { en: 'Rain', es: 'yoo-byah', fr: 'plwee', de: 'ray-gen', it: 'pyohd-jah', ar: 'ma-tar', ko: 'bi', ja: 'ame' },
        exampleSentences: { en: 'The rain falls.', es: 'La lluvia cae.', fr: 'La pluie tombe.', de: 'Der Regen fällt.', it: 'La pioggia cade.', ar: 'المطر يتساقط.', ko: '비가 내립니다.', ja: '雨が降っています。' }
      },
      {
        picture: '💨',
        translations: { en: 'Wind', es: 'Viento', fr: 'Vent', de: 'Wind', it: 'Vento', ar: 'ريح', ko: '바람', ja: '風' },
        pronunciations: { en: 'Wind', es: 'byen-toh', fr: 'vahn', de: 'vint', it: 'ven-toh', ar: 'reeh', ko: 'ba-ram', ja: 'kaze' },
        exampleSentences: { en: 'The wind blows.', es: 'El viento sopla.', fr: 'Le vent souffle.', de: 'Der wind weht.', it: 'Il vento soffia.', ar: 'الرياح تهب.', ko: '바람이 붑니다.', ja: '風が吹いています。' }
      },
      {
        picture: '❄️',
        translations: { en: 'Snow', es: 'Nieve', fr: 'Neige', de: 'Schnee', it: 'Neve', ar: 'ثلج', ko: '눈', ja: '雪' },
        pronunciations: { en: 'Snow', es: 'nyeh-beh', fr: 'nezh', de: 'shnee', it: 'neh-veh', ar: 'thalj', ko: 'noon', ja: 'yuki' },
        exampleSentences: { en: 'White snow is beautiful.', es: 'La nieve blanca es hermosa.', fr: 'La neige blanche est belle.', de: 'Weißer Schnee ist schön.', it: 'La neve bianca è bella.', ar: 'الثلج الأبيض جميل.', ko: '하얀 눈은 아름답습니다.', ja: '白い雪は美しいです。' }
      },
      {
        picture: '🔥',
        translations: { en: 'Hot', es: 'Caliente', fr: 'Chaud', de: 'Heiß', it: 'Caldo', ar: 'حار', ko: '더운', ja: '暑い' },
        pronunciations: { en: 'Hot', es: 'cah-lyen-teh', fr: 'shoh', de: 'hice', it: 'cahl-doh', ar: 'harr', ko: 'deoun', ja: 'atsui' },
        exampleSentences: { en: 'The tea is hot.', es: 'El té está caliente.', fr: 'Le thé est chaud.', de: 'Der Tee ist heiß.', it: 'Il té è caldo.', ar: 'الشاي ساخن.', ko: '차가 뜨겁습니다.', ja: 'お茶が熱いです。' }
      },
      {
        picture: '❄️',
        translations: { en: 'Cold', es: 'Frío', fr: 'Froid', de: 'Kalt', it: 'Freddo', ar: 'بارد', ko: '추운', ja: '寒い' },
        pronunciations: { en: 'Cold', es: 'free-oh', fr: 'frwah', de: 'kahlt', it: 'fred-doh', ar: 'ba-rid', ko: 'chooun', ja: 'samui' },
        exampleSentences: { en: 'It is cold today.', es: 'Hace frío hoy.', fr: 'Il fait froid aujourd\'hui.', de: 'Es ist kalt heute.', it: 'Fa freddo oggi.', ar: 'الطقس بارد اليوم.', ko: '오늘 날씨가 춥습니다.', ja: '今日は寒いです。' }
      }
    ]
  },

  // === UNIT 2: REAL-LIFE SCENARIOS ===
  // 11. Airport
  {
    title: 'Airport',
    unit: 2,
    unitTitle: 'Real-Life Scenarios',
    category: 'Vocabulary',
    words: [
      {
        picture: '🎫',
        translations: { en: 'Ticket', es: 'Billete', fr: 'Billet', de: 'Ticket', it: 'Biglietto', ar: 'تذكرة', ko: '표', ja: '切符' },
        pronunciations: { en: 'Ticket', es: 'bee-yeh-teh', fr: 'bee-yeh', de: 'tik-et', it: 'bee-lyet-toh', ar: 'tadh-ki-rah', ko: 'pyo', ja: 'kippu' },
        exampleSentences: { en: 'Show your ticket.', es: 'Muestra tu billete.', fr: 'Montrez votre billet.', de: 'Zeige dein Ticket.', it: 'Mostra il tuo biglietto.', ar: 'أظهر تذكرتك.', ko: '표를 보여주세요.', ja: '切符を見せてください。' }
      },
      {
        picture: '🛂',
        translations: { en: 'Passport', es: 'Pasaporte', fr: 'Passeport', de: 'Reisepass', it: 'Passaporto', ar: 'جواز سفر', ko: '여권', ja: 'パスポート' },
        pronunciations: { en: 'Passport', es: 'gah-sah-por-teh', fr: 'pahs-pohr', de: 'rye-ze-pas', it: 'pahs-sah-por-toh', ar: 'ja-waz sa-far', ko: 'yeo-gwon', ja: 'pasu-pooto' },
        exampleSentences: { en: 'I have my passport.', es: 'Tengo mi pasaporte.', fr: 'J\'ai mon passeport.', de: 'Ich habe meinen Reisepass.', it: 'Ho il mio passaporto.', ar: 'لدي جواز سفري.', ko: '여권을 가지고 있습니다.', ja: 'パスポートを持っています。' }
      },
      {
        picture: '✈️',
        translations: { en: 'Flight', es: 'Vuelo', fr: 'Vol', de: 'Flug', it: 'Volo', ar: 'رحلة', ko: '비행', ja: '飛行' },
        pronunciations: { en: 'Flight', es: 'bweh-loh', fr: 'vohl', de: 'floog', it: 'voh-loh', ar: 'rih-lah', ko: 'bee-haeng', ja: 'hikou' },
        exampleSentences: { en: 'The flight is late.', es: 'El vuelo llega tarde.', fr: 'Le vol est en retard.', de: 'Der Flug hat Verspätung.', it: 'Il volo è in ritardo.', ar: 'الرحلة متأخرة.', ko: '비행기가 지연되었습니다.', ja: '飛行機が遅れています。' }
      },
      {
        picture: '🧳',
        translations: { en: 'Luggage', es: 'Equipaje', fr: 'Bagage', de: 'Gepäck', it: 'Bagaglio', ar: 'أمتعة', ko: '수하물', ja: '荷物' },
        pronunciations: { en: 'Luggage', es: 'eh-kee-pah-heh', fr: 'bah-gahzh', de: 'guh-pek', it: 'bah-gah-lyoh', ar: 'am-ti-ah', ko: 'su-ha-mool', ja: 'nimotsu' },
        exampleSentences: { en: 'This is my luggage.', es: 'Este es mi equipaje.', fr: 'C\'est mon bagage.', de: 'Das ist mein Gepäck.', it: 'Questo è il mio bagaglio.', ar: 'هذه أمتعتي.', ko: '이것은 제 수하물입니다.', ja: 'prefix_this_is_my_bag' }
      },
      {
        picture: '🚪',
        translations: { en: 'Gate', es: 'Puerta', fr: 'Porte', de: 'Gate', it: 'Porta', ar: 'بوابة', ko: '게이트', ja: 'ゲート' },
        pronunciations: { en: 'Gate', es: 'pwer-tah', fr: 'pohrt', de: 'geyt', it: 'por-tah', ar: 'ba-wah-bah', ko: 'ge-i-teu', ja: 'geeto' },
        exampleSentences: { en: 'Go to gate five.', es: 'Ve a la puerta cinco.', fr: 'Allez à la porte cinq.', de: 'Gehe zu Gate fünf.', it: 'Vai alla porta cinque.', ar: 'اذهب إلى البوابة خمسة.', ko: '5번 게이트로 가세요.', ja: '5番ゲートに行ってください。' }
      },
      {
        picture: '🛩️',
        translations: { en: 'Plane', es: 'Avión', fr: 'Avion', de: 'Flugzeug', it: 'Aereo', ar: 'طائرة', ko: '비행기', ja: '飛行機' },
        pronunciations: { en: 'Plane', es: 'ah-byohn', fr: 'ah-vyohn', de: 'floog-tsoyg', it: 'ah-eh-reh-oh', ar: 'ta-ee-rah', ko: 'bee-haeng-gi', ja: 'hikouki' },
        exampleSentences: { en: 'The plane is huge.', es: 'El avión es enorme.', fr: 'L\'avion est énorme.', de: 'Das Flugzeug ist riesig.', it: 'L\'aereo è enorme.', ar: 'الطائرة ضخمة.', ko: '비행기가 아주 큽니다.', ja: '飛行機はとても大きいです。' }
      }
    ]
  },
  // 12. Taxi
  {
    title: 'Taxi',
    unit: 2,
    unitTitle: 'Real-Life Scenarios',
    category: 'Speaking',
    words: [
      {
        picture: '🚕',
        translations: { en: 'Taxi', es: 'Taxi', fr: 'Taxi', de: 'Taxi', it: 'Taxi', ar: 'تاكسي', ko: '택시', ja: 'タクシー' },
        pronunciations: { en: 'Taxi', es: 'tahk-see', fr: 'tahk-see', de: 'tak-see', it: 'tahk-see', ar: 'tak-see', ko: 'taek-si', ja: 'takushii' },
        exampleSentences: { en: 'Call a taxi.', es: 'Llama a un taxi.', fr: 'Appelez un taxi.', de: 'Rufe ein Taxi.', it: 'Chiama un taxi.', ar: 'اتصل بسيارة تاكسي.', ko: '택시를 불러주세요.', ja: 'タクシー을 불러주세요.' }
      },
      {
        picture: '👨‍✈️',
        translations: { en: 'Driver', es: 'Conductor', fr: 'Chauffeur', de: 'Fahrer', it: 'Autista', ar: 'سائق', ko: '운전사', ja: '運転手' },
        pronunciations: { en: 'Driver', es: 'cohn-dook-tor', fr: 'shoh-fuhr', de: 'fah-rer', it: 'ow-tees-tah', ar: 'sa-iq', ko: 'oon-jeon-sa', ja: 'untenshu' },
        exampleSentences: { en: 'Ask the driver.', es: 'Pregunta al conductor.', fr: 'Demandez au chauffeur.', de: 'Frage den Fahrer.', it: 'Chiedi all\'autista.', ar: 'اسأل السائق.', ko: '운전사에게 물어보세요.', ja: '運転手に聞いてください。' }
      },
      {
        picture: '📍',
        translations: { en: 'Address', es: 'Dirección', fr: 'Adresse', de: 'Adresse', it: 'Indirizzo', ar: 'عنوان', ko: '주소', ja: '住所' },
        pronunciations: { en: 'Address', es: 'dee-rec-thyohn', fr: 'ah-dres', de: 'a-dres-se', it: 'een-dee-reet-tsoh', ar: 'un-wan', ko: 'ju-so', ja: 'juusho' },
        exampleSentences: { en: 'Write the address.', es: 'Escribe la dirección.', fr: 'Écrivez l\'adresse.', de: 'Schreibe die Adresse.', it: 'Scrivi l\'indirizzo.', ar: 'اكتب العنوان.', ko: '주소를 적어주세요.', ja: '住所を書いてください。' }
      },
      {
        picture: '🛣️',
        translations: { en: 'Street', es: 'Calle', fr: 'Rue', de: 'Straße', it: 'Via', ar: 'شارع', ko: '거리', ja: '通り' },
        pronunciations: { en: 'Street', es: 'cah-yeh', fr: 'roo', de: 'shtrah-suh', it: 'vee-ah', ar: 'sha-ri', ko: 'geo-ri', ja: 'toori' },
        exampleSentences: { en: 'Cross the street.', es: 'Cruza la calle.', fr: 'Traversez la rue.', de: 'Überquere die Straße.', it: 'Attraversa la strada.', ar: 'اعبر الشارع.', ko: '길을 건너세요.', ja: '通りを渡ってください。' }
      },
      {
        picture: '💵',
        translations: { en: 'Price', es: 'Precio', fr: 'Prix', de: 'Preis', it: 'Prezzo', ar: 'سعر', ko: '요금', ja: '料金' },
        pronunciations: { en: 'Price', es: 'preh-thyoh', fr: 'pree', de: 'price', it: 'pret-tsoh', ar: 'si-r', ko: 'yo-geum', ja: 'ryoukin' },
        exampleSentences: { en: 'The price is fair.', es: 'El precio es justo.', fr: 'Le prix est correct.', de: 'Der Preis ist fair.', it: 'Il prezzo è giusto.', ar: 'السعر مناسب.', ko: '요금이 저렴합니다.', ja: '料金は手頃です。' }
      },
      {
        picture: '🗺️',
        translations: { en: 'Map', es: 'Mapa', fr: 'Carte', de: 'Karte', it: 'Mappa', ar: 'خريطة', ko: '지도', ja: '地図' },
        pronunciations: { en: 'Map', es: 'mah-pah', fr: 'cahrt', de: 'kahr-tuh', it: 'mahp-pah', ar: 'kha-ree-tah', ko: 'ji-do', ja: 'chizu' },
        exampleSentences: { en: 'Check the map.', es: 'Consulta el mapa.', fr: 'Regardez la carte.', de: 'Schau auf die Karte.', it: 'Guarda la mappa.', ar: 'تحقق من الخريطة.', ko: '지도를 확인하세요.', ja: '地図を確認してください。' }
      }
    ]
  },
  // 13. Hotel
  {
    title: 'Hotel',
    unit: 2,
    unitTitle: 'Real-Life Scenarios',
    category: 'Vocabulary',
    words: [
      {
        picture: '🔑',
        translations: { en: 'Room', es: 'Habitación', fr: 'Chambre', de: 'Zimmer', it: 'Camera', ar: 'غرفة', ko: '방', ja: '部屋' },
        pronunciations: { en: 'Room', es: 'ah-bee-tah-thyohn', fr: 'shahm-br', de: 'tsim-mer', it: 'cah-meh-rah', ar: 'ghur-fah', ko: 'bang', ja: 'heya' },
        exampleSentences: { en: 'This room is clean.', es: 'Esta habitación está limpia.', fr: 'Cette chambre est propre.', de: 'Dieses Zimmer ist sauber.', it: 'Questa camera è pulita.', ar: 'هذه الغرفة نظيفة.', ko: '이 방은 깨끗합니다.', ja: 'この部屋は綺麗です。' }
      },
      {
        picture: '🗝️',
        translations: { en: 'Key', es: 'Llave', fr: 'Clé', de: 'Schlüssel', it: 'Chiave', ar: 'مفتاح', ko: '열쇠', ja: '鍵' },
        pronunciations: { en: 'Key', es: 'yah-beh', fr: 'clay', de: 'shlus-sel', it: 'kyah-veh', ar: 'mif-tah', ko: 'yeol-soe', ja: 'kagi' },
        exampleSentences: { en: 'Give me the key.', es: 'Dame la llave.', fr: 'Donnez-moi la clé.', de: 'Gib mir den Schlüssel.', it: 'Dammi la chiave.', ar: 'أعطني المفتاح.', ko: '열쇠를 주세요.', ja: '鍵をください。' }
      },
      {
        picture: '🛏️',
        translations: { en: 'Bed', es: 'Cama', fr: 'Lit', de: 'Bett', it: 'Letto', ar: 'سرير', ko: '침대', ja: 'ベッド' },
        pronunciations: { en: 'Bed', es: 'cah-mah', fr: 'lee', de: 'bet', it: 'let-toh', ar: 'sa-reer', ko: 'chim-dae', ja: 'beddo' },
        exampleSentences: { en: 'The bed is soft.', es: 'La cama es blanda.', fr: 'Le lit est doux.', de: 'Das Bett ist weich.', it: 'Il letto è morbido.', ar: 'السرير ناعم.', ko: '침대가 폭신합니다.', ja: 'ベッドは柔らかいです。' }
      },
      {
        picture: '🚿',
        translations: { en: 'Shower', es: 'Ducha', fr: 'Douche', de: 'Dusche', it: 'Doccia', ar: 'دش', ko: '샤워', ja: 'シャワー' },
        pronunciations: { en: 'Shower', es: 'doo-chah', fr: 'doosh', de: 'doo-shuh', it: 'dohd-jah', ar: 'dush', ko: 'sya-wo', ja: 'shawaa' },
        exampleSentences: { en: 'Take a shower.', es: 'Toma una ducha.', fr: 'Prenez une douche.', de: 'Nimm eine Dusche.', it: 'Fai una doccia.', ar: 'خذ دوشاً.', ko: '샤워를 하세요.', ja: 'シャワーを浴びなさい。' }
      },
      {
        picture: '🛎️',
        translations: { en: 'Reception', es: 'Recepción', fr: 'Réception', de: 'Rezeption', it: 'Reception', ar: 'استقبال', ko: '리셉션', ja: '受付' },
        pronunciations: { en: 'Reception', es: 'reh-thep-thyohn', fr: 'ray-sep-syohn', de: 're-tsep-tsyon', it: 'ree-sep-shon', ar: 'is-tiq-bal', ko: 'ri-seb-syeon', ja: 'uketsuke' },
        exampleSentences: { en: 'Meet at reception.', es: 'Reunirse en recepción.', fr: 'Rendez-vous à la réception.', de: 'Treffen an der Rezeption.', it: 'Incontriamoci alla reception.', ar: 'التقِ بي في الاستقبال.', ko: '리셉션에서 만나요.', ja: '受付で会いましょう。' }
      },
      {
        picture: '📅',
        translations: { en: 'Reservation', es: 'Reserva', fr: 'Réservation', de: 'Reservierung', it: 'Prenotazione', ar: 'حجز', ko: '예약', ja: '予約' },
        pronunciations: { en: 'Reservation', es: 'reh-ser-bah', fr: 'ray-zair-vah-syohn', de: 're-zer-vee-roong', it: 'preh-noh-tah-tsyoh-neh', ar: 'hajz', ko: 'ye-yak', ja: 'yoyaku' },
        exampleSentences: { en: 'I have a reservation.', es: 'Tengo una reserva.', fr: 'J\'ai une réservation.', de: 'Ich habe eine Reservierung.', it: 'Ho una prenotazione.', ar: 'لدي حجز.', ko: '예약이 있습니다.', ja: '予約があります。' }
      }
    ]
  },
  // 14. Restaurant
  {
    title: 'Restaurant',
    unit: 2,
    unitTitle: 'Real-Life Scenarios',
    category: 'Vocabulary',
    words: [
      {
        picture: '📜',
        translations: { en: 'Menu', es: 'Menú', fr: 'Menu', de: 'Menü', it: 'Menu', ar: 'قائمة', ko: '메뉴', ja: 'メニュー' },
        pronunciations: { en: 'Menu', es: 'meh-noo', fr: 'muh-nyoo', de: 'meh-nee', it: 'meh-noo', ar: 'qa-ee-mah', ko: 'me-nyu', ja: 'menyuu' },
        exampleSentences: { en: 'Read the menu.', es: 'Lee el menú.', fr: 'Lisez le menu.', de: 'Lies das Menü.', it: 'Leggi il menu.', ar: 'اقرأ قائمة الطعام.', ko: '메뉴판을 읽어보세요.', ja: 'メニューを読んでください。' }
      },
      {
        picture: '🥤',
        translations: { en: 'Water', es: 'Agua', fr: 'Eau', de: 'Wasser', it: 'Acqua', ar: 'ماء', ko: '물', ja: '水' },
        pronunciations: { en: 'Water', es: 'ah-gwah', fr: 'oh', de: 'vahs-ser', it: 'ahk-kwah', ar: 'maa', ko: 'mool', ja: 'mizu' },
        exampleSentences: { en: 'Water, please.', es: 'Agua, por favor.', fr: 'De l\'eau, s\'il vous plaît.', de: 'Wasser, bitte.', it: 'Acqua, per favore.', ar: 'ماء، من فضلك.', ko: '물 주세요.', ja: 'お水をお願いします。' }
      },
      {
        picture: '🧾',
        translations: { en: 'Bill', es: 'Cuenta', fr: 'Addition', de: 'Rechnung', it: 'Conto', ar: 'فاتورة', ko: '계산서', ja: '会計' },
        pronunciations: { en: 'Bill', es: 'cwen-tah', fr: 'ah-dee-syohn', de: 'rekh-noong', it: 'cohn-toh', ar: 'fa-too-rah', ko: 'gye-san-seo', ja: 'kaikei' },
        exampleSentences: { en: 'Ask for the bill.', es: 'Pide la cuenta.', fr: 'Demandez l\'addition.', de: 'Frage nach der Rechnung.', it: 'Chiedi il conto.', ar: 'اطلب الفاتورة.', ko: '계산서를 주세요.', ja: 'お会計をお願いします。' }
      },
      {
        picture: '🍲',
        translations: { en: 'Food', es: 'Comida', fr: 'Nourriture', de: 'Essen', it: 'Cibo', ar: 'طعام', ko: '음식', ja: '食べ物' },
        pronunciations: { en: 'Food', es: 'coh-mee-dah', fr: 'noo-ree-tyur', de: 'es-sen', it: 'chee-boh', ar: 'ta-am', ko: 'eum-sik', ja: 'tabemono' },
        exampleSentences: { en: 'The food is hot.', es: 'La comida está caliente.', fr: 'La nourriture est chaude.', de: 'Das Essen ist heiß.', it: 'Il cibo è caldo.', ar: 'الطعام ساخن.', ko: '음식이 뜨겁습니다.', ja: '食べ物は温かいです。' }
      },
      {
        picture: '😋',
        translations: { en: 'Delicious', es: 'Delicioso', fr: 'Délicieux', de: 'Lecker', it: 'Delizioso', ar: 'لذيذ', ko: '맛있는', ja: '美味しい' },
        pronunciations: { en: 'Delicious', es: 'deh-lee-thyoh-soh', fr: 'day-lee-syuh', de: 'lek-er', it: 'deh-lee-tsyoh-soh', ar: 'la-dheedh', ko: 'mas-in-neun', ja: 'oishii' },
        exampleSentences: { en: 'It is delicious.', es: 'Está delicioso.', fr: 'C\'est délicieux.', de: 'Es ist lecker.', it: 'È delizioso.', ar: 'إنه لذيذ.', ko: '정말 맛있습니다.', ja: 'とても美味しいです。' }
      },
      {
        picture: '🤵',
        translations: { en: 'Waiter', es: 'Camarero', fr: 'Serveur', de: 'Kellner', it: 'Cameriere', ar: 'نادل', ko: '웨이터', ja: 'ウェイター' },
        pronunciations: { en: 'Waiter', es: 'cah-mah-reh-roh', fr: 'sair-vuhr', de: 'kel-ner', it: 'cah-meh-ryeh-reh', ar: 'na-dil', ko: 'we-i-teo', ja: 'weitaa' },
        exampleSentences: { en: 'Call the waiter.', es: 'Llama al camarero.', fr: 'Appelez le serveur.', de: 'Rufe den Kellner.', it: 'Chiama il cameriere.', ar: 'نادِ النادل.', ko: '웨이터를 불러주세요.', ja: 'ウェイ터를 요해 주세요.' }
      }
    ]
  },
  // 15. Shopping
  {
    title: 'Shopping',
    unit: 2,
    unitTitle: 'Real-Life Scenarios',
    category: 'Vocabulary',
    words: [
      {
        picture: '🏪',
        translations: { en: 'Store', es: 'Tienda', fr: 'Magasin', de: 'Geschäft', it: 'Negozio', ar: 'متجر', ko: '가게', ja: '店' },
        pronunciations: { en: 'Store', es: 'tyen-dah', fr: 'mah-gah-zanh', de: 'ge-sheft', it: 'neh-goh-tsyoh', ar: 'mat-jar', ko: 'ga-ge', ja: 'mise' },
        exampleSentences: { en: 'Go to the store.', es: 'Ve a la tienda.', fr: 'Allez au magasin.', de: 'Gehe in das Geschäft.', it: 'Vai al negozio.', ar: 'اذهب إلى المتجر.', ko: '가게에 가세요.', ja: '店に行ってください。' }
      },
      {
        picture: '🏷️',
        translations: { en: 'Price', es: 'Precio', fr: 'Prix', de: 'Preis', it: 'Prezzo', ar: 'سعر', ko: '가격', ja: '価格' },
        pronunciations: { en: 'Price', es: 'preh-thyoh', fr: 'pree', de: 'price', it: 'pret-tsoh', ar: 'si-r', ko: 'ga-gyeog', ja: 'kakaku' },
        exampleSentences: { en: 'Check the price.', es: 'Comprueba el precio.', fr: 'Vérifiez le prix.', de: 'Überprüfe den Preis.', it: 'Controlla il prezzo.', ar: 'تحقق من السعر.', ko: '가격을 확인하세요.', ja: '価格を確認してください。' }
      },
      {
        picture: '🛍️',
        translations: { en: 'Buy', es: 'Comprar', fr: 'Acheter', de: 'Kaufen', it: 'Comprare', ar: 'شراء', ko: '사다', ja: '買う' },
        pronunciations: { en: 'Buy', es: 'cohm-prar', fr: 'ah-shuh-tay', de: 'kow-fen', it: 'cohm-prah-reh', ar: 'shee-ra', ko: 'sa-da', ja: 'kau' },
        exampleSentences: { en: 'Buy this bag.', es: 'Compra este bolso.', fr: 'Achetez ce sac.', de: 'Kaufe diese Tasche.', it: 'Compra questa borsa.', ar: 'اشترِ هذه الحقيبة.', ko: '이 가방을 사세요.', ja: 'この鞄を買ってください。' }
      },
      {
        picture: '💰',
        translations: { en: 'Money', es: 'Dinero', fr: 'Argent', de: 'Geld', it: 'Soldi', ar: 'مال', ko: '돈', ja: 'お金' },
        pronunciations: { en: 'Money', es: 'dee-neh-roh', fr: 'ahr-zhanh', de: 'gelt', it: 'sohl-dee', ar: 'mal', ko: 'don', ja: 'okane' },
        exampleSentences: { en: 'I have money.', es: 'Tengo dinero.', fr: 'J\'ai de l\'argent.', de: 'Ich habe Geld.', it: 'Ho soldi.', ar: 'عندي مال.', ko: '저는 돈이 있습니다.', ja: '私はお金を持っています。' }
      },
      {
        picture: '🪙',
        translations: { en: 'Cheap', es: 'Barato', fr: 'Bon marché', de: 'Billig', it: 'Economico', ar: 'رخيص', ko: '싼', ja: '安い' },
        pronunciations: { en: 'Cheap', es: 'bah-rah-toh', fr: 'bohn mahr-shay', de: 'bil-likh', it: 'eh-coh-noh-mee-coh', ar: 'ra-khees', ko: 'ssan', ja: 'yasui' },
        exampleSentences: { en: 'This is cheap.', es: 'Esto es barato.', fr: 'C\'est bon marché.', de: 'Das ist billig.', it: 'Questo è economico.', ar: 'هذا رخيص.', ko: '이것은 가격이 쌉니다.', ja: 'これは安いです。' }
      },
      {
        picture: '💎',
        translations: { en: 'Expensive', es: 'Caro', fr: 'Cher', de: 'Teuer', it: 'Costoso', ar: 'غالي', ko: '비싼', ja: '高い' },
        pronunciations: { en: 'Expensive', es: 'cah-roh', fr: 'shair', de: 'toy-er', it: 'cohs-toh-soh', ar: 'gha-lee', ko: 'bi-ssan', ja: 'takai' },
        exampleSentences: { en: 'The car is expensive.', es: 'El coche es caro.', fr: 'La voiture est chère.', de: 'Das Auto ist teuer.', it: 'La macchina è costosa.', ar: 'السيارة غالية.', ko: '차가 비쌉니다.', ja: '車は高いです。' }
      }
    ]
  },
  // 16. School
  {
    title: 'School',
    unit: 2,
    unitTitle: 'Real-Life Scenarios',
    category: 'Vocabulary',
    words: [
      {
        picture: '🏫',
        translations: { en: 'School', es: 'Escuela', fr: 'École', de: 'Schule', it: 'Scuola', ar: 'مدرسة', ko: '학교', ja: '学校' },
        pronunciations: { en: 'School', es: 'es-cweh-lah', fr: 'ay-kohl', de: 'shoo-luh', it: 'scwoh-lah', ar: 'mad-ra-sah', ko: 'hak-gyo', ja: 'gakkou' },
        exampleSentences: { en: 'Go to school.', es: 'Ve a la escuela.', fr: 'Allez à l\'école.', de: 'Gehe zur Schule.', it: 'Vai a scuola.', ar: 'اذهب إلى المدرسة.', ko: '학교에 가세요.', ja: '学校へ行ってください。' }
      },
      {
        picture: '👩&zwj;🏫',
        translations: { en: 'Teacher', es: 'Profesor', fr: 'Professeur', de: 'Lehrer', it: 'Insegnante', ar: 'معلم', ko: '선생님', ja: '先生' },
        pronunciations: { en: 'Teacher', es: 'pro-feh-sor', fr: 'pro-fes-suhr', de: 'lay-rer', it: 'een-sen-yahn-teh', ar: 'mu-al-lim', ko: 'seon-saeng-nim', ja: 'sensei' },
        exampleSentences: { en: 'The teacher is nice.', es: 'El profesor es amable.', fr: 'Le professeur est gentil.', de: 'Der Lehrer ist nett.', it: 'L\'insegnante è gentile.', ar: 'المعلم لطيف.', ko: '선생님은 친절하십니다.', ja: '先生は優しいです。' }
      },
      {
        picture: '🧑&zwj;🎓',
        translations: { en: 'Student', es: 'Estudiante', fr: 'Étudiant', de: 'Schüler', it: 'Studente', ar: 'طالب', ko: '학생', ja: '学生' },
        pronunciations: { en: 'Student', es: 'es-too-dyan-teh', fr: 'ay-too-dyanh', de: 'shoo-ler', it: 'stoo-den-teh', ar: 'ta-lib', ko: 'hak-saeng', ja: 'gakusei' },
        exampleSentences: { en: 'I am a student.', es: 'Soy estudiante.', fr: 'Je suis étudiant.', de: 'Ich bin Schüler.', it: 'Sono uno studente.', ar: 'أنا طالب.', ko: '저는 학생입니다.', ja: '저는 학생입니다.' }
      },
      {
        picture: '📖',
        translations: { en: 'Class', es: 'Clase', fr: 'Classe', de: 'Klasse', it: 'Classe', ar: 'صف', ko: '교실', ja: '教室' },
        pronunciations: { en: 'Class', es: 'clah-seh', fr: 'klahs', de: 'klas-suh', it: 'clahs-seh', ar: 'saff', ko: 'gyo-sil', ja: 'kyoushitsu' },
        exampleSentences: { en: 'Join the class.', es: 'Únete a la clase.', fr: 'Rejoignez la classe.', de: 'Nimm am Unterricht teil.', it: 'Partecipa alla classe.', ar: 'انضم إلى الصف.', ko: '교실로 들어가세요.', ja: '教室に入ってください。' }
      },
      {
        picture: '📝',
        translations: { en: 'Lesson', es: 'Lección', fr: 'Leçon', de: 'Lektion', it: 'Lezione', ar: 'درس', ko: '수업', ja: '授業' },
        pronunciations: { en: 'Lesson', es: 'lec-thyohn', fr: 'luh-sonh', de: 'lek-tsyon', it: 'leh-tsyoh-neh', ar: 'dars', ko: 'su-eop', ja: 'jugyou' },
        exampleSentences: { en: 'Study this lesson.', es: 'Estudia esta lección.', fr: 'Étudiez cette leçon.', de: 'Lerne diese Lektion.', it: 'Studia questa lezione.', ar: 'ادرس هذا الدرس.', ko: '수업을 열심히 들으세요.', ja: '授業を勉強しなさい。' }
      },
      {
        picture: '🧠',
        translations: { en: 'Learn', es: 'Aprender', fr: 'Apprendre', de: 'Lernen', it: 'Imparare', ar: 'تعلم', ko: '배우다', ja: '学ぶ' },
        pronunciations: { en: 'Learn', es: 'ah-pren-dair', fr: 'ah-prahndr', de: 'ler-nen', it: 'eem-pah-rah-reh', ar: 'ta-al-lum', ko: 'bae-oo-da', ja: 'manabu' },
        exampleSentences: { en: 'Learn every day.', es: 'Aprende todos los días.', fr: 'Apprenez chaque jour.', de: 'Lerne jeden Tag.', it: 'Impara ogni giorno.', ar: 'تعلم كل يوم.', ko: '매일 배우세요.', ja: '毎日学びなさい。' }
      }
    ]
  },
  // 17. Hospital
  {
    title: 'Hospital',
    unit: 2,
    unitTitle: 'Real-Life Scenarios',
    category: 'Vocabulary',
    words: [
      {
        picture: '🏥',
        translations: { en: 'Hospital', es: 'Hospital', fr: 'Hôpital', de: 'Krankenhaus', it: 'Ospedale', ar: 'مستشفى', ko: '병원', ja: '病院' },
        pronunciations: { en: 'Hospital', es: 'os-pee-tahl', fr: 'oh-pee-tahl', de: 'kran-ken-hows', it: 'os-peh-dah-leh', ar: 'mus-tash-fah', ko: 'byeong-won', ja: 'byouin' },
        exampleSentences: { en: 'Where is the hospital?', es: '¿Dónde está el hospital?', fr: 'Où est l\'hôpital?', de: 'Wo ist das Krankenhaus?', it: 'Dov\'è l\'ospedale?', ar: 'أين المستشفى؟', ko: '병원이 어디에 있나요?', ja: '病院はどこにありますか？' }
      },
      {
        picture: '🥼',
        translations: { en: 'Doctor', es: 'Médico', fr: 'Médecin', de: 'Arzt', it: 'Medico', ar: 'طبيب', ko: '의사', ja: '医師' },
        pronunciations: { en: 'Doctor', es: 'meh-dee-coh', fr: 'med-sanh', de: 'artst', it: 'meh-dee-coh', ar: 'ta-beeb', ko: 'ui-sa', ja: 'ichi' },
        exampleSentences: { en: 'See the doctor.', es: 'Ve al médico.', fr: 'Consultez le médecin.', de: 'Gehe zum Arzt.', it: 'Vai dal medico.', ar: 'راجع الطبيب.', ko: '의사를 만나보세요.', ja: '医師の診察を受けてください。' }
      },
      {
        picture: '💊',
        translations: { en: 'Medicine', es: 'Medicina', fr: 'Medicina', de: 'Medizin', it: 'Medicina', ar: 'دواء', ko: '약', ja: '薬' },
        pronunciations: { en: 'Medicine', es: 'meh-dee-thee-nah', fr: 'may-dee-cah-manh', de: 'meh-dee-tseen', it: 'meh-dee-chee-nah', ar: 'da-wa', ko: 'yak', ja: 'kusuri' },
        exampleSentences: { en: 'Take your medicine.', es: 'Toma tu medicina.', fr: 'Prenez votre médicament.', de: 'Nimm deine Medizin.', it: 'Prendi la tua medicina.', ar: 'تناول دواءك.', ko: '약을 복용하세요.', ja: '薬を飲みなさい。' }
      },
      {
        picture: '🤢',
        translations: { en: 'Sick', es: 'Enfermo', fr: 'Malade', de: 'Krank', it: 'Malato', ar: 'مريض', ko: '아픈', ja: '病気' },
        pronunciations: { en: 'Sick', es: 'en-fer-moh', fr: 'mah-lahd', de: 'krank', it: 'mah-lah-toh', ar: 'ma-reedh', ko: 'a-peun', ja: 'byouki' },
        exampleSentences: { en: 'I feel sick today.', es: 'Me siento enfermo hoy.', fr: 'Je me sens malade aujourd\'hui.', de: 'Ich fühle mich heute krank.', it: 'Mi sento malato oggi.', ar: 'أشعر بالمرض اليوم.', ko: '오늘 몸이 아픕니다.', ja: '今日、私は体調が悪いです。' }
      },
      {
        picture: '🤕',
        translations: { en: 'Hurt', es: 'Doler', fr: 'Blessé', de: 'Wehtun', it: 'Male', ar: 'ألم', ko: '다치다', ja: '痛い' },
        pronunciations: { en: 'Hurt', es: 'doh-lair', fr: 'bles-say', de: 'mey-toon', it: 'mah-leh', ar: 'a-lam', ko: 'da-chi-da', ja: 'itai' },
        exampleSentences: { en: 'My leg hurts.', es: 'Me duele la pierna.', fr: 'Ma jambe me fait mal.', de: 'Mein Bein tut weh.', it: 'Mi fa male la gamba.', ar: 'ساقي تؤلمني.', ko: '다리가 아픕니다.', ja: '足が痛いです。' }
      },
      {
        picture: '🚨',
        translations: { en: 'Emergency', es: 'Emergencia', fr: 'Urgence', de: 'Notfall', it: 'Emergenza', ar: 'طوارئ', ko: '응급', ja: '緊急' },
        pronunciations: { en: 'Emergency', es: 'eh-mer-hen-thyah', fr: 'oor-zhanhs', de: 'not-fal', it: 'eh-mair-jen-tsah', ar: 'ta-wa-ree', ko: 'eung-geup', ja: 'kinkyuu' },
        exampleSentences: { en: 'It is an emergency.', es: 'Es una emergencia.', fr: 'C\'est une urgence.', de: 'Es ist ein Notfall.', it: 'È un\'emergenza.', ar: 'هذه حالة طوارئ.', ko: '이것은 응급 상황입니다.', ja: 'これは緊急事態です。' }
      }
    ]
  },
  // 18. Travel
  {
    title: 'Travel',
    unit: 2,
    unitTitle: 'Real-Life Scenarios',
    category: 'Reading',
    words: [
      {
        picture: '🧭',
        translations: { en: 'Travel', es: 'Viajar', fr: 'Voyager', de: 'Reisen', it: 'Viaggiare', ar: 'سفر', ko: '여행', ja: '旅行' },
        pronunciations: { en: 'Travel', es: 'byah-har', fr: 'vwah-yah-zhay', de: 'rye-zen', it: 'vyahd-jah-reh', ar: 'sa-far', ko: 'yeo-haeng', ja: 'ryokou' },
        exampleSentences: { en: 'I love to travel.', es: 'Me encanta viajar.', fr: 'J\'adore voyager.', de: 'Ich reise gerne.', it: 'Amo viaggiare.', ar: 'أنا أحب السفر.', ko: '저는 여행을 좋아합니다.', ja: '私は旅行が大好きです。' }
      },
      {
        picture: '🚆',
        translations: { en: 'Train', es: 'Tren', fr: 'Train', de: 'Zug', it: 'Treno', ar: 'قطار', ko: '기차', ja: '電車' },
        pronunciations: { en: 'Train', es: 'tren', fr: 'tranh', de: 'tsoog', it: 'treh-noh', ar: 'qee-tar', ko: 'gi-cha', ja: 'densha' },
        exampleSentences: { en: 'The train is fast.', es: 'El tren es rápido.', fr: 'Le train est rapide.', de: 'Der Zug ist schnell.', it: 'Il treno è veloce.', ar: 'القطار سريع.', ko: '기차가 빠릅니다.', ja: '電車は速いです。' }
      },
      {
        picture: '🚌',
        translations: { en: 'Bus', es: 'Autobús', fr: 'Bus', de: 'Bus', it: 'Autobus', ar: 'حافلة', ko: '버스', ja: 'バス' },
        pronunciations: { en: 'Bus', es: 'ow-toh-boos', fr: 'boos', de: 'boos', it: 'ow-toh-boos', ar: 'ha-fee-lah', ko: 'beo-seu', ja: 'basu' },
        exampleSentences: { en: 'Wait for the bus.', es: 'Espera al autobús.', fr: 'Attendez le bus.', de: 'Warte auf den Bus.', it: 'Aspetta l\'autobus.', ar: 'انتظر الحافلة.', ko: '버스를 기다리세요.', ja: 'バスを待ってください。' }
      },
      {
        picture: '🏙️',
        translations: { en: 'City', es: 'Ciudad', fr: 'Ville', de: 'Stadt', it: 'Città', ar: 'مدينة', ko: '도시', ja: '都市' },
        pronunciations: { en: 'City', es: 'thyoo-dahd', fr: 'veel', de: 'shtat', it: 'cheet-tah', ar: 'ma-dee-nah', ko: 'do-si', ja: 'toshi' },
        exampleSentences: { en: 'The city is noisy.', es: 'La ciudad es ruidosa.', fr: 'La ville est bruyante.', de: 'Die Stadt ist laut.', it: 'La città è rumorosa.', ar: 'المدينة صاخبة.', ko: '도시는 시끄럽습니다.', ja: '都市は賑やかです。' }
      },
      {
        picture: '🏨',
        translations: { en: 'Hotel', es: 'Hotel', fr: 'Hôtel', de: 'Hotel', it: 'Hotel', ar: 'فندق', ko: '호텔', ja: 'ホテル' },
        pronunciations: { en: 'Hotel', es: 'oh-tel', fr: 'oh-tel', de: 'ho-tel', it: 'oh-tel', ar: 'fun-duq', ko: 'ho-tel', ja: 'hoteru' },
        exampleSentences: { en: 'Find a cheap hotel.', es: 'Encuentra un hotel barato.', fr: 'Trouvez un hôtel pas cher.', de: 'Finde ein billiges Hotel.', it: 'Trova un hotel economico.', ar: 'ابحث عن فندق رخيص.', ko: '저렴한 호텔을 찾으세요.', ja: '安いホテルを見つけてください。' }
      },
      {
        picture: '🗺️',
        translations: { en: 'Map', es: 'Mapa', fr: 'Carte', de: 'Karte', it: 'Mappa', ar: 'خريطة', ko: '지도', ja: '지도' },
        pronunciations: { en: 'Map', es: 'mah-pah', fr: 'cahrt', de: 'kahr-tuh', it: 'mahp-pah', ar: 'kha-ree-tah', ko: 'ji-do', ja: 'chizu' },
        exampleSentences: { en: 'Check the city map.', es: 'Mira el mapa de la ciudad.', fr: 'Vérifiez la carte de la ville.', de: 'Schau auf den Stadtplan.', it: 'Controlla la mappa della città.', ar: 'تحقق من خريطة المدينة.', ko: '도시 지도를 확인하세요.', ja: '都市地図を確認してください。' }
      }
    ]
  }
];

export const generateCurriculum = () => {
  let lessonsData = [];

  languages.forEach(lang => {
    const langKey = langKeys[lang];
    let order = 1;

    curriculumData.forEach((ld) => {
      const words = ld.words.map(w => {
        const meaning = lang === 'English' ? w.translations['es'] : w.translations['en'];
        return {
          picture: w.picture,
          targetWord: w.translations[langKey],
          pronunciation: w.pronunciations[langKey] || '',
          meaning: meaning,
          exampleSentence: w.exampleSentences[langKey],
          audioUrl: ''
        };
      });

      const questions = [];

      if (words.length >= 6) {
        // Q1: What does this word mean? (target word → meaning)
        questions.push({
          type: 'multiple-choice',
          prompt: `What does "${words[0].targetWord}" mean?`,
          options: [words[0].meaning, words[1].meaning, words[2].meaning, words[3].meaning].sort(() => Math.random() - 0.5),
          correctAnswer: words[0].meaning
        });

        // Q2: How do you say X in [language]? (meaning → target word)
        questions.push({
          type: 'multiple-choice',
          prompt: `How do you say "${words[1].meaning}" in ${lang}?`,
          options: [words[1].targetWord, words[0].targetWord, words[2].targetWord, words[3].targetWord].sort(() => Math.random() - 0.5),
          correctAnswer: words[1].targetWord
        });

        // Q3: Image identification (target word → image)
        questions.push({
          type: 'identify-image',
          prompt: `Which image matches "${words[2].targetWord}"?`,
          imageOptions: [words[0].picture, words[1].picture, words[2].picture, words[3].picture].sort(() => Math.random() - 0.5),
          correctAnswer: words[2].picture
        });

        // Q4: Listening exercise (hear → select image)
        questions.push({
          type: 'listen',
          prompt: `Listen to the ${lang} word and select the matching image.`,
          audioText: words[3].targetWord,
          imageOptions: [words[0].picture, words[1].picture, words[2].picture, words[3].picture].sort(() => Math.random() - 0.5),
          correctAnswer: words[3].picture
        });

        // Q5: Speaking practice (say the word)
        questions.push({
          type: 'speak',
          prompt: `Say this ${lang} word aloud: "${words[4].meaning}"`,
          correctAnswer: words[4].targetWord
        });

        // Q6: Matching exercise
        questions.push({
          type: 'match',
          prompt: `Match each ${lang} word to its meaning.`,
          options: words.slice(0, 4).map(w => `${w.meaning} - ${w.targetWord}`).sort(() => Math.random() - 0.5),
          correctAnswer: 'Matched successfully'
        });

        // Q7: Fill in the blank
        const escapedWord = words[5].targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const cleanSentence = words[5].exampleSentence.replace(new RegExp(escapedWord, 'gi'), '____');
        questions.push({
          type: 'fill-blank',
          prompt: `Complete the ${lang} sentence: "${cleanSentence}"`,
          correctAnswer: words[5].targetWord
        });

        // Q8: Translation exercise
        const targetSentence = words[0].exampleSentence;
        const meaningLangKey = lang === 'English' ? 'es' : 'en';
        const expectedTranslation = ld.words[0].exampleSentences[meaningLangKey];
        questions.push({
          type: 'translate',
          prompt: `Translate this ${lang} sentence: "${targetSentence}"`,
          correctAnswer: expectedTranslation
        });
      }

      lessonsData.push({
        title: `Lesson ${order} — ${ld.title}`,
        language: lang,
        category: ld.category,
        difficulty: ld.difficulty || 1,
        order: order++,
        unit: ld.unit,
        unitTitle: ld.unitTitle,
        xpReward: ld.unit === 1 ? 20 : 30,
        words: words,
        questions: questions
      });
    });

    // Boss challenge
    const bossLesson = {
      title: `Lesson 19 — Grand Challenge`,
      language: lang,
      category: 'Quiz',
      difficulty: 3,
      order: 19,
      unit: 2,
      unitTitle: 'Real-Life Scenarios',
      xpReward: 50,
      words: [],
      questions: [
        {
          type: 'multiple-choice',
          prompt: `How do you say "Thank you" in ${lang}?`,
          options: [
            curriculumData[0].words[2].translations[langKey],
            curriculumData[0].words[0].translations[langKey],
            curriculumData[0].words[1].translations[langKey],
            curriculumData[0].words[3].translations[langKey]
          ].sort(() => Math.random() - 0.5),
          correctAnswer: curriculumData[0].words[2].translations[langKey]
        },
        {
          type: 'identify-image',
          prompt: `Which image represents "${curriculumData[1].words[0].translations[langKey]}"?`,
          imageOptions: ['🚗', '🏠', '💧', '🍎'].sort(() => Math.random() - 0.5),
          correctAnswer: '🚗'
        },
        {
          type: 'listen',
          prompt: `Listen to the ${lang} word and choose the matching image.`,
          audioText: curriculumData[2].words[1].translations[langKey],
          imageOptions: ['🐱', '🐶', '🐐', '🐦'].sort(() => Math.random() - 0.5),
          correctAnswer: '🐱'
        },
        {
          type: 'speak',
          prompt: `Say "Hello" in ${lang}:`,
          correctAnswer: curriculumData[0].words[0].translations[langKey]
        },
        {
          type: 'translate',
          prompt: `Translate this ${lang} sentence: "${curriculumData[0].words[0].exampleSentences[langKey]}"`,
          correctAnswer: lang === 'English' ? curriculumData[0].words[0].exampleSentences['es'] : curriculumData[0].words[0].exampleSentences['en']
        }
      ]
    };
    lessonsData.push(bossLesson);
  });

  const fileContent = `export const lessonsData = ${JSON.stringify(lessonsData, null, 2)};\n`;
  const destPath = path.join(__dirname, '../data/lessonsData.js');
  fs.writeFileSync(destPath, fileContent);
  console.log(`[GENERATOR] Successfully auto-generated ${lessonsData.length} lessons in ${destPath}`);
};
