'use client';

import { useLanguage } from '@/hooks/use-language';
import { LanguageToggle } from '@/components/shared/language-toggle';

export function LanguageTest() {
  const { t, language, isKhmer, isEnglish } = useLanguage();
  
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Language System Test</h1>
      
      <div className="flex items-center gap-4">
        <span>Current Language: <strong>{language}</strong></span>
        <span className="text-sm text-gray-600">
          ({isKhmer ? 'Khmer' : isEnglish ? 'English' : 'Unknown'})
        </span>
        <LanguageToggle />
      </div>
      
      <div className="space-y-4 p-4 border rounded-lg">
        <h2 className="text-lg font-semibold">Sample Translations:</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <strong>Home:</strong> <span>{t('home')}</span>
          </div>
          <div>
            <strong>Settings:</strong> <span>{t('settings')}</span>
          </div>
          <div>
            <strong>Voice Transcript:</strong> <span>{t('voiceScribe')}</span>
          </div>
          <div>
            <strong>AI Assistant:</strong> <span>{t('aiAssistant')}</span>
          </div>
          <div>
            <strong>Start Now:</strong> <span>{t('startNow')}</span>
          </div>
          <div>
            <strong>Loading:</strong> <span>{t('loading')}</span>
          </div>
          <div>
            <strong>Success:</strong> <span>{t('success')}</span>
          </div>
          <div>
            <strong>Error:</strong> <span>{t('error')}</span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded">
          <strong>Dynamic Translation (File Size):</strong>
          <div>{t('fileTooLargeDescription', { size: 25 })}</div>
        </div>
      </div>
      
      <div className="text-sm text-gray-600">
        <p><strong>Instructions:</strong></p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Click the language toggle button above</li>
          <li>Verify that all text updates to the new language</li>
          <li>Refresh the page and verify language preference is persisted</li>
          <li>Check browser localStorage for 'preferred-language' key</li>
          <li>Verify that the body gets the correct 'lang-{language}' class</li>
        </ol>
      </div>
    </div>
  );
}
