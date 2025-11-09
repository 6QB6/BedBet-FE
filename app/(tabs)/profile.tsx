import { View, Text, StyleSheet, Pressable } from "react-native";
import type { ViewStyle, TextStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../_layout";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native'; 
import { clearToken } from "@/auth";
import { StackNavigationProp } from '@react-navigation/stack'; // StackNavigationProp 추가
import { RootStackParamList } from '../navigation/types'; // 타입 정의 가져오기

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

export default function Profile() {
  const { logout, user } = useAuth(); // user = { name, email, bankAccount }
  const navigation = useNavigation<ProfileScreenNavigationProp>(); // navigation 객체 가져오기

  // 안전 처리
  const name = user?.name ?? "홍길동";
  const email = user?.email ?? "email@example.com";
  const bank = user?.bank ?? "우리";
  const account = user?.account_number ?? "000000000000";

  const handleLogout = async () => {
    try {
      // SecureStore에서 accessToken 삭제
      await clearToken();
      // 로그아웃 처리
      logout();
      // 로그인 페이지로 이동
      navigation.navigate('Login'); // 'Login'은 로그인 페이지의 이름입니다. 실제 페이지 이름으로 변경하세요.
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* 상단 헤더 (평평한 하단) */}
      <LinearGradient
        colors={["#FFE29F", "#FFA99F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerLogo}>BedBet</Text>
        <Ionicons name="menu" size={28} color="#030202ff" />
      </LinearGradient>

      {/* ✅ 가장 배경의 하얀 요소: 상단만 둥글게 */}
      <View style={styles.panel}>
        {/* 프로필 카드 (원래대로 1개) */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="person-outline" size={20} color="#555" />
            <Text style={styles.cardText}>{name}</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="mail-outline" size={20} color="#555" />
            <Text style={styles.cardText}>{email}</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="card-outline" size={20} color="#555" />
            <Text style={styles.cardText}>{bank}</Text>
            <Text style={styles.cardText}>{account}</Text>
          </View>
        </View>

        {/* 로그아웃 / 회원탈퇴 (그대로) */}
        <Pressable onPress={handleLogout} style={styles.item}>
          <Text style={styles.itemText}>로그아웃</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            // TODO: 회원탈퇴 API 연결
            alert("회원탈퇴 기능은 서버 연결 후 구현됩니다.");
          }}
          style={styles.item}
        >
          <Text style={[styles.itemText, { color: "red" }]}>회원탈퇴</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create<{
  container: ViewStyle;
  header: ViewStyle;
  headerLogo: TextStyle;
  panel: ViewStyle;
  card: ViewStyle;
  row: ViewStyle;
  cardText: TextStyle;
  item: ViewStyle;
  itemText: TextStyle;
}>({
  container: { flex: 1, backgroundColor: "#FFF" },

  // 헤더는 하단 라운드 없음 (평평)
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLogo: {
    fontSize: 28,
    fontWeight: "800",
    color: "#333",
  },

  // ✅ 화면의 “배경 하얀 패널” — 상단 둥근 모서리
  panel: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -10, // 헤더와 자연스럽게 맞닿아 라운드가 보이도록
    paddingTop: 12,
    paddingHorizontal: 16,
  },

  // 프로필 카드(원래처럼 한 장)
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  cardText: {
    fontSize: 15,
    color: "#444",
  },

  item: { marginTop: 24, marginLeft: 8 },
  itemText: { fontSize: 16, fontWeight: "500", color: "#111" },
});
