import {User} from 'firebase/auth';
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {OperationType, db, handleFirestoreError} from '../firebase';
import {Snippet, UserProfileData, WebTab} from '../types/snippet';

// Constants synchronized verbatim with firebase-blueprint.json & firestore.rules
export const MAX_TITLE_LENGTH = 120;
export const MAX_CODE_LENGTH = 200000;
export const MAX_DISPLAY_NAME_LENGTH = 120;
export const MAX_EMAIL_LENGTH = 254;
export const MAX_PHOTO_URL_LENGTH = 40000;
export const VALID_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
export const ALL_WEB_TABS: WebTab[] = ['html', 'css', 'js'];

function sanitizeTitle(raw: string): string {
  const trimmed = raw.trim().slice(0, MAX_TITLE_LENGTH);
  return trimmed.length > 0 ? trimmed : 'Sem título';
}

function sanitizeCode(raw: string): string {
  return raw.slice(0, MAX_CODE_LENGTH);
}

function sanitizeMode(raw: unknown): 'web' | 'python' {
  return raw === 'python' ? 'python' : 'web';
}

export function sanitizeWebTabs(raw: unknown): WebTab[] {
  if (!Array.isArray(raw)) return [...ALL_WEB_TABS];
  const validSet = new Set<WebTab>();
  for (const item of raw) {
    if (item === 'html' || item === 'css' || item === 'js') {
      validSet.add(item);
    }
  }
  const ordered = ALL_WEB_TABS.filter((tab) => validSet.has(tab));
  return ordered.length > 0 ? ordered : [...ALL_WEB_TABS];
}

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) {
    return value.toMillis();
  }
  if (typeof value === 'object' && value !== null && 'toMillis' in value) {
    const fn = (value as {toMillis?: () => number}).toMillis;
    if (typeof fn === 'function') return fn.call(value);
  }
  return Date.now();
}

export async function ensureUserProfile(user: User): Promise<UserProfileData> {
  if (!VALID_ID_PATTERN.test(user.uid)) {
    throw new Error('Identificador de usuário inválido.');
  }

  const profilePath = `users/${user.uid}`;
  const profileRef = doc(db, 'users', user.uid);

  const fallbackName = (user.displayName ?? '').slice(0, MAX_DISPLAY_NAME_LENGTH);
  const email = (user.email ?? '').slice(0, MAX_EMAIL_LENGTH);
  const fallbackPhoto = (user.photoURL ?? '').slice(0, MAX_PHOTO_URL_LENGTH);

  if (email.length < 3) {
    throw new Error('A conta precisa ter um e-mail verificado.');
  }

  let snap;
  try {
    snap = await getDoc(profileRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, profilePath);
  }

  if (!snap.exists()) {
    try {
      await setDoc(profileRef, {
        uid: user.uid,
        displayName: fallbackName,
        email,
        photoURL: fallbackPhoto,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, profilePath);
    }
    return {
      uid: user.uid,
      displayName: fallbackName,
      email,
      photoURL: fallbackPhoto,
    };
  }

  const existingData = snap.data();
  const savedName =
    typeof existingData.displayName === 'string' ? existingData.displayName : fallbackName;
  const savedPhoto =
    typeof existingData.photoURL === 'string' ? existingData.photoURL : fallbackPhoto;

  // Keep user's customized name & photo intact; only sync email if it changed
  if (existingData.email !== email) {
    try {
      await updateDoc(profileRef, {
        displayName: savedName,
        email,
        photoURL: savedPhoto,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, profilePath);
    }
  }

  return {
    uid: user.uid,
    displayName: savedName,
    email,
    photoURL: savedPhoto,
  };
}

export async function updateUserProfileDetails(
  user: User,
  payload: {displayName: string; photoURL: string}
): Promise<UserProfileData> {
  if (!VALID_ID_PATTERN.test(user.uid)) {
    throw new Error('Identificador de usuário inválido.');
  }

  const profilePath = `users/${user.uid}`;
  const profileRef = doc(db, 'users', user.uid);
  const displayName = payload.displayName.trim().slice(0, MAX_DISPLAY_NAME_LENGTH);
  const photoURL = payload.photoURL.trim().slice(0, MAX_PHOTO_URL_LENGTH);
  const email = (user.email ?? '').slice(0, MAX_EMAIL_LENGTH);

  try {
    await updateDoc(profileRef, {
      displayName,
      email,
      photoURL,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, profilePath);
  }

  return {
    uid: user.uid,
    displayName,
    email,
    photoURL,
  };
}

export function subscribeUserSnippets(
  userId: string,
  onData: (snippets: Snippet[]) => void,
  onError: (error: Error) => void
): () => void {
  const collectionPath = `users/${userId}/snippets`;
  const q = query(collection(db, 'users', userId, 'snippets'), where('ownerId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Snippet[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: typeof data.id === 'string' ? data.id : docSnap.id,
          ownerId: typeof data.ownerId === 'string' ? data.ownerId : userId,
          title: typeof data.title === 'string' ? data.title : 'Sem título',
          mode: sanitizeMode(data.mode),
          webTabs: sanitizeWebTabs(data.webTabs),
          html: typeof data.html === 'string' ? data.html : '',
          css: typeof data.css === 'string' ? data.css : '',
          js: typeof data.js === 'string' ? data.js : '',
          python: typeof data.python === 'string' ? data.python : '',
          createdAt: toMillis(data.createdAt),
          updatedAt: toMillis(data.updatedAt),
        };
      });
      items.sort((a, b) => b.updatedAt - a.updatedAt);
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      } catch (wrappedError) {
        onError(wrappedError instanceof Error ? wrappedError : new Error(String(wrappedError)));
      }
    }
  );
}

export async function createUserSnippet(
  userId: string,
  snippetId: string,
  payload: {
    title: string;
    mode?: 'web' | 'python';
    webTabs?: WebTab[];
    html: string;
    css: string;
    js: string;
    python?: string;
  }
): Promise<void> {
  if (!VALID_ID_PATTERN.test(userId) || !VALID_ID_PATTERN.test(snippetId)) {
    throw new Error('Identificador inválido.');
  }

  const docPath = `users/${userId}/snippets/${snippetId}`;
  const docRef = doc(db, 'users', userId, 'snippets', snippetId);

  try {
    await setDoc(docRef, {
      id: snippetId,
      ownerId: userId,
      title: sanitizeTitle(payload.title),
      mode: sanitizeMode(payload.mode),
      webTabs: sanitizeWebTabs(payload.webTabs),
      html: sanitizeCode(payload.html),
      css: sanitizeCode(payload.css),
      js: sanitizeCode(payload.js),
      python: sanitizeCode(payload.python ?? ''),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export async function updateUserSnippet(
  userId: string,
  snippetId: string,
  payload: {
    title: string;
    mode?: 'web' | 'python';
    webTabs?: WebTab[];
    html: string;
    css: string;
    js: string;
    python?: string;
  }
): Promise<void> {
  if (!VALID_ID_PATTERN.test(userId) || !VALID_ID_PATTERN.test(snippetId)) {
    throw new Error('Identificador inválido.');
  }

  const docPath = `users/${userId}/snippets/${snippetId}`;
  const docRef = doc(db, 'users', userId, 'snippets', snippetId);

  try {
    await updateDoc(docRef, {
      title: sanitizeTitle(payload.title),
      mode: sanitizeMode(payload.mode),
      webTabs: sanitizeWebTabs(payload.webTabs),
      html: sanitizeCode(payload.html),
      css: sanitizeCode(payload.css),
      js: sanitizeCode(payload.js),
      python: sanitizeCode(payload.python ?? ''),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteUserSnippet(userId: string, snippetId: string): Promise<void> {
  if (!VALID_ID_PATTERN.test(userId) || !VALID_ID_PATTERN.test(snippetId)) {
    throw new Error('Identificador inválido.');
  }

  const docPath = `users/${userId}/snippets/${snippetId}`;
  const docRef = doc(db, 'users', userId, 'snippets', snippetId);

  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}
