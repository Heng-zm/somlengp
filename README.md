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

- 🤖 **AI Assistant** - Advanced chat with Gemini integration
- 📱 **QR Code Scanner** - Real-time scanning and generation
- 📄 **PDF Tools** - Create, convert, and manipulate PDFs
- 🖼️ **Image Processing** - Optimization and format conversion
- 🔐 **Authentication** - Google OAuth integration
- 🗄️ **Database** - Supabase integration

## 📚 Documentation

- 📖 [Setup Guide](./docs/SETUP.md)
- 🏗️ [Project Structure](./docs/PROJECT_STRUCTURE.md)
- 🤖 [AI Assistant Guide](./docs/AI_ASSISTANT_README.md)
- 🔧 [Development Guide](./docs/development-guide.md)

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **AI**: Google Gemini API
- **Auth**: Google OAuth
- **Database**: PostgreSQL (Supabase)
- **Deployment**: Vercel, Netlify

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

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