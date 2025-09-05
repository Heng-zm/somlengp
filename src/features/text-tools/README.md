# Text Tools Feature

A comprehensive collection of text processing and manipulation tools built for the Somleng application.

## Overview

The Text Tools feature provides users with a powerful set of utilities for processing, transforming, and analyzing text content. It's designed to be intuitive, fast, and mobile-friendly.

## Features

### 1. Text Transformation Tools

#### Case Conversion
- **UPPERCASE**: Convert all text to uppercase letters
- **lowercase**: Convert all text to lowercase letters  
- **Title Case**: Capitalize the first letter of each word
- **camelCase**: Convert to camelCase format for programming
- **PascalCase**: Convert to PascalCase format for programming
- **snake_case**: Convert to snake_case format for programming
- **kebab-case**: Convert to kebab-case format for URLs
- **Sentence case**: Capitalize only the first letter

#### Text Cleaning & Formatting
- **Remove Extra Spaces**: Remove duplicate spaces and trim whitespace
- **Remove Empty Lines**: Remove all blank lines from text
- **Sort Lines A-Z**: Sort all lines alphabetically (ascending)
- **Sort Lines Z-A**: Sort all lines alphabetically (descending)
- **Remove Duplicates**: Remove duplicate lines from text
- **Add Line Numbers**: Add line numbers to each line
- **Reverse Text**: Reverse the entire text character by character
- **Strip HTML**: Remove all HTML tags from text

#### Encoding & Decoding
- **Encode Base64**: Encode text to Base64 format
- **Decode Base64**: Decode Base64 encoded text
- **URL Encode**: Encode text for URL use
- **URL Decode**: Decode URL encoded text
- **Escape HTML**: Escape HTML special characters
- **Unescape HTML**: Unescape HTML entities
- **Generate Hash**: Generate SHA-256 hash of the text

#### JSON Tools
- **Format JSON**: Format and prettify JSON with proper indentation
- **Minify JSON**: Compress JSON by removing whitespace

### 2. Text Comparison
- Side-by-side text comparison
- Visual diff highlighting showing additions, deletions, and unchanged text
- Word-level comparison algorithm

### 3. Text Extraction
- **Email Addresses**: Automatically detect and extract email addresses
- **URLs**: Find and extract web URLs from text
- **Phone Numbers**: Detect and extract phone numbers

### 4. Text Analysis
- **Real-time Statistics**: 
  - Character count (with and without spaces)
  - Word count
  - Sentence count  
  - Paragraph count
  - Line count
  - Estimated reading time

### 5. Hash Generation
- **SHA-256 Hash**: Generate cryptographic hashes of text content

## File Structure

```
src/features/text-tools/
├── components/
│   ├── text-tools-page.tsx          # Main page component
│   └── text-utility-components.tsx  # Reusable UI components
├── utils/
│   └── text-processors.ts           # Text processing utilities
└── README.md                        # This documentation
```

## Key Components

### TextToolsPage
The main page component that orchestrates all text tools functionality with a tabbed interface.

### TextInputArea / TextOutputArea
Reusable components for text input and output with built-in:
- File upload/download capabilities
- Statistics display
- Copy/clear functionality
- Mobile-optimized design

### UtilityActionCard
Interactive cards for each text transformation tool with:
- Icon and description
- Disabled state when no input text
- Badge indicators for tool types

### ComparisonView
Side-by-side text comparison with diff visualization.

## Text Processing Utilities

The `text-processors.ts` file contains all the core text manipulation functions:

- **Statistics Calculation**: Word counting, reading time estimation
- **Case Conversions**: All major case formats for programming and writing
- **Text Transformations**: Cleaning, formatting, and manipulation
- **Encoding/Decoding**: Base64, URL encoding, HTML escaping
- **Pattern Extraction**: Email, URL, and phone number detection
- **JSON Processing**: Formatting and minification
- **Hash Generation**: SHA-256 cryptographic hashing
- **Text Comparison**: Simple diff algorithm implementation

## Usage

Navigate to `/text-tools` in the application to access all tools. The interface is organized into four main tabs:

1. **Tools**: Main text transformation utilities
2. **Compare**: Text comparison and diff tools
3. **Extract**: Data extraction from text (emails, URLs, phones)  
4. **Hash**: Text hashing utilities

## Technical Features

- **Mobile-First Design**: Optimized for mobile and desktop use
- **Real-time Processing**: Instant text transformations and statistics
- **File Support**: Upload text files and download results
- **Error Handling**: Graceful error handling with user feedback
- **Performance Optimized**: Efficient algorithms and React optimization
- **Accessibility**: Screen reader friendly with proper ARIA labels
- **TypeScript**: Fully typed for better development experience

## Integration

The text tools feature is fully integrated with the Somleng application:
- Uses the existing UI component library
- Follows the established routing patterns
- Integrated with the home page navigation
- Consistent with the app's design system
- Mobile-responsive layout matching other features

## Future Enhancements

Potential additions could include:
- Regular expression find/replace
- Advanced text analysis (sentiment, readability scores)
- Custom text templates
- Markdown to HTML conversion
- CSV/TSV processing tools
- Text encryption/decryption
- Multi-language text detection
- Batch file processing
