import { z } from 'zod';
import type { User } from '@supabase/supabase-js';

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

// Comment Types
export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorEmail: string | null;
  authorPhotoURL: string | null;
  createdAt: Date;
  updatedAt: Date;
  isEdited?: boolean;
}

export interface CommentCreateData {
  content: string;
}

export interface CommentUpdateData {
  content: string;
}

// Comment Schema for validation
export const CommentSchema = z.object({
  id: z.string(),
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment too long"),
  authorId: z.string(),
  authorName: z.string(),
  authorEmail: z.string().email().nullable(),
  authorPhotoURL: z.string().url().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  isEdited: z.boolean().optional(),
});

export const CommentCreateSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment too long"),
});

export const CommentUpdateSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment too long"),
});

// Dimension Types
export enum DimensionUnit {
  METER = 'meter',
  CENTIMETER = 'cm',
  MILLIMETER = 'mm',
  INCH = 'inch',
  PIXEL = 'px'
}

export interface Dimension {
  value: number;
  unit: DimensionUnit;
}

export interface DimensionPair {
  width: Dimension;
  height: Dimension;
}

// Physical dimension conversion rates (all to millimeters)
const CONVERSION_TO_MM = {
  [DimensionUnit.METER]: 1000,
  [DimensionUnit.CENTIMETER]: 10,
  [DimensionUnit.MILLIMETER]: 1,
  [DimensionUnit.INCH]: 25.4,
  [DimensionUnit.PIXEL]: 0.264583 // Assuming 96 DPI standard
} as const;

// Dimension Schema for validation
export const DimensionSchema = z.object({
  value: z.number().positive("Dimension value must be positive"),
  unit: z.nativeEnum(DimensionUnit)
});

export const DimensionPairSchema = z.object({
  width: DimensionSchema,
  height: DimensionSchema
});
