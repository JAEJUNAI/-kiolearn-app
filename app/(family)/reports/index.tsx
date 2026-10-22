// G5 리포트 목록
import React from 'react';
import { View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Screen, T, Box, Row, Grow, Bar, KV, Btn, Empty } from '../../../src/ui';
import { useStore, sel } from '../../../src/data/store';
import { fmtDT, fmtMD } from '../../../src/lib/fmt';
import { IMG, C, F } from '../../../src/theme';

export default function Reports() {
  const r = useRouter(); const s = useStore(); const rec = sel.myRecipient(s);
  const reps = sel.reportsOf(s, rec.id); const used = sel.usedCount(s, rec.id); const bought = sel.totalBought(s, rec.id);
  const pass = sel.activePass(s, rec.id); const next = sel.nextSession(s, rec.id);
  const solo = reps.reduce((a, x) => a + x.checks.length, 0); const firsts = reps.reduce((a, x) => a + x.checks.filter((c) => c.first).length, 0);
  const grid = reps.slice(0, 5);
  return (
    <Screen>
      <T v="ttl">{rec.honorific}의 기록</T>
      <Box kind="white" tight>
        <Row style={{ marginBottom: 8 }}><T v="h" style={{ fontSize: 16 }}>{used} / {bought}회</T><Grow /><T v="cap">남은 회차 {pass?.remaining ?? 0}</T></Row>
        <Bar pct={bought ? (used / bought) * 100 : 0} />
        <T v="cap" style={{ marginTop: 8 }}>혼자 해낸 것 {solo}개 · 처음 성공 {firsts}번</T>
      </Box>
      {reps.length === 0 ? <Empty text="첫 수업 뒤 여기에 사진과 결과가 쌓입니다." /> : (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {grid.map((x) => (
              <Pressable key={x.id} onPress={() => r.push(`/(family)/reports/${x.id}`)} style={{ width: '32%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: C.soft }}>
                {x.photo && <Image source={IMG[x.photo]} style={{ width: '100%', height: '100%' }} contentFit="cover" />}
                <View style={{ position: 'absolute', left: 6, bottom: 6, backgroundColor: 'rgba(0,0,0,.55)', borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2 }}><T style={{ color: '#fff', fontSize: 10.5, fontFamily: F.bold, lineHeight: 14 }}>{x.seq}회</T></View>
              </Pressable>
            ))}
            <View style={{ width: '32%', aspectRatio: 1, borderRadius: 12, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' }}>
              <T style={{ fontSize: 12, fontFamily: F.semibold, color: C.muted, textAlign: 'center' }}>{next ? `${next.seq}회\n${fmtMD(next.scheduledAt)} 예정` : '다음 예정\n없음'}</T>
            </View>
          </View>
          <View>
            {reps.slice(0, 4).map((x, i) => (
              <KV key={x.id} first={i === 0} onPress={() => r.push(`/(family)/reports/${x.id}`)} k={<T b style={{ fontSize: 13.5 }}>{x.seq}회 · {fmtDT(x.date, false)}</T>} sub={`${x.checks[0]?.label}${x.checks.some((c) => c.first) ? ' · 처음 성공' : ''}`} style={{ paddingVertical: 12 }} />
            ))}
          </View>
          <Btn label="리포트 PDF로 모아 받기" kind="ghost" onPress={() => s.toast('PDF를 준비하면 알려드릴게요.')} />
        </>
      )}
    </Screen>
  );
}
