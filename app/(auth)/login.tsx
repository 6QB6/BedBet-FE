import { View, Text, TextInput, StyleSheet, Pressable, Platform } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../_layout";
import { useMemo, useState } from "react";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isFormFilled = useMemo(
    () => email.trim().length > 0 && password.trim().length > 0,
    [email, password]
  );

  const handleLogin = () => {
    if (!isFormFilled) {
      return;
    }
    login();
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <Text style={styles.inputLabel}>ID</Text>
        <TextInput
          placeholder="ex) @gmail.com"
          placeholderTextColor="#c5c5c5"
          keyboardType="email-address"
          style={[
            styles.rowInput,
            Platform.OS === "web" && styles.rowInputWeb,
          ]}
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
          style={[
            styles.rowInput,
            Platform.OS === "web" && styles.rowInputWeb,
          ]}
          underlineColorAndroid="transparent"
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <Pressable
        style={[styles.button, isFormFilled && styles.buttonActive]}
        onPress={handleLogin}
      >
        <Text style={[styles.buttonText]}>
          로그인
        </Text>
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
  rowInputWeb: {
    outlineStyle: "none",
    outlineWidth: 0,
    borderWidth: 0,
  } as any,
  link: { marginTop: 4, textAlign: "center", color: "#9c9c9c" },

  button: {
    backgroundColor: "#FEF0C7",
    height: 56,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  buttonActive: {
    backgroundColor: "#FEDF89",
  },
  buttonText: { color: "black", fontSize: 16, fontWeight: "regular" },
});
