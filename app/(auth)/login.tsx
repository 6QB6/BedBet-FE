import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Link, router } from "expo-router";
import { useAuth } from "../_layout";
import { useMemo, useState } from "react";
import { saveToken } from "../../auth";

const API_BASE = "https://bedbet.knpu.re.kr/api";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isFormFilled = useMemo(
    () => email.trim().length > 0 && password.trim().length > 0,
    [email, password]
  );

  const handleLogin = async () => {
    if (!isFormFilled || submitting) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`${API_BASE}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // 400 / 404 등
        const msg =
          typeof data?.message === "string"
            ? data.message
            : `로그인 실패 (HTTP ${res.status})`;
        setErrorMsg(msg);
        return;
      }

      // 성공 (200)
      // 응답 형태:
      // {
      //   message: "Token is valid",
      //   access_token: "...",
      //   user: { email, account_number, bank, coin, name, userUid }
      // }
      const u = data.user;
      await saveToken(data.access_token);
      login({
        name: u?.name ?? "",
        email: u?.email ?? email,
        bank: u?.bank ?? "",
        account_number: u?.account_number ?? "",
        coin: typeof u?.coin === "number" ? u.coin : 0,
        // _layout.tsx의 User 타입에 token 필드가 있으면 아래 같이 추가해서 저장
        token: data?.access_token ?? "",
        // userUid 같은 추가 필드는 타입에 optional로 두거나 생략해도 됨
        // userUid: u?.userUid,
      });

      // 메인 탭으로
      router.replace("/(tabs)");
    } catch (e: any) {
      setErrorMsg("네트워크 오류가 발생했어요. 연결을 확인해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <Text style={styles.inputLabel}>ID</Text>
        <TextInput
          placeholder="ex) user@gmail.com"
          placeholderTextColor="#c5c5c5"
          keyboardType="email-address"
          autoCapitalize="none"
          style={[styles.rowInput, Platform.OS === "web" && styles.rowInputWeb]}
          underlineColorAndroid="transparent"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View style={styles.inputRow}>
        <Text style={styles.inputLabel}>PW</Text>
        <TextInput
          placeholder=""
          secureTextEntry
          autoCapitalize="none"
          style={[styles.rowInput, Platform.OS === "web" && styles.rowInputWeb]}
          underlineColorAndroid="transparent"
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {!!errorMsg && (
        <Text style={{ color: "crimson", textAlign: "center" }}>
          {errorMsg}
        </Text>
      )}

      <Pressable
        style={[
          styles.button,
          (isFormFilled || submitting) && styles.buttonActive,
          submitting && { opacity: 0.7 },
        ]}
        onPress={handleLogin}
        disabled={!isFormFilled || submitting}
      >
        {submitting ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.buttonText}>로그인</Text>
        )}
      </Pressable>

      <Link href="/(auth)/signup" style={styles.link}>
        회원가입
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 18,
    backgroundColor: "#ffffff",
  },
  inputRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  inputLabel: { fontSize: 16, fontWeight: "600", color: "#1a1a1a" },
  rowInput: {
    flex: 1,
    textAlign: "right",
    fontSize: 16,
    color: "#1a1a1a",
    marginLeft: 12,
    borderWidth: 0,
  },
  rowInputWeb: { outlineStyle: "none", outlineWidth: 0, borderWidth: 0 } as any,
  link: { marginTop: 4, textAlign: "center", color: "#9c9c9c" },
  button: {
    backgroundColor: "#FEF0C7",
    height: 56,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  buttonActive: { backgroundColor: "#FEDF89" },
  buttonText: { color: "black", fontSize: 16, fontWeight: "600" },
});
