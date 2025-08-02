const fs = require('fs');
const path = require('path');

// Files and their specific fixes
const fixes = [
  {
    file: 'src/features/convert-image-format/components/convert-image-format-page.tsx',
    changes: [
      {
        find: "import {allTranslations} from '@/lib/translations';",
        replace: "import {allTranslations, resolveTranslation} from '@/lib/translations';"
      }
    ]
  },
  {
    file: 'src/features/image-to-pdf/components/image-to-pdf-page.tsx',
    changes: [
      {
        find: "import { allTranslations } from '@/lib/translations';",
        replace: "import { allTranslations, resolveTranslation } from '@/lib/translations';"
      }
    ]
  },
  {
    file: 'src/features/transcript-pdf/components/pdf-transcript-page.tsx',
    changes: [
      {
        find: "import { allTranslations } from '@/lib/translations';",
        replace: "import { allTranslations, resolveTranslation } from '@/lib/translations';"
      }
    ]
  }
];

// Apply fixes
fixes.forEach(({file, changes}) => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    changes.forEach(({find, replace}) => {
      content = content.replace(find, replace);
    });
    
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});

console.log('Translation fixes applied');
