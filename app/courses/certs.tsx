// P3 수료증 · 출강 자격 (수료와 출강 가능은 다른 표시)
import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Nav, T, Cert, Icon, Box, KV, Chip, Btn, Empty } from '../../src/ui';
import { useStore } from '../../src/data/store';
import { fmtDT } from '../../src/lib/fmt';

export default function Certs() {
  const r = useRouter(); const s = useStore(); const e = s.eligibility; const certs = s.certificates;
  const goSettings = () => { if (!s.account.roles.includes('instructor')) { s.login(s.account.phone, e.certNo ?? 'KL-DC-2026-0588'); } r.replace('/instructor/settings'); };
  return (
    <Screen>
      <Nav title="내 수료증" />
      {certs.length === 0 ? <Empty icon="icCert" text="수료한 과정이 아직 없어요. 과정을 마치면 여기에 수료증이 발급됩니다." /> : certs.map((c) => (
        <Cert key={c.id}>
          <Icon src="icCert" size={54} />
          <T v="cap">수료증</T>
          <T v="h" style={{ fontSize: 17, marginTop: 4 }}>{c.name}</T>
          <T v="cap">{c.course} · {c.issuer}</T>
          <T v="cap">{fmtDT(c.issuedAt, false)} · {c.certNo}</T>
        </Cert>
      ))}
      <Box kind="white" style={{ paddingVertical: 2 }}>
        <KV first k="과정 수료" right={<Chip label={certs.length ? `완료 · ${fmtDT(certs[0].issuedAt, false)}` : '전'} kind={certs.length ? 'ok' : 'gray'} />} style={{ paddingVertical: 12 }} />
        <KV k="서류 3종" right={<Chip label={e.docsOkAt ? '확인' : '전'} kind={e.docsOkAt ? 'ok' : 'gray'} />} style={{ paddingVertical: 12 }} />
        <KV k="학습실 확인 문제" right={<Chip label={e.quizOkAt ? '통과' : '전'} kind={e.quizOkAt ? 'ok' : 'gray'} />} style={{ paddingVertical: 12 }} />
        <KV k={<T b style={{ fontSize: 13.5 }}>출강 가능</T>} sub={e.certNo ? `자격번호 ${e.certNo}` : '서류와 확인 문제를 통과하면 붙습니다'} right={<Chip label={e.eligibleAt ? '배정 대상' : '전'} kind={e.eligibleAt ? 'orange' : 'gray'} />} style={{ paddingVertical: 12 }} />
      </Box>
      <Box tight><T v="sub">출강 가능은 국가자격이 아니라 이 앱 안에서 배정을 받을 수 있다는 표시입니다. 활동 설정을 채우면 요청이 오기 시작합니다.</T></Box>
      {e.eligibleAt ? <Btn label="활동 설정하러 가기" onPress={goSettings} /> : <Btn label="검증 통과 처리 (개발용)" kind="ghost" disabled={certs.length === 0} onPress={() => s.verifyEligibility()} />}
      {certs.length > 0 && <Btn label="수료증 PDF" kind="ghost" onPress={() => s.toast('PDF를 준비하면 알려드릴게요.')} />}
      <View style={{ height: 8 }} />
    </Screen>
  );
}
