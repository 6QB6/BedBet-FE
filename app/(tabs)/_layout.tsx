import { Tabs } from "expo-router";
import { Pressable, Text } from "react-native";
import { useAuth } from "../_layout";

export default function TabsLayout() {
  const { logout } = useAuth();
  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: "center",
        tabBarActiveTintColor: "black",
      }}
    >
      <Tabs.Screen name="index" options={{ title: "홈" }} />
      <Tabs.Screen name="cash" options={{ title: "캐쉬" }} />
      <Tabs.Screen
        name="profile"
        options={{
          title: "프로필",
          headerRight: () => (
            <Pressable onPress={logout} style={{ paddingRight: 12 }}>
              <Text>로그아웃</Text>
            </Pressable>
          ),
        }}
      />
    </Tabs>
  );
}
