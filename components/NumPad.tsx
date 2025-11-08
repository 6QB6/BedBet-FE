import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

type Props = { value: string; onChange: (next: string) => void; onClose?: () => void };

export default function NumPad({ value, onChange, onClose }: Props) {
  const press = (k: string) => {
    if (k === "back") onChange(value.slice(0, -1));
    else if (k === "close") onClose?.();
    else onChange((value + k).replace(/^0+/, ""));
  };

  const Key = ({ label, k }: { label: string; k: string }) => (
    <TouchableOpacity style={styles.key} onPress={() => press(k)} activeOpacity={0.8}>
      {k === "back" ? <Ionicons name="backspace" size={22} /> : <Text style={styles.keyText}>{label}</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.row}><Key label="1" k="1" /><Key label="2" k="2" /><Key label="3" k="3" /></View>
      <View style={styles.row}><Key label="4" k="4" /><Key label="5" k="5" /><Key label="6" k="6" /></View>
      <View style={styles.row}><Key label="7" k="7" /><Key label="8" k="8" /><Key label="9" k="9" /></View>
      <View style={styles.row}><Key label="닫기" k="close" /><Key label="0" k="0" /><Key label="" k="back" /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16 },
  row: { flexDirection: "row" },
  key: {
    flex: 1, height: 56, margin: 6, borderRadius: 10, borderWidth: 1, borderColor: "#E9E2D2",
    alignItems: "center", justifyContent: "center", backgroundColor: "#FFF",
  },
  keyText: { fontSize: 18, fontWeight: "700" },
});
