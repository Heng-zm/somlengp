# Email Verification Setup Guide

Your email verification system is already fully implemented! This guide will help you configure Gmail OAuth to enable sending verification emails.

## 🎯 Current Implementation Status

✅ **Email verification service** - Fully implemented
✅ **Gmail integration** - Ready to use
✅ **Beautiful email templates** - Professional HTML emails
✅ **Signup flow integration** - Complete workflow
✅ **UI components** - Ready-to-use verification forms
✅ **API endpoints** - All routes implemented

## 🔧 Setup Gmail OAuth (Required)

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Gmail API:
   - Go to **APIs & Services > Library**
   - Search for "Gmail API"
   - Click **Enable**

### Step 2: Create OAuth 2.0 Credentials

1. Go to **APIs & Services > Credentials**
2. Click **+ CREATE CREDENTIALS > OAuth 2.0 Client IDs**
3. Configure the consent screen:
   - User Type: External (for testing)
   - Add your email to test users
4. Application type: **Web application**
5. Add authorized redirect URIs:
   ```
   https://developers.google.com/oauthplayground
   ```
6. Save and copy:
   - **Client ID**
   - **Client Secret**

### Step 3: Get Refresh Token

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
2. Click the gear icon (⚙️) in the top right
3. Check "Use your own OAuth credentials"
4. Enter your Client ID and Client Secret
5. In Step 1, enter scope: `https://mail.google.com/`
6. Click "Authorize APIs"
7. Sign in with your Gmail account
8. In Step 2, click "Exchange authorization code for tokens"
9. Copy the **Refresh Token**

### Step 4: Configure Environment Variables

Add to your `.env.local` file:

```bash
# Gmail OAuth Configuration
GMAIL_CLIENT_ID=your_client_id_here
GMAIL_CLIENT_SECRET=your_client_secret_here
GMAIL_REFRESH_TOKEN=your_refresh_token_here
GMAIL_USER_EMAIL=your_gmail_address@gmail.com
COMPANY_NAME=SomlengP
```

## 🧪 Testing Email Verification

### Test Gmail Connection

Run the test script:

```bash
node scripts/test-gmail-connection.js
```

### Manual Testing

1. Go to `/signup` page
2. Fill out the signup form
3. Check your email for the verification code
4. Enter the code to complete account creation

## 📧 Email Template Features

Your emails include:

- **Professional branding** with SomlengP logo
- **Responsive design** that works on all devices
- **Security warnings** and best practices
- **Expiry countdown** (10 minutes)
- **Beautiful HTML styling** with gradients
- **Fallback text version** for email clients

## 🔒 Security Features

- **Rate limiting**: Max 3 verification attempts
- **Time-based expiry**: Codes expire in 10 minutes  
- **Email validation**: Proper format checking
- **Secure code generation**: Cryptographically secure random codes
- **Automatic cleanup**: Expired codes are automatically removed

## 📱 How It Works

1. **User enters signup details** → Form validation
2. **Verification email sent** → 6-digit code generated and stored
3. **User checks email** → Professional email with code received
4. **User enters code** → Code verified against stored data
5. **Account created** → Firebase Auth user created with profile
6. **Cleanup** → Pending signup data removed

## 🚀 Usage in Your App

The verification system is already integrated into:

- `SignupForm` component (modal/sheet version)
- `SignupFormStandalone` component (page version)  
- `/signup` page route
- API routes under `/api/signup-verification/`

## ⚡ Performance Features

- **In-memory storage** for pending signups (fast access)
- **Automatic cleanup** of expired data
- **Connection reuse** for Gmail OAuth tokens
- **Error handling** with proper user feedback

## 🎨 UI Features

- **Professional styling** with Tailwind CSS
- **Loading states** and progress indicators
- **Real-time countdown** timer for code expiry
- **Input validation** with visual feedback
- **Responsive design** for all screen sizes
- **Dark mode support**

Your email verification system is production-ready! Just configure the Gmail OAuth credentials and you're all set.

## 🐛 Troubleshooting

**Email not sending?**
- Check environment variables
- Verify Gmail API is enabled
- Test OAuth tokens with the playground
- Check console for error messages

**Verification failing?**
- Ensure codes match exactly (case-sensitive)
- Check if code has expired (10 minutes)
- Verify attempts haven't exceeded limit (3 max)

**Need help?**
- Check the browser console for errors
- Review API response messages
- Test with the included test script
