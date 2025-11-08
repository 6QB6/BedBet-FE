import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../_layout";

export default function Login() {
  const { login } = useAuth();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>로그인</Text>

      <TextInput placeholder="이메일" style={styles.input} />
      <TextInput placeholder="비밀번호" secureTextEntry style={styles.input} />

      <Button title="로그인" onPress={login} />

      <Link href="/(auth)/signup" style={styles.link}>
        회원가입
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, gap: 12 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8 },
  link: { marginTop: 8, textAlign: "center", color: "blue" },
});
