// G6 예약·결제. 상품 → 희망 일시 2개 → 결제 수단 → 결제.
import React, { useMemo, useState } from 'react';
import { View, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen, T, Opt, Tile, Box, KV, Btn, Chips, Chip, Row, Grow, Seg } from '../../src/ui';
import { useStore, sel } from '../../src/data/store';
import { PRODUCTS, Product, PayMethod, Pass } from '../../src/data/types';
import { fmtDT, won, ymd } from '../../src/lib/fmt';
import { C, F } from '../../src/theme';

const MAIN: Product[] = ['pass3', 'pass10', 'member'];
const MORE: Product[] = ['p60', 'p90', 'p120', 'pass5', 'pass20', 'pass30', 'monthly4', 'monthly8'];
const OPEN_AREAS = ['서울', '하남', '구리', '성남', '광명', '부천', '고양'];
type Slot = 'am' | 'pm' | 'eve';

export default function Book() {
  const r = useRouter(); const { passId } = useLocalSearchParams<{ passId?: string }>();
  const s = useStore(); const rec = sel.myRecipient(s);
  const gift = passId ? s.passes.find((p) => p.id === passId) : undefined;
  const [product, setProduct] = useState<Product>(gift?.product ?? 'pass10'); const [more, setMore] = useState(false);
  const [d1, setD1] = useState<string>(''); const [sl1, setSl1] = useState<Slot>('am'); const [d2, setD2] = useState<string>(''); const [sl2, setSl2] = useState<Slot>('am');
  const [method, setMethod] = useState<PayMethod>('card'); const [extras, setExtras] = useState<string[]>([]);
  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => { const x = new Date(); x.setDate(x.getDate() + 2 + i); x.setHours(0, 0, 0, 0); return x; }), []);
  const P = PRODUCTS[product]; const outside = !OPEN_AREAS.some((a) => rec.sigungu.includes(a));
  const extraFee = (extras.includes('two') ? 20000 : 0) + (extras.includes('weekend') ? 10000 : 0) + (extras.includes('escort') ? 10000 : 0) + (outside ? 10000 : 0);
  const total = gift ? 0 : P.price + extraFee * (P.total || 1);
  const ready = !!rec.addressDetail && !!d1;

  const pay = () => {
    const slot1: Pass['slot1'] = { date: d1, slot: sl1 }; const slot2: Pass['slot2'] = d2 ? { date: d2, slot: sl2 } : undefined;
    if (gift) { useStore.setState((st) => ({ passes: st.passes.map((p) => (p.id === gift.id ? { ...p, slot1, slot2 } : p)) })); s.toast('희망 일정을 받았어요. 72시간 안에 첫 일정을 정해 드립니다.'); return r.replace('/(family)/home'); }
    s.checkout(rec.id, product, slot1, slot2, method, extras); r.replace('/(family)/home');
  };

  const DayPick = ({ v, set, other }: { v: string; set: (d: string) => void; other: string }) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
      {days.map((x) => { const k = ymd(x); const on = v === k; const dis = other === k; return (
        <Pressable key={k} disabled={dis} onPress={() => set(k)} style={{ width: '13%', backgroundColor: on ? C.fg : C.soft, borderRadius: 12, paddingVertical: 7, alignItems: 'center', opacity: dis ? 0.35 : 1 }}>
          <T style={{ fontFamily: F.semibold, fontSize: 12, lineHeight: 15, color: on ? '#fff' : C.muted }}>{'일월화수목금토'[x.getDay()]}</T><T style={{ fontSize: 10, lineHeight: 12, color: on ? '#fff' : C.muted }}>{x.getDate()}</T>
        </Pressable>); })}
    </View>
  );
  const SlotPick = ({ v, set }: { v: Slot; set: (s: Slot) => void }) => <Chips>{(['am', 'pm', 'eve'] as Slot[]).map((k) => <Chip key={k} big label={{ am: '오전', pm: '오후', eve: '저녁' }[k]} kind="line" sel={v === k} onPress={() => set(k)} />)}</Chips>;

  return (
    <Screen>
      <T v="ttl" style={{ fontSize: 21 }}>{gift ? '효도권으로 시작합니다' : '어떤 구성으로 시작할까요'}</T>
      {!rec.addressDetail && <Box kind="peach" tight><T style={{ fontSize: 13 }}>결제 전에 {rec.honorific} 상세 주소가 필요해요. </T><Btn label="어르신 정보 적기" size="sm" kind="ghost" style={{ alignSelf: 'flex-start', marginTop: 8 }} onPress={() => r.push('/family/profile')} /></Box>}
      {!gift && (
        <>
          {MAIN.map((k) => <Opt key={k} title={PRODUCTS[k].name} sub={PRODUCTS[k].sub} price={k === 'member' ? '월 29,000원' : won(PRODUCTS[k].price)} chip={k === 'pass10' ? '회당 63,900' : undefined} sel={product === k} onPress={() => setProduct(k)} />)}
          <Pressable onPress={() => setMore(!more)}><T v="cap" style={{ textAlign: 'center' }}>{more ? '접기' : '다른 구성 보기 (1회, 5·20·30회, 정기)'}</T></Pressable>
          {more && MORE.map((k) => <Opt key={k} title={PRODUCTS[k].name} sub={PRODUCTS[k].sub} price={won(PRODUCTS[k].price)} sel={product === k} onPress={() => setProduct(k)} />)}
        </>
      )}
      <View><T v="lbl">희망 일정 1순위 <T v="cap">지금부터 48시간 뒤부터</T></T><DayPick v={d1} set={setD1} other={d2} /><View style={{ height: 6 }} /><SlotPick v={sl1} set={setSl1} /></View>
      <View><T v="lbl">2순위 (다른 날)</T><DayPick v={d2} set={setD2} other={d1} /><View style={{ height: 6 }} /><SlotPick v={sl2} set={setSl2} /></View>
      {!gift && (
        <View><T v="lbl">추가 선택</T><Chips>
          {[['two', '두 분 함께 +20,000'], ['weekend', '주말·저녁 +10,000'], ['escort', '매장 동행 +10,000']].map(([k, l]) => <Chip key={k} big label={l} kind="line" sel={extras.includes(k)} onPress={() => setExtras(extras.includes(k) ? extras.filter((x) => x !== k) : [...extras, k])} />)}
          {outside && <Chip big label="기본 지역 밖 +10,000" kind="peach" />}
        </Chips></View>
      )}
      <Tile pad={14} title={d1 ? `희망 일정 ${fmtDT(d1 + 'T00:00:00', false)} ${{ am: '오전', pm: '오후', eve: '저녁' }[sl1]}` : '희망 일정을 골라 주세요'} text="72시간 안에 강사와 첫 일정이 정해집니다. 안 되면 전액 환불." />
      {!gift && (
        <View><T v="lbl">결제 수단</T><Chips>
          {([['card', '카드'], ['transfer', '계좌이체'], ['vaccount', '가상계좌'], ['manual', '무통장 입금']] as [PayMethod, string][]).map(([k, l]) => <Chip key={k} big label={l} kind="line" sel={method === k} onPress={() => setMethod(k)} />)}
        </Chips>{(method === 'vaccount' || method === 'manual') && <T v="cap" style={{ marginTop: 6 }}>입금 기한 3일. 입금이 확인되면 그때부터 72시간 안에 일정을 정해 드립니다.</T>}</View>
      )}
      <Box kind="white">
        <KV first k="자격 확인" v="서류 3종 · 배상책임보험" />
        <KV k="리포트" v="수업마다 사진과 결과" />
        <KV k="환불" v="첫 수업 전까지 전액" />
        {!gift && extraFee > 0 && <KV k="추가 비용" v={`회당 ${won(extraFee)}`} />}
      </Box>
      <Btn label={gift ? '희망 일정 보내기' : `${won(total)} 결제하기`} disabled={!ready} onPress={pay} />
      <T v="fine">{method === 'card' ? '토스페이먼츠 카드 결제' : method === 'transfer' ? '토스페이먼츠 계좌이체' : method === 'vaccount' ? '토스페이먼츠 가상계좌' : '법인 계좌 무통장 입금'} · 영수증 자동 발급 · 유효기간 안 미사용분은 사용 회차를 정가로 빼고 환불</T>
    </Screen>
  );
}
