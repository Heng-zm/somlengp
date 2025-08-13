const { GmailService } = require('../src/lib/gmail-service.ts');
require('dotenv').config({ path: '.env.local' });

async function testGmailConnection() {
  console.log('🧪 Testing Gmail OAuth2 connection...\n');

  // Check environment variables
  const requiredVars = [
    'GMAIL_CLIENT_ID',
    'GMAIL_CLIENT_SECRET',
    'GMAIL_REFRESH_TOKEN',
    'GMAIL_USER_EMAIL'
  ];

  console.log('📋 Checking environment variables:');
  let missingVars = false;
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      console.log(`  ✅ ${varName}: ${value.substring(0, 10)}...`);
    } else {
      console.log(`  ❌ ${varName}: Missing`);
      missingVars = true;
    }
  }

  if (missingVars) {
    console.log('\n❌ Missing required environment variables. Please check your .env.local file.');
    process.exit(1);
  }

  try {
    // Initialize Gmail service
    const gmailService = new GmailService({
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      user: process.env.GMAIL_USER_EMAIL,
    });

    console.log('\n🔗 Testing connection...');
    const connectionTest = await gmailService.testConnection();
    
    if (connectionTest.success) {
      console.log('✅ Gmail connection successful!');
      
      // Test sending an OTP email
      console.log('\n📧 Testing OTP email send...');
      const testEmail = process.env.GMAIL_USER_EMAIL; // Send to self for testing
      const testOTP = '123456';
      
      const emailResult = await gmailService.sendOTPEmail(testOTP, testEmail, {
        subject: 'Test OTP - Gmail Connection Verification',
        companyName: 'SomlengP Test',
        expiryMinutes: 5,
      });

      if (emailResult.success) {
        console.log('✅ Test email sent successfully!');
        console.log(`📬 Message ID: ${emailResult.messageId}`);
        console.log(`📩 Check your email: ${testEmail}`);
        console.log(`🔢 Test OTP code: ${testOTP}`);
      } else {
        console.log('❌ Failed to send test email:', emailResult.error);
      }
    } else {
      console.log('❌ Gmail connection failed:', connectionTest.error);
    }

  } catch (error) {
    console.log('❌ Error during testing:', error.message);
  }

  console.log('\n🏁 Test completed!');
}

// Run the test
testGmailConnection().catch(console.error);
