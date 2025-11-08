import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function TopupFail() {
  const { reason = "충전에 실패했습니다." } = useLocalSearchParams<{ reason?: string }>();

  return (
    <View style={styles.safe}>
      <View style={styles.center}>
        <Ionicons name="close-circle" size={72} color="#E55353" />
        <Text style={styles.title}>충전 실패</Text>
        <Text style={styles.sub}>{reason}</Text>

        <TouchableOpacity style={styles.btn} onPress={() => router.replace("/cash/topup")}>
          <Text style={styles.btnText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff", padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  title: { fontSize: 22, fontWeight: "800" },
  sub: { fontSize: 15, color: "#444", textAlign: "center" },
  btn: { marginTop: 12, height: 44, paddingHorizontal: 18, borderRadius: 10, backgroundColor: "#FFD883", alignItems: "center", justifyContent: "center" },
  btnText: { fontSize: 16, fontWeight: "800", color: "#3a2c05" },
});
