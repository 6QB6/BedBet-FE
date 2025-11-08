import { View, Text, TextInput, Button, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export default function SignUp() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>회원가입</Text>

      <TextInput placeholder="이름" style={styles.input} />
      <TextInput placeholder="이메일" style={styles.input} />
      <TextInput placeholder="비밀번호" secureTextEntry style={styles.input} />
      <TextInput placeholder="은행명" style={styles.input} />
      <TextInput placeholder="계좌번호" style={styles.input} />

      <Button title="가입 완료" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, gap: 12 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8 },
});
