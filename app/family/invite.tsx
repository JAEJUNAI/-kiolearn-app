// G8 가족 초대. 서버가 14일짜리 초대 링크를 발급한다(op invite-create). 받은 가족이 링크로 로그인하면 같은 부모님에 연결된다.
import React, { useEffect, useState } from 'react';
import { Share, Platform } from 'react-native';
import { Screen, Nav, T, Tile, Input, Chip, Btn, Row, Box, KV, Toggle } from '../../src/ui';
import { useStore, sel } from '../../src/data/store';
import { createInvite } from '../../src/lib/profile';

export default function Invite() {
  const s = useStore(); const rec = sel.myRecipient(s);
  const [link, setLink] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(true);
  const who = rec?.honorific || '부모님';
  const make = async () => { setBusy(true); setErr(''); const out = await createInvite(); setBusy(false); if (out.ok && out.url) setLink(out.url); else setErr(out.error || '링크를 만들지 못했어요.'); };
  useEffect(() => { make(); }, []);
  const msg = `${who} 수업 소식을 같이 받아요. 아래 링크를 눌러 전화번호로 로그인하면 연결됩니다. (14일 동안 쓸 수 있어요)\n${link}`;
  const copy = async () => {
    if (!link) return;
    try { if (Platform.OS === 'web' && navigator?.clipboard) { await navigator.clipboard.writeText(link); return s.toast('링크를 복사했어요.'); } } catch {}
    await Share.share({ message: msg });
  };
  const share = async () => {
    if (!link) return;
    if (Platform.OS === 'web') { try { if ((navigator as any).share) { await (navigator as any).share({ text: msg }); return; } } catch {} return copy(); }
    await Share.share({ message: msg });
  };
  return (
    <Screen>
      <Nav title="가족 초대" />
      <Tile title={`${who} 소식을\n같이 받을 가족`} text="초대받은 가족은 수업 일정과 리포트를 같은 시간에 받습니다." obj="icFamily" />
      <T v="lbl">초대 링크 <T v="cap">14일 동안 쓸 수 있어요</T></T>
      <Input value={busy ? '링크를 만드는 중…' : link || '-'} ro right={link ? <Chip label="복사" kind="dark" onPress={copy} /> : undefined} />
      {!!err && <><T v="cap" style={{ color: '#c0392b' }}>{err}</T><Btn label="다시 만들기" kind="ghost" size="sm" onPress={make} /></>}
      <Row><Btn label="카카오톡으로 보내기" kind="soft" size="sm" grow disabled={!link} onPress={share} /><Btn label="문자로 보내기" kind="soft" size="sm" grow disabled={!link} onPress={share} /></Row>
      <T v="lbl">받는 사람</T>
      <Box kind="white" style={{ paddingVertical: 4 }}>
        {(rec?.guardians ?? []).map((g, i) => (
          <KV key={g.accountId || g.name + i} first={i === 0} k={<T b style={{ fontSize: 13.5 }}>{g.relation === '나' ? (g.name && g.name !== '나' ? `${g.name} · 나` : '나') : `${g.name || '가족'}${g.relation ? ` · ${g.relation}` : ''}`}</T>} sub={g.smsOnly ? '앱 없음 · 문자로 요약' : g.isPrimary ? '결제 · 열람 · 일정 변경' : g.canPay ? '결제 · 열람' : '열람'}
            right={g.isPrimary ? <Chip label="대표" kind="gray" /> : g.smsOnly ? <Chip label="문자" kind="line" /> : <Row style={{ gap: 6 }}><T v="cap">결제</T><Toggle on={g.canPay} onChange={(v) => s.setGuardianPay(rec.id, g.accountId, v)} /></Row>} style={{ paddingVertical: 12 }} />
        ))}
      </Box>
      <T v="fine">링크로 들어온 가족은 이 목록에 추가되고, 열람 권한으로 시작합니다.</T>
    </Screen>
  );
}
