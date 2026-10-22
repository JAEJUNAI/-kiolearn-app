// P1 과정 목록 (직영·파트너 라벨)
import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Screen, Nav, T, Row, Grow, Icon, Chips, Chip, Box } from '../../src/ui';
import { useStore } from '../../src/data/store';
import { won } from '../../src/lib/fmt';
import { IMG } from '../../src/theme';

export default function Courses() {
  const r = useRouter(); const s = useStore(); const [f, setF] = useState<'all' | 'senior' | 'child' | 'online'>('all');
  const list = s.courses.filter((c) => f === 'all' ? true : f === 'online' ? c.format.includes('온라인') : c.category === f).sort((a, b) => Number(b.direct) - Number(a.direct));
  return (
    <Screen>
      <Nav title="과정" right={<Chip label="내 수료증" kind="line" onPress={() => r.push('/courses/certs')} />} />
      <Row><Grow><T v="ttl">배우고,{'\n'}일로 잇기</T></Grow><Icon src="icBook" size={60} /></Row>
      <Chips>{([['all', '전체'], ['senior', '시니어'], ['child', '아동'], ['online', '온라인']] as const).map(([k, l]) => <Chip key={k} big label={l} kind="line" sel={f === k} onPress={() => setF(k)} />)}</Chips>
      {list.map((c) => (
        <Pressable key={c.id} onPress={() => r.push(`/courses/${c.id}`)}>
          <Box kind="white" tight><Row>{c.direct && c.price === 0 ? <Icon src="icCert" size={44} /> : <Image source={IMG[c.img]} style={{ width: 44, height: 44, borderRadius: 12 }} contentFit="cover" />}<Grow><Row style={{ gap: 6, flexWrap: 'wrap' }}><T b>{c.title}</T><Chip label={c.direct ? '직영' : '파트너'} kind={c.direct ? 'dark' : 'peach'} /></Row><T v="cap">{c.provider} · {c.format} · {c.price ? won(c.price) : '무료'}</T></Grow></Row></Box>
        </Pressable>
      ))}
      <T v="fine">모든 과정의 수료증은 "○○기관 과정 수료"로 발급됩니다. 출강 가능 표시는 우리 검증을 통과한 분에게만 붙습니다.</T>
    </Screen>
  );
}
