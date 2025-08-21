
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, runTransaction, DocumentReference } from 'firebase/firestore';

interface VisitorData {
  count: number;
}

function getVisitorDocRef(): DocumentReference<VisitorData> {
  if (!db) {
    throw new Error('Firebase is not initialized');
  }
  return doc(db, 'visitors', 'global') as DocumentReference<VisitorData>;
}

async function getCount(): Promise<number> {
  // Check if Firebase is properly initialized
  if (!db) {
    console.error('Firebase is not initialized. Check your environment variables.');
    return 0;
  }
  
  try {
    const visitorDocRef = getVisitorDocRef();
    const docSnap = await getDoc(visitorDocRef);
    if (docSnap.exists()) {
      return docSnap.data().count || 0;
    }
    // If the document doesn't exist, initialize it.
    await setDoc(visitorDocRef, { count: 0 });
    return 0;
  } catch (error) {
    console.error("Error getting visitor count from Firestore: ", error);
    // In case of error, return 0 to avoid breaking the client.
    return 0;
  }
}

async function incrementCount(): Promise<number> {
    // Check if Firebase is properly initialized
    if (!db) {
        console.error('Firebase is not initialized. Check your environment variables.');
        return 0;
    }
    
    try {
        const visitorDocRef = getVisitorDocRef();
        const newCount = await runTransaction(db, async (transaction) => {
            const visitorDoc = await transaction.get(visitorDocRef);
            if (!visitorDoc.exists()) {
                transaction.set(visitorDocRef, { count: 1 });
                return 1;
            }
            const currentCount = visitorDoc.data().count || 0;
            const newCount = currentCount + 1;
            transaction.update(visitorDocRef, { count: newCount });
            return newCount;
        });
        return newCount;
    } catch (error) {
        console.error("Error incrementing visitor count in Firestore: ", error);
        // Fallback to just getting the count if transaction fails.
        return getCount();
    }
}


export async function POST() {
  try {
    const newCount = await incrementCount();
    return NextResponse.json({ success: true, count: newCount });
  } catch (error) {
    console.error('Error in POST /api/visit:', error);
    return NextResponse.json(
      { success: false, message: 'An internal error occurred while updating the count.' },
      { status: 500 }
    );
  }
}

export async function GET() {
    try {
        const count = await getCount();
        return NextResponse.json({ success: true, count: count });
    } catch (error) {
        console.error('Error in GET /api/visit:', error);
        return NextResponse.json(
            { success: false, message: 'An internal error occurred.' },
            { status: 500 }
        );
    }
}
