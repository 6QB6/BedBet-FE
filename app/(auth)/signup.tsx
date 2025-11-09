// app/(auth)/signup.tsx
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { useAuth } from "../_layout";
import { API_BASE } from "@/auth";

type StepKey = "name" | "contact" | "payment";
const STEPS: StepKey[] = ["name", "contact", "payment"];

export default function SignUp() {
  const router = useRouter();
  const { login } = useAuth();

  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex];

  // form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [bank, setBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  // verification & submit states
  const [requestingCode, setRequestingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const isValidEmail = (v: string) => /\S+@\S+\.\S+/.test(v);
  const isContactStepValid = useMemo(() => {
    // 이메일 형식 + 코드 입력 + 비번 일치 + 이메일 인증 완료
    return (
      isValidEmail(email) &&
      code.trim().length > 0 &&
      password.trim().length > 0 &&
      password === passwordConfirm &&
      emailVerified
    );
  }, [email, code, password, passwordConfirm, emailVerified]);

  const isCurrentStepComplete = useMemo(() => {
    switch (step) {
      case "name":
        return name.trim().length > 0;
      case "contact":
        return isContactStepValid;
      case "payment":
        return bank.trim().length > 0 && accountNumber.trim().length > 0;
      default:
        return false;
    }
  }, [step, name, isContactStepValid, bank, accountNumber]);

  const goBack = () => {
    if (stepIndex === 0) {
      router.back();
      return;
    }
    setErrorMsg(null);
    setInfoMsg(null);
    setStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const goNext = async () => {
    if (!isCurrentStepComplete || submitting) return;

    // 마지막 단계면: 회원가입 → 자동 로그인 → 메인으로
    if (stepIndex === STEPS.length - 1) {
      await submitSignup();
      return;
    }

    setErrorMsg(null);
    setInfoMsg(null);
    setStepIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  // ─────────── 이메일 인증 코드 전송 ───────────
  const onRequestCode = async () => {
    if (!isValidEmail(email) || requestingCode) return;
    setRequestingCode(true);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      const res = await fetch(`${API_BASE}/auth/verify/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data?.message === "string"
            ? data.message
            : `코드 전송 실패 (HTTP ${res.status})`;
        setErrorMsg(msg);
        return;
      }
      setInfoMsg("인증 코드가 전송되었습니다. 메일함을 확인해 주세요.");
    } catch {
      setErrorMsg("네트워크 오류: 코드 전송에 실패했습니다.");
    } finally {
      setRequestingCode(false);
    }
  };

  // ─────────── 이메일 코드 인증 ───────────
  const onVerifyCode = async () => {
    if (!isValidEmail(email) || code.trim().length === 0 || verifyingCode)
      return;
    setVerifyingCode(true);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      const res = await fetch(`${API_BASE}/auth/verify/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof data?.message === "string"
            ? data.message
            : `인증 실패 (HTTP ${res.status})`;
        setErrorMsg(msg);
        setEmailVerified(false);
        return;
      }
      setEmailVerified(true);
      setInfoMsg("이메일 인증이 완료되었습니다.");
    } catch {
      setErrorMsg("네트워크 오류: 인증에 실패했습니다.");
      setEmailVerified(false);
    } finally {
      setVerifyingCode(false);
    }
  };

  // ─────────── 회원가입 → 자동 로그인 ───────────
  const submitSignup = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    setInfoMsg(null);

    try {
      // 1) 회원가입
      const signupRes = await fetch(`${API_BASE}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          password,
          account_number: accountNumber,
          bank,
        }),
      });
      const signupJson = await signupRes.json().catch(() => ({}));

      if (!signupRes.ok) {
        const msg =
          typeof signupJson?.message === "string"
            ? signupJson.message
            : `회원가입 실패 (HTTP ${signupRes.status})`;
        setErrorMsg(msg);
        setSubmitting(false);
        return;
      }

      // 2) 자동 로그인(사인인)으로 유저 정보 확보
      const signinRes = await fetch(`${API_BASE}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const signinJson = await signinRes.json().catch(() => ({}));

      if (!signinRes.ok) {
        const msg =
          typeof signinJson?.message === "string"
            ? signinJson.message
            : `자동 로그인 실패 (HTTP ${signinRes.status})`;
        setErrorMsg(msg);
        setSubmitting(false);
        return;
      }

      // 3) 컨텍스트 저장 후 메인으로 이동
      const u = signinJson.user;
      login({
        name: u?.name ?? name,
        email: u?.email ?? email,
        bank: u?.bank ?? bank,
        account_number: u?.account_number ?? accountNumber,
        coin: typeof u?.coin === "number" ? u.coin : 0,
        token: signinJson.access_token,
      });

      router.replace("/(tabs)");
    } catch {
      setErrorMsg("네트워크 오류: 회원가입을 완료하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
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

      {/* 본문 */}
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
            onRequestCode={onRequestCode}
            onVerifyCode={onVerifyCode}
            requestingCode={requestingCode}
            verifyingCode={verifyingCode}
            emailVerified={emailVerified}
            isValidEmail={isValidEmail(email)}
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

      {/* 메시지 */}
      {!!errorMsg && (
        <Text
          style={{ color: "crimson", textAlign: "center", marginBottom: 8 }}
        >
          {errorMsg}
        </Text>
      )}
      {!!infoMsg && (
        <Text
          style={{ color: "#3b5bdb", textAlign: "center", marginBottom: 8 }}
        >
          {infoMsg}
        </Text>
      )}

      {/* 하단 네비게이션 */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.footerButton, styles.prevButton]}
          onPress={goBack}
          disabled={submitting}
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
            submitting && { opacity: 0.6 },
          ]}
          onPress={goNext}
          disabled={!isCurrentStepComplete || submitting}
        >
          {submitting ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.footerButtonText}>
              {stepIndex === STEPS.length - 1 ? "완료" : "다음"}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

type NameStepProps = { value: string; onChange: (value: string) => void };
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
  onRequestCode: () => void;
  onVerifyCode: () => void;
  requestingCode: boolean;
  verifyingCode: boolean;
  emailVerified: boolean;
  isValidEmail: boolean;
};

function ContactStep(props: ContactStepProps) {
  const {
    email,
    code,
    password,
    passwordConfirm,
    onChangeEmail,
    onChangeCode,
    onChangePassword,
    onChangePasswordConfirm,
    onRequestCode,
    onVerifyCode,
    requestingCode,
    verifyingCode,
    emailVerified,
    isValidEmail,
  } = props;

  const codeBtnEnabled = code.trim().length > 0;

  return (
    <View style={styles.stepCard}>
      {/* 이메일 + 코드 전송 */}
      <View style={styles.inputBox}>
        <TextInput
          placeholder="이메일 ex) user@gmail.com"
          placeholderTextColor="#bdbdbd"
          style={styles.inputField}
          value={email}
          onChangeText={onChangeEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Pressable
          onPress={onRequestCode}
          disabled={!isValidEmail || requestingCode}
          style={[
            styles.inlineButton,
            (isValidEmail || requestingCode) && styles.inlineButtonActive,
            requestingCode && { opacity: 0.7 },
          ]}
        >
          {requestingCode ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.inlineButtonText}>코드 전송</Text>
          )}
        </Pressable>
      </View>

      {/* 코드 입력 + 인증 */}
      <View style={styles.inputBox}>
        <TextInput
          placeholder="코드 입력"
          placeholderTextColor="#bdbdbd"
          style={styles.inputField}
          value={code}
          onChangeText={onChangeCode}
        />
        <Pressable
          onPress={onVerifyCode}
          disabled={!codeBtnEnabled || verifyingCode}
          style={[
            styles.inlineButton,
            (codeBtnEnabled || verifyingCode) && styles.inlineButtonActive,
            verifyingCode && { opacity: 0.7 },
          ]}
        >
          {verifyingCode ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.inlineButtonText}>
              {emailVerified ? "인증완료" : "인증"}
            </Text>
          )}
        </Pressable>
      </View>

      {/* 비밀번호 & 확인 */}
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

      {emailVerified ? (
        <Text style={{ color: "#3b5bdb" }}>이메일 인증이 완료되었습니다.</Text>
      ) : null}
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
  backButtonPressed: { backgroundColor: "#f2f2f2" },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#1f1f1f" },
  headerSpacer: { width: 32 },
  content: { flex: 1, justifyContent: "center" },
  stepCard: { gap: 20 },

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
  inputField: { flex: 1, fontSize: 16, color: "#1f1f1f" },

  inlineButton: {
    marginLeft: 12,
    backgroundColor: "#FFE8AE",
    borderRadius: 12,
    height: 40,
    minWidth: 84,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  inlineButtonActive: { backgroundColor: "#FEDF89" },
  inlineButtonText: { color: "#1f1f1f", fontSize: 14, fontWeight: "500" },

  footer: { flexDirection: "row", gap: 12 },
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
  nextButton: { backgroundColor: "#FEE9A8" },
  nextButtonActive: { backgroundColor: "#FEDF89" },
  footerButtonText: { fontSize: 16, fontWeight: "500", color: "#1f1f1f" },
  prevButtonText: { color: "#b0b0b0" },
});
