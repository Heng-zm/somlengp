# Gmail OTP Verification System

A complete email verification system using Gmail OAuth2 for sending OTP codes with a modern React UI.

## Features

- ✅ Generate 6-digit OTP codes
- ✅ Send beautifully formatted HTML emails via Gmail
- ✅ Rate limiting and expiration (5 minutes default)
- ✅ Attempt tracking (3 attempts max)
- ✅ Resend functionality with cooldown
- ✅ Modern React component with real-time countdown
- ✅ Full API endpoints for integration
- ✅ TypeScript support

## Setup

### 1. Install Dependencies

The required packages have already been installed:
- `nodemailer` - Email sending
- `googleapis` - Google API client
- `@types/nodemailer` - TypeScript types

### 2. Gmail OAuth2 Setup

#### Step 1: Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

#### Step 2: Create OAuth2 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Desktop Application" or "Web Application"
4. Add authorized redirect URI: `https://developers.google.com/oauthplayground`
5. Save your Client ID and Client Secret

#### Step 3: Get Refresh Token
1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
2. Click the settings gear icon (top right)
3. Check "Use your own OAuth credentials"
4. Enter your Client ID and Client Secret
5. In the left panel, select:
   - Gmail API v1
   - `https://www.googleapis.com/auth/gmail.send`
6. Click "Authorize APIs"
7. Complete the OAuth flow (login to Gmail)
8. Click "Exchange authorization code for tokens"
9. Copy the `refresh_token` value

### 3. Environment Variables

Add these to your `.env.local` file:

```env
# Required Gmail OAuth2 credentials
GMAIL_CLIENT_ID=your_google_client_id_here
GMAIL_CLIENT_SECRET=your_google_client_secret_here
GMAIL_REFRESH_TOKEN=your_refresh_token_here
GMAIL_USER_EMAIL=your_gmail_address_here

# Optional configuration
COMPANY_NAME=SomlengP
OTP_EXPIRY_MINUTES=5
```

## Usage

### 1. Test the System

Visit `/otp-test` to test the OTP verification:

```bash
npm run dev
# Navigate to: http://localhost:3000/otp-test
```

### 2. Use the React Component

```tsx
import { OTPVerification } from '@/components/otp/otp-verification';

function MyComponent() {
  const handleSuccess = (email: string) => {
    console.log('Email verified:', email);
    // Handle successful verification
  };

  const handleError = (error: string) => {
    console.error('Verification error:', error);
    // Handle error
  };

  return (
    <OTPVerification
      onSuccess={handleSuccess}
      onError={handleError}
      title="Verify Your Email"
      description="Enter your email to receive a verification code"
    />
  );
}
```

### 3. Use the API Directly

#### Send OTP
```javascript
const response = await fetch('/api/otp/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});
const data = await response.json();
```

#### Verify OTP
```javascript
const response = await fetch('/api/otp/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    email: 'user@example.com', 
    code: '123456' 
  })
});
const data = await response.json();
```

#### Resend OTP
```javascript
const response = await fetch('/api/otp/resend', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});
const data = await response.json();
```

#### Check OTP Status
```javascript
const response = await fetch('/api/otp/send?email=user@example.com');
const data = await response.json();
console.log(data.status); // { exists, expires, attempts, timeRemaining }
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/otp/send` | POST | Send OTP to email |
| `/api/otp/verify` | POST | Verify OTP code |
| `/api/otp/resend` | POST | Resend new OTP |
| `/api/otp/send?email=` | GET | Get OTP status |

## File Structure

```
src/
├── lib/
│   ├── otp-service.ts      # Core OTP logic
│   ├── gmail-service.ts    # Gmail email sending
│   └── otp-manager.ts      # Main OTP manager
├── app/api/otp/
│   ├── send/route.ts       # Send OTP endpoint
│   ├── verify/route.ts     # Verify OTP endpoint
│   └── resend/route.ts     # Resend OTP endpoint
├── components/otp/
│   └── otp-verification.tsx # React component
└── app/otp-test/
    └── page.tsx            # Test page
```

## Configuration Options

### OTP Settings
- **Code Length**: 6 digits (fixed)
- **Expiry Time**: 5 minutes (configurable via `OTP_EXPIRY_MINUTES`)
- **Max Attempts**: 3 attempts per code
- **Resend Cooldown**: Must wait for expiry or use resend endpoint

### Email Customization
The email template includes:
- Company branding
- Professional HTML design
- Security warnings
- Expiry countdown
- Fallback text version

## Security Features

- ✅ Rate limiting (one active OTP per email)
- ✅ Attempt tracking with limits
- ✅ Time-based expiration
- ✅ Secure random code generation
- ✅ Input validation and sanitization
- ✅ OAuth2 authentication for Gmail

## Production Considerations

1. **Database Storage**: Replace in-memory storage with Redis or database
2. **Rate Limiting**: Add IP-based rate limiting
3. **Monitoring**: Add logging and analytics
4. **Email Templates**: Customize for your brand
5. **Error Handling**: Enhanced error reporting
6. **Testing**: Add comprehensive test suite

## Troubleshooting

### Common Issues

1. **"Service configuration error"**
   - Check all environment variables are set
   - Verify OAuth2 credentials are correct

2. **"Failed to send email"**
   - Check Gmail API is enabled
   - Verify refresh token is valid
   - Ensure sender email matches OAuth2 account

3. **"Invalid refresh token"**
   - Regenerate refresh token using OAuth Playground
   - Check token hasn't expired

4. **Emails not received**
   - Check spam folder
   - Verify recipient email is valid
   - Check Gmail sending limits

### Debug Mode

For development, you can log the OTP code by uncommenting the debug line in the API response.

## License

This OTP system is part of the SomlengP project.
