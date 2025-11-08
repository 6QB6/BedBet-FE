import { Tabs } from "expo-router";
import { Image } from "react-native";
import { useAuth } from "../_layout";

export default function TabsLayout() {
  const { logout } = useAuth();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        // headerShown: false,
        headerTitleAlign: "center",
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 84, // ✅ 탭바 높이 증가
          paddingTop: 16,
          paddingBottom: 16,
          backgroundColor: "white",
          borderTopWidth: 2,
          borderTopColor: "#FEB573",
          elevation: 10, // Android 그림자
        },
        tabBarIcon: ({ focused }) => {
          let iconSource;

          if (route.name === "index") {
            iconSource = focused
              ? require("../../assets/icons/home_active.png")
              : require("../../assets/icons/home.png");
          }
          if (route.name === "cash") {
            iconSource = focused
              ? require("../../assets/icons/cash_active.png")
              : require("../../assets/icons/cash.png");
          }
          if (route.name === "profile") {
            iconSource = focused
              ? require("../../assets/icons/profile_active.png")
              : require("../../assets/icons/profile.png");
          }

          return (
            <Image
              source={iconSource}
              style={{ width: 48, height: 48, resizeMode: "contain" }}
            />
          );
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "홈" }} />
      <Tabs.Screen name="cash" options={{ title: "캐쉬" }} />
      <Tabs.Screen name="profile" options={{ title: "프로필" }} />
    </Tabs>
  );
}
