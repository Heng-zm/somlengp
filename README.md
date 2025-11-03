# SomlengP - Modern Web Application Suite

A comprehensive Next.js application with AI assistance, document processing, QR code scanning, and more.

## 🚀 Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd somlengp
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Visit**: http://localhost:3000

## 📁 Project Structure

```
├── src/               # Source code
├── docs/              # Documentation
├── scripts/           # Utility scripts  
├── config/            # Configuration files
├── database/          # Database schemas & migrations
└── public/            # Static assets
```

📖 **[View Complete Project Structure →](./docs/PROJECT_STRUCTURE.md)**

## ✨ Key Features

- 🤖 **AI Assistant** - Advanced chat with Gemini integration & encrypted history
- 🔗 **Shareable Routes** - Generate secure shareable links with random IDs
- 📱 **QR Code Scanner** - Real-time scanning and generation
- 📄 **PDF Tools** - Create, convert, and manipulate PDFs
- 🖼️ **Image Processing** - Optimization and format conversion
- 🔐 **Authentication** - Google OAuth integration
- 🗄️ **Database** - Supabase integration
- ⚡ **Service Worker** - Advanced caching and offline support
- 🎯 **Performance** - Optimized bundle sizes and lazy loading

## 📚 Documentation

### Getting Started
- 📖 [Setup Guide](./docs/SETUP.md)
- 🏗️ [Project Structure](./docs/PROJECT_STRUCTURE.md)
- 🔧 [Development Guide](./docs/development-guide.md)

### Features
- 🤖 [AI Assistant Guide](./docs/AI_ASSISTANT_README.md)
- 🔗 [Shareable Routes](./docs/shareable-routes.md)
- 📊 [Performance Optimization](./docs/performance.md)

### Examples
- 💡 [Shareable Route Examples](./src/lib/examples/shareable-route-example.ts)

## 🔧 Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **AI**: Google Gemini API
- **Auth**: Google OAuth
- **Database**: PostgreSQL (Supabase)
- **Deployment**: Vercel, Netlify

## 🔗 Shareable Routes Quick Start

Generate secure shareable links with cryptographically random IDs:

```typescript
import { generateShareableRoute, parseShareableRoute } from '@/lib/id-utils';

// Generate a shareable route
const { route, id } = generateShareableRoute('/ai-assistant');
// Result: { 
//   route: "/ai-assistant/=AE3TifNagMlXtBHunG4l61gIqPLa",
//   id: "AE3TifNagMlXtBHunG4l61gIqPLa"
// }

// Parse a shareable route
const parsed = parseShareableRoute('/ai-assistant/=AE3TifNagMlXtBHunG4l61gIqPLa');
// Result: {
//   basePath: "/ai-assistant",
//   id: "AE3TifNagMlXtBHunG4l61gIqPLa",
//   isValid: true
// }
```

**Features:**
- ✅ Cryptographically secure IDs (28 chars, ~10^50 combinations)
- ✅ URL-safe alphanumeric characters only
- ✅ Customizable length, prefix, and timestamp options
- ✅ Batch generation for multiple routes
- ✅ Full TypeScript support

📖 **[Full Documentation](./docs/shareable-routes.md)** | 💡 **[Examples](./src/lib/examples/shareable-route-example.ts)**

## 📦 Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run typecheck` - Run TypeScript type checking
- `npm run test` - Run tests
- `npm run test:coverage` - Run tests with coverage

### Optimization
- `npm run check-all` - Run typecheck, lint, and tests
- `npm run perf:check` - Run performance checks
- `npm run analyze` - Analyze bundle size

## 🚀 Deployment

The application supports deployment on:
- **Vercel** (Recommended for Next.js)
- **Netlify** (With edge functions)
- **Docker** (Using provided Dockerfile)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- 📖 Check the [documentation](./docs/)
- 🐛 [Report issues](https://github.com/your-username/somlengp/issues)
- 💬 [Discussions](https://github.com/your-username/somlengp/discussions)