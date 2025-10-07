# Somleng - AI-Powered Speech Transcription Platform

**A modern, intelligent speech-to-text transcription platform with AI assistant capabilities.**

## 🚀 Features

### Core Transcription Features
- **🎤 Real-time Speech-to-Text**: Advanced voice-to-text transcription using AI-powered speech recognition
- **✏️ Interactive Text Editor**: Intuitive editing interface for refining transcriptions with error correction
- **📄 SRT Export**: Convert transcriptions to SubRip Subtitle (SRT) format for video projects
- **🎵 Audio Synchronization**: Real-time highlighting of spoken words during playback

### AI Assistant (Premium)
- **🤖 Powered by Gemini 1.5 Flash**: Advanced conversational AI using Google's latest technology
- **💬 Real-time Chat**: Instant responses with typing indicators
- **🔐 Secure Authentication**: Google OAuth integration with Supabase
- **📋 Message Management**: Copy responses and clear chat history

### User Experience
- **📱 Responsive Design**: Optimized for desktop and mobile devices
- **🎨 Modern UI**: Clean, professional interface with Tailwind CSS
- **🌙 Theme Support**: Light and dark mode compatibility
- **⚡ Performance Optimized**: Fast loading and efficient resource management

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.4, React 18, TypeScript 5
- **Styling**: Tailwind CSS, Radix UI components, Framer Motion
- **Authentication**: NextAuth.js with Google OAuth, Supabase Auth
- **Backend**: Supabase, Google AI (Gemini 1.5), Node.js 20+
- **AI Integration**: Genkit AI framework, Google Generative AI
- **Form Management**: React Hook Form with Zod validation
- **Charts & Analytics**: Recharts, Vercel Analytics
- **Testing**: Jest, React Testing Library
- **Performance**: Lighthouse CI, Bundle Analyzer
- **Document Processing**: PDF-lib, DOCX, JSZip

## 📋 Prerequisites

- Node.js 20+ and npm
- Google Cloud Platform account (for AI features)
- Supabase project (for authentication and database)

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd somlengp
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Copy the example environment file and configure your variables:
```bash
cp .env.example .env.local
```

Configure the following environment variables:
```bash
# Google AI API Key (for AI Assistant)
GOOGLE_API_KEY=your_google_ai_api_key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Additional API keys as needed
```

### 4. Supabase Setup
1. Create a new Supabase project at [Supabase Console](https://supabase.com/dashboard)
2. Enable Google Authentication in the Authentication section
3. Set up your database tables (see SUPABASE_SETUP_GUIDE.md)
4. Add your domain to authorized domains in Authentication settings

### 5. Google AI Setup
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Add the key to your environment variables

### 6. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📝 Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run genkit:dev       # Start Genkit AI development server
npm run genkit:watch     # Start Genkit with watch mode

# Building
npm run build            # Create production build
npm run start            # Start production server
npm run analyze          # Analyze bundle size

# Testing
npm run test             # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm run test:ci          # Run tests for CI

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run typecheck        # Run TypeScript type checking
npm run check-all        # Run typecheck, lint, and tests

# Performance & Monitoring
npm run perf:check       # Run performance checks
npm run perf:build       # Build and check performance
npm run lighthouse       # Run Lighthouse CI
npm run optimize         # Run performance check and fix linting
```

## 🏗️ Project Structure

```
somlengp/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── ai-assistant/    # AI Assistant feature
│   │   └── api/             # API routes
│   ├── components/          # Reusable UI components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions and configs
│   └── config.ts            # Application configuration
├── public/                  # Static assets
├── docs/                    # Project documentation
├── scripts/                 # Build and utility scripts
├── .env.example             # Environment variables template
└── SUPABASE_SETUP_GUIDE.md  # Supabase setup and migration guide
```

## 🎨 Design System

### Color Palette
- **Primary**: Soft Blue (#64B5F6) - Professional and calming
- **Background**: Light Gray (#F0F4F7) - Clean and distraction-free
- **Accent**: Teal (#26A69A) - For important actions and highlights

### Typography
- **Font Family**: Inter (sans-serif)
- **Icons**: Lucide React (clean, outlined style)

### Layout Principles
- Clean, minimal interface with focus on the text editor
- Left sidebar for settings and navigation
- Right sidebar for actions (export, sync)
- Subtle animations for loading states and progress

## 🔧 Configuration

### AI Model Settings
The AI Assistant uses configurable settings in `src/lib/ai-types.ts`:
- Model: Gemini 1.5 Flash
- Temperature: 0.7 (creativity level)
- Max Tokens: 2048
- Top K: 40, Top P: 0.95

### Performance Optimizations
- Bundle splitting for optimal loading
- Image optimization with WebP/AVIF formats
- Component lazy loading
- Memory management and cleanup

## 🔐 Security Features

- **Authentication Required**: Supabase JWT validation for premium features
- **User Context**: All requests tied to authenticated users
- **Content Safety**: Google's built-in AI safety filters
- **Secure Headers**: Next.js security best practices
- **Environment Variables**: Sensitive data protection

## 📚 Documentation

Comprehensive documentation is available in the project root:
- `AI_ASSISTANT_README.md` - AI Assistant setup and usage
- `AUTH_FIXES_README.md` - Authentication troubleshooting
- `GOOGLE_AUTH_README.md` - Google Authentication setup
- `SUPABASE_SETUP_GUIDE.md` - Supabase setup and migration guide
- `PERFORMANCE_OPTIMIZATIONS.md` - Performance guidelines
- `USER_PROFILE_FEATURES.md` - User profile functionality
- `OTP_SETUP_README.md` - OTP authentication setup
- `CAMERA_PERMISSIONS_README.md` - Camera access setup
- `STATUS_NOTIFICATIONS_README.md` - Notification system guide
- `PRODUCTION_AUTH_SETUP.md` - Production authentication setup

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on git push

### Manual Deployment
```bash
npm run build
npm run start
```

## 🐛 Troubleshooting

### Common Issues

**Authentication Problems**
- Verify Supabase configuration
- Check Google OAuth settings in Supabase dashboard
- Ensure authorized domains are configured in Authentication settings

**AI Assistant Not Working**
- Verify `GOOGLE_API_KEY` environment variable
- Check API key permissions and billing
- Ensure user is authenticated

**Performance Issues**
- Run `npm run perf:check` to identify bottlenecks
- Check bundle analysis with `npm run analyze`
- Review browser console for errors

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Use ESLint and Prettier for code formatting
- Write tests for new features
- Update documentation for significant changes

## 📄 License

This project is private and proprietary. All rights reserved.

## 🆘 Support

For support and questions:
- Check the documentation in `/docs`
- Review troubleshooting section above
- Create an issue in the repository

---

**Version**: 1.1.0  
**Last Updated**: September 2025  
**Node.js**: 20+ Required
