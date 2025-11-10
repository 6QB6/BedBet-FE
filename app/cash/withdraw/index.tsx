import { useState, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
type MdiName = keyof typeof MaterialCommunityIcons.glyphMap;

const SELL_PRICE = 100; // 1코인 출금가(원)

export default function WithdrawScreen() {
  const { balance = "0" } = useLocalSearchParams<{ balance?: string }>();
  const balanceCoins = Number(balance || 0);

  const [coinsStr, setCoinsStr] = useState("");
  const coins = Number(coinsStr || 0);
  const cash = useMemo(() => coins * SELL_PRICE, [coins]);

  const goConfirm = () => {
    if (!Number.isInteger(coins) || coins <= 0) {
      router.push({ pathname: "/cash/withdraw/fail", params: { reason: "출금 코인을 올바르게 입력해 주세요." } });
      return;
    }
    router.push({ pathname: "/cash/withdraw/confirm", params: { coins: String(coins), cash: String(cash), balance: String(balanceCoins) } });
  };

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>출금</Text>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="close" size={26} /></TouchableOpacity>
      </View>

      {/* 코인 입력 박스 (장식 아님!) */}
 <View style={styles.card}>
        <Text style={styles.label}>출금코인</Text>
        <View style={styles.coinRow}>
          {/* ✅ 아이콘 대신 이미지로 교체 */}
          <Image
            source={require("../../../assets/icons/cash_active.png")}
            style={{ width: 20, height: 20, resizeMode: "contain" }}
          />
          <TextInput
            style={styles.coinInput}
            value={coinsStr}
            onChangeText={(t) => setCoinsStr(t.replace(/\D/g, "").slice(0, 9))}
            placeholder="|"
            placeholderTextColor="#B6B6B6"
            keyboardType="number-pad"
            inputMode="numeric"
          />
        </View>
        <Text style={styles.balanceInfo}>
          보유: {balanceCoins.toLocaleString()} 코인
        </Text>
      </View>

      {/* 예상 변환 */}
      <View style={styles.previewBox}>
        <Text style={styles.previewText}>예상 현금: <Text style={styles.previewStrong}>{cash.toLocaleString()} 원</Text></Text>
        <Text style={styles.hint}>1코인 = 110원 (출금가)</Text>
      </View>

      <TouchableOpacity style={[styles.primaryBtn, { marginTop: 12 }]} onPress={goConfirm} activeOpacity={0.9}>
        <Text style={styles.primaryText}>출금하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff", padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  title: { fontSize: 20, fontWeight: "800" },

  card: { borderWidth: 1, borderColor: "#EFE7D6", borderRadius: 12, padding: 14, backgroundColor: "#fff" },
  label: { fontSize: 12, color: "#777", marginBottom: 6 },
  coinRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#EFE7D6", borderRadius: 10, paddingHorizontal: 10, height: 44 },
  coinInput: { flex: 1, marginLeft: 8, fontSize: 16, color: "#222" },
  balanceInfo: { marginTop: 6, color: "#777", fontSize: 12 },

  previewBox: { marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: "#FFF8E7", borderWidth: 1, borderColor: "#EFE7D6" },
  previewText: { textAlign: "center", fontSize: 16 },
  previewStrong: { fontWeight: "800" },
  hint: { marginTop: 4, textAlign: "center", color: "#777" },

  primaryBtn: { height: 48, borderRadius: 12, backgroundColor: "#F4E1B0", alignItems: "center", justifyContent: "center" },
  primaryText: { fontSize: 16, fontWeight: "800", color: "#3a2c05" },
});
