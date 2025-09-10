import { Language, allTranslations } from '@/lib/translations';

export interface SEOTranslations {
  // Meta titles
  homeTitle: string;
  aiAssistantTitle: string;
  voiceTranscriptTitle: string;
  textToSpeechTitle: string;
  generateQrCodeTitle: string;
  pdfTranscriptTitle: string;
  combinePdfTitle: string;
  imageToPdfTitle: string;
  convertImageFormatTitle: string;
  historyTitle: string;
  profileTitle: string;
  loginTitle: string;
  signupTitle: string;

  // Meta descriptions
  homeDescription: string;
  aiAssistantDescription: string;
  voiceTranscriptDescription: string;
  textToSpeechDescription: string;
  generateQrCodeDescription: string;
  pdfTranscriptDescription: string;
  combinePdfDescription: string;
  imageToPdfDescription: string;
  convertImageFormatDescription: string;

  // Keywords
  siteKeywords: string;
  brandName: string;
}

const enSEO: SEOTranslations = {
  // Meta titles
  homeTitle: "Somleng - Audio Transcription & PDF Tools",
  aiAssistantTitle: "AI Assistant - Somleng",
  voiceTranscriptTitle: "Voice Transcription - Somleng",
  textToSpeechTitle: "Text to Speech - Somleng",
  generateQrCodeTitle: "QR Code Generator - Somleng",
  pdfTranscriptTitle: "PDF Text Extraction - Somleng",
  combinePdfTitle: "Combine PDF Files - Somleng",
  imageToPdfTitle: "Image to PDF Converter - Somleng",
  convertImageFormatTitle: "Image Format Converter - Somleng",
  historyTitle: "History - Somleng",
  profileTitle: "Profile - Somleng",
  loginTitle: "Login - Somleng",
  signupTitle: "Sign Up - Somleng",

  // Meta descriptions
  homeDescription: "An all-in-one toolkit for audio transcription, text-to-speech, PDF utilities, and more. Fast, accurate, and easy to use.",
  aiAssistantDescription: "AI-powered assistant to help with various tasks including text processing, analysis, and more.",
  voiceTranscriptDescription: "Convert audio files to text with high accuracy. Supports multiple formats and languages.",
  textToSpeechDescription: "Convert text to natural-sounding speech with multiple voice options and languages.",
  generateQrCodeDescription: "Generate QR codes for text, URLs, contact information, and more with customizable options.",
  pdfTranscriptDescription: "Extract and clean text from PDF documents quickly and accurately.",
  combinePdfDescription: "Merge multiple PDF files into a single document easily and securely.",
  imageToPdfDescription: "Convert images (JPG, PNG, etc.) to PDF format with batch processing support.",
  convertImageFormatDescription: "Convert images between different formats (JPG, PNG, WebP, etc.) with quality control.",

  // Keywords
  siteKeywords: "audio transcription, text to speech, PDF tools, image converter, QR code generator, voice recognition, speech to text, file conversion",
  brandName: "Somleng"
};

const kmSEO: SEOTranslations = {
  // Meta titles
  homeTitle: "សំឡេង - ឧបករណ៍បកប្រែសំឡេង និង PDF",
  aiAssistantTitle: "ជំនួយការ AI - សំឡេង",
  voiceTranscriptTitle: "ការសរសេរតាមសំឡេង - សំឡេង",
  textToSpeechTitle: "អត្ថបទទៅសំឡេង - សំឡេង",
  generateQrCodeTitle: "បង្កើតកូដ QR - សំឡេង",
  pdfTranscriptTitle: "ស្រង់អត្ថបទ PDF - សំឡេង",
  combinePdfTitle: "បូកបញ្ចូល PDF - សំឡេង",
  imageToPdfTitle: "រូបភាពទៅជា PDF - សំឡេង",
  convertImageFormatTitle: "បម្លែងទ្រង់ទ្រាយរូបភាព - សំឡេង",
  historyTitle: "ប្រវត្តិ - សំឡេង",
  profileTitle: "ប្រវត្តិរូប - សំឡេង",
  loginTitle: "ចូលគណនី - សំឡេង",
  signupTitle: "ចុះឈ្មោះ - សំឡេង",

  // Meta descriptions
  homeDescription: "ឧបករណ៍ពេញលេញសម្រាប់ការបកប្រែសំឡេង អត្ថបទទៅសំឡេង ឧបករណ៍ PDF និងច្រើនទៀត។ លឿន ត្រឹមត្រូវ និងងាយស្រួលប្រើ។",
  aiAssistantDescription: "ជំនួយការដើម្បីដោយ AI ដើម្បីជួយដោះស្រាយកិច្ចការផ្សេងៗ រួមទាំងការធ្វើការលើអត្ថបទ ការវិភាគ និងច្រើនទៀត។",
  voiceTranscriptDescription: "បម្លែងឯកសារសំឡេងទៅជាអត្ថបទដោយភាពត្រឹមត្រូវខ្ពស់។ គាំទ្រទ្រង់ទ្រាយ និងភាសាជាច្រើន។",
  textToSpeechDescription: "បម្លែងអត្ថបទទៅជាសំឡេងធម្មជាតិជាមួយនឹងជម្រើសសំឡេង និងភាសាជាច្រើន។",
  generateQrCodeDescription: "បង្កើតកូដ QR សម្រាប់អត្ថបទ URL ព័ត៌មានទំនាក់ទំនង និងច្រើនទៀតជាមួយនឹងការកំណត់ផ្ទាល់ខ្លួន។",
  pdfTranscriptDescription: "ស្រង់ចេញ និងសម្អាតអត្ថបទពីឯកសារ PDF យ៉ាងលឿន និងត្រឹមត្រូវ។",
  combinePdfDescription: "បូកបញ្ចូលឯកសារ PDF ជាច្រើនទៅក្នុងឯកសារតែមួយដោយងាយស្រួល និងមានសុវត្ថិភាព។",
  imageToPdfDescription: "បម្លែងរូបភាព (JPG, PNG, ល។) ទៅជាទ្រង់ទ្រាយ PDF ជាមួយនឹងការគាំទ្រដំណើរការជាបាច់។",
  convertImageFormatDescription: "បម្លែងរូបភាពរវាងទ្រង់ទ្រាយផ្សេងៗ (JPG, PNG, WebP, ល។) ជាមួយនឹងការត្រួតពិនិត្យគុណភាព។",

  // Keywords
  siteKeywords: "ការបកប្រែសំឡេង, អត្ថបទទៅសំឡេង, ឧបករណ៍ PDF, កម្មវិធីបម្លែងរូបភាព, កម្មវិធីបង្កើតកូដ QR, ការស្គាល់សំឡេង, សំឡេងទៅអត្ថបទ, ការបម្លែងឯកសារ",
  brandName: "សំឡេង"
};

export const seoTranslations = {
  en: enSEO,
  km: kmSEO
};

export const getSEOForPage = (page: string, language: Language) => {
  const seo = seoTranslations[language];
  const t = allTranslations[language];
  
  const baseTitle = seo.brandName;
  
  switch (page) {
    case 'home':
    case '/':
      return {
        title: seo.homeTitle,
        description: seo.homeDescription,
        keywords: seo.siteKeywords
      };
    case 'ai-assistant':
      return {
        title: seo.aiAssistantTitle,
        description: seo.aiAssistantDescription,
        keywords: seo.siteKeywords
      };
    case 'voice-transcript':
      return {
        title: seo.voiceTranscriptTitle,
        description: seo.voiceTranscriptDescription,
        keywords: seo.siteKeywords
      };
    case 'text-to-speech':
      return {
        title: seo.textToSpeechTitle,
        description: seo.textToSpeechDescription,
        keywords: seo.siteKeywords
      };
    case 'generate-qr-code':
      return {
        title: seo.generateQrCodeTitle,
        description: seo.generateQrCodeDescription,
        keywords: seo.siteKeywords
      };
    case 'pdf-transcript':
      return {
        title: seo.pdfTranscriptTitle,
        description: seo.pdfTranscriptDescription,
        keywords: seo.siteKeywords
      };
    case 'combine-pdf':
      return {
        title: seo.combinePdfTitle,
        description: seo.combinePdfDescription,
        keywords: seo.siteKeywords
      };
    case 'image-to-pdf':
      return {
        title: seo.imageToPdfTitle,
        description: seo.imageToPdfDescription,
        keywords: seo.siteKeywords
      };
    case 'convert-image-format':
      return {
        title: seo.convertImageFormatTitle,
        description: seo.convertImageFormatDescription,
        keywords: seo.siteKeywords
      };
    case 'history':
      return {
        title: seo.historyTitle,
        description: seo.homeDescription,
        keywords: seo.siteKeywords
      };
    case 'profile':
      return {
        title: seo.profileTitle,
        description: seo.homeDescription,
        keywords: seo.siteKeywords
      };
    case 'login':
      return {
        title: seo.loginTitle,
        description: seo.homeDescription,
        keywords: seo.siteKeywords
      };
    case 'signup':
      return {
        title: seo.signupTitle,
        description: seo.homeDescription,
        keywords: seo.siteKeywords
      };
    default:
      return {
        title: `${t.pageTitle || page} - ${baseTitle}`,
        description: seo.homeDescription,
        keywords: seo.siteKeywords
      };
  }
};

export const generateMetaTags = (page: string, language: Language) => {
  const seo = getSEOForPage(page, language);
  
  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    'og:title': seo.title,
    'og:description': seo.description,
    'og:type': 'website',
    'twitter:title': seo.title,
    'twitter:description': seo.description,
    'twitter:card': 'summary_large_image',
  };
};
