
export type Language = 'km' | 'en';

type TranslationValue = string | ((size: number) => string);

// Base translations interface for string-only values
interface BaseTranslations {
    home: string;
    voiceScribe: string;
    voiceTranscriptDescription: string;
    startNow: string;
    selectModel: string;
    transcribing: string;
    readyToTranscribe: string;
    dropAudio: string;
    download: string;
    exportSettings: string;
    chooseFormat: string;
    exportFormat: string;
    wordsPerSecond: string;
    wordsPerSecondHint: string;
    exportTranscript: string;
    invalidFileType: string;
    selectAudioFile: string;
    transcriptionFailed: string;
    noTranscript: string;
    transcriptionError: string;
    rateLimitExceeded: string;
    rateLimitMessage: string;
    support: string;
    supportDescription: string;
    improveAccuracy: string;
    customVocabulary: string;
    customVocabularyHint: string;
    addWord: string;
    pressEnterToAdd: string;
    retranscribe: string;
    ratingTitle: string;
    ratingDescription: string;
    ratingFeedbackPlaceholder: string;
    ratingSubmit: string;
    ratingLater: string;
    feedbackSuccess: string;
    feedbackError: string;
    ratingThankYou: string;
    pdfTranscript: string;
    pdfTranscriptDescription: string;
    features: string;
    copy: string;
    copied: string;
    chooseFile: string;
    pageTitle: string;
    dropPdf: string;
    noText: string;
    noTextToExport: string;
    selectPdfFile: string;
    transcribedTextPlaceholder: string;
    uploadCardTitle: string;
    transcriptionSuccess: string;
    fileName: string;
    fileSize: string;
    actions: string;
    actionsDescription: string;
    exportFailed: string;
    combinePdf: string;
    combinePdfDescription: string;
    combinePdfTitle: string;
    dropMultiplePdfs: string;
    filesToCombine: string;
    addMorePdfs: string;
    combineAndDownload: string;
    combineError: string;
    combineErrorDescription: string;
    imageToPdf: string;
    imageToPdfDescription: string;
    imageToPdfTitle: string;
    dropImages: string;
    addMoreImages: string;
    imagesToConvert: string;
    convertAndDownload: string;
    conversionError: string;
    conversionErrorDescription: string;
    selectImageFile: string;
    fileTooLargeTitle: string;
    convertImageFormat: string;
    convertImageFormatDescription: string;
    convertImageFormatTitle: string;
    dropImageToConvert: string;
    modelOverloadedTitle: string;
    modelOverloadedDescription: string;
    reportBug: string;
    history: string;
    seeAll: string;
    noHistory: string;
    popularTools: string;
    otherTools: string;
    commentLoginRequired: string;
    // Comment system translations
    comments: string;
    addComment: string;
    addCommentPlaceholder: string;
    reply: string;
    replyPlaceholder: string;
    submit: string;
    edit: string;
    delete: string;
    report: string;
    showMore: string;
    showReplies: string;
    hideReplies: string;
    sortMostRecent: string;
    sortOldest: string;
    sortPopular: string;
    noComments: string;
    commentSubmitted: string;
    commentDeleted: string;
    commentError: string;
    voteError: string;
    editComment: string;
    deleteComment: string;
    confirmDelete: string;
    edited: string;
    fileTooLargeDescription: (size: number) => string; // Only function-based translation
}

// Extended type for internal translations (allowing functions)
type Translations = BaseTranslations;

// Create safe translation resolver that works with React components
export const resolveTranslation = (value: TranslationValue, size?: number): string => {
    if (typeof value === 'string') {
        return value;
    }
    return value(size || 25); // Default 25MB limit
};

// Create a translation hook helper
export const createSafeTranslations = (translations: Translations): Record<string, TranslationValue> => {
    // Create an object with all translations resolved safely
    const resolved: Record<string, TranslationValue> = {};
    
    for (const key in translations) {
        const value = translations[key as keyof Translations];
        if (typeof value === 'function') {
            // For function-based translations, create a helper function
            resolved[key] = (size?: number) => value(size || 25);
        } else {
            // For string translations, use directly
            resolved[key] = value;
        }
    }
    
    return resolved;
};

export const useTranslationResolver = (translations: Translations) => {
    return {
        ...translations,
        // Helper method to resolve dynamic translations
        getFileTooLargeDescription: (size: number) => translations.fileTooLargeDescription(size)
    };
};

const enTranslations: Translations = {
    home: "Home",
    voiceScribe: "Voice Transcript",
    voiceTranscriptDescription: "Transcribe audio files into editable text with timestamps.",
    startNow: "Start Now",
    selectModel: "Select model",
    transcribing: "In Processing please wait",
    readyToTranscribe: "Ready to Transcribe",
    dropAudio: "Drop an audio file here or click to upload.",
    download: "DOWNLOAD",
    exportSettings: "Export Settings",
    chooseFormat: "Choose your format and settings, then click export.",
    exportFormat: "Export Format",
    wordsPerSecond: "Words per second",
    wordsPerSecondHint: "For SRT/VTT. Overrides AI timing.",
    exportTranscript: "Export Transcript",
    invalidFileType: "Invalid file type",
    selectAudioFile: "Please select an audio file.",
    transcriptionFailed: "Transcription failed",
    noTranscript: "The model did not return a transcript. Please try again.",
    transcriptionError: "Transcription Error",
    rateLimitExceeded: "Rate Limit Exceeded",
    rateLimitMessage: "You've made too many requests. Please wait a moment or check your API plan and billing details.",
    support: "Support",
    supportDescription: "If you find this application useful, please consider supporting its development.",
    improveAccuracy: "IMPROVE",
    customVocabulary: "Custom Vocabulary",
    customVocabularyHint: "Add difficult-to-transcribe words or phrases to improve accuracy.",
    addWord: "Add Word",
    pressEnterToAdd: "Press Enter to add",
    retranscribe: "Retranscribe",
    ratingTitle: "How was the transcription?",
    ratingDescription: "Your feedback helps us improve. Please rate your experience.",
    ratingFeedbackPlaceholder: "Tell us more about your experience...",
    ratingSubmit: "Submit",
    ratingLater: "Rate Later",
    feedbackSuccess: "Thank you for your feedback!",
    feedbackError: "Could not submit feedback. Please try again later.",
    ratingThankYou: "Thank you!",
    pdfTranscript: "PDF Transcript",
    pdfTranscriptDescription: "Extract and clean up text from your PDF documents.",
    features: "Features",
    copy: "COPY",
    copied: "Copied!",
    chooseFile: "Choose File",
    pageTitle: "PDF Transcript",
    dropPdf: "Drop a PDF file here or click to upload.",
    noText: "The model did not return any text. Please try again.",
    noTextToExport: "There is no text to export.",
    selectPdfFile: "Please select a PDF file.",
    transcribedTextPlaceholder: "Your transcribed text will appear here. You can edit it directly.",
    uploadCardTitle: "Upload your PDF",
    transcriptionSuccess: "Transcription Successful!",
    fileName: "File Name:",
    fileSize: "File Size:",
    actions: "Actions",
    actionsDescription: "Copy or download the text in various formats.",
    exportFailed: "Export Failed",
    combinePdf: "Combine PDF",
    combinePdfDescription: "Merge multiple PDF files into one.",
    combinePdfTitle: "Upload your PDFs to combine",
    dropMultiplePdfs: "Drop PDF files here or click to select.",
    filesToCombine: "Files to Combine",
    addMorePdfs: "Add more PDFs",
    combineAndDownload: "Combine & Download",
    combineError: "Combine Failed",
    combineErrorDescription: "Please upload at least two PDF files to combine.",
    imageToPdf: "Image to PDF",
    imageToPdfDescription: "Convert one or more images into a single PDF file.",
    imageToPdfTitle: "Upload your images to convert",
    dropImages: "Drop images here or click to select.",
    addMoreImages: "Add more images",
    imagesToConvert: "Images to Convert",
    convertAndDownload: "Convert & Download",
    conversionError: "Conversion Failed",
    conversionErrorDescription: "Please upload at least one image to convert.",
    selectImageFile: "Please select an image file (JPEG, PNG, etc.).",
    fileTooLargeTitle: "File Too Large",
    fileTooLargeDescription: (size: number) => `The file exceeds the server's limit of ${size}MB. Please use a smaller file.`,
    convertImageFormat: "Convert Image Format",
    convertImageFormatDescription: "Easily change the format of your images.",
    convertImageFormatTitle: "Upload your image to convert",
    dropImageToConvert: "Drop an image here or click to select.",
    modelOverloadedTitle: "AI Model Busy",
    modelOverloadedDescription: "The AI model is currently experiencing high demand. Please try again in a few moments.",
    reportBug: "Report a Bug",
    history: "Recent History",
    seeAll: "See All History",
    noHistory: "No history yet. Start using features to see them here.",
    popularTools: "Popular Tools",
    otherTools: "Other Tools",
    commentLoginRequired: "Please login to leave comments and share your experience with our tools.",
    // Comment system translations
    comments: "Comments",
    addComment: "Add Comment",
    addCommentPlaceholder: "Add comment...",
    reply: "Reply",
    replyPlaceholder: "Write a reply...",
    submit: "Submit",
    edit: "Edit",
    delete: "Delete",
    report: "Report",
    showMore: "Show more",
    showReplies: "Show replies",
    hideReplies: "Hide replies",
    sortMostRecent: "Most recent",
    sortOldest: "Oldest first",
    sortPopular: "Most popular",
    noComments: "No comments yet. Be the first to share your thoughts!",
    commentSubmitted: "Comment submitted successfully!",
    commentDeleted: "Comment deleted successfully!",
    commentError: "Failed to submit comment. Please try again.",
    voteError: "Failed to vote. Please try again.",
    editComment: "Edit Comment",
    deleteComment: "Delete Comment",
    confirmDelete: "Are you sure you want to delete this comment?",
    edited: "edited",
};

const kmTranslations: Translations = {
    home: "ទំព័រដើម",
    voiceScribe: "ការសរសេរតាមសំឡេង",
    voiceTranscriptDescription: "បម្លែងឯកសារអូឌីយ៉ូទៅជាអត្ថបទដែលអាចកែសម្រួលបានជាមួយនឹងពេលវេលា។",
    startNow: "ចាប់ផ្តើមឥឡូវនេះ",
    selectModel: "ជ្រើសរើសម៉ូដែល",
    transcribing: "កំពុងដំណើរការ សូមរង់ចាំ",
    readyToTranscribe: "ត្រៀមខ្លួនរួចរាល់ដើម្បីបកប្រែ",
    dropAudio: "ដាក់ឯកសារសំឡេងនៅទីនេះ ឬចុចដើម្បីផ្ទុកឡើង។",
    download: "ទាញយក",
    exportSettings: "ការកំណត់ការនាំចេញ",
    chooseFormat: "ជ្រើសរើសទម្រង់ និងការកំណត់របស់អ្នក បន្ទាប់មកចុចនាំចេញ។",
    exportFormat: "ទ្រង់ទ្រាយនាំចេញ",
    wordsPerSecond: "ពាក្យក្នុងមួយវិនាទី",
    wordsPerSecondHint: "សម្រាប់ SRT/VTT។ បដិសេធពេលវេលា AI ។",
    exportTranscript: "ទាញយក",
    invalidFileType: "ប្រភេទឯកសារមិនត្រឹមត្រូវ",
    selectAudioFile: "សូមជ្រើសរើសឯកសារអូឌីយ៉ូ។",
    transcriptionFailed: "ការបកប្រែបានបរាជ័យ",
    noTranscript: "ម៉ូដែលមិនបានបញ្ជូនប្រតិចារិកមកវិញទេ។ សូមព្យាយាមម្តងទៀត។",
    transcriptionError: "កំហុសក្នុងការបកប្រែ",
    rateLimitExceeded: "លើសកម្រិតកំណត់",
    rateLimitMessage: "អ្នកបានធ្វើការស្នើសុំច្រើនពេក។ សូមរង់ចាំមួយភ្លែត ឬពិនិត្យមើលផែនការ API និងព័ត៌មានលម្អិតអំពីការចេញវិក្កយប័ត្ររបស់អ្នក។",
    support: "គាំទ្រ",
    supportDescription: "ប្រសិនបើអ្នកពេញចិត្តនឹងកម្មវិធីនេះ សូមពិចារណាគាំទ្រការអភិវឌ្ឍន៍របស់វា។",
    improveAccuracy: "កែលម្អ",
    customVocabulary: "វាក្យសព្ទផ្ទាល់ខ្លួន",
    customVocabularyHint: "បន្ថែមពាក្យ ឬឃ្លាដែលពិបាកបកប្រែ ដើម្បីបង្កើនភាពត្រឹមត្រូវ។",
    addWord: "បន្ថែមពាក្យ",
    pressEnterToAdd: "ចុច Enter ដើម្បីបន្ថែម",
    retranscribe: "បកប្រែឡើងវិញ",
    ratingTitle: "តើអ្នកពេញចិត្តនឹងការបកប្រែទេ?",
    ratingDescription: "មតិកែលម្អរបស់អ្នកជួយយើងក្នុងការកែលម្អ។ សូមវាយតម្លៃបទពិសោធន៍របស់អ្នក។",
    ratingFeedbackPlaceholder: "ប្រាប់យើងបន្ថែមអំពីបទពិសោធន៍របស់អ្នក...",
    ratingSubmit: "បញ្ជូន",
    ratingLater: "វាយតម្លៃពេលក្រោយ",
    feedbackSuccess: "សូមអរគុណសម្រាប់មតិកែលម្អរបស់អ្នក!",
    feedbackError: "មិនអាចបញ្ជូនមតិកែលម្អបានទេ។ សូម​ព្យាយាម​ម្តង​ទៀត​នៅ​ពេល​ក្រោយ។",
    ratingThankYou: "សូម​អរគុណ!",
    pdfTranscript: "ប្រតិចារិក PDF",
    pdfTranscriptDescription: "ស្រង់ចេញ និងសម្អាតអត្ថបទពីឯកសារ PDF របស់អ្នក។",
    features: "លក្ខណៈពិសេស",
    copy: "ចម្លង",
    copied: "បានចម្លង!",
    chooseFile: "Choose File",
    pageTitle: "ប្រតិចារិក PDF",
    dropPdf: "ដាក់ឯកសារ PDF នៅទីនេះ ឬចុចដើម្បីផ្ទុកឡើង។",
    noText: "ម៉ូដែលមិនបានបញ្ជូនអត្ថបទមកវិញទេ។ សូមព្យាយាមម្តងទៀត។",
    noTextToExport: "គ្មានអត្ថបទសម្រាប់នាំចេញទេ។",
    selectPdfFile: "សូមជ្រើសរើសឯកសារ PDF។",
    transcribedTextPlaceholder: "អត្ថបទដែលបានបម្លែងនឹងបង្ហាញនៅទីនេះ។",
    uploadCardTitle: "ផ្ទុកឡើង PDF របស់អ្នក",
    transcriptionSuccess: "ការបម្លែងបានជោគជ័យ!",
    fileName: "ឈ្មោះ​ឯកសារ:",
    fileSize: "ទំហំ​ឯកសារ:",
    actions: "សកម្មភាព",
    actionsDescription: "ចម្លង ឬទាញយកអត្ថបទជាទម្រង់ផ្សេងៗ។",
    exportFailed: "ការនាំចេញបានបរាជ័យ",
    combinePdf: "បូកបញ្ចូល PDF",
    combinePdfDescription: "បូកបញ្ចូលឯកសារ PDF ច្រើនចូលគ្នា។",
    combinePdfTitle: "ផ្ទុកឡើងឯកសារ PDF របស់អ្នកដើម្បីបូកបញ្ចូល",
    dropMultiplePdfs: "ដាក់ឯកសារ PDF នៅទីនេះ ឬចុចដើម្បីជ្រើសរើស។",
    filesToCombine: "ឯកសារត្រូវបូកបញ្ចូល",
    addMorePdfs: "បន្ថែមឯកសារ PDF ផ្សេងទៀត",
    combineAndDownload: "បូកបញ្ចូល ហើយទាញយក",
    combineError: "ការបូកបញ្ចូលបានបរាជ័យ",
    combineErrorDescription: "សូមផ្ទុកឡើងឯកសារ PDF យ៉ាងតិចពីរ។",
    imageToPdf: "រូបភាពទៅជា PDF",
    imageToPdfDescription: "បម្លែងរូបភាពមួយឬច្រើនទៅជាឯកសារ PDF តែមួយ។",
    imageToPdfTitle: "ផ្ទុកឡើងរូបភាពរបស់អ្នកដើម្បីបម្លែង",
    dropImages: "ទម្លាក់រូបភាពនៅទីនេះ ឬចុចដើម្បីជ្រើសរើស។",
    addMoreImages: "បន្ថែមរូបភាពផ្សេងទៀត",
    imagesToConvert: "រូបភាពត្រូវបម្លែង",
    convertAndDownload: "បម្លែង ហើយទាញយក",
    conversionError: "ការបម្លែងបានបរាជ័យ",
    conversionErrorDescription: "សូមផ្ទុកឡើងយ៉ាងហោចណាស់រូបភាពមួយ។",
    selectImageFile: "សូមជ្រើសរើសឯកសាររូបភាព។",
    fileTooLargeTitle: "ឯកសារធំពេក",
    fileTooLargeDescription: (size: number) => `ឯកសារមានទំហំធំជាង ${size}MB។ សូមផ្ទុកឡើងឯកសារតូចជាងនេះ។`,
    convertImageFormat: "បម្លែងទ្រង់ទ្រាយរូបភាព",
    convertImageFormatDescription: "ផ្លាស់ប្តូរទ្រង់ទ្រាយរូបភាពរបស់អ្នកបានយ៉ាងងាយស្រួល។",
    convertImageFormatTitle: "ផ្ទុកឡើងរូបភាពរបស់អ្នកដើម្បីបម្លែង",
    dropImageToConvert: "ទម្លាក់រូបភាពនៅទីនេះ ឬចុចដើម្បីជ្រើសរើស។",
    modelOverloadedTitle: "ម៉ូដែល AI រវល់",
    modelOverloadedDescription: "ម៉ូដែល AI កំពុងមានតម្រូវការខ្ពស់។ សូមព្យាយាមម្តងទៀតក្នុងរយៈពេលពីរបីនាទីទៀត។",
    reportBug: "រាយការណ៍បញ្ហា",
    history: "ប្រវត្តិថ្មីៗ",
    seeAll: "មើល​ប្រវត្តិ​ទាំងអស់",
    noHistory: "មិនទាន់មានប្រវត្តិទេ។ ចាប់ផ្តើមប្រើលក្ខណៈពិសេសដើម្បីមើលពួកវានៅទីនេះ។",
    popularTools: "ឧបករណ៍ពេញនិយម",
    otherTools: "ឧបករណ៍ផ្សេងទៀត",
    commentLoginRequired: "សូមចូលគណនីដើម្បីបន្សល់មតិយោបល់ និងចែករំលែកបទពិសោធន៍របស់អ្នកជាមួយឧបករណ៍របស់យើង។",
    // Comment system translations
    comments: "មតិយោបល់",
    addComment: "បន្ថែមមតិយោបល់",
    addCommentPlaceholder: "បន្ថែមមតិយោបល់...",
    reply: "ឆ្លើយតប",
    replyPlaceholder: "សរសេរការឆ្លើយតប...",
    submit: "បញ្ជូន",
    edit: "កែសម្រួល",
    delete: "លុប",
    report: "រាយការណ៍",
    showMore: "បង្ហាញបន្ថែម",
    showReplies: "បង្ហាញការឆ្លើយតប",
    hideReplies: "លាក់ការឆ្លើយតប",
    sortMostRecent: "ថ្មីបំផុត",
    sortOldest: "ចាស់បំផុត",
    sortPopular: "ពេញនិយមបំផុត",
    noComments: "មិនទាន់មានមតិយោបល់ទេ។ ចូលរួមចែករំលែកគំនិតរបស់អ្នកដំបូងគេ!",
    commentSubmitted: "បានបញ្ជូនមតិយោបល់ដោយជោគជ័យ!",
    commentDeleted: "បានលុបមតិយោបល់ដោយជោគជ័យ!",
    commentError: "បរាជ័យក្នុងការបញ្ជូនមតិយោបល់។ សូមព្យាយាមម្តងទៀត។",
    voteError: "បរាជ័យក្នុងការបោះឆ្នោត។ សូមព្យាយាមម្តងទៀត។",
    editComment: "កែសម្រួលមតិយោបល់",
    deleteComment: "លុបមតិយោបល់",
    confirmDelete: "តើអ្នកប្រាកដថាចង់លុបមតិយោបល់នេះមែនទេ?",
    edited: "បានកែសម្រួល",
};

export const allTranslations = {
  km: kmTranslations,
  en: enTranslations
};
