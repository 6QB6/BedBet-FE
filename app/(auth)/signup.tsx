import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";

type StepKey = "name" | "contact" | "payment";
const STEPS: StepKey[] = ["name", "contact", "payment"];

export default function SignUp() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];

  const goBack = () => {
    if (stepIndex === 0) {
      router.back();
      return;
    }
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const goNext = () => {
    if (stepIndex === STEPS.length - 1) {
      router.back();
      return;
    }
    setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
        >
          <Ionicons name="chevron-back" size={22} color="#1f1f1f" />
        </Pressable>
        <Text style={styles.headerTitle}>회원가입</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* 본문 콘텐츠 */}
      <View style={styles.content}>
        {step === "name" ? <NameStep /> : step === "contact" ? <ContactStep /> : <PaymentStep />}
      </View>

      {/* 하단 네비게이션 */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.footerButton, styles.prevButton]}
          onPress={goBack}
        >
          <Text style={[styles.footerButtonText, styles.prevButtonText]}>
            이전
          </Text>
        </Pressable>

        <Pressable
          style={[styles.footerButton, styles.nextButton]}
          onPress={goNext}
        >
          <Text style={styles.footerButtonText}>
            {stepIndex === STEPS.length - 1 ? "완료" : "다음"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function NameStep() {
  return (
    <View style={styles.stepCard}>
      <View style={styles.inputRow}>
        <TextInput
          placeholder="이름"
          placeholderTextColor="#bdbdbd"
          style={styles.rowInput}
        />
      </View>
    </View>
  );
}

function ContactStep() {
  return (
    <View style={styles.stepCard}>
      <View style={styles.inputRow}>
        <TextInput
          placeholder="이메일 ex) @gmail.com"
          placeholderTextColor="#bdbdbd"
          style={styles.rowInput}
        />
        <Pressable style={styles.inlineButton}>
          <Text style={styles.inlineButtonText}>코드 전송</Text>
        </Pressable>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          placeholder="코드 입력"
          placeholderTextColor="#bdbdbd"
          style={styles.rowInput}
        />
        <Pressable style={styles.inlineButton}>
          <Text style={styles.inlineButtonText}>인증</Text>
        </Pressable>
      </View>

      <TextInput placeholder="비밀번호" secureTextEntry style={styles.singleInput} />
      <TextInput placeholder="비밀번호 확인" secureTextEntry style={styles.singleInput} />
    </View>
  );
}

function PaymentStep() {
  return (
    <View style={styles.stepCard}>
      <TextInput placeholder="은행명" style={styles.singleInput} />
      <TextInput placeholder="계좌번호" style={styles.singleInput} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonPressed: {
    backgroundColor: "#f2f2f2",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f1f1f",
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  stepCard: {
    gap: 20,
    backgroundColor: "#ffffff",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#f1f1f1",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  rowInput: {
    flex: 1,
    fontSize: 16,
    color: "#1f1f1f",
    paddingVertical: 2,
  },
  inlineButton: {
    marginLeft: 16,
    backgroundColor: "#FFE8AE",
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 96,
    alignItems: "center",
  },
  inlineButtonText: {
    color: "#1f1f1f",
    fontSize: 14,
    fontWeight: "600",
  },
  singleInput: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eeeeee",
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  prevButton: {
    borderWidth: 1,
    borderColor: "#dedede",
    backgroundColor: "#ffffff",
  },
  nextButton: {
    backgroundColor: "#FEE9A8",
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f1f1f",
  },
  prevButtonText: {
    color: "#b0b0b0",
  },
});
