import { Stack } from "expo-router";
import React, { createContext, useContext, useState } from "react";

export type User = {
  name: string;
  email: string;
  bank: string;
  account_number: string;
  coin: number;
  token: string;
};

export type AuthContextType = {
  loggedIn: boolean;
  user: User | null;
  login: (u: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);
export const useAuth = () => useContext(AuthContext)!;

export default function RootLayout() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const login = (u: User) => {
    setUser(u); // ✅ 사용자 정보 저장
    setLoggedIn(true); // ✅ 로그인 상태로 전환
  };

  const logout = () => {
    setUser(null); // ✅ 사용자 정보 제거
    setLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ loggedIn, user, login, logout }}>
      <Stack screenOptions={{ headerShown: false }}>
        {loggedIn ? (
          <Stack.Screen name="(tabs)" />
        ) : (
          <>
            <Stack.Screen name="(auth)/firstpage" />
            <Stack.Screen name="(auth)/login" />
            <Stack.Screen name="(auth)/signup" />
          </>
        )}
      </Stack>
    </AuthContext.Provider>
  );
}
