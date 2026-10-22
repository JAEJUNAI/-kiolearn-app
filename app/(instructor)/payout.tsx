// T8 정산
import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, T, Row, Chip, Chips, Tile, Bar, Box, KV, Btn } from '../../src/ui';
import { useStore, sel, RULES } from '../../src/data/store';
import { fmtMD, num, won } from '../../src/lib/fmt';

export default function Payout() {
  const r = useRouter(); const s = useStore(); const me = sel.me(s);
  const [tab, setTab] = useState<'open' | 'paid'>('open');
  const now = new Date(); const month = now.toISOString().slice(0, 7);
  const rows = s.payouts.filter((p) => p.instructorId === me.id && p.month === month && (tab === 'open' ? p.status !== 'paid' : p.status === 'paid')).sort((a, b) => b.date.localeCompare(a.date));
  const total = s.payouts.filter((p) => p.instructorId === me.id && p.month === month).reduce((a, b) => a + b.amount, 0);
  const lessons = s.payouts.filter((p) => p.instructorId === me.id && p.month === month && p.kind === 'session').length;
  const transport = s.payouts.filter((p) => p.instructorId === me.id && p.month === month && p.kind === 'transport').length;
  const nextGrade = me.grade < 3 ? RULES.gradeLessons[me.grade] - me.stats.lessons : 0;
  const payDay = new Date(now.getFullYear(), now.getMonth() + 1, 10);
  // 같은 세션의 행을 한 줄로 묶어 보여 준다
  const grouped = Object.values(rows.reduce<Record<string, { key: string; note: string; sub?: string; amount: number; date: string; kinds: string[] }>>((acc, p) => {
    const key = p.sessionId ?? p.id; const g = acc[key] ?? { key, note: p.sessionId ? p.note.replace(/ 교통비$/, '') : p.note, sub: p.sub, amount: 0, date: p.date, kinds: [] };
    g.amount += p.amount; g.kinds.push(p.kind); if (p.sub && !g.sub) g.sub = p.sub; acc[key] = g; return acc;
  }, {}));
  return (
    <Screen>
      <T v="cap">{now.getMonth() + 1}월 · 확정 금액</T>
      <Row style={{ marginTop: -8 }} align="baseline"><T v="big">{num(total)}</T><T style={{ fontSize: 18, fontFamily: 'Pretendard-Bold' }}>원</T></Row>
      <Row style={{ marginTop: -4 }}><Chip label={`${payDay.getMonth() + 1}월 10일 입금`} kind="dark" /><T v="cap">수업 {lessons}회 + 교통비 {transport}건 · 3.3% 공제 전</T></Row>
      <Tile pad={14} title={me.grade < 3 ? `다음 단계까지 ${Math.max(0, nextGrade)}회` : '3단계 · 경험 많은 강사'} text={`단계가 오르면 배정 요청을 먼저 받습니다. 월 ${RULES.bonusOver}회를 넘기면 보너스 ${won(RULES.bonusAmount)}.`}>
        {me.grade < 3 && <Bar light pct={(me.stats.lessons / RULES.gradeLessons[me.grade]) * 100} style={{ marginTop: 10 }} />}
      </Tile>
      <Chips><Chip big label="미정산" kind="line" sel={tab === 'open'} onPress={() => setTab('open')} /><Chip big label="정산 완료" kind="line" sel={tab === 'paid'} onPress={() => setTab('paid')} /></Chips>
      <Box kind="white" style={{ paddingVertical: 2 }}>
        {grouped.length === 0 && <T v="sub" style={{ paddingVertical: 12 }}>{tab === 'open' ? '이달 확정된 내역이 아직 없어요.' : '정산 완료된 내역이 없어요.'}</T>}
        {grouped.map((g, i) => (
          <KV key={g.key} first={i === 0} k={<T b style={{ fontSize: 13.5 }}>{fmtMD(g.date)} {g.note}</T>} sub={g.sub ?? (g.kinds.includes('session') ? '리포트 제출' : undefined)}
            right={<Row style={{ gap: 6 }}><T b style={{ fontSize: 13.5 }}>{g.kinds.includes('session') ? num(g.amount) : `${g.kinds[0] === 'transport' ? '교통비 ' : ''}${num(g.amount)}`}</T><Chip label={tab === 'open' ? '확정' : '입금'} kind="ok" /></Row>} />
        ))}
      </Box>
      <Btn label="활동 증명서 받기" kind="ghost" onPress={() => r.push('/instructor/certificate')} />
      <T v="fine">매월 1일 전월 마감, 10일 입금, 3.3% 공제. 금액 문의는 행을 길게 눌러 운영자에게 보냅니다.</T>
      <View style={{ height: 8 }} />
    </Screen>
  );
}
