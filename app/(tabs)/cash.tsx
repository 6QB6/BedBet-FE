import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { API_BASE, getAuthHeaders, ensureTokenOrThrow } from "../../auth";
import { useAuth } from "../_layout";

export default function Cash() {
  const { user } = useAuth();

  const initialCoins = typeof user?.coin === "number" ? user.coin : 0;

  const [coin, setCoin] = useState<number>(initialCoins);
  const [amount, setAmount] = useState("");
  const [topupLoading, setTopupLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    setCoin(initialCoins);
  }, [initialCoins]);

  // 사용자 정보 조회로 최신 코인 갱신
  const refreshCoin = async () => {
    if (refreshLoading) return;
    setRefreshLoading(true);
    setMsg(null);
    try {
      await ensureTokenOrThrow();
      const res = await fetch(`${API_BASE}/user/info`, {
        method: "GET",
        headers: await getAuthHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(
          typeof data?.message === "string"
            ? data.message
            : `조회 실패 (${res.status})`
        );
        return;
      }
      const next = Number(data?.user?.coin);
      if (!Number.isNaN(next)) setCoin(next);
    } catch (e: any) {
      setMsg(e?.message ?? "네트워크 오류");
    } finally {
      setRefreshLoading(false);
    }
  };

  // 코인 충전 요청 (POST /coin/request { amount })
  const submitTopup = async () => {
    if (topupLoading || withdrawLoading) return;
    const num = Number(amount);
    if (!num || num <= 0) {
      setMsg("금액을 입력하세요");
      return;
    }
    setTopupLoading(true);
    setMsg(null);
    try {
      await ensureTokenOrThrow();
      const res = await fetch(`${API_BASE}/coin/request`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ amount: num }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(
          typeof data?.message === "string"
            ? data.message
            : `요청 실패 (${res.status})`
        );
      } else {
        setMsg(data?.message || "요청 완료");
        setAmount("");
        await refreshCoin();
      }
    } catch (e: any) {
      setMsg(e?.message ?? "네트워크 오류");
    } finally {
      setTopupLoading(false);
    }
  };

  // 출금(현금) 요청 (POST /money/request { amount })
  const submitWithdraw = async () => {
    if (topupLoading || withdrawLoading) return;
    const num = Number(amount);
    if (!num || num <= 0) {
      setMsg("금액을 입력하세요");
      return;
    }
    if (num > coin) {
      setMsg("보유 코인이 부족합니다");
      return;
    }
    setWithdrawLoading(true);
    setMsg(null);
    try {
      await ensureTokenOrThrow();
      const res = await fetch(`${API_BASE}/money/request`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ amount: num }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // 서버 메시지: "Money request already exists", "User not found", "Not enough coins to request money"
        setMsg(
          typeof data?.message === "string"
            ? data.message
            : `요청 실패 (${res.status})`
        );
      } else {
        setMsg(data?.message || "요청 완료");
        setAmount("");
        await refreshCoin();
      }
    } catch (e: any) {
      setMsg(e?.message ?? "네트워크 오류");
    } finally {
      setWithdrawLoading(false);
    }
  };

  return (
    <View style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.logo}>BedBet</Text>
        <Ionicons name="menu" size={26} color="#313131" />
      </View>

      {/* 잔액 + 금액 입력 + 액션 */}
      <View style={styles.balanceRow}>
        <View style={styles.balanceLeft}>
          <Image
            source={require("../../assets/icons/cash_active.png")}
            style={{ width: 20, height: 20, resizeMode: "contain" }}
          />
          <Text style={styles.balanceText}>{coin}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.refreshBtn, refreshLoading && { opacity: 0.6 }]}
            activeOpacity={0.85}
            onPress={refreshCoin}
            disabled={refreshLoading}
          >
            {refreshLoading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.refreshText}>새로고침</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.chargeBtn,
              (!amount || topupLoading || withdrawLoading) && { opacity: 0.6 },
            ]}
            activeOpacity={0.85}
            disabled={!amount || topupLoading || withdrawLoading}
            onPress={submitTopup}
          >
            {topupLoading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.btnText}>충전</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.withdrawBtn,
              (!amount ||
                withdrawLoading ||
                topupLoading ||
                Number(amount) > coin) && { opacity: 0.6 },
            ]}
            activeOpacity={0.85}
            disabled={
              !amount || withdrawLoading || topupLoading || Number(amount) > coin
            }
            onPress={submitWithdraw}
          >
            {withdrawLoading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.btnText}>출금</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 금액 입력 */}
      <View style={[styles.userCard, { marginTop: 12 }]}>
        <View style={styles.inputRow}>
          <Ionicons name="cash-outline" size={20} color="#8C8C8C" />
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={(t) => setAmount(t.replace(/[^0-9]/g, ""))}
            placeholder="금액을 입력하세요 (숫자)"
            placeholderTextColor="#B6B6B6"
            keyboardType="number-pad"
            inputMode="numeric"
            maxLength={9}
          />
        </View>
        {!!msg && (
          <Text style={{ marginTop: 8, color: "#c03", fontSize: 12 }}>
            {msg}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  logo: { fontSize: 22, fontWeight: "800", color: "#2E2E2E" },

  userCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EFE7D6",
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    marginTop: 8,
  },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: {
    flex: 1,
    height: 40,
    paddingHorizontal: 8,
    fontSize: 14,
    color: "#222",
  },

  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    justifyContent: "space-between",
  },
  balanceLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  balanceText: { fontSize: 14, color: "#000" },
  actions: { flexDirection: "row", gap: 10 },

  refreshBtn: {
    borderWidth: 1,
    borderColor: "#E5D7AE",
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7DF",
  },
  refreshText: { fontSize: 13, fontWeight: "700", color: "#5b4a11" },

  chargeBtn: {
    backgroundColor: "#FFD883",
    paddingHorizontal: 16,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  withdrawBtn: {
    backgroundColor: "#F4E1B0",
    paddingHorizontal: 16,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: { fontSize: 13, fontWeight: "700", color: "#3a2c05" },
});
