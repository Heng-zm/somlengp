import { z } from 'zod';
import { User } from 'firebase/auth';

export type TranscriptWord = {
  text: string;
  start: number;
  end: number;
};

const TranscriptWordSchema = z.object({
  text: z.string(),
  start: z.number().describe('Start time of the word in seconds.'),
  end: z.number().describe('End time of the word in seconds.'),
});

export const TranscribeAudioOutputSchema = z.object({
  transcript: z
    .array(TranscriptWordSchema)
    .describe('The structured transcript with word timings.'),
  text: z.string().describe('The full transcribed text as a single string.'),
});
export type TranscribeAudioOutput = z.infer<
  typeof TranscribeAudioOutputSchema
>;

// User Profile Types
export interface UserProfile {
  uid: string; // Firebase UID (string)
  userId: number; // Numeric user ID
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date;
  lastSignInTime: Date | null;
  profileCreatedAt?: Date;
  profileUpdatedAt?: Date;
}

export interface ExtendedUser extends User {
  userId?: number;
  profileCreatedAt?: Date;
  profileUpdatedAt?: Date;
}

// Counter for tracking the last assigned user ID
export interface UserCounter {
  lastUserId: number;
  updatedAt: Date;
}

// User Profile Schema for validation
export const UserProfileSchema = z.object({
  uid: z.string(),
  userId: z.number(),
  email: z.string().email().nullable(),
  displayName: z.string().nullable(),
  photoURL: z.string().url().nullable(),
  createdAt: z.date(),
  lastSignInTime: z.date().nullable(),
  profileCreatedAt: z.date().optional(),
  profileUpdatedAt: z.date().optional(),
});

// User Counter Schema
export const UserCounterSchema = z.object({
  lastUserId: z.number(),
  updatedAt: z.date(),
});
