import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../_layout";

export default function Login() {
  const { login } = useAuth();
  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <Text style={styles.inputLabel}>ID</Text>
        <TextInput
          placeholder="ex) @gmail.com"
          placeholderTextColor="#c5c5c5"
          keyboardType="email-address"
          style={styles.rowInput}
        />
      </View>

      <View style={styles.inputRow}>
        <Text style={styles.inputLabel}>PW</Text>
        <TextInput
          placeholder=""
          secureTextEntry
          style={styles.rowInput}
        />
      </View>

      <Pressable style={styles.button} onPress={login}>
        <Text style={styles.buttonText}>로그인</Text>
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
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  rowInput: {
    flex: 1,
    textAlign: "right",
    fontSize: 16,
    color: "#1a1a1a",
    marginLeft: 12,
    borderWidth: 0,
  },
  link: { marginTop: 8, textAlign: "center", color: "#9c9c9c" },

  button: {
    backgroundColor: "#FEDF89",
    height: 56,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  buttonText: { color: "#1a1a1a", fontSize: 16, fontWeight: "regular" },
});
