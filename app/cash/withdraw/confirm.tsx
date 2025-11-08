import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";

const SELL_PRICE = 100;

export default function WithdrawConfirm() {
  const { coins = "0", cash = "0", balance = "0" } =
    useLocalSearchParams<{ coins: string; cash: string; balance: string }>();
  const c = Number(coins); const w = Number(cash); const b = Number(balance);

  const onSubmit = () => {
    // ✔ 유효성: 1개 이상, 보유 코인 이내, 현금 계산 일치
    if (!Number.isInteger(c) || c <= 0 || c > b || w !== c * SELL_PRICE) {
      const reason =
        !Number.isInteger(c) || c <= 0
          ? "출금 코인을 올바르게 입력해 주세요."
          : c > b
          ? "보유 코인보다 많이 출금할 수 없습니다."
          : "금액 계산에 문제가 있습니다.";
      router.replace({ pathname: "/cash/withdraw/fail", params: { reason } });
      return;
    }
    // TODO: 서버 출금 API 호출 위치
    router.replace({ pathname: "/cash/success", params: { kind: "withdraw", amount: cash } });
  };

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>출금</Text>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="close" size={26} /></TouchableOpacity>
      </View>

      <Text style={styles.question}>출금하시겠습니까?</Text>

      <View style={styles.card}>
        <Text style={styles.line}>코인: {c.toLocaleString()} 개</Text>
        <Text style={styles.line}>예상 현금: {w.toLocaleString()} 원</Text>
        <Text style={[styles.line, { color: "#777" }]}>보유 코인: {b.toLocaleString()} 개</Text>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onSubmit} activeOpacity={0.9}>
        <Text style={styles.primaryText}>출금하기</Text>
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

  primaryBtn: { height: 48, borderRadius: 12, backgroundColor: "#F4E1B0", alignItems: "center", justifyContent: "center" },
  primaryText: { fontSize: 16, fontWeight: "800", color: "#3a2c05" },
});
