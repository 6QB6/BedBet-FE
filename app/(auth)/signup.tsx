import { View, Text, TextInput, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";

type StepKey = "name" | "contact" | "payment";
const STEPS: StepKey[] = ["name", "contact", "payment"];

export default function SignUp() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [bank, setBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const isCurrentStepComplete = useMemo(() => {
    switch (step) {
      case "name":
        return name.trim().length > 0;
      case "contact":
        return (
          email.trim().length > 0 &&
          code.trim().length > 0 &&
          password.trim().length > 0 &&
          password === passwordConfirm
        );
      case "payment":
        return bank.trim().length > 0 && accountNumber.trim().length > 0;
      default:
        return false;
    }
  }, [step, name, email, code, password, passwordConfirm, bank, accountNumber]);

  const goBack = () => {
    if (stepIndex === 0) {
      router.back();
      return;
    }
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const goNext = () => {
    if (!isCurrentStepComplete) {
      return;
    }
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
        {step === "name" ? (
          <NameStep value={name} onChange={setName} />
        ) : step === "contact" ? (
          <ContactStep
            email={email}
            code={code}
            password={password}
            passwordConfirm={passwordConfirm}
            onChangeEmail={setEmail}
            onChangeCode={setCode}
            onChangePassword={setPassword}
            onChangePasswordConfirm={setPasswordConfirm}
          />
        ) : (
          <PaymentStep
            bank={bank}
            accountNumber={accountNumber}
            onChangeBank={setBank}
            onChangeAccount={setAccountNumber}
          />
        )}
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
          style={[
            styles.footerButton,
            styles.nextButton,
            isCurrentStepComplete && styles.nextButtonActive,
          ]}
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

type NameStepProps = {
  value: string;
  onChange: (value: string) => void;
};

function NameStep({ value, onChange }: NameStepProps) {
  return (
    <View style={styles.stepCard}>
      <View style={styles.inputBox}>
        <TextInput
          placeholder="이름"
          placeholderTextColor="#bdbdbd"
          style={styles.inputField}
          value={value}
          onChangeText={onChange}
        />
      </View>
    </View>
  );
}

type ContactStepProps = {
  email: string;
  code: string;
  password: string;
  passwordConfirm: string;
  onChangeEmail: (value: string) => void;
  onChangeCode: (value: string) => void;
  onChangePassword: (value: string) => void;
  onChangePasswordConfirm: (value: string) => void;
};

function ContactStep({
  email,
  code,
  password,
  passwordConfirm,
  onChangeEmail,
  onChangeCode,
  onChangePassword,
  onChangePasswordConfirm,
}: ContactStepProps) {
  const emailActive = email.trim().length > 0;
  const codeActive = code.trim().length > 0;

  return (
    <View style={styles.stepCard}>
      <View style={styles.inputBox}>
        <TextInput
          placeholder="이메일 ex) @gmail.com"
          placeholderTextColor="#bdbdbd"
          style={styles.inputField}
          value={email}
          onChangeText={onChangeEmail}
        />
        <Pressable
          style={[
            styles.inlineButton,
            emailActive && styles.inlineButtonActive,
          ]}
        >
          <Text style={styles.inlineButtonText}>코드 전송</Text>
        </Pressable>
      </View>

      <View style={styles.inputBox}>
        <TextInput
          placeholder="코드 입력"
          placeholderTextColor="#bdbdbd"
          style={styles.inputField}
          value={code}
          onChangeText={onChangeCode}
        />
        <Pressable
          style={[
            styles.inlineButton,
            codeActive && styles.inlineButtonActive,
          ]}
        >
          <Text style={styles.inlineButtonText}>인증</Text>
        </Pressable>
      </View>

      <View style={styles.inputBox}>
        <TextInput
          placeholder="비밀번호"
          placeholderTextColor="#bdbdbd"
          secureTextEntry
          style={styles.inputField}
          value={password}
          onChangeText={onChangePassword}
        />
      </View>

      <View style={styles.inputBox}>
        <TextInput
          placeholder="비밀번호 확인"
          placeholderTextColor="#bdbdbd"
          secureTextEntry
          style={styles.inputField}
          value={passwordConfirm}
          onChangeText={onChangePasswordConfirm}
        />
      </View>
    </View>
  );
}

type PaymentStepProps = {
  bank: string;
  accountNumber: string;
  onChangeBank: (value: string) => void;
  onChangeAccount: (value: string) => void;
};

function PaymentStep({
  bank,
  accountNumber,
  onChangeBank,
  onChangeAccount,
}: PaymentStepProps) {
  return (
    <View style={styles.stepCard}>
      <View style={styles.inputBox}>
        <TextInput
          placeholder="은행명"
          placeholderTextColor="#bdbdbd"
          style={styles.inputField}
          value={bank}
          onChangeText={onChangeBank}
        />
      </View>
      <View style={styles.inputBox}>
        <TextInput
          placeholder="계좌번호"
          placeholderTextColor="#bdbdbd"
          style={styles.inputField}
          value={accountNumber}
          onChangeText={onChangeAccount}
          keyboardType="number-pad"
        />
      </View>
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
  },

  /** ✅ 통일된 입력칸 스타일 */
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eeeeee",
    height: 56,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  inputField: {
    flex: 1,
    fontSize: 16,
    color: "#1f1f1f",
  },

  inlineButton: {
    marginLeft: 12,
    backgroundColor: "#FFE8AE",
    borderRadius: 12,
    height: 40,
    minWidth: 84,
    alignItems: "center",
    justifyContent: "center",
  },
  /** ✅ 입력 시 진한 노란색으로 변경 */
  inlineButtonActive: {
    backgroundColor: "#FEDF89",
  },
  inlineButtonText: {
    color: "#1f1f1f",
    fontSize: 14,
    fontWeight: "500",
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
  nextButtonActive: {
    backgroundColor: "#FEDF89",
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f1f1f",
  },
  prevButtonText: {
    color: "#b0b0b0",
  },
});