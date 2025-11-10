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

type MemberInfo = {
  userUid: string;
  name: string;
  email: string;
  account_number: string;
  coin: number;
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
  const [joinError, setJoinError] = useState<string | null>(null);


  // ───────── 방 생성(FAB) 모달 ─────────
  const [createOpen, setCreateOpen] = useState(false);
  const [createStartIdx, setCreateStartIdx] = useState<number | null>(null);
  const [createEndIdx, setCreateEndIdx] = useState<number | null>(null);
  const [createBet, setCreateBet] = useState("0"); // 초기 본인 베팅(옵션) 0~500

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTeam, setDetailTeam] = useState<ApiTeam | null>(null);
  const [detailMembers, setDetailMembers] = useState<MemberInfo[]>([]);
  const [detailError, setDetailError] = useState<string | null>(null);
  
  const openRoom = async (room: Room) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setDetailTeam(null);
    setDetailMembers([]);

    try {
      await ensureTokenOrThrow();
      const headers = await getAuthHeaders();

      // 1) 팀 정보 조회
      const teamRes = await fetch(`${API_BASE}/team/info/${room.id}`, {
        method: "GET",
        headers,
      });
      const teamData = await teamRes.json().catch(() => ({} as any));

      if (!teamRes.ok) {
        let msg = "방 정보를 불러오지 못했습니다.";
        const apiMsg =
          typeof teamData?.detail?.message === "string"
            ? teamData.detail.message
            : typeof teamData?.message === "string"
            ? teamData.message
            : null;
        if (apiMsg) msg = apiMsg;

        setDetailError(msg);
        return;
      }

      const team: ApiTeam = teamData.team;
      setDetailTeam(team);

      // 2) 참여자 정보 조회 (각 userUid별)
      const members: MemberInfo[] = [];
      for (const tm of team.teammates ?? []) {
        try {
          const uRes = await fetch(`${API_BASE}/user/info/${tm.userUid}`, {
            method: "GET",
            headers,
          });
          const uData = await uRes.json().catch(() => ({} as any));

          if (uRes.ok && uData?.user) {
            members.push({
              userUid: tm.userUid,
              name: uData.user.name,
              email: uData.user.email,
              account_number: uData.user.account_number,
              coin: tm.coin,
            });
          } else {
            members.push({
              userUid: tm.userUid,
              name: "알 수 없음",
              email: "-",
              account_number: "-",
              coin: tm.coin,
            });
          }
        } catch {
          members.push({
            userUid: tm.userUid,
            name: "알 수 없음",
            email: "-",
            account_number: "-",
            coin: tm.coin,
          });
        }
      }

      setDetailMembers(members);
    } catch (e: any) {
      setDetailError(e?.message ?? "네트워크 오류가 발생했습니다.");
    } finally {
      setDetailLoading(false);
    }
  };


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
  /** 팀 참가: POST team/join  { teamUid, coin } */
const confirmJoin = async () => {
  const coin = Math.max(0, Math.min(500, Number(bet) || 0));

  try {
    if (!joinTarget) return;

    await ensureTokenOrThrow();

    const res = await fetch(`${API_BASE}/team/join`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ teamUid: joinTarget.id, coin }),
    });

    const data = await res.json().catch(() => ({} as any));

    if (!res.ok) {
      // ── 명세서에 따라 에러 메시지 꺼내기 ──
      // { detail: { message: "..." } } 형태
      let msg = "팀 참가에 실패했습니다.";

      const apiMsg =
        typeof data?.detail?.message === "string"
          ? data.detail.message
          : typeof data?.message === "string"
          ? data.message
          : null;

      if (apiMsg) msg = apiMsg;

      // 상태 코드에 따라(원하면 커스텀 메시지도 가능)
      // switch (res.status) {
      //   case 404:
      //     msg = apiMsg || "팀 또는 유저를 찾을 수 없습니다.";
      //     break;
      //   case 409:
      //     msg = apiMsg || "이미 이 팀에 가입되어 있습니다.";
      //     break;
      //   case 400:
      //     msg = apiMsg || "다른 팀에 속해 있거나 코인이 부족합니다.";
      //     break;
      // }

      setJoinError(msg); // ✅ 모달에 보여줄 메시지 설정
      return;
    }

    // 성공 (200)
    // { "message": "Successfully joined team" }
    setJoinOpen(false);
    setJoinTarget(null);
    await fetchRooms();
  } catch (e: any) {
    setJoinError(e?.message ?? "네트워크 오류가 발생했습니다.");
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

    const name = `room_${startISO.slice(11, 16)}_${endISO.slice(11, 16)}_${Date.now()}`;

    try {
      await ensureTokenOrThrow();

      const res = await fetch(`${API_BASE}/team/create`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          name,
          challenge_start_at: startISO,
          challenge_end_at: endISO,
          coin
        }),
      });


      const data = await res.json().catch(() => ({} as any));

      if (!res.ok) {
        let msg = "팀 생성에 실패했습니다.";
        const apiMsg =
          typeof data?.detail?.message === "string"
            ? data.detail.message
            : typeof data?.message === "string"
            ? data.message
            : null;
        if (apiMsg) msg = apiMsg;
        setError(msg);
        return;
      }

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
              <Pressable style={styles.card} onPress={() => openRoom(item)}>
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
              </Pressable>
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

        {/* 방 상세 모달 */}
        <Modal visible={detailOpen} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalBox, { maxHeight: "80%" }]}>
              <Text style={styles.modalTitle}>
                {detailTeam?.name ?? "방 정보"}
              </Text>

              {detailLoading ? (
                <View style={[styles.center, { paddingVertical: 20 }]}>
                  <ActivityIndicator />
                </View>
              ) : detailError ? (
                <Text style={[styles.modalSubtitle, { color: "crimson", marginTop: 12 }]}>
                  {detailError}
                </Text>
              ) : detailTeam ? (
                <>
                  <Text style={[styles.modalSubtitle, { marginTop: 8 }]}>
                    {fmtRange(
                      detailTeam.challenge_start_at,
                      detailTeam.challenge_end_at
                    )}
                  </Text>
                  <Text style={{ marginTop: 8 }}>
                    총 베팅 코인: {detailTeam.bet_coins}
                  </Text>
                  <Text style={{ marginTop: 4 }}>
                    참여 인원: {detailTeam.teammates?.length ?? 0}명
                  </Text>

                  <Text style={{ marginTop: 14, fontWeight: "700" }}>
                    참여자 목록
                  </Text>

                  <FlatList
                    data={detailMembers}
                    keyExtractor={(m) => m.userUid}
                    style={{ marginTop: 8, maxHeight: 220 }}
                    renderItem={({ item }) => (
                      <View style={{ paddingVertical: 6 }}>
                        <Text style={{ fontWeight: "600" }}>
                          {item.name} ({item.email})
                        </Text>
                        <Text style={{ fontSize: 12, color: "#666" }}>
                          베팅: {item.coin} · 계좌: {item.account_number}
                        </Text>
                      </View>
                    )}
                    ListEmptyComponent={
                      <Text style={{ marginTop: 4 }}>참여자가 없습니다.</Text>
                    }
                  />
                </>
              ) : (
                <Text style={[styles.modalSubtitle, { marginTop: 12 }]}>
                  방 정보를 찾을 수 없습니다.
                </Text>
              )}

              <View style={[styles.modalActions, { marginTop: 18 }]}>
                <Pressable
                  style={[styles.btn, styles.btnGhost]}
                  onPress={() => {
                    setDetailOpen(false);
                    setDetailTeam(null);
                    setDetailMembers([]);
                    setDetailError(null);
                  }}
                >
                  <Text style={[styles.btnText, { color: "#333" }]}>닫기</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>


        <Modal visible={joinError !== null} transparent animationType="fade">
          <View style={styles.modalBackdrop}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>팀 참가 실패</Text>
              <Text style={[styles.modalSubtitle, { marginTop: 12 }]}>
                {joinError}
              </Text>

              <View
                style={[
                  styles.modalActions,
                  { justifyContent: "center", marginTop: 18 },
                ]}
              >
                <Pressable
                  style={[styles.btn, styles.btnPrimary]}
                  onPress={() => setJoinError(null)}
                >
                  <Text style={[styles.btnText, { color: "white" }]}>확인</Text>
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
