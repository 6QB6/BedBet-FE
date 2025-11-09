import { Stack } from "expo-router";
import React, { createContext, useContext, useState, useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { getAccessToken } from "../auth";

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
  const [isLoading, setIsLoading] = useState(true);

  // 앱 시작 시 토큰 체크
  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await getAccessToken();
        if (token) {
          // TODO: 토큰이 있으면 사용자 정보를 가져와서 설정
          // 임시로 토큰만 있어도 로그인 상태로 처리
          setLoggedIn(true);
        }
      } catch (error) {
        console.error("Token check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, []);

  const login = (u: User) => {
    setUser(u);
    setLoggedIn(true);
  };

  const logout = async () => {
    try {
      // TODO: 로그아웃 시 토큰 제거 로직 추가
      setUser(null);
      setLoggedIn(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    // TODO: 로딩 화면 추가
    return null;
  }

  return (
    <AuthContext.Provider value={{ loggedIn, user, login, logout }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {loggedIn ? (
            <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
          ) : (
            <>
              <Stack.Screen
                name="(auth)/firstpage"
                options={{ gestureEnabled: false }}
              />
              <Stack.Screen name="(auth)/login" />
              <Stack.Screen name="(auth)/signup" />
            </>
          )}
        </Stack>
      </SafeAreaProvider>
    </AuthContext.Provider>
  );
}
