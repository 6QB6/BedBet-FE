import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect } from "react";

export default function Success() {
  const { kind = "topup", amount = "0" } = useLocalSearchParams<{ kind?: string; amount?: string }>();

  useEffect(() => {
    const t = setTimeout(() => router.replace("/(tabs)/cash"), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.safe}>
      <View style={styles.center}>
        <Ionicons name="checkmark-circle" size={72} color="#36C48B" />
        <Text style={styles.title}>{kind === "withdraw" ? "출금 완료!" : "충전 완료!"}</Text>
        <Text style={styles.sub}>
          {kind === "withdraw" ? "+" : "+"} {Number(amount).toLocaleString()} {kind === "withdraw" ? "원" : "코인"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff", padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  title: { fontSize: 22, fontWeight: "800" },
  sub: { fontSize: 16, color: "#444" },
});
