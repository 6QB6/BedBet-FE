import { useState, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Image } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
// 커스텀 키패드를 쓰고 싶다면 아래 주석 해제하고 <NumPad> 배치
// import NumPad from "../../../components/NumPad";
type MdiName = keyof typeof MaterialCommunityIcons.glyphMap;

const BUY_PRICE = 110; // 1코인 구매가(원)

export default function TopupScreen() {
  const [coinsStr, setCoinsStr] = useState("");
  const coins = Number(coinsStr || 0);
  const needCash = useMemo(() => coins * BUY_PRICE, [coins]);

  const goConfirm = () => {
    if (!Number.isFinite(coins) || coins <= 0) {
      router.push({ pathname: "/cash/topup/fail", params: { reason: "코인 수량을 올바르게 입력해 주세요." } });
      return;
    }
    // 상한/정책이 있으면 여기서 체크 (예: 1회 1,000,000코인 제한)
    router.push({ pathname: "/cash/topup/confirm", params: { coins: String(coins), cash: String(needCash) } });
  };

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>충전</Text>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="close" size={26} /></TouchableOpacity>
      </View>

      {/* 코인 입력 박스 (장식 아님!) */}
      <View style={styles.card}>
        <Text style={styles.label}>충전코인</Text>
        <View style={styles.coinRow}>
          {/* ✅ 기존 아이콘 대신 PNG 이미지 사용 */}
          <Image
            source={require("../../../assets/icons/cash_active.png")}
            style={{ width: 20, height: 20, resizeMode: "contain" }}
          />

          <TextInput
            style={styles.coinInput}
            value={coinsStr}
            onChangeText={(t) => setCoinsStr(t.replace(/\D/g, "").slice(0, 9))}
            placeholder="|" // 커서 느낌
            placeholderTextColor="#B6B6B6"
            keyboardType="number-pad"
            inputMode="numeric"
          />
        </View>
      </View>

      {/* 예상 변환 */}
      <View style={styles.previewBox}>
        <Text style={styles.previewText}>입금 필요액: <Text style={styles.previewStrong}>{needCash.toLocaleString()} 원</Text></Text>
        <Text style={styles.hint}>1코인 = 110원 (구매가)</Text>
      </View>

      {/* 커스텀 숫자패드를 쓰려면 여기에 <NumPad value={coinsStr} onChange={setCoinsStr} /> 배치 */}

      <TouchableOpacity style={[styles.primaryBtn, { marginTop: 12 }]} onPress={goConfirm} activeOpacity={0.9}>
        <Text style={styles.primaryText}>충전하기</Text>
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

  previewBox: { marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: "#FFF8E7", borderWidth: 1, borderColor: "#EFE7D6" },
  previewText: { textAlign: "center", fontSize: 16 },
  previewStrong: { fontWeight: "800" },
  hint: { marginTop: 4, textAlign: "center", color: "#777" },

  primaryBtn: { height: 48, borderRadius: 12, backgroundColor: "#FFD883", alignItems: "center", justifyContent: "center" },
  primaryText: { fontSize: 16, fontWeight: "800", color: "#3a2c05" },
});
