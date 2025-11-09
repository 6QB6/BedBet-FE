import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "access_token";
export const API_BASE =
  process.env.EXPO_PUBLIC_API ?? "https://bedbet.knpu.re.kr/api";

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getAccessToken(): Promise<string | null> {
  return await SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function getAuthHeaders() {
  const token = await getAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** 로컬 토큰 존재 여부를 확인하고 없으면 예외를 던집니다 */
export async function ensureTokenOrThrow() {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Token required");
  }
  return token;
}

export async function fetchJson<T = any>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    try {
      const j = await res.json();
      const msg = j?.detail?.message ?? j?.message ?? `HTTP ${res.status}`;
      throw new Error(msg);
    } catch {
      throw new Error(`HTTP ${res.status}`);
    }
  }
  return res.json();
}

