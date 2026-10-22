// G8 가족 초대
import React from 'react';
import { Share, Platform } from 'react-native';
import { Screen, Nav, T, Tile, Input, Chip, Btn, Row, Box, KV, Toggle } from '../../src/ui';
import { useStore, sel } from '../../src/data/store';

export default function Invite() {
  const s = useStore(); const rec = sel.myRecipient(s);
  const link = `https://app.kiolearn.co.kr/i/${rec.id}8k2m`;
  const share = async () => { if (Platform.OS === 'web') return s.toast('링크를 복사했어요.'); await Share.share({ message: `${rec.honorific} 수업 소식을 같이 받으세요. ${link}` }); };
  return (
    <Screen>
      <Nav title="가족 초대" />
      <Tile title={`${rec.honorific} 소식을\n같이 받을 가족`} text="초대받은 가족은 리포트를 같은 시간에 받습니다." obj="icFamily" />
      <T v="lbl">초대 링크</T>
      <Input value={link} ro right={<Chip label="복사" kind="dark" onPress={() => s.toast('링크를 복사했어요.')} />} />
      <Row><Btn label="카카오톡으로 보내기" kind="soft" size="sm" grow onPress={share} /><Btn label="문자로 보내기" kind="soft" size="sm" grow onPress={share} /></Row>
      <T v="lbl">받는 사람</T>
      <Box kind="white" style={{ paddingVertical: 4 }}>
        {rec.guardians.map((g, i) => (
          <KV key={g.name} first={i === 0} k={<T b style={{ fontSize: 13.5 }}>{g.name}{g.relation ? ` · ${g.relation}` : ''}</T>} sub={g.smsOnly ? '앱 없음 · 문자로 요약' : g.isPrimary ? '결제 · 열람 · 일정 변경' : g.canPay ? '결제 · 열람' : '열람'}
            right={g.isPrimary ? <Chip label="대표" kind="gray" /> : g.smsOnly ? <Chip label="문자" kind="line" /> : <Row style={{ gap: 6 }}><T v="cap">결제</T><Toggle on={g.canPay} onChange={(v) => s.setGuardianPay(rec.id, g.accountId, v)} /></Row>} style={{ paddingVertical: 12 }} />
        ))}
      </Box>
      <T v="fine">{rec.honorific} 본인이 계정을 만들면 이 목록에 들어오고, 활동 모듈이 열립니다.</T>
    </Screen>
  );
}
