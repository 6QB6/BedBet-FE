import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  getAccessToken,
  API_BASE,
  getAuthHeaders,
  ensureTokenOrThrow,
  fetchJson,
} from "../../auth";
import { useRouter } from "expo-router";
import { useAuth } from "../_layout";

// ======================= API 타입/유틸 =======================
type ApiTeam = {
  name: string;
  teamUid: string;
  ownerUid: string;
  challenge_start_at: string; // ISO
  challenge_end_at: string; // ISO
  created_at: string;
  teammates: { userUid: string; coin: number }[];
  bet_coins: number;
};

type TeamListResponse = {
  status_code: number; // 201
  message: string;
  teams: ApiTeam[];
};

type Room = {
  id: string; // teamUid
  startTime: string; // ISO(+09:00로 표기되는 문자열 가능)
  endTime: string; // ISO
  participants: number;
  totalCoin: number;
  name: string;
};

// 00:00 ~ 23:30 30분 단위
const HALF_HOUR_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 ? 30 : 0;
  return `${String(h).padStart(2, "0")}:${m === 0 ? "00" : "30"}`;
});
const timeToIndex = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 2 + (m >= 30 ? 1 : 0);
};

// 화면 표기에 사용 (단순 HH:mm)
const fmtRange = (startISO: string, endISO: string) => {
  const s = new Date(startISO);
  const e = new Date(endISO);
  const sH = String(s.getHours()).padStart(2, "0");
  const sM = String(s.getMinutes()).padStart(2, "0");
  const eH = String(e.getHours()).padStart(2, "0");
  const eM = String(e.getMinutes()).padStart(2, "0");
  return `${sH}:${sM} ~ ${eH}:${eM}`;
};

/** idx(0~47)을 KST 기준 ISO 문자열(+09:00)로 변환
 *  - 종료가 시작보다 작거나 같으면 다음날로 간주
 *  - 서버의 "KST 30분 경계" 체크를 확실히 통과하도록 오프셋 표기를 +09:00로 명시
 */
function isoKSTFromIdxPair(startIdx: number, endIdx: number) {
  const now = new Date();
  // 오늘 날짜(로컬) 00:00 기준
  const base = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );

  // 날짜/시간 계산 (로컬)
  const s = new Date(base);
  s.setMinutes(startIdx * 30);
  const e = new Date(base);
  e.setMinutes(endIdx * 30);
  if (endIdx <= startIdx) {
    e.setDate(e.getDate() + 1);
  }

  // YYYY-MM-DDTHH:mm:SS.mmm+09:00 형식 만들기
  const pad = (n: number, len = 2) => String(n).padStart(len, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:00.000+09:00`;
  return { startISO: fmt(s), endISO: fmt(e) };
}

/** team/list → Room[] 매핑 */
function mapTeamsToRooms(res: TeamListResponse): Room[] {
  return (res.teams ?? []).map((t) => ({
    id: t.teamUid,
    name: t.name,
    startTime: t.challenge_start_at,
    endTime: t.challenge_end_at,
    participants: t.teammates?.length ?? 0,
    totalCoin: t.bet_coins ?? 0,
  }));
}

// ======================= 컴포넌트 =======================
export default function Home() {

  const { logout } = useAuth();
  const router = useRouter();
  const [checkingToken, setCheckingToken] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          logout();            // 컨텍스트 상태 초기화
          router.replace("/login"); // 뒤로가기 방지
          return;
        }
      } finally {
        if (alive) setCheckingToken(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  
  // ───────── 필터(조회만) ─────────
  const [sleepIdx, setSleepIdx] = useState<number | null>(null);
  const [wakeIdx, setWakeIdx] = useState<number | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // ───────── 데이터 상태 ─────────
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ───────── 참가 모달 ─────────
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinTarget, setJoinTarget] = useState<Room | null>(null);
  const [bet, setBet] = useState("0"); // 0~500

  // ───────── 방 생성(FAB) 모달 ─────────
  const [createOpen, setCreateOpen] = useState(false);
  const [createStartIdx, setCreateStartIdx] = useState<number | null>(null);
  const [createEndIdx, setCreateEndIdx] = useState<number | null>(null);
  const [createBet, setCreateBet] = useState("0"); // 초기 본인 베팅(옵션) 0~500

  const filtered = useMemo(() => {
    if (sleepIdx === null || wakeIdx === null) return rooms;
    return rooms.filter((r) => {
      const [sHHMM, eHHMM] = fmtRange(r.startTime, r.endTime).split(" ~ ");
      const s = timeToIndex(sHHMM);
      const e = timeToIndex(eHHMM);
      return s === sleepIdx && e === wakeIdx;
    });
  }, [rooms, sleepIdx, wakeIdx]);

  // ======================= API 연동 부분 =======================
  async function fetchRooms() {
    try {
      setError(null);
      setLoading(true);
      
      const json = await fetchJson<TeamListResponse>(`${API_BASE}/team/list`, {
        method: "GET",
        headers: await getAuthHeaders(),
      });

      // API 응답이 status_code: 200 또는 201인지 확인
      if (json.status_code !== 200 && json.status_code !== 201) {
        throw new Error(json.message || "Failed to get teams");
      }

      setRooms(mapTeamsToRooms(json));
    } catch (e: any) {
      setError(e?.message ?? "failed to load");
      console.error("Failed to fetch rooms:", e);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    fetchRooms();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRooms();
    setRefreshing(false);
  };

  const openJoin = (room: Room) => {
    setJoinTarget(room);
    setBet("0");
    setJoinOpen(true);
  };

  /** 팀 참가: POST team/join  { teamUid, coin } */
  const confirmJoin = async () => {
    const coin = Math.max(0, Math.min(500, Number(bet) || 0));
    try {
      if (!joinTarget) return;
      await ensureTokenOrThrow();
      await fetchJson(`${API_BASE}/team/join`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({ teamUid: joinTarget.id, coin }),
      });
      setJoinOpen(false);
      setJoinTarget(null);
      await fetchRooms();
    } catch (e: any) {
      setError(e?.message ?? "join failed");
    }
  };

  const openCreate = () => {
    setCreateStartIdx(null);
    setCreateEndIdx(null);
    setCreateBet("0");
    setCreateOpen(true);
  };

  /** 팀 생성: POST team/create
   *  BODY: { name, challenge_start_at, challenge_end_at, coin }
   *  - 시간은 KST 30분 경계(+09:00)로 전송
   */
  const confirmCreate = async () => {
    if (createStartIdx === null || createEndIdx === null) return;
    const coin = Math.max(0, Math.min(500, Number(createBet) || 0));

    const { startISO, endISO } = isoKSTFromIdxPair(
      createStartIdx,
      createEndIdx
    );

    // 팀 이름 간단 생성 (중복 방지용 타임스탬프)
    const name = `room_${startISO.slice(11, 16)}_${endISO.slice(11, 16)}_${Date.now()}`;

    try {
      await ensureTokenOrThrow();
      await fetchJson(`${API_BASE}/team/create`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          name,
          challenge_start_at: startISO, // KST 30분 경계(+09:00) 포맷 권장
          challenge_end_at: endISO,
          coin,
        }),
      });
      setCreateOpen(false);
      await fetchRooms();
    } catch (e: any) {
      setError(e?.message ?? "create failed");
    }
  };

  // ======================= UI =======================
  if (checkingToken) {
    return (
      <SafeAreaView style={styles.safe}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.brand}>BedBet</Text>
          <Pressable style={styles.menuBtn} onPress={() => setFilterOpen(true)}>
            <Text style={styles.menuText}>필터</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }
  return (
    <SafeAreaView style={styles.safe}>
      {/* 필터 상태 표시 */}
        <View style={styles.filterBar}>
          <Pressable
            style={styles.filterChip}
            onPress={() => setFilterOpen(true)}
          >
            <Text style={styles.filterLabel}>취침</Text>
            <Text style={styles.filterValue}>
              {sleepIdx === null ? "-" : HALF_HOUR_SLOTS[sleepIdx]}
            </Text>
          </Pressable>
          <Pressable
            style={styles.filterChip}
            onPress={() => setFilterOpen(true)}
          >
            <Text style={styles.filterLabel}>기상</Text>
            <Text style={styles.filterValue}>
              {wakeIdx === null ? "-" : HALF_HOUR_SLOTS[wakeIdx]}
            </Text>
          </Pressable>
        </View>

        {/* 목록 */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={{ color: "crimson" }}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 120 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={{ gap: 6 }}>
                  <Text style={styles.cardTime}>
                    {fmtRange(item.startTime, item.endTime)}
                  </Text>
                  <View style={styles.row}>
                    <Text style={styles.metaLine}>👥 {item.participants}</Text>
                    <Text style={styles.metaLine}>🪙 {item.totalCoin}</Text>
                  </View>
                </View>
                <Pressable style={styles.joinFab} onPress={() => openJoin(item)}>
                  <Text style={styles.joinFabText}>참가</Text>
                </Pressable>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text>해당 조건의 방이 없습니다.</Text>
              </View>
            }
          />
        )}

        {/* 플로팅 추가 버튼 (방 생성) */}
        <Pressable style={styles.fab} onPress={openCreate}>
          <Text style={styles.fabPlus}>＋</Text>
        </Pressable>

        {/* 필터 모달 */}
        <Modal visible={filterOpen} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>취침 / 기상 시간 선택</Text>

              <View style={styles.pickersRow}>
                <View style={styles.pickerCol}>
                  <Text style={styles.pickerLabel}>취침</Text>
                  <FlatList
                    style={styles.timeList}
                    data={HALF_HOUR_SLOTS}
                    keyExtractor={(t) => `s-${t}`}
                    renderItem={({ item, index }) => (
                      <Pressable
                        style={[
                          styles.timeItem,
                          index === sleepIdx && styles.timeItemSelected,
                        ]}
                        onPress={() => setSleepIdx(index)}
                      >
                        <Text
                          style={[
                            styles.timeText,
                            index === sleepIdx && styles.timeTextSelected,
                          ]}
                        >
                          {item}
                        </Text>
                      </Pressable>
                    )}
                  />
                </View>

                <View style={styles.pickerCol}>
                  <Text style={styles.pickerLabel}>기상</Text>
                  <FlatList
                    style={styles.timeList}
                    data={HALF_HOUR_SLOTS}
                    keyExtractor={(t) => `w-${t}`}
                    renderItem={({ item, index }) => (
                      <Pressable
                        style={[
                          styles.timeItem,
                          index === wakeIdx && styles.timeItemSelected,
                        ]}
                        onPress={() => setWakeIdx(index)}
                      >
                        <Text
                          style={[
                            styles.timeText,
                            index === wakeIdx && styles.timeTextSelected,
                          ]}
                        >
                          {item}
                        </Text>
                      </Pressable>
                    )}
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.btn, styles.btnGhost]}
                  onPress={() => setFilterOpen(false)}
                >
                  <Text style={[styles.btnText, { color: "#333" }]}>닫기</Text>
                </Pressable>
                <Pressable
                  style={[styles.btn, styles.btnPrimary]}
                  onPress={() => setFilterOpen(false)}
                >
                  <Text style={[styles.btnText, { color: "white" }]}>적용</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* 참가 모달 */}
        <Modal visible={joinOpen} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>베팅 금액 (최대 500코인)</Text>
              <Text style={styles.modalSubtitle}>
                방:{" "}
                {joinTarget
                  ? fmtRange(joinTarget.startTime, joinTarget.endTime)
                  : "-"}
              </Text>

              <TextInput
                value={bet}
                onChangeText={(t) => setBet(t.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                placeholder="0"
                style={styles.input}
                maxLength={4}
              />
              <Text style={styles.hint}>숫자만 입력 · 0~500</Text>

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.btn, styles.btnGhost]}
                  onPress={() => setJoinOpen(false)}
                >
                  <Text style={[styles.btnText, { color: "#333" }]}>취소</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.btn,
                    styles.btnPrimary,
                    Number(bet) > 500 && { opacity: 0.5 },
                  ]}
                  disabled={Number(bet) > 500}
                  onPress={confirmJoin}
                >
                  <Text style={[styles.btnText, { color: "white" }]}>참가</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* 방 생성 모달 */}
        <Modal visible={createOpen} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>방 생성</Text>
              <Text style={styles.modalSubtitle}>
                시작/종료 시간(30분 단위) + 초기 베팅
              </Text>

              <View style={styles.pickersRow}>
                <View style={styles.pickerCol}>
                  <Text style={styles.pickerLabel}>시작</Text>
                  <FlatList
                    style={styles.timeList}
                    data={HALF_HOUR_SLOTS}
                    keyExtractor={(t) => `cs-${t}`}
                    renderItem={({ item, index }) => (
                      <Pressable
                        style={[
                          styles.timeItem,
                          index === createStartIdx && styles.timeItemSelected,
                        ]}
                        onPress={() => setCreateStartIdx(index)}
                      >
                        <Text
                          style={[
                            styles.timeText,
                            index === createStartIdx && styles.timeTextSelected,
                          ]}
                        >
                          {item}
                        </Text>
                      </Pressable>
                    )}
                  />
                </View>

                <View style={styles.pickerCol}>
                  <Text style={styles.pickerLabel}>종료</Text>
                  <FlatList
                    style={styles.timeList}
                    data={HALF_HOUR_SLOTS}
                    keyExtractor={(t) => `ce-${t}`}
                    renderItem={({ item, index }) => (
                      <Pressable
                        style={[
                          styles.timeItem,
                          index === createEndIdx && styles.timeItemSelected,
                        ]}
                        onPress={() => setCreateEndIdx(index)}
                      >
                        <Text
                          style={[
                            styles.timeText,
                            index === createEndIdx && styles.timeTextSelected,
                          ]}
                        >
                          {item}
                        </Text>
                      </Pressable>
                    )}
                  />
                </View>
              </View>

              <TextInput
                value={createBet}
                onChangeText={(t) => setCreateBet(t.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                placeholder="초기 베팅 코인 (0~500)"
                style={styles.input}
                maxLength={4}
              />
              <Text style={styles.hint}>최대 500코인</Text>

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.btn, styles.btnGhost]}
                  onPress={() => setCreateOpen(false)}
                >
                  <Text style={[styles.btnText, { color: "#333" }]}>취소</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.btn,
                    styles.btnPrimary,
                    (createStartIdx === null ||
                      createEndIdx === null ||
                      Number(createBet) > 500) && { opacity: 0.5 },
                  ]}
                  disabled={
                    createStartIdx === null ||
                    createEndIdx === null ||
                    Number(createBet) > 500
                  }
                  onPress={confirmCreate}
                >
                  <Text style={[styles.btnText, { color: "white" }]}>
                    방 생성
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>      
    );
  }


const cardShadow = {
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#EDF0FF" },

  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "#cfd7ff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: { fontSize: 22, fontWeight: "800" },
  menuBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "white",
  },
  menuText: { fontWeight: "600" },

  filterBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterChip: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "white",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...cardShadow,
  },
  filterLabel: { fontWeight: "700" },
  filterValue: { color: "#666" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: "white",
    padding: 16,
    ...cardShadow,
  },
  cardTime: { fontSize: 16, fontWeight: "700" },
  row: { flexDirection: "row", gap: 16, marginTop: 4 },
  metaLine: { color: "#666" },

  joinFab: {
    position: "absolute",
    right: 12,
    bottom: 12,
    backgroundColor: "#111",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  joinFabText: { color: "white", fontWeight: "700" },

  // 플로팅 추가 버튼
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6C5CE7",
    alignItems: "center",
    justifyContent: "center",
    ...cardShadow,
  },
  fabPlus: { color: "white", fontSize: 30, lineHeight: 30, fontWeight: "800" },

  // 공통 모달 스타일
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    backgroundColor: "white",
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  modalSubtitle: { marginTop: 6, color: "#555" },

  pickersRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  pickerCol: { flex: 1 },
  pickerLabel: { fontWeight: "700", marginBottom: 8 },
  timeList: {
    maxHeight: 220,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
  },
  timeItem: { paddingVertical: 8, paddingHorizontal: 12 },
  timeItemSelected: { backgroundColor: "#EEF2FF" },
  timeText: { fontSize: 14, color: "#222" },
  timeTextSelected: { fontWeight: "800", color: "#3b5bdb" },

  modalActions: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  btn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  btnGhost: { backgroundColor: "#f2f2f2" },
  btnPrimary: { backgroundColor: "#111" },
  btnText: { fontWeight: "700" },

  input: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  hint: { marginTop: 6, color: "#888" },
});
