
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
    
    // Additional UI Elements
    aiAssistant: string;
    textToSpeech: string;
    generateQrCode: string;
    passwordGenerator: string;
    textTools: string;
    contact: string;
    premium: string;
    version: string;
    loading: string;
    processing: string;
    success: string;
    error: string;
    warning: string;
    info: string;
    cancel: string;
    confirm: string;
    retry: string;
    close: string;
    save: string;
    reset: string;
    clear: string;
    upload: string;
    browse: string;
    search: string;
    filter: string;
    sort: string;
    refresh: string;
    settings: string;
    profile: string;
    logout: string;
    login: string;
    signup: string;
    
    // Form Elements
    email: string;
    password: string;
    confirmPassword: string;
    firstName: string;
    lastName: string;
    fullName: string;
    phoneNumber: string;
    address: string;
    city: string;
    country: string;
    zipCode: string;
    
    // Messages and Notifications
    welcomeMessage: string;
    successMessage: string;
    errorMessage: string;
    warningMessage: string;
    infoMessage: string;
    emailSent: string;
    passwordReset: string;
    accountCreated: string;
    accountDeleted: string;
    dataUpdated: string;
    dataSaved: string;
    
    // Time and Date
    today: string;
    yesterday: string;
    thisWeek: string;
    thisMonth: string;
    thisYear: string;
    january: string;
    february: string;
    march: string;
    april: string;
    may: string;
    june: string;
    july: string;
    august: string;
    september: string;
    october: string;
    november: string;
    december: string;
    
    // File Operations
    uploadFile: string;
    downloadFile: string;
    deleteFile: string;
    renameFile: string;
    shareFile: string;
    previewFile: string;
    
    // Quality and Size
    quality: string;
    size: string;
    format: string;
    resolution: string;
    duration: string;
    
    // Text Tools Categories
    caseConversion: string;
    textCleaning: string;
    textCleaningFormatting: string;
    encodingDecoding: string;
    jsonTools: string;
    
    // Text Tools - Case Conversion
    uppercase: string;
    uppercaseDesc: string;
    lowercase: string;
    lowercaseDesc: string;
    titleCase: string;
    titleCaseDesc: string;
    camelCase: string;
    camelCaseDesc: string;
    pascalCase: string;
    pascalCaseDesc: string;
    snakeCase: string;
    snakeCaseDesc: string;
    kebabCase: string;
    kebabCaseDesc: string;
    sentenceCase: string;
    sentenceCaseDesc: string;
    
    // Text Tools - Cleaning
    removeExtraSpaces: string;
    removeExtraSpacesDesc: string;
    removeEmptyLines: string;
    removeEmptyLinesDesc: string;
    sortLinesAZ: string;
    sortLinesAZDesc: string;
    sortLinesZA: string;
    sortLinesZADesc: string;
    removeDuplicates: string;
    removeDuplicatesDesc: string;
    addLineNumbers: string;
    addLineNumbersDesc: string;
    reverseText: string;
    reverseTextDesc: string;
    stripHtml: string;
    stripHtmlDesc: string;
    
    // Text Tools - Encoding
    encodeBase64: string;
    encodeBase64Desc: string;
    decodeBase64: string;
    decodeBase64Desc: string;
    urlEncode: string;
    urlEncodeDesc: string;
    urlDecode: string;
    urlDecodeDesc: string;
    escapeHtml: string;
    escapeHtmlDesc: string;
    unescapeHtml: string;
    unescapeHtmlDesc: string;
    generateHash: string;
    generateHashDesc: string;
    
    // Text Tools - JSON
    formatJson: string;
    formatJsonDesc: string;
    minifyJson: string;
    minifyJsonDesc: string;
    
    // Text Tools - UI Labels
    tools: string;
    compare: string;
    extract: string;
    hash: string;
    inputText: string;
    transformedText: string;
    outputWillAppear: string;
    enterTextToTransform: string;
    transformedTextWillAppear: string;
    searchTools: string;
    quickActions: string;
    favoriteTools: string;
    keyboardShortcuts: string;
    navigation: string;
    switchToToolsTab: string;
    switchToCompareTab: string;
    switchToExtractTab: string;
    switchToHashTab: string;
    focusSearchBox: string;
    convertToUppercase: string;
    convertToLowercase: string;
    convertToTitleCase: string;
    showShortcuts: string;
    toolNavigation: string;
    navigateToolsUp: string;
    navigateToolsDown: string;
    applyFocusedTool: string;
    proTips: string;
    shortcutsWorkWhenNotTyping: string;
    useArrowKeysToNavigate: string;
    starToolsToFavorite: string;
    searchFiltersAllTools: string;
    
    // Text Tools - Comparison
    text1: string;
    text2: string;
    enterFirstTextToCompare: string;
    enterSecondTextToCompare: string;
    
    // Text Tools - Extract
    enterTextToExtract: string;
    emailAddresses: string;
    urls: string;
    phoneNumbers: string;
    noEmailsFound: string;
    noUrlsFound: string;
    noPhonesFound: string;
    
    // Text Tools - Hash
    enterTextToGenerateHash: string;
    generateSHA256Hash: string;
    sha256Hash: string;
    
    // AI Model Translations
    selectAiModel: string;
    fastAndEfficient: string;
    latestExperimental: string;
    nextGeneration: string;
    active: string;
    
    // Feature Cards - Titles and Descriptions
    smartAiChat: string;
    smartAiChatDesc: string;
    qrGenerator: string;
    qrGeneratorDesc: string;
    voiceToText: string;
    voiceToTextDesc: string;
    textReader: string;
    textReaderDesc: string;
    pdfReader: string;
    pdfReaderDesc: string;
    pdfMerger: string;
    pdfMergerDesc: string;
    imageToPdfTitle: string;
    imageToPdfDesc: string;
    imageConverter: string;
    imageConverterDesc: string;
    passwordGen: string;
    passwordGenDesc: string;
    textUtils: string;
    textUtilsDesc: string;
    
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
    
    // Additional UI Elements
    aiAssistant: "AI Assistant",
    textToSpeech: "Text to Speech",
    generateQrCode: "Generate QR Code",
    passwordGenerator: "Password Generator",
    textTools: "Text Tools",
    contact: "Contact Us",
    premium: "Premium",
    version: "Version",
    loading: "Loading",
    processing: "Processing",
    success: "Success",
    error: "Error",
    warning: "Warning",
    info: "Info",
    cancel: "Cancel",
    confirm: "Confirm",
    retry: "Retry",
    close: "Close",
    save: "Save",
    reset: "Reset",
    clear: "Clear",
    upload: "Upload",
    browse: "Browse",
    search: "Search",
    filter: "Filter",
    sort: "Sort",
    refresh: "Refresh",
    settings: "Settings",
    profile: "Profile",
    logout: "Logout",
    login: "Login",
    signup: "Sign Up",
    
    // Form Elements
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    firstName: "First Name",
    lastName: "Last Name",
    fullName: "Full Name",
    phoneNumber: "Phone Number",
    address: "Address",
    city: "City",
    country: "Country",
    zipCode: "ZIP Code",
    
    // Messages and Notifications
    welcomeMessage: "Welcome!",
    successMessage: "Operation completed successfully",
    errorMessage: "An error occurred",
    warningMessage: "Warning",
    infoMessage: "Information",
    emailSent: "Email sent successfully",
    passwordReset: "Password reset successfully",
    accountCreated: "Account created successfully",
    accountDeleted: "Account deleted successfully",
    dataUpdated: "Data updated successfully",
    dataSaved: "Data saved successfully",
    
    // Time and Date
    today: "Today",
    yesterday: "Yesterday",
    thisWeek: "This Week",
    thisMonth: "This Month",
    thisYear: "This Year",
    january: "January",
    february: "February",
    march: "March",
    april: "April",
    may: "May",
    june: "June",
    july: "July",
    august: "August",
    september: "September",
    october: "October",
    november: "November",
    december: "December",
    
    // File Operations
    uploadFile: "Upload File",
    downloadFile: "Download File",
    deleteFile: "Delete File",
    renameFile: "Rename File",
    shareFile: "Share File",
    previewFile: "Preview File",
    
    // Quality and Size
    quality: "Quality",
    size: "Size",
    format: "Format",
    resolution: "Resolution",
    duration: "Duration",
    
    // Text Tools Categories
    caseConversion: "Case Conversion",
    textCleaning: "Text Cleaning",
    textCleaningFormatting: "Text Cleaning & Formatting",
    encodingDecoding: "Encoding & Decoding",
    jsonTools: "JSON Tools",
    
    // Text Tools - Case Conversion
    uppercase: "UPPERCASE",
    uppercaseDesc: "Convert all text to uppercase letters",
    lowercase: "lowercase",
    lowercaseDesc: "Convert all text to lowercase letters",
    titleCase: "Title Case",
    titleCaseDesc: "Capitalize the first letter of each word",
    camelCase: "camelCase",
    camelCaseDesc: "Convert to camelCase format",
    pascalCase: "PascalCase",
    pascalCaseDesc: "Convert to PascalCase format",
    snakeCase: "snake_case",
    snakeCaseDesc: "Convert to snake_case format",
    kebabCase: "kebab-case",
    kebabCaseDesc: "Convert to kebab-case format",
    sentenceCase: "Sentence case",
    sentenceCaseDesc: "Capitalize only the first letter",
    
    // Text Tools - Cleaning
    removeExtraSpaces: "Remove Extra Spaces",
    removeExtraSpacesDesc: "Remove duplicate spaces and trim whitespace",
    removeEmptyLines: "Remove Empty Lines",
    removeEmptyLinesDesc: "Remove all blank lines from text",
    sortLinesAZ: "Sort Lines A-Z",
    sortLinesAZDesc: "Sort all lines alphabetically (ascending)",
    sortLinesZA: "Sort Lines Z-A",
    sortLinesZADesc: "Sort all lines alphabetically (descending)",
    removeDuplicates: "Remove Duplicates",
    removeDuplicatesDesc: "Remove duplicate lines from text",
    addLineNumbers: "Add Line Numbers",
    addLineNumbersDesc: "Add line numbers to each line",
    reverseText: "Reverse Text",
    reverseTextDesc: "Reverse the entire text character by character",
    stripHtml: "Strip HTML",
    stripHtmlDesc: "Remove all HTML tags from text",
    
    // Text Tools - Encoding
    encodeBase64: "Encode Base64",
    encodeBase64Desc: "Encode text to Base64 format",
    decodeBase64: "Decode Base64",
    decodeBase64Desc: "Decode Base64 encoded text",
    urlEncode: "URL Encode",
    urlEncodeDesc: "Encode text for URL use",
    urlDecode: "URL Decode",
    urlDecodeDesc: "Decode URL encoded text",
    escapeHtml: "Escape HTML",
    escapeHtmlDesc: "Escape HTML special characters",
    unescapeHtml: "Unescape HTML",
    unescapeHtmlDesc: "Unescape HTML entities",
    generateHash: "Generate Hash",
    generateHashDesc: "Generate SHA-256 hash of the text",
    
    // Text Tools - JSON
    formatJson: "Format JSON",
    formatJsonDesc: "Format and prettify JSON with proper indentation",
    minifyJson: "Minify JSON",
    minifyJsonDesc: "Compress JSON by removing whitespace",
    
    // Text Tools - UI Labels
    tools: "Tools",
    compare: "Compare",
    extract: "Extract",
    hash: "Hash",
    inputText: "Input Text",
    transformedText: "Transformed Text",
    outputWillAppear: "Output will appear here",
    enterTextToTransform: "Enter your text here to transform...",
    transformedTextWillAppear: "Transformed text will appear here...",
    searchTools: "Search tools (e.g., uppercase, json, base64)...",
    quickActions: "Quick Actions",
    favoriteTools: "Favorite Tools",
    keyboardShortcuts: "Keyboard Shortcuts",
    navigation: "Navigation",
    switchToToolsTab: "Switch to Tools tab",
    switchToCompareTab: "Switch to Compare tab",
    switchToExtractTab: "Switch to Extract tab",
    switchToHashTab: "Switch to Hash tab",
    focusSearchBox: "Focus search box",
    convertToUppercase: "Convert to UPPERCASE",
    convertToLowercase: "Convert to lowercase",
    convertToTitleCase: "Convert to Title Case",
    showShortcuts: "Show shortcuts",
    toolNavigation: "Tool Navigation",
    navigateToolsUp: "Navigate tools up",
    navigateToolsDown: "Navigate tools down",
    applyFocusedTool: "Apply focused tool",
    proTips: "Pro Tips",
    shortcutsWorkWhenNotTyping: "Keyboard shortcuts work when not typing in text areas",
    useArrowKeysToNavigate: "Use arrow keys to navigate through visible tools",
    starToolsToFavorite: "Star tools to add them to your favorites list",
    searchFiltersAllTools: "Search filters all available tools instantly",
    
    // Text Tools - Comparison
    text1: "Text 1",
    text2: "Text 2",
    enterFirstTextToCompare: "Enter first text to compare...",
    enterSecondTextToCompare: "Enter second text to compare...",
    
    // Text Tools - Extract
    enterTextToExtract: "Enter text to extract emails, URLs, and phone numbers...",
    emailAddresses: "Email Addresses",
    urls: "URLs",
    phoneNumbers: "Phone Numbers",
    noEmailsFound: "No email addresses found",
    noUrlsFound: "No URLs found",
    noPhonesFound: "No phone numbers found",
    
    // Text Tools - Hash
    enterTextToGenerateHash: "Enter text to generate hash...",
    generateSHA256Hash: "Generate SHA-256 Hash",
    sha256Hash: "SHA-256 Hash",
    
    // AI Model Translations
    selectAiModel: "Select AI Model",
    fastAndEfficient: "Fast and efficient for most tasks",
    latestExperimental: "Latest experimental model with enhanced capabilities",
    nextGeneration: "Next-generation model with improved performance and capabilities",
    active: "Active",
    
    // Feature Cards - Titles and Descriptions
    smartAiChat: "Smart AI Chat",
    smartAiChatDesc: "Get instant help from an AI assistant powered by Gemini 1.5 Flash. Perfect for quick questions and tasks.",
    qrGenerator: "QR Generator",
    qrGeneratorDesc: "Create QR codes instantly for links, text, or contact info. Share easily across devices.",
    voiceToText: "Voice to Text",
    voiceToTextDesc: "Convert speech to text quickly and accurately. Perfect for notes and transcription.",
    textReader: "Text Reader",
    textReaderDesc: "Turn any text into natural speech. Great for accessibility and multitasking.",
    pdfReader: "PDF Reader",
    pdfReaderDesc: "Extract and read text from PDF documents easily on your mobile device.",
    pdfMerger: "PDF Merger",
    pdfMergerDesc: "Combine multiple PDF files into one document. Simple and fast processing.",
    imageToPdfTitle: "Image to PDF",
    imageToPdfDesc: "Convert photos and images to PDF format with high quality output.",
    imageConverter: "Image Converter",
    imageConverterDesc: "Change image formats (JPG, PNG, WebP) with optimized compression.",
    passwordGen: "Password Gen",
    passwordGenDesc: "Generate secure, random passwords with customizable length and complexity.",
    textUtils: "Text Utils",
    textUtilsDesc: "Count words, remove duplicates, format text, and more text manipulation tools.",
};

const kmTranslations: Translations = {
    home: "ទំព័រដើម",
    voiceScribe: "ការសរសេរតាមសំឡេង",
    voiceTranscriptDescription: "បម្លែងឯកសារអូឌីយ៉ូទៅជាអត្ថបទដែលអាចកែសម្រួលបានជាមួយនឹងពេលវេលា។",
    startNow: "ចាប់ផ្តើមឥឡូវនេះ",
    selectModel: "ជ្រើសរើសម៉ូដែល",
    transcribing: "កំពុងដំណើរការ សូមរង់ចាំ",
    readyToTranscribe: "ត្រៀមខ្លួនរួចរាល់ដើម្បីសរសេរ",
    dropAudio: "ដាក់ឯកសារសំឡេងនៅទីនេះ ឬចុចដើម្បីផ្ទុកឡើង។",
    download: "ទាញយក",
    exportSettings: "ការកំណត់ការនាំចេញ",
    chooseFormat: "ជ្រើសរើសទម្រង់ និងការកំណត់របស់អ្នក បន្ទាប់មកចុចនាំចេញ។",
    exportFormat: "ទ្រង់ទ្រាយនាំចេញ",
    wordsPerSecond: "ពាក្យក្នុងមួយវិនាទី",
    wordsPerSecondHint: "សម្រាប់ SRT/VTT។ បដិសេធពេលវេលា AI ។",
    exportTranscript: "នាំចេញប្រតិចារិក",
    invalidFileType: "ប្រភេទឯកសារមិនត្រឹមត្រូវ",
    selectAudioFile: "សូមជ្រើសរើសឯកសារអូឌីយ៉ូ។",
    transcriptionFailed: "ការសរសេរបានបរាជ័យ",
    noTranscript: "ម៉ូដែលមិនបានបញ្ជូនប្រតិចារិកមកវិញទេ។ សូមព្យាយាមម្តងទៀត។",
    transcriptionError: "កំហុសក្នុងការសរសេរ",
    rateLimitExceeded: "លើសកម្រិតកំណត់",
    rateLimitMessage: "អ្នកបានធ្វើការស្នើសុំច្រើនពេក។ សូមរង់ចាំមួយភ្លែត ឬពិនិត្យមើលផែនការ API និងព័ត៌មានលម្អិតអំពីការចេញវិក្កយប័ត្ររបស់អ្នក។",
    support: "គាំទ្រ",
    supportDescription: "ប្រសិនបើអ្នកពេញចិត្តនឹងកម្មវិធីនេះ សូមពិចារណាគាំទ្រការអភិវឌ្ឍន៍របស់វា។",
    improveAccuracy: "កែលម្អ",
    customVocabulary: "វាក្យសព្ទផ្ទាល់ខ្លួន",
    customVocabularyHint: "បន្ថែមពាក្យ ឬឃ្លាដែលពិបាកសរសេរ ដើម្បីបង្កើនភាពត្រឹមត្រូវ។",
    addWord: "បន្ថែមពាក្យ",
    pressEnterToAdd: "ចុច Enter ដើម្បីបន្ថែម",
    retranscribe: "សរសេរឡើងវិញ",
    ratingTitle: "តើអ្នកពេញចិត្តនឹងការសរសេរទេ?",
    ratingDescription: "មតិកែលម្អរបស់អ្នកជួយយើងក្នុងការកែលម្អ។ សូមវាយតម្លៃបទពិសោធន៍របស់អ្នក។",
    ratingFeedbackPlaceholder: "ប្រាប់យើងបន្ថែមអំពីបទពិសោធន៍របស់អ្នក...",
    ratingSubmit: "បញ្ជូន",
    ratingLater: "វាយតម្លៃពេលក្រោយ",
    feedbackSuccess: "សូមអរគុណសម្រាប់មតិកែលម្អរបស់អ្នក!",
    feedbackError: "មិនអាចបញ្ជូនមតិកែលម្អបានទេ។ សូម​ព្យាយាម​ម្តង​ទៀត​នៅ​ពេល​ក្រោយ។",
    ratingThankYou: "សូម​អរគុណ!",
    pdfTranscript: "ស្រង់អត្ថបទ PDF",
    pdfTranscriptDescription: "ស្រង់ចេញ និងសម្អាតអត្ថបទពីឯកសារ PDF របស់អ្នក។",
    features: "លក្ខណៈពិសេស",
    copy: "ចម្លង",
    copied: "បានចម្លង!",
    chooseFile: "ជ្រើសរើសឯកសារ",
    pageTitle: "ស្រង់អត្ថបទ PDF",
    dropPdf: "ដាក់ឯកសារ PDF នៅទីនេះ ឬចុចដើម្បីផ្ទុកឡើង។",
    noText: "ម៉ូដែលមិនបានបញ្ជូនអត្ថបទមកវិញទេ។ សូមព្យាយាមម្តងទៀត។",
    noTextToExport: "គ្មានអត្ថបទសម្រាប់នាំចេញទេ។",
    selectPdfFile: "សូមជ្រើសរើសឯកសារ PDF។",
    transcribedTextPlaceholder: "អត្ថបទដែលបានស្រង់នឹងបង្ហាញនៅទីនេះ។ អ្នកអាចកែសម្រួលបានដោយផ្ទាល់។",
    uploadCardTitle: "ផ្ទុកឡើង PDF របស់អ្នក",
    transcriptionSuccess: "ការស្រង់អត្ថបទបានជោគជ័យ!",
    fileName: "ឈ្មោះ​ឯកសារ:",
    fileSize: "ទំហំ​ឯកសារ:",
    actions: "សកម្មភាព",
    actionsDescription: "ចម្លង ឬទាញយកអត្ថបទជាទម្រង់ផ្សេងៗ។",
    exportFailed: "ការនាំចេញបានបរាជ័យ",
    combinePdf: "បូកបញ្ចូល PDF",
    combinePdfDescription: "បូកបញ្ចូលឯកសារ PDF ច្រើនចូលគ្នាជាឯកសារតែមួយ។",
    combinePdfTitle: "ផ្ទុកឡើងឯកសារ PDF របស់អ្នកដើម្បីបូកបញ្ចូល",
    dropMultiplePdfs: "ដាក់ឯកសារ PDF នៅទីនេះ ឬចុចដើម្បីជ្រើសរើស។",
    filesToCombine: "ឯកសារត្រូវបូកបញ្ចូល",
    addMorePdfs: "បន្ថែមឯកសារ PDF ផ្សេងទៀត",
    combineAndDownload: "បូកបញ្ចូល ហើយទាញយក",
    combineError: "ការបូកបញ្ចូលបានបរាជ័យ",
    combineErrorDescription: "សូមផ្ទុកឡើងឯកសារ PDF យ៉ាងតិចពីរឯកសារ។",
    imageToPdf: "រូបភាពទៅជា PDF",
    imageToPdfDescription: "បម្លែងរូបភាពមួយឬច្រើនទៅជាឯកសារ PDF តែមួយ។",
    dropImages: "ទម្លាក់រូបភាពនៅទីនេះ ឬចុចដើម្បីជ្រើសរើស។",
    addMoreImages: "បន្ថែមរូបភាពផ្សេងទៀត",
    imagesToConvert: "រូបភាពត្រូវបម្លែង",
    convertAndDownload: "បម្លែង ហើយទាញយក",
    conversionError: "ការបម្លែងបានបរាជ័យ",
    conversionErrorDescription: "សូមផ្ទុកឡើងយ៉ាងហោចណាស់រូបភាពមួយ។",
    selectImageFile: "សូមជ្រើសរើសឯកសាររូបភាព (JPEG, PNG, ។ល។)។",
    fileTooLargeTitle: "ឯកសារធំពេក",
    fileTooLargeDescription: (size: number) => `ឯកសារមានទំហំធំជាងកម្រិតកំណត់របស់ម៉ាស៊ីនមេ ${size}MB។ សូមប្រើឯកសារតូចជាងនេះ។`,
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
    
    // Additional UI Elements
    aiAssistant: "ជំនួយការ AI",
    textToSpeech: "អត្ថបទទៅសំឡេង",
    generateQrCode: "បង្កើតកូដ QR",
    passwordGenerator: "បង្កើតលេខសម្ងាត់",
    textTools: "ឧបករណ៍អត្ថបទ",
    contact: "ទាក់ទងយើង",
    premium: "ពិសេស",
    version: "កំណែ",
    loading: "កំពុងផ្ទុក",
    processing: "កំពុងដំណើរការ",
    success: "ជោគជ័យ",
    error: "កំហុស",
    warning: "ការព្រមាន",
    info: "ព័ត៌មាន",
    cancel: "បោះបង់",
    confirm: "បញ្ជាក់",
    retry: "ព្យាយាមម្តងទៀត",
    close: "បិទ",
    save: "រក្សាទុក",
    reset: "កំណត់ឡើងវិញ",
    clear: "សម្អាត",
    upload: "ផ្ទុកឡើង",
    browse: "រកមើល",
    search: "ស្វែងរក",
    filter: "តម្រង",
    sort: "តម្រៀប",
    refresh: "ផ្ទុកឡើងវិញ",
    settings: "ការកំណត់",
    profile: "ប្រវត្តិរូប",
    logout: "ចាកចេញ",
    login: "ចូលគណនី",
    signup: "ចុះឈ្មោះ",
    
    // Form Elements
    email: "អ៊ីមែល",
    password: "ពាក្យសម្ងាត់",
    confirmPassword: "បញ្ជាក់ពាក្យសម្ងាត់",
    firstName: "នាមត្រកូល",
    lastName: "គោត្តនាម",
    fullName: "ឈ្មោះពេញ",
    phoneNumber: "លេខទូរស័ព្ទ",
    address: "អាសយដ្ឋាន",
    city: "ទីក្រុង",
    country: "ប្រទេស",
    zipCode: "លេខប្រៃសណីយ៍",
    
    // Messages and Notifications
    welcomeMessage: "សូមស្វាគមន៍!",
    successMessage: "ការដំណើរការបានបញ្ចប់ដោយជោគជ័យ",
    errorMessage: "មានកំហុសកើតឡើង",
    warningMessage: "ការព្រមាន",
    infoMessage: "ព័ត៌មាន",
    emailSent: "បានបញ្ជូនអ៊ីមែលដោយជោគជ័យ",
    passwordReset: "បានកំណត់ពាក្យសម្ងាត់ឡើងវិញដោយជោគជ័យ",
    accountCreated: "បានបង្កើតគណនីដោយជោគជ័យ",
    accountDeleted: "បានលុបគណនីដោយជោគជ័យ",
    dataUpdated: "បានធ្វើបច្ចុប្បន្នភាពទិន្នន័យដោយជោគជ័យ",
    dataSaved: "បានរក្សាទុកទិន្នន័យដោយជោគជ័យ",
    
    // Time and Date
    today: "ថ្ងៃនេះ",
    yesterday: "ម្សិលមិញ",
    thisWeek: "សប្តាហ៍នេះ",
    thisMonth: "ខែនេះ",
    thisYear: "ឆ្នាំនេះ",
    january: "មករា",
    february: "កុម្ភៈ",
    march: "មីនា",
    april: "មេសា",
    may: "ឧសភា",
    june: "មិថុនា",
    july: "កក្កដា",
    august: "សីហា",
    september: "កញ្ញា",
    october: "តុលា",
    november: "វិច្ឆិកា",
    december: "ធ្នូ",
    
    // File Operations
    uploadFile: "ផ្ទុកឡើងឯកសារ",
    downloadFile: "ទាញយកឯកសារ",
    deleteFile: "លុបឯកសារ",
    renameFile: "ប្តូរឈ្មោះឯកសារ",
    shareFile: "ចែករំលែកឯកសារ",
    previewFile: "មើលឯកសារជាមុន",
    
    // Quality and Size
    quality: "គុណភាព",
    size: "ទំហំ",
    format: "ទ្រង់ទ្រាយ",
    resolution: "គុណភាពរូបភាព",
    duration: "រយៈពេល",
    
    // Text Tools Categories
    caseConversion: "បម្លែងព្រុយអក្សរ",
    textCleaning: "សម្អាតអត្ថបទ",
    textCleaningFormatting: "សម្អាត និងធ្វើទ្រង់ទ្រាយអត្ថបទ",
    encodingDecoding: "អ៊ិនកូដ និងដេកូដ",
    jsonTools: "ឧបករណ៍ JSON",
    
    // Text Tools - Case Conversion
    uppercase: "ព្រុយអក្សរធំ",
    uppercaseDesc: "បម្លែងអត្ថបទទាំងអស់ទៅជាអក្សរធំ",
    lowercase: "ព្រុយអក្សរតូច",
    lowercaseDesc: "បម្លែងអត្ថបទទាំងអស់ទៅជាអក្សរតូច",
    titleCase: "ព្រុយចំណងជើង",
    titleCaseDesc: "ធ្វើឱ្យអក្សរដំបូងនៃពាក្យនីមួយៗធំ",
    camelCase: "ព្រុយអូន្ត",
    camelCaseDesc: "បម្លែងទៅជាទម្រង់ camelCase",
    pascalCase: "ព្រុយ Pascal",
    pascalCaseDesc: "បម្លែងទៅជាទម្រង់ PascalCase",
    snakeCase: "ព្រុយពស់",
    snakeCaseDesc: "បម្លែងទៅជាទម្រង់ snake_case",
    kebabCase: "ព្រុយកាបាប់",
    kebabCaseDesc: "បម្លែងទៅជាទម្រង់ kebab-case",
    sentenceCase: "ព្រុយប្រយោគ",
    sentenceCaseDesc: "ធ្វើឱ្យតែអក្សរដំបូងប៉ុណ្ណោះធំ",
    
    // Text Tools - Cleaning
    removeExtraSpaces: "លុបចន្លោះបន្ថែម",
    removeExtraSpacesDesc: "លុបចន្លោះស្ទួន និងកាត់ចន្លោះនៅដើម-ចុង",
    removeEmptyLines: "លុបបន្ទាត់ទទេ",
    removeEmptyLinesDesc: "លុបបន្ទាត់ទទេទាំងអស់ពីអត្ថបទ",
    sortLinesAZ: "តម្រៀបបន្ទាត់ ក-អ",
    sortLinesAZDesc: "តម្រៀបបន្ទាត់ទាំងអស់តាមអក្ខរក្រម (ឡើង)",
    sortLinesZA: "តម្រៀបបន្ទាត់ អ-ក",
    sortLinesZADesc: "តម្រៀបបន្ទាត់ទាំងអស់តាមអក្ខរក្រម (ចុះ)",
    removeDuplicates: "លុបស្ទួន",
    removeDuplicatesDesc: "លុបបន្ទាត់ស្ទួនពីអត្ថបទ",
    addLineNumbers: "បន្ថែមលេខបន្ទាត់",
    addLineNumbersDesc: "បន្ថែមលេខបន្ទាត់ទៅបន្ទាត់នីមួយៗ",
    reverseText: "បញ្ច្រាសអត្ថបទ",
    reverseTextDesc: "បញ្ច្រាសអត្ថបទទាំងមូលតាមតួអក្សរ",
    stripHtml: "លុប HTML",
    stripHtmlDesc: "លុបស្លាក HTML ទាំងអស់ពីអត្ថបទ",
    
    // Text Tools - Encoding
    encodeBase64: "អ៊ិនកូដ Base64",
    encodeBase64Desc: "អ៊ិនកូដអត្ថបទទៅជាទម្រង់ Base64",
    decodeBase64: "ដេកូដ Base64",
    decodeBase64Desc: "ដេកូដអត្ថបទដែលបានអ៊ិនកូដ Base64",
    urlEncode: "អ៊ិនកូដ URL",
    urlEncodeDesc: "អ៊ិនកូដអត្ថបទសម្រាប់ប្រើក្នុង URL",
    urlDecode: "ដេកូដ URL",
    urlDecodeDesc: "ដេកូដអត្ថបទដែលបានអ៊ិនកូដ URL",
    escapeHtml: "គេច HTML",
    escapeHtmlDesc: "គេចតួអក្សរពិសេស HTML",
    unescapeHtml: "មិនគេច HTML",
    unescapeHtmlDesc: "មិនគេច HTML entities",
    generateHash: "បង្កើតហាស",
    generateHashDesc: "បង្កើតហាស SHA-256 នៃអត្ថបទ",
    
    // Text Tools - JSON
    formatJson: "ធ្វើទ្រង់ទ្រាយ JSON",
    formatJsonDesc: "ធ្វើទ្រង់ទ្រាយ និងធ្វើឱ្យស្អាត JSON ជាមួយការចុះបន្ទាត់ត្រឹមត្រូវ",
    minifyJson: "បង្រួម JSON",
    minifyJsonDesc: "បង្រួម JSON ដោយការលុបចន្លោះ",
    
    // Text Tools - UI Labels
    tools: "ឧបករណ៍",
    compare: "ប្រៀបធៀប",
    extract: "ស្រង់ចេញ",
    hash: "ហាស",
    inputText: "អត្ថបទបញ្ចូល",
    transformedText: "អត្ថបទដែលបានបម្លែង",
    outputWillAppear: "លទ្ធផលនឹងបង្ហាញនៅទីនេះ",
    enterTextToTransform: "បញ្ចូលអត្ថបទរបស់អ្នកនៅទីនេះដើម្បីបម្លែង...",
    transformedTextWillAppear: "អត្ថបទដែលបានបម្លែងនឹងបង្ហាញនៅទីនេះ...",
    searchTools: "ស្វែងរកឧបករណ៍ (ឧ. អក្សរធំ, json, base64)...",
    quickActions: "សកម្មភាពរហ័ស",
    favoriteTools: "ឧបករណ៍ពេញចិត្ត",
    keyboardShortcuts: "ផ្លូវកាត់ក្ដារចុច",
    navigation: "រុករក",
    switchToToolsTab: "ប្តូរទៅផ្ទាំងឧបករណ៍",
    switchToCompareTab: "ប្តូរទៅផ្ទាំងប្រៀបធៀប",
    switchToExtractTab: "ប្តូរទៅផ្ទាំងស្រង់ចេញ",
    switchToHashTab: "ប្តូរទៅផ្ទាំងហាស",
    focusSearchBox: "ផ្តោតលើប្រអប់ស្វែងរក",
    convertToUppercase: "បម្លែងទៅជាអក្សរធំ",
    convertToLowercase: "បម្លែងទៅជាអក្សរតូច",
    convertToTitleCase: "បម្លែងទៅជាព្រុយចំណងជើង",
    showShortcuts: "បង្ហាញផ្លូវកាត់",
    toolNavigation: "រុករកឧបករណ៍",
    navigateToolsUp: "រុករកឧបករណ៍ឡើងលើ",
    navigateToolsDown: "រុករកឧបករណ៍ចុះក្រោម",
    applyFocusedTool: "ប្រើឧបករណ៍ដែលកំពុងផ្តោត",
    proTips: "គន្លឹះអ្នកជំនាញ",
    shortcutsWorkWhenNotTyping: "ផ្លូវកាត់ក្ដារចុចដំណើរការនៅពេលមិនវាយក្នុងផ្ទៃអត្ថបទ",
    useArrowKeysToNavigate: "ប្រើគ្រាប់ចុចព្រួញដើម្បីរុករកតាមឧបករណ៍ដែលមើលឃើញ",
    starToolsToFavorite: "ដាក់ផ្កាយឧបករណ៍ដើម្បីបន្ថែមទៅក្នុងបញ្ជីពេញចិត្ត",
    searchFiltersAllTools: "ការស្វែងរកតម្រងឧបករណ៍ទាំងអស់ភ្លាមៗ",
    
    // Text Tools - Comparison
    text1: "អត្ថបទ ១",
    text2: "អត្ថបទ ២",
    enterFirstTextToCompare: "បញ្ចូលអត្ថបទទីមួយដើម្បីប្រៀបធៀប...",
    enterSecondTextToCompare: "បញ្ចូលអត្ថបទទីពីរដើម្បីប្រៀបធៀប...",
    
    // Text Tools - Extract
    enterTextToExtract: "បញ្ចូលអត្ថបទដើម្បីស្រង់ចេញអ៊ីមែល URL និងលេខទូរស័ព្ទ...",
    emailAddresses: "អាស័យដ្ឋានអ៊ីមែល",
    urls: "URLs",
    phoneNumbers: "លេខទូរស័ព្ទ",
    noEmailsFound: "រកមិនឃើញអាស័យដ្ឋានអ៊ីមែល",
    noUrlsFound: "រកមិនឃើញ URLs",
    noPhonesFound: "រកមិនឃើញលេខទូរស័ព្ទ",
    
    // Text Tools - Hash
    enterTextToGenerateHash: "បញ្ចូលអត្ថបទដើម្បីបង្កើតហាស...",
    generateSHA256Hash: "បង្កើតហាស SHA-256",
    sha256Hash: "ហាស SHA-256",
    
    // AI Model Translations
    selectAiModel: "ជ្រើសរើសម៉ូដែល AI",
    fastAndEfficient: "លឿន និងមានប្រសិទ្ធភាពសម្រាប់ការងារភាគច្រើន",
    latestExperimental: "ម៉ូដែលសាកល្បងចុងក្រោយបំផុតជាមួយលក្ខណៈពិសេសកែលម្អ",
    nextGeneration: "ម៉ូដែលជំនាន់បន្ទាប់ជាមួយការកែលម្អប្រសិទ្ធភាព និងសមត្ថភាព",
    active: "សកម្ម",
    
    // Feature Cards - Titles and Descriptions
    smartAiChat: "ជ្រោមជាង AI ឆ្លាត",
    smartAiChatDesc: "ទទួលបានជំនួយភ្លាមៗពីជំនួយការ AI ដោយ Gemini 1.5 Flash។ ល្អសម្រាប់សំណួរ និងការងាររហ័ស។",
    qrGenerator: "បម្រុងបង្កើត QR",
    qrGeneratorDesc: "បង្កើតកូដ QR ភ្លាមៗសម្រាប់តំណ អត្ថបទ ឬព័ត៌មានទំនាក់ទំនង។ ចែករំលែកបានយ៉ាងងាយស្រួលតាមឧបករណ៍។",
    voiceToText: "សំឡេងទៅអត្ថបទ",
    voiceToTextDesc: "បម្លែងការនិយាយទៅជាអត្ថបទបានលឿន និងត្រឹមត្រូវ។ ល្អសម្រាប់កត់ត្រា និងការសរសេរ។",
    textReader: "អានអត្ថបទ",
    textReaderDesc: "បម្លែងអត្ថបទទៅជាការនិយាយធម្មជាតិ។ ល្អសម្រាប់ការចូលប្រើ និងការធ្វើកិច្ចការច្រើន។",
    pdfReader: "អានឯកសារ PDF",
    pdfReaderDesc: "ស្រង់ចេញ និងអានអត្ថបទពីឯកសារ PDF បានយ៉ាងងាយស្រួលលើឧបករណ៍ទូរស័ព្ទរបស់អ្នក។",
    pdfMerger: "បូកបញ្ចូល PDF",
    pdfMergerDesc: "បូកបញ្ចូលឯកសារ PDF ច្រើនចូលគ្នាជាឯកសារតែមួយ។ ការដំណើរការសាមញ្ញ និងលឿន។",
    imageToPdfTitle: "រូបភាពទៅជា PDF",
    imageToPdfDesc: "បម្លែងរូបថត និងរូបភាពទៅទ្រង់ទ្រាយ PDF ជាមួយគុណភាពខ្ពស់។",
    imageConverter: "បម្លែងរូបភាព",
    imageConverterDesc: "ផ្លាស់ប្តូរទ្រង់ទ្រាយរូបភាព (JPG, PNG, WebP) ជាមួយការបង្រួមបង្កើន។",
    passwordGen: "បង្កើតពាក្យសម្ងាត់",
    passwordGenDesc: "បង្កើតពាក្យសម្ងាត់សុវត្ថិភាព ចៃដន្យ ជាមួយប្រវែង និងភាពស្មុគស្មាញដែលអាចកំណត់បាន។",
    textUtils: "ឧបករណ៍អត្ថបទ",
    textUtilsDesc: "រាប់ពាក្យ លុបស្ទួន ធ្វើទ្រង់ទ្រាយអត្ថបទ និងឧបករណ៍រៀបចំអត្ថបទបន្ថែមទៀត។",
};

export const allTranslations = {
  km: kmTranslations,
  en: enTranslations
};
