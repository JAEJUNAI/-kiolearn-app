// 어르신(수업 받을 분) 고르기 띠. 양가 부모님처럼 여러 분일 때 홈·예약·어르신 정보 위에서 바꾼다.
import React from 'react';
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Chip } from '../ui';
import { useStore, sel } from '../data/store';
import { Recipient } from '../data/types';

export const recipientLabel = (r?: Recipient) => (r ? `${r.honorific || '부모님'}${r.name ? ` ${r.name}` : ''}` : '부모님');

export function RecipientBar({ addLabel = '+ 어르신 추가', hideAdd, onPick }: { addLabel?: string; hideAdd?: boolean; onPick?: (id: string) => void }) {
  const r = useRouter(); const s = useStore(); const cur = sel.myRecipient(s);
  if (s.recipients.length <= 1 && hideAdd) return null;
  const add = () => { s.addRecipient(); r.push({ pathname: '/family/profile', params: { new: '1' } }); };
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
      {s.recipients.map((x) => (
        <Chip key={x.id} big label={recipientLabel(x)} kind={x.id === cur?.id ? 'dark' : 'line'} onPress={() => { s.selectRecipient(x.id); onPick?.(x.id); }} />
      ))}
      {!hideAdd && <Chip big label={addLabel} kind="line" onPress={add} />}
    </ScrollView>
  );
}
