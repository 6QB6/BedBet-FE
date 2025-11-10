import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import type { ViewStyle, TextStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../_layout";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { clearToken, API_BASE, getAuthHeaders, ensureTokenOrThrow } from "@/auth";
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useCallback, useState } from "react";

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

type UserInfo = {
  userUid?: string;
  email?: string;
  name?: string;
  account_number?: string;
  coin?: number;
  teamUid?: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function Profile() {
  const { logout, user } = useAuth();
  const navigation = useNavigation<ProfileScreenNavigationProp>();

  const [profile, setProfile] = useState<UserInfo>({
    name: user?.name ?? "홍길동",
    email: user?.email ?? "email@example.com",
    account_number: user?.account_number ?? "000000000000",
    coin: typeof user?.coin === "number" ? user!.coin : 0,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await clearToken();
      logout();
      navigation.navigate('Login');
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
      Alert.alert("오류", "로그아웃 중 오류가 발생했습니다.");
    }
  };

  const fetchUserInfo = useCallback(async () => {
    // 원하면 이 guard는 그냥 둬도 됨
    if (loading) return;

    setLoading(true);
    setErr(null);
    try {
      await ensureTokenOrThrow();
      const res = await fetch(`${API_BASE}/user/info`, {
        method: "GET",
        headers: await getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data?.message === "string"
            ? data.message
            : `조회 실패 (${res.status})`;
        setErr(msg);
        return;
      }
      if (data?.user) {
        setProfile({
          name: data.user.name,
          email: data.user.email,
          account_number: data.user.account_number,
          coin: data.user.coin,
        });
      }
    } catch (e: any) {
      setErr(e?.message ?? "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, []); // ✅ loading 제거

  // 화면이 포커스될 때마다 사용자 정보 갱신
  useFocusEffect(
    useCallback(() => {
      fetchUserInfo();
    }, [fetchUserInfo])
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#FFE29F", "#FFA99F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerLogo}>BedBet</Text>
        <Ionicons name="menu" size={28} color="#030202ff" />
      </LinearGradient>

      <View style={styles.panel}>
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="person-outline" size={20} color="#555" />
            <Text style={styles.cardText}>{profile.name}</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="mail-outline" size={20} color="#555" />
            <Text style={styles.cardText}>{profile.email}</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="card-outline" size={20} color="#555" />
            <Text style={styles.cardText}>{profile.account_number}</Text>
          </View>

          <View style={styles.row}>
            <Ionicons name="cash-outline" size={20} color="#555" />
            <Text style={styles.cardText}>코인: {typeof profile.coin === "number" ? profile.coin : "-"}</Text>
            {loading && <Text style={[styles.cardText, { marginLeft: 8 }]}></Text>}
          </View>

          {!!err && (
            <View style={{ marginTop: 8 }}>
              <Text style={{ color: "crimson", fontSize: 13 }}>{err}</Text>
            </View>
          )}
        </View>

        <Pressable onPress={handleLogout} style={styles.item}>
          <Text style={styles.itemText}>로그아웃</Text>
        </Pressable>

        <Pressable
          onPress={() => {
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

  panel: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -10,
    paddingTop: 12,
    paddingHorizontal: 16,
  },

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