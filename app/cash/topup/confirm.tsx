import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

const BUY_PRICE = 110;

export default function TopupConfirm() {
  const { coins = "0", cash = "0" } = useLocalSearchParams<{ coins: string; cash: string }>();
  const c = Number(coins); const w = Number(cash);

  const onSubmit = () => {
    // ✔ 유효성 검사: 1개 이상, 현금 계산 일치
    if (!Number.isInteger(c) || c <= 0 || w !== c * BUY_PRICE) {
      router.replace({ pathname: "/cash/topup/fail", params: { reason: "충전 수량이 올바르지 않습니다." } });
      return;
    }
    // TODO: 서버 결제/입금 확인 API 호출 위치
    router.replace({ pathname: "/cash/success", params: { kind: "topup", amount: coins } });
  };

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>충전</Text>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="close" size={26} /></TouchableOpacity>
      </View>

      <Text style={styles.question}>충전하시겠습니까?</Text>

      <View style={styles.card}>
        <Text style={styles.line}>코인: {Number(coins).toLocaleString()} 개</Text>
        <Text style={styles.line}>입금액: {Number(cash).toLocaleString()} 원</Text>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onSubmit} activeOpacity={0.9}>
        <Text style={styles.primaryText}>충전하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff", padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "800" },
  question: { marginVertical: 16, fontSize: 16 },

  card: { borderWidth: 1, borderColor: "#EFE7D6", borderRadius: 12, padding: 14, marginBottom: 16 },
  line: { fontSize: 16, marginBottom: 6 },

  primaryBtn: { height: 48, borderRadius: 12, backgroundColor: "#FFD883", alignItems: "center", justifyContent: "center" },
  primaryText: { fontSize: 16, fontWeight: "800", color: "#3a2c05" },
});
