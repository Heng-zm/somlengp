# Gemini AI Upscale Integration

This document describes the integration of Google's Gemini AI Vision API for intelligent image upscaling in the Image Resize application.

## Overview

The Gemini AI Upscale feature uses Google's advanced AI vision models to intelligently enhance and upscale images while preserving quality and natural details. This provides superior results compared to traditional upscaling algorithms, especially for complex images with varied content.

## Features

### AI Models
- **Gemini Pro Vision**: Standard model for general image upscaling
- **Gemini 1.5 Pro Vision**: Advanced model with enhanced capabilities

### Scale Factors
- 2x, 4x, and 8x upscaling supported
- Intelligent content-aware scaling

### Advanced Options
- **AI Creativity Control**: Temperature setting (0.0-1.0) to control creative enhancement
- **Advanced Vision Analysis**: Enable detailed AI analysis of image content
- **Custom Enhancement Prompts**: Guide AI with specific instructions
- **Face Enhancement**: Specialized enhancement for human faces
- **Transparency Preservation**: Maintain PNG transparency during upscaling

### Preset Configurations
- **Gemini Intelligent Enhancement**: Balanced AI enhancement with content-aware optimization
- **Gemini Creative Upscale**: Artistic enhancement with higher creativity settings

## Setup and Configuration

### API Key Configuration

The Gemini integration requires a valid Google AI API key. The key can be configured in several ways:

1. **Environment Variable** (Recommended for production):
   ```bash
   NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
   # or
   GEMINI_API_KEY=your_api_key_here
   ```

2. **Local Storage** (Development/User preference):
   The application will store the API key in browser localStorage for persistence.

3. **Runtime Configuration**:
   Users can enter their API key directly in the application interface.

### API Key Format
- Gemini API keys typically start with "AIza"
- Keys should be at least 20 characters long
- No spaces or special characters allowed

## Technical Implementation

### Core Components

1. **Gemini Client** (`src/lib/gemini-client.ts`)
   - Handles direct API communication with Google's Gemini Vision API
   - Manages request/response formatting
   - Implements retry logic and error handling

2. **Gemini Configuration** (`src/lib/gemini-config.ts`)
   - Manages API key storage and validation
   - Provides environment-aware configuration loading
   - Includes API key testing functionality

3. **AI Upscale Types** (`src/lib/ai-upscale-types.ts`)
   - Extended with Gemini-specific options and configurations
   - New model type: 'gemini'
   - Gemini-specific presets and parameters

4. **AI Upscale Service** (`src/lib/ai-upscale-service.ts`)
   - Enhanced with Gemini integration
   - Separate upscaling pipeline for Gemini models
   - Comprehensive error handling for API calls

### User Interface

The Gemini model appears as "🤖 Gemini AI Vision (Intelligent)" in the AI Model dropdown. When selected, additional configuration options appear:

- **Gemini Model Variant**: Choose between Pro and 1.5 Pro versions
- **AI Creativity Slider**: Control enhancement creativity
- **Advanced Vision Toggle**: Enable detailed analysis
- **Enhancement Prompt**: Custom instructions for AI

## Usage

1. **Select Gemini Model**: Choose "🤖 Gemini AI Vision (Intelligent)" from the AI Model dropdown
2. **Configure API Key**: If not already configured, enter your Gemini API key
3. **Adjust Settings**: Customize Gemini-specific options as needed
4. **Select Scale Factor**: Choose 2x, 4x, or 8x upscaling
5. **Process Image**: Click "AI Upscale & Resize" to begin processing

## Processing Flow

1. **Image Validation**: Verify image format and size limits
2. **API Key Check**: Ensure Gemini API is configured and accessible
3. **Content Analysis**: Gemini AI analyzes image content and structure
4. **Enhancement Instructions**: AI generates upscaling guidance
5. **Intelligent Upscaling**: Apply AI-guided enhancements
6. **Quality Optimization**: Final processing and optimization

## Error Handling

The integration includes comprehensive error handling for:

- Missing or invalid API keys
- Network connectivity issues
- API rate limits and quota exceeded
- Image format or size restrictions
- Processing timeouts

## Performance Considerations

- **Processing Time**: Gemini upscaling typically takes 15-30 seconds depending on image complexity
- **Image Size Limits**: Maximum 20MB input images (Gemini API limit)
- **Rate Limiting**: Respects Google's API rate limits with automatic retry logic
- **Memory Management**: Efficient handling of large upscaled images

## Best Practices

1. **API Key Security**: Store API keys securely, never commit to version control
2. **Error Feedback**: Provide clear error messages to users
3. **Progress Indication**: Show processing progress with descriptive steps
4. **Graceful Degradation**: Fall back to traditional upscaling if Gemini fails
5. **Resource Management**: Clean up temporary resources and cancel operations when needed

## Troubleshooting

### Common Issues

1. **"Gemini API is not configured"**
   - Solution: Provide a valid Gemini API key

2. **"Invalid API key format"**
   - Solution: Ensure key starts with "AIza" and contains no spaces

3. **"Network error"**
   - Solution: Check internet connectivity and API endpoint availability

4. **"Image too large"**
   - Solution: Reduce image size to under 20MB

5. **"Processing timeout"**
   - Solution: Try with a smaller image or check API status

### Testing API Connection

Use the built-in connection test feature:
```javascript
const result = await aiUpscaleService.testGeminiConnection();
console.log(result.success ? 'Connected!' : result.message);
```

## Future Enhancements

- Support for additional Gemini model variants
- Batch processing optimization
- Enhanced prompt templates
- Custom training data integration
- Real-time preview capabilities

## API Documentation

For detailed API documentation, refer to:
- [Google AI Gemini API Documentation](https://ai.google.dev/docs)
- [Gemini Vision API Reference](https://ai.google.dev/api/generate-content)

## Support

For issues related to:
- **Gemini API**: Contact Google AI support
- **Integration Issues**: Check application logs and error messages
- **Feature Requests**: Submit through the application feedback system