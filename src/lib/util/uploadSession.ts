import { browser } from '$app/environment';
import type { ParsedRow } from '$lib/types';

const DB_NAME = 'teosto-analysis-db';
const DB_VERSION = 1;
const STORE_NAME = 'upload-session';

type UploadedSessionPayload = {
	rows: ParsedRow[];
	fileNames: string[];
	uploadedAt: string;
};

function isValidPayload(value: unknown): value is UploadedSessionPayload {
	if (!value || typeof value !== 'object') return false;

	const payload = value as Partial<UploadedSessionPayload>;

	return (
		Array.isArray(payload.rows) &&
		Array.isArray(payload.fileNames) &&
		typeof payload.uploadedAt === 'string'
	);
}

function openDatabase(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => resolve(request.result);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME);
			}
		};
	});
}

async function getFromIndexedDB(): Promise<UploadedSessionPayload | null> {
	if (!browser) return null;

	try {
		const db = await openDatabase();
		return new Promise((resolve) => {
			const transaction = db.transaction(STORE_NAME, 'readonly');
			const store = transaction.objectStore(STORE_NAME);
			const request = store.get('session');

			request.onerror = () => resolve(null);
			request.onsuccess = () => {
				const value = request.result;
				resolve(value && isValidPayload(value) ? value : null);
			};
		});
	} catch {
		return null;
	}
}

async function saveToIndexedDB(payload: UploadedSessionPayload): Promise<void> {
	if (!browser) return;

	try {
		const db = await openDatabase();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(STORE_NAME, 'readwrite');
			const store = transaction.objectStore(STORE_NAME);
			const request = store.put(payload, 'session');

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	} catch (error) {
		console.error('Failed to save to IndexedDB:', error);
		throw error;
	}
}

async function clearFromIndexedDB(): Promise<void> {
	if (!browser) return;

	try {
		const db = await openDatabase();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(STORE_NAME, 'readwrite');
			const store = transaction.objectStore(STORE_NAME);
			const request = store.clear();

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	} catch {
		// Silently fail
	}
}

export async function saveUploadedSession(rows: ParsedRow[], fileNames: string[]) {
	const payload: UploadedSessionPayload = {
		rows,
		fileNames,
		uploadedAt: new Date().toISOString()
	};

	await saveToIndexedDB(payload);
}

export async function readUploadedSession(): Promise<UploadedSessionPayload | null> {
	return getFromIndexedDB();
}

export async function clearUploadedSession() {
	await clearFromIndexedDB();
}
