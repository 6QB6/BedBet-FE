import { View, Text, StyleSheet } from "react-native";

export default function Cash() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>캐쉬</Text>
      <Text>충전 / 출금 / 내역</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
});
