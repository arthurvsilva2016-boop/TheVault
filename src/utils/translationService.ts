// Real-time Translation & Captioning Service for Vault Live Calls

export interface SupportedLanguage {
  code: string;
  name: string;
  flag: string;
  speechLang: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', flag: '🇺🇸', speechLang: 'en-US' },
  { code: 'pt', name: 'Português', flag: '🇧🇷', speechLang: 'pt-BR' },
  { code: 'es', name: 'Español', flag: '🇪🇸', speechLang: 'es-ES' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', speechLang: 'fr-FR' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', speechLang: 'de-DE' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', speechLang: 'it-IT' },
  { code: 'ja', name: '日本語', flag: '🇯🇵', speechLang: 'ja-JP' },
  { code: 'zh', name: '中文', flag: '🇨🇳', speechLang: 'zh-CN' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', speechLang: 'ar-SA' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', speechLang: 'ru-RU' },
];

export const QUICK_SPEECH_PRESETS: Array<{ label: string; text: string; category: string }> = [
  { label: 'Hello Everyone', text: 'Hello everyone, welcome to our live session!', category: 'Greetings' },
  { label: 'Can you hear me?', text: 'Can everyone hear and see me clearly?', category: 'Audio/Video' },
  { label: 'Good morning', text: 'Good morning everyone, let us begin.', category: 'Greetings' },
  { label: 'Look at screen', text: 'Please look at the presentation on the screen.', category: 'Instruction' },
  { label: 'I have a question', text: 'I have a quick question about this topic.', category: 'Questions' },
  { label: 'Open whiteboard', text: 'Let us open the interactive whiteboard for this exercise.', category: 'Instruction' },
  { label: 'Great job!', text: 'Great job and excellent participation today!', category: 'Feedback' },
  { label: 'Thank you', text: 'Thank you very much for your time and focus.', category: 'Polite' },
  { label: 'Please repeat', text: 'Could you please repeat that last explanation?', category: 'Questions' },
  { label: 'Class dismissed', text: 'That concludes our meeting today. Have a great day!', category: 'Closing' }
];

// Conversational and classroom dictionary mapping across all supported languages
const COMMON_PHRASES: Record<string, Record<string, string>> = {
  'hello': {
    en: 'Hello',
    pt: 'Olá',
    es: 'Hola',
    fr: 'Bonjour',
    de: 'Hallo',
    it: 'Ciao',
    ja: 'こんにちは',
    zh: '你好',
    ar: 'مرحبا',
    ru: 'Привет'
  },
  'good morning': {
    en: 'Good morning',
    pt: 'Bom dia',
    es: 'Buenos días',
    fr: 'Bonjour',
    de: 'Guten Morgen',
    it: 'Buongiorno',
    ja: 'おはようございます',
    zh: '早上好',
    ar: 'صباح الخير',
    ru: 'Доброе утро'
  },
  'good afternoon': {
    en: 'Good afternoon',
    pt: 'Boa tarde',
    es: 'Buenas tardes',
    fr: 'Bon après-midi',
    de: 'Guten Tag',
    it: 'Buon pomeriggio',
    ja: 'こんにちは',
    zh: '下午好',
    ar: 'مساء الخير',
    ru: 'Добрый день'
  },
  'good evening': {
    en: 'Good evening',
    pt: 'Boa noite',
    es: 'Buenas noches',
    fr: 'Bonsoir',
    de: 'Guten Abend',
    it: 'Buonasera',
    ja: 'こんばんは',
    zh: '晚上好',
    ar: 'مساء الخير',
    ru: 'Добрый вечер'
  },
  'thank you': {
    en: 'Thank you',
    pt: 'Obrigado',
    es: 'Gracias',
    fr: 'Merci',
    de: 'Danke',
    it: 'Grazie',
    ja: 'ありがとうございます',
    zh: '谢谢',
    ar: 'شكرا لك',
    ru: 'Спасибо'
  },
  'i have a question': {
    en: 'I have a question',
    pt: 'Eu tenho uma pergunta',
    es: 'Tengo una pregunta',
    fr: 'J\'ai une question',
    de: 'Ich habe eine Frage',
    it: 'Ho una domanda',
    ja: '質問があります',
    zh: '我有一个问题',
    ar: 'لدي سؤال',
    ru: 'У меня есть вопрос'
  },
  'can you hear me': {
    en: 'Can you hear me?',
    pt: 'Você pode me ouvir?',
    es: '¿Me puedes escuchar?',
    fr: 'Est-ce que vous m\'entendez?',
    de: 'Kannst du mich hören?',
    it: 'Mi sentite?',
    ja: '聞こえますか？',
    zh: '你能听到我吗？',
    ar: 'هل تسمعني؟',
    ru: 'Вы меня слышите?'
  },
  'can you repeat that': {
    en: 'Can you repeat that?',
    pt: 'Você pode repetir isso?',
    es: '¿Puedes repetir eso?',
    fr: 'Pouvez-vous répéter?',
    de: 'Können Sie das wiederholen?',
    it: 'Puoi ripetere?',
    ja: 'もう一度言っていただけますか？',
    zh: '你能再说一遍吗？',
    ar: 'هل يمكنك تكرار ذلك؟',
    ru: 'Можете повторить?'
  },
  'look at the screen': {
    en: 'Look at the screen',
    pt: 'Olhem para a tela',
    es: 'Miren la pantalla',
    fr: 'Regardez l\'écran',
    de: 'Schauen Sie auf den Bildschirm',
    it: 'Guardate lo schermo',
    ja: '画面を見てください',
    zh: '请看屏幕',
    ar: 'انظر إلى الشاشة',
    ru: 'Посмотрите на экран'
  },
  'welcome to class': {
    en: 'Welcome to class',
    pt: 'Bem-vindos à aula',
    es: 'Bienvenidos a la clase',
    fr: 'Bienvenue au cours',
    de: 'Willkommen zum Unterricht',
    it: 'Benvenuti a lezione',
    ja: 'クラスへようこそ',
    zh: '欢迎来上课',
    ar: 'مرحبا بكم في الفصل',
    ru: 'Добро пожаловать на урок'
  },
  'welcome everyone': {
    en: 'Welcome everyone',
    pt: 'Bem-vindos a todos',
    es: 'Bienvenidos a todos',
    fr: 'Bienvenue à tous',
    de: 'Herzlich willkommen alle',
    it: 'Benvenuti a tutti',
    ja: '皆さんようこそ',
    zh: '欢迎大家',
    ar: 'أهلا بالجميع',
    ru: 'Добро пожаловать всем'
  },
  'yes': {
    en: 'Yes',
    pt: 'Sim',
    es: 'Sí',
    fr: 'Oui',
    de: 'Ja',
    it: 'Sì',
    ja: 'はい (Hai)',
    zh: '是的 (Shì de)',
    ar: 'نعم (Na\'am)',
    ru: 'Да (Da)'
  },
  'no': {
    en: 'No',
    pt: 'Não',
    es: 'No',
    fr: 'Non',
    de: 'Nein',
    it: 'No',
    ja: 'いいえ (Iie)',
    zh: '不是 (Bù)',
    ar: 'لا (La)',
    ru: 'Нет (Net)'
  },
  'great job': {
    en: 'Great job!',
    pt: 'Ótimo trabalho!',
    es: '¡Gran trabajo!',
    fr: 'Excellent travail!',
    de: 'Gute Arbeit!',
    it: 'Ottimo lavoro!',
    ja: '素晴らしい！',
    zh: '太棒了！',
    ar: 'عمل رائع!',
    ru: 'Отличная работа!'
  },
  'let us begin': {
    en: 'Let us begin',
    pt: 'Vamos começar',
    es: 'Vamos a empezar',
    fr: 'Commençons',
    de: 'Lasst uns anfangen',
    it: 'Cominciamo',
    ja: '始めましょう',
    zh: '我们开始吧',
    ar: 'دعونا نبدأ',
    ru: 'Давайте начнем'
  },
  'see you next time': {
    en: 'See you next time',
    pt: 'Até a próxima',
    es: 'Hasta la próxima',
    fr: 'À la prochaine',
    de: 'Bis zum nächsten Mal',
    it: 'Alla prossima',
    ja: 'また次回お会いしましょう',
    zh: '下次见',
    ar: 'أراك في المرة القادمة',
    ru: 'До следующего раза'
  }
};

const VOCAB_MAP: Record<string, Record<string, string>> = {
  teacher: { en: 'teacher', pt: 'professor', es: 'profesor', fr: 'professeur', de: 'Lehrer', it: 'insegnante', ja: '先生', zh: '老师', ar: 'معلم', ru: 'учитель' },
  professor: { en: 'teacher', pt: 'professor', es: 'profesor', fr: 'professeur', de: 'Lehrer', it: 'insegnante', ja: '先生', zh: '老师', ar: 'معلم', ru: 'учитель' },
  student: { en: 'student', pt: 'aluno', es: 'estudiante', fr: 'étudiant', de: 'Schüler', it: 'studente', ja: '学生', zh: '学生', ar: 'طالب', ru: 'студент' },
  aluno: { en: 'student', pt: 'aluno', es: 'estudiante', fr: 'étudiant', de: 'Schüler', it: 'studente', ja: '学生', zh: '学生', ar: 'طالب', ru: 'студент' },
  class: { en: 'class', pt: 'aula', es: 'clase', fr: 'cours', de: 'Klasse', it: 'classe', ja: 'クラス', zh: '课程', ar: 'فصل', ru: 'класс' },
  aula: { en: 'class', pt: 'aula', es: 'clase', fr: 'cours', de: 'Klasse', it: 'classe', ja: 'クラス', zh: '课程', ar: 'فصل', ru: 'класс' },
  homework: { en: 'homework', pt: 'tarefa de casa', es: 'tarea', fr: 'devoirs', de: 'Hausaufgaben', it: 'compiti', ja: '宿題', zh: '作业', ar: 'واجب', ru: 'домашнее задание' },
  whiteboard: { en: 'whiteboard', pt: 'quadro branco', es: 'pizarra', fr: 'tableau blanc', de: 'Whiteboard', it: 'lavagna', ja: 'ホワイトボード', zh: '白板', ar: 'السبورة', ru: 'доска' },
  screen: { en: 'screen', pt: 'tela', es: 'pantalla', fr: 'écran', de: 'Bildschirm', it: 'schermo', ja: '画面', zh: '屏幕', ar: 'شاشة', ru: 'экран' },
  meeting: { en: 'meeting', pt: 'reunião', es: 'reunión', fr: 'réunion', de: 'Besprechung', it: 'riunione', ja: '会議', zh: '会议', ar: 'اجتماع', ru: 'встреча' },
  reuniao: { en: 'meeting', pt: 'reunião', es: 'reunión', fr: 'réunion', de: 'Besprechung', it: 'riunione', ja: '会議', zh: '会议', ar: 'اجتماع', ru: 'встреча' },
  page: { en: 'page', pt: 'página', es: 'página', fr: 'page', de: 'Seite', it: 'pagina', ja: 'ページ', zh: '页', ar: 'صفحة', ru: 'страница' },
  question: { en: 'question', pt: 'pergunta', es: 'pregunta', fr: 'question', de: 'Frage', it: 'domanda', ja: '質問', zh: '问题', ar: 'سؤال', ru: 'вопрос' },
  pergunta: { en: 'question', pt: 'pergunta', es: 'pregunta', fr: 'question', de: 'Frage', it: 'domanda', ja: '質問', zh: '问题', ar: 'سؤال', ru: 'вопрос' },
  answer: { en: 'answer', pt: 'resposta', es: 'respuesta', fr: 'réponse', de: 'Antwort', it: 'risposta', ja: '答え', zh: '答案', ar: 'إجابة', ru: 'ответ' },
  good: { en: 'good', pt: 'bom', es: 'bueno', fr: 'bon', de: 'gut', it: 'buono', ja: '良い', zh: '好', ar: 'جيد', ru: 'хорошо' },
  bom: { en: 'good', pt: 'bom', es: 'bueno', fr: 'bon', de: 'gut', it: 'buono', ja: '良い', zh: '好', ar: 'جيد', ru: 'хорошо' },
  great: { en: 'great', pt: 'ótimo', es: 'excelente', fr: 'excellent', de: 'großartig', it: 'ottimo', ja: '素晴らしい', zh: '太棒了', ar: 'رائع', ru: 'отлично' },
  please: { en: 'please', pt: 'por favor', es: 'por favor', fr: 's\'il vous plaît', de: 'bitte', it: 'per favore', ja: 'お願いします', zh: '请', ar: 'من فضلك', ru: 'пожалуйста' },
  listen: { en: 'listen', pt: 'ouçam', es: 'escuchen', fr: 'écoutez', de: 'zuhören', it: 'ascolta', ja: '聞いてください', zh: '请听', ar: 'استمع', ru: 'слушайте' },
  start: { en: 'start', pt: 'começar', es: 'comenzar', fr: 'commencer', de: 'starten', it: 'iniziare', ja: '開始', zh: '开始', ar: 'ابدأ', ru: 'начать' },
  help: { en: 'help', pt: 'ajuda', es: 'ayuda', fr: 'aide', de: 'Hilfe', it: 'aiuto', ja: '助け', zh: '帮助', ar: 'مساعدة', ru: 'помощь' },
  ready: { en: 'ready', pt: 'pronto', es: 'listo', fr: 'prêt', de: 'bereit', it: 'pronto', ja: '準備完了', zh: '准备好', ar: 'جاهز', ru: 'готов' },
  welcome: { en: 'welcome', pt: 'bem-vindo', es: 'bienvenido', fr: 'bienvenue', de: 'willkommen', it: 'benvenuto', ja: 'ようこそ', zh: '欢迎', ar: 'أهلا بك', ru: 'добро пожаловать' }
};

/**
 * Fast client-side translation engine for live meeting captions
 */
export async function translateCaption(text: string, targetLangCode: string, sourceLangCode: string = 'en'): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return '';
  if (targetLangCode === sourceLangCode && targetLangCode !== 'auto') return trimmed;

  const normalized = trimmed.toLowerCase().replace(/[.,!?;:()]/g, '').trim();

  // 1. Direct phrase lookup in all translations
  for (const [, translations] of Object.entries(COMMON_PHRASES)) {
    // Check if input matches any language in this phrase group
    for (const [, phraseValue] of Object.entries(translations)) {
      const phraseNorm = phraseValue.toLowerCase().replace(/[.,!?;:()]/g, '').trim();
      if (normalized === phraseNorm || normalized.includes(phraseNorm) || phraseNorm.includes(normalized)) {
        const match = translations[targetLangCode];
        if (match) return match;
      }
    }
  }

  // 2. Word replacement / vocabulary synthesis
  const words = trimmed.split(/\s+/);
  let replacedCount = 0;
  const translatedWords = words.map(word => {
    const cleanWord = word.toLowerCase().replace(/[.,!?;:]/g, '');
    const punctuation = word.slice(cleanWord.length);

    // Look in vocab map
    for (const [, translations] of Object.entries(VOCAB_MAP)) {
      for (const [, val] of Object.entries(translations)) {
        if (cleanWord === val.toLowerCase() || cleanWord === val) {
          if (translations[targetLangCode]) {
            replacedCount++;
            return translations[targetLangCode] + punctuation;
          }
        }
      }
    }
    return word;
  });

  if (replacedCount > 0) {
    return translatedWords.join(' ');
  }

  // 3. Fallback: If same as English or straightforward string, return trimmed
  if (targetLangCode === 'en') {
    return trimmed;
  }

  // 4. Fallback with target code prefix tag if unsupported phrasing
  return `[${targetLangCode.toUpperCase()}] ${trimmed}`;
}

/**
 * Speaks text using Web Speech API
 */
export function speakText(text: string, langCode: string = 'en-US') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const clean = text.replace(/^\[[A-Z]+\]\s*/, '');
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = langCode;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Text-to-speech error:', err);
  }
}
