import { useState } from "react";
import { Image } from "react-native";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
type MdiName = keyof typeof MaterialCommunityIcons.glyphMap;

export default function Cash() {
  const [name, setName] = useState("");
  const [account, setAccount] = useState("");
  const BALANCE_COINS = 340;

  const formatAccount = (t: string) => {
    const digits = t.replace(/\D/g, "").slice(0, 20);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.logo}>BedBet</Text>
        <Ionicons name="menu" size={26} color="#313131" />
      </View>

      <View style={styles.userCard}>
        <View style={styles.inputRow}>
          <Ionicons name="person-outline" size={20} color="#8C8C8C" />
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="홍길동"
            placeholderTextColor="#B6B6B6"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
        </View>

        <View style={[styles.inputRow, { marginTop: 10 }]}>
          <Ionicons name="card-outline" size={20} color="#8C8C8C" />
          <TextInput
            style={styles.input}
            value={account}
            onChangeText={(t) => setAccount(formatAccount(t))}
            placeholder="우리 110011001100"
            placeholderTextColor="#B6B6B6"
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={23}
          />
        </View>
      </View>

      <View style={styles.balanceRow}>
        <View style={styles.balanceLeft}>
          <Image
            source={require("../../assets/icons/cash_active.png")}
            style={{ width: 20, height: 20, resizeMode: "contain" }}
          />
          <Text style={styles.balanceText}>{BALANCE_COINS}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.chargeBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/cash/topup")} // 코인 입력 → 현금 계산
          >
            <Text style={styles.btnText}>충전</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.withdrawBtn}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: "/cash/withdraw", params: { balance: String(BALANCE_COINS) } })}
          >
            <Text style={styles.btnText}>출금</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 12, paddingTop: 8 },
  header: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
  logo: { fontSize: 22, fontWeight: "800", color: "#2E2E2E" },

  userCard: {
    backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#EFE7D6",
    padding: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 2, marginTop: 8,
  },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: { flex: 1, height: 40, paddingHorizontal: 8, fontSize: 14, color: "#222" },

  balanceRow: { flexDirection: "row", alignItems: "center", marginTop: 12, justifyContent: "space-between" },
  balanceLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  balanceText: { fontSize: 14, color: "#000" },
  actions: { flexDirection: "row", gap: 10 },

  chargeBtn: { backgroundColor: "#FFD883", paddingHorizontal: 16, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  withdrawBtn: { backgroundColor: "#F4E1B0", paddingHorizontal: 16, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  btnText: { fontSize: 13, fontWeight: "700", color: "#3a2c05" },
});
