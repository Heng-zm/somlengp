import { NextRequest, NextResponse } from 'next/server';
import { EmailVerificationService } from '@/lib/email-verification-service';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUserProfile } from '@/lib/user-profile';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    // Validate required fields
    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    // Verify the code and get signup data
    const verificationResult = EmailVerificationService.verifySignupCode(email, code);

    if (!verificationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: verificationResult.error,
          attemptsRemaining: verificationResult.attemptsRemaining
        },
        { status: 400 }
      );
    }

    const { signupData } = verificationResult;
    if (!signupData) {
      return NextResponse.json(
        { success: false, error: 'Signup data not found' },
        { status: 400 }
      );
    }

    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        signupData.email, 
        signupData.password
      );
      
      const user = userCredential.user;

      // Update user profile with display name
      const displayName = `${signupData.firstName} ${signupData.lastName}`;
      await updateProfile(user, {
        displayName,
      });

      // Create user profile in Firestore
      try {
        await createUserProfile(user, {
          firstName: signupData.firstName,
          lastName: signupData.lastName,
          emailVerified: true, // Mark as verified since they verified through our system
        });
      } catch (profileError) {
        console.error('Failed to create user profile in Firestore:', profileError);
        // Don't fail the signup if profile creation fails
      }

      // Complete the signup process (remove from pending)
      EmailVerificationService.completeSignup(email);

      return NextResponse.json({
        success: true,
        message: 'Email verified and account created successfully!',
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          emailVerified: true,
        },
      });
    } catch (authError: unknown) {
      console.error('Firebase Auth Error during signup:', authError);
      
      const error = authError as { code?: string; message?: string };
      let errorMessage = 'Failed to create account';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email address already exists';
        // Clean up pending signup since account already exists
        EmailVerificationService.completeSignup(email);
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password sign-up is not enabled';
      }

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Verify Signup API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify email and create account' },
      { status: 500 }
    );
  }
}

// GET endpoint to check verification status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Get verification status
    const status = EmailVerificationService.getVerificationStatus(email);

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('Get Verification Status API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get verification status' },
      { status: 500 }
    );
  }
}
