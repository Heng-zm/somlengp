
"use client";

const DB_NAME = 'chat-db';
const STORE_NAME = 'messages';
const DB_VERSION = 1;

export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error("IndexedDB can only be used in the browser."));
    }
    if (!dbPromise) {
        dbPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };

            request.onsuccess = (event) => {
                resolve((event.target as IDBOpenDBRequest).result);
            };

            request.onerror = (event) => {
                console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
                reject('Error opening IndexedDB.');
            };
        });
    }
    return dbPromise;
}

export async function addMessage(message: ChatMessage): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(message);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            console.error('Error adding message:', (event.target as IDBRequest).error);
            reject('Error adding message to DB.');
        };
    });
}

export async function getMessages(): Promise<ChatMessage[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = (event) => {
            const messages = (event.target as IDBRequest).result as ChatMessage[];
            // Sort by timestamp to ensure correct order
            resolve(messages.sort((a, b) => a.timestamp - b.timestamp));
        };

        request.onerror = (event) => {
            console.error('Error getting messages:', (event.target as IDBRequest).error);
            reject('Error getting messages from DB.');
        };
    });
}
