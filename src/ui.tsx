// 공용 컴포넌트. 시안의 .ttl .cap .box .tile .btn .chip .kv .chk .opt .inp .tog .seg 를 그대로 옮긴 것.
import React from 'react';
import {
  View, Text as RNText, Pressable, ScrollView, TextInput, StyleSheet,
  ViewStyle, TextStyle, StyleProp, ViewProps, TextInputProps,
} from 'react-native';
import { Image, ImageStyle } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { C, R, F, S, IMG, ImgKey } from './theme';

type Sx = StyleProp<ViewStyle>;
type Tx = StyleProp<TextStyle>;

// ---------- 글자 ----------
type TVariant = 'ttl' | 'ttl2' | 'h' | 'body' | 'sub' | 'cap' | 'lbl' | 'fine' | 'big';
const TV: Record<TVariant, TextStyle> = {
  ttl: { fontFamily: F.extra, fontSize: 22, lineHeight: 29, letterSpacing: -0.5, color: C.fg },
  ttl2: { fontFamily: F.extra, fontSize: 19, lineHeight: 25, letterSpacing: -0.4, color: C.fg },
  h: { fontFamily: F.extra, fontSize: 15, lineHeight: 21, color: C.fg },
  body: { fontFamily: F.regular, fontSize: 14, lineHeight: 21, color: C.fg },
  sub: { fontFamily: F.regular, fontSize: 13.5, lineHeight: 20, color: C.fg2 },
  cap: { fontFamily: F.regular, fontSize: 12.5, lineHeight: 18, color: C.muted },
  lbl: { fontFamily: F.bold, fontSize: 12, lineHeight: 17, color: C.fg2, marginBottom: 5 },
  fine: { fontFamily: F.regular, fontSize: 11.5, lineHeight: 17, color: C.muted },
  big: { fontFamily: F.extra, fontSize: 30, lineHeight: 34, letterSpacing: -0.8, color: C.fg },
};
export function T({ v = 'body', b, style, children, ...rest }: { v?: TVariant; b?: boolean; style?: Tx; children?: React.ReactNode } & React.ComponentProps<typeof RNText>) {
  return (
    <RNText {...rest} style={[TV[v], b && { fontFamily: F.bold }, style]} allowFontScaling maxFontSizeMultiplier={1.6}>
      {children}
    </RNText>
  );
}

// ---------- 레이아웃 ----------
export function Screen({ children, scroll = true, style, bottom = 24 }: { children: React.ReactNode; scroll?: boolean; style?: Sx; bottom?: number }) {
  const inner = <View style={[{ padding: S.page, paddingTop: 10, gap: S.gap, paddingBottom: bottom }, style]}>{children}</View>;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right']}>
      {scroll ? <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>{inner}</ScrollView> : <View style={{ flex: 1 }}>{inner}</View>}
    </SafeAreaView>
  );
}
export function Row({ children, style, gap = 10, align = 'center' }: { children: React.ReactNode; style?: Sx; gap?: number; align?: ViewStyle['alignItems'] }) {
  return <View style={[{ flexDirection: 'row', alignItems: align, gap }, style]}>{children}</View>;
}
export function Grow({ children, style }: { children?: React.ReactNode; style?: Sx }) {
  return <View style={[{ flex: 1, minWidth: 0 }, style]}>{children}</View>;
}
export function Box({ children, kind = 'soft', tight, style }: { children: React.ReactNode; kind?: 'soft' | 'white' | 'peach'; tight?: boolean; style?: Sx }) {
  const k: ViewStyle = kind === 'white'
    ? { backgroundColor: C.white, borderWidth: 1, borderColor: C.line, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2 }
    : kind === 'peach' ? { backgroundColor: C.peach } : { backgroundColor: C.soft };
  return <View style={[{ borderRadius: R.card, padding: tight ? 13 : 16 }, k, style]}>{children}</View>;
}
export function Nav({ title, right, onBack }: { title: string; right?: React.ReactNode; onBack?: () => void }) {
  const r = useRouter();
  return (
    <Row style={{ marginBottom: 2 }}>
      <Pressable onPress={onBack ?? (() => (r.canGoBack() ? r.back() : r.replace('/')))} style={st.navBack} hitSlop={10}>
        <T style={{ fontSize: 16, lineHeight: 18 }}>‹</T>
      </Pressable>
      <T v="h" style={{ fontSize: 15 }}>{title}</T>
      <Grow />
      {right}
    </Row>
  );
}

// ---------- 타일(주황 그라데이션) ----------
export function Tile({ title, text, dark, obj, children, style, pad = 18 }: { title: string; text?: string; dark?: boolean; obj?: ImgKey; children?: React.ReactNode; style?: Sx; pad?: number }) {
  const colors = dark ? ['#0a0a0a', '#1a1a1a'] : ['#f0601f', '#f96d32', '#fb9a6a'];
  return (
    <LinearGradient colors={colors as [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.6 }} style={[{ borderRadius: R.card, padding: pad, overflow: 'hidden', minHeight: 92 }, style]}>
      <View style={st.tileGlow} />
      <T style={{ fontFamily: F.extra, fontSize: 19, lineHeight: 25, letterSpacing: -0.4, color: '#fff' }}>{title}</T>
      {!!text && <T style={{ fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,.95)', marginTop: 4, paddingRight: obj ? 70 : 0 }}>{text}</T>}
      {children}
      {obj && <Image source={IMG[obj]} style={{ position: 'absolute', right: 8, bottom: -6, width: 84, height: 84 }} contentFit="contain" />}
    </LinearGradient>
  );
}

// ---------- 버튼 ----------
type BtnKind = 'primary' | 'ghost' | 'orange' | 'soft' | 'danger';
export function Btn({ label, onPress, kind = 'primary', size, disabled, style, grow }: { label: string; onPress?: () => void; kind?: BtnKind; size?: 'sm' | 'xl'; disabled?: boolean; style?: Sx; grow?: boolean }) {
  const h = size === 'sm' ? 38 : size === 'xl' ? 64 : 50;
  const fs = size === 'sm' ? 13.5 : size === 'xl' ? 18 : 15;
  const bg = { primary: C.fg, ghost: C.white, orange: C.orange, soft: C.soft, danger: C.white }[kind];
  const fg = { primary: '#fff', ghost: C.fg, orange: '#fff', soft: C.fg, danger: C.danger }[kind];
  const border = kind === 'ghost' ? { borderWidth: 1.5, borderColor: '#e5e5e5' } : kind === 'danger' ? { borderWidth: 1.5, borderColor: C.dangerBg } : {};
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [{ height: h, borderRadius: R.pill, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: size === 'sm' ? 16 : 20, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 }, border, grow && { flex: 1 }, style]}>
      <T style={{ fontFamily: F.bold, fontSize: fs, color: fg }}>{label}</T>
    </Pressable>
  );
}

// ---------- 칩 ----------
type ChipKind = 'peach' | 'dark' | 'gray' | 'line' | 'ok' | 'orange' | 'danger';
export function Chip({ label, kind = 'peach', sel, onPress, big, style }: { label: string; kind?: ChipKind; sel?: boolean; onPress?: () => void; big?: boolean; style?: Sx }) {
  const k = sel ? 'dark' : kind;
  const bg = { peach: C.peach, dark: C.fg, gray: '#eee', line: C.white, ok: C.okBg, orange: C.orange, danger: C.danger }[k];
  const fg = { peach: C.orangeDeep, dark: '#fff', gray: C.fg2, line: C.fg2, ok: C.ok, orange: '#fff', danger: '#fff' }[k];
  const el = (
    <View style={[{ backgroundColor: bg, borderRadius: R.chip, paddingVertical: big ? 7 : 4, paddingHorizontal: big ? 12 : 10, alignSelf: 'flex-start' }, k === 'line' && { borderWidth: 1, borderColor: '#e5e5e5' }, style]}>
      <T style={{ fontFamily: F.bold, fontSize: big ? 12.5 : 11.5, lineHeight: big ? 17 : 15, color: fg }}>{label}</T>
    </View>
  );
  return onPress ? <Pressable onPress={onPress} hitSlop={4}>{el}</Pressable> : el;
}
export function Chips({ children, style }: { children: React.ReactNode; style?: Sx }) {
  return <View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, style]}>{children}</View>;
}

// ---------- 키-값 ----------
export function KV({ k, v, sub, first, right, onPress, style }: { k: React.ReactNode; v?: React.ReactNode; sub?: string; first?: boolean; right?: React.ReactNode; onPress?: () => void; style?: Sx }) {
  const inner = (
    <View style={[{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: first ? 0 : 1, borderTopColor: C.line }, style]}>
      <View style={{ flex: 1 }}>
        {typeof k === 'string' ? <T v="sub" style={{ color: C.fg2, fontSize: 13.5 }}>{k}</T> : k}
        {!!sub && <T v="cap">{sub}</T>}
      </View>
      {typeof v === 'string' ? <T style={{ fontFamily: F.bold, fontSize: 13.5, textAlign: 'right', flexShrink: 1 }}>{v}</T> : v}
      {right}
      {onPress && <T style={{ color: '#bbb', fontSize: 16 }}>›</T>}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{inner}</Pressable> : inner;
}

// ---------- 체크 ----------
export function Check({ label, state = 'done', chip, sub }: { label: string; state?: 'done' | 'now' | 'off'; chip?: string; sub?: string }) {
  const n = state === 'now';
  return (
    <Row align="flex-start" style={{ gap: 10 }}>
      <View style={[st.chk, state === 'now' && { backgroundColor: C.fg }, state === 'off' && { backgroundColor: '#fff', borderWidth: 2, borderColor: '#ddd', width: 18, height: 18, marginTop: 2 }]}>
        {state !== 'off' && <T style={{ color: '#fff', fontFamily: F.extra, fontSize: 12, lineHeight: 14 }}>{n ? '•' : '✓'}</T>}
      </View>
      <Grow>
        <Row style={{ flexWrap: 'wrap', gap: 6 }}>
          <T style={[state === 'off' && { color: C.muted }, n && { fontFamily: F.bold }]}>{label}</T>
          {!!chip && <Chip label={chip} />}
        </Row>
        {!!sub && <T v="cap">{sub}</T>}
      </Grow>
    </Row>
  );
}

// ---------- 입력 ----------
export function Input({ right, style, ro, multiline, ...p }: TextInputProps & { right?: React.ReactNode; ro?: boolean; style?: Sx }) {
  return (
    <View style={[st.inp, ro && { backgroundColor: C.white, borderWidth: 1, borderStyle: 'dashed', borderColor: '#ddd' }, multiline && { minHeight: 70, alignItems: 'flex-start' }, style]}>
      <TextInput {...p} multiline={multiline} editable={!ro} placeholderTextColor="#a0a0a0" style={[{ flex: 1, fontFamily: F.regular, fontSize: ro ? 13.5 : 15, color: ro ? C.fg2 : C.fg, padding: 0, lineHeight: multiline ? 20 : undefined }, multiline && { textAlignVertical: 'top' }]} />
      {right}
    </View>
  );
}
export function Toggle({ on, onChange }: { on: boolean; onChange?: (v: boolean) => void }) {
  return (
    <Pressable onPress={() => onChange?.(!on)} style={{ width: 44, height: 26, borderRadius: 99, backgroundColor: on ? C.fg : '#ddd', justifyContent: 'center' }} hitSlop={6}>
      <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', marginLeft: on ? 21 : 3 }} />
    </Pressable>
  );
}
export function Seg({ items, value, onChange, pick }: { items: { k: string; label: string; sub?: string; off?: boolean }[]; value: string[]; onChange?: (v: string[]) => void; pick?: string }) {
  return (
    <Row style={{ gap: 5 }}>
      {items.map((it) => {
        const on = value.includes(it.k); const pk = pick === it.k;
        return (
          <Pressable key={it.k} disabled={it.off} onPress={() => onChange?.(on ? value.filter((x) => x !== it.k) : [...value, it.k])} style={{ flex: 1, backgroundColor: pk ? C.orange : on ? C.fg : C.soft, borderRadius: 12, paddingVertical: 8, alignItems: 'center', opacity: it.off ? 0.4 : 1 }}>
            <T style={{ fontFamily: F.semibold, fontSize: 12.5, lineHeight: 16, color: on || pk ? '#fff' : C.muted }}>{it.label}</T>
            {!!it.sub && <T style={{ fontSize: 10, lineHeight: 12, color: on || pk ? '#fff' : C.muted }}>{it.sub}</T>}
          </Pressable>
        );
      })}
    </Row>
  );
}
export function Stepper({ value, onChange, min = 1, max = 15, unit = '회' }: { value: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string }) {
  const B = ({ t, d }: { t: string; d: number }) => (
    <Pressable onPress={() => onChange(Math.min(max, Math.max(min, value + d)))} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.soft2, alignItems: 'center', justifyContent: 'center' }}><T b>{t}</T></Pressable>
  );
  return (
    <Row style={{ gap: 14, backgroundColor: C.white, borderWidth: 1.5, borderColor: '#e5e5e5', borderRadius: 99, paddingVertical: 4, paddingHorizontal: 6, alignSelf: 'flex-start' }}>
      <B t="−" d={-1} /><T style={{ fontFamily: F.extra }}>{value}{unit}</T><B t="+" d={1} />
    </Row>
  );
}

// ---------- 상품 옵션 ----------
export function Opt({ title, sub, price, sel, chip, onPress }: { title: string; sub?: string; price: string; sel?: boolean; chip?: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: sel ? C.white : C.soft, borderWidth: 2, borderColor: sel ? C.orange : 'transparent', borderRadius: R.inner, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <View style={{ flex: 1 }}>
        <Row style={{ gap: 6 }}><T style={{ fontFamily: F.extra }}>{title}</T>{!!chip && <Chip label={chip} />}</Row>
        {!!sub && <T v="cap" style={{ marginTop: 2 }}>{sub}</T>}
      </View>
      <T style={{ fontFamily: F.extra, fontVariant: ['tabular-nums'] }}>{price}</T>
    </Pressable>
  );
}

// ---------- 그 외 ----------
export function Bar({ pct, light, style }: { pct: number; light?: boolean; style?: Sx }) {
  return (
    <View style={[{ height: 8, borderRadius: 99, backgroundColor: light ? 'rgba(255,255,255,.25)' : '#eee', overflow: 'hidden' }, style]}>
      <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', backgroundColor: light ? '#fff' : C.orange, borderRadius: 99 }} />
    </View>
  );
}
export function Avatar({ src, size = 42 }: { src: ImgKey; size?: number }) {
  return <Image source={IMG[src]} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />;
}
export function Photo({ src, ratio = 16 / 10, style }: { src: ImgKey; ratio?: number; style?: StyleProp<ImageStyle> }) {
  return <Image source={IMG[src]} style={[{ width: '100%', aspectRatio: ratio, borderRadius: R.inner }, style]} contentFit="cover" />;
}
export function Icon({ src, size = 40, style }: { src: ImgKey; size?: number; style?: StyleProp<ImageStyle> }) {
  return <Image source={IMG[src]} style={[{ width: size, height: size }, style]} contentFit="contain" />;
}
export function Hero({ src, title, sub, ratio = 16 / 10 }: { src: ImgKey; title: string; sub?: string; ratio?: number }) {
  return (
    <View style={{ borderRadius: R.card, overflow: 'hidden', aspectRatio: ratio }}>
      <Image source={IMG[src]} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,.6)']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 40, paddingHorizontal: 16, paddingBottom: 14 }}>
        <T style={{ fontFamily: F.extra, fontSize: 17, lineHeight: 22, color: '#fff' }}>{title}</T>
        {!!sub && <T style={{ fontFamily: F.semibold, fontSize: 13, color: '#fff' }}>{sub}</T>}
      </LinearGradient>
    </View>
  );
}
export function ModTile({ src, label, onPress }: { src: ImgKey; label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, backgroundColor: C.soft, borderRadius: R.tile, paddingTop: 12, paddingBottom: 10, alignItems: 'center' }}>
      <Icon src={src} size={40} style={{ marginBottom: 6 }} />
      <T style={{ fontFamily: F.semibold, fontSize: 12, color: '#191919' }}>{label}</T>
    </Pressable>
  );
}
export function Cert({ children, style }: { children: React.ReactNode; style?: Sx }) {
  return (
    <View style={[{ backgroundColor: C.white, borderWidth: 1, borderColor: C.line, borderRadius: R.card, padding: 18, alignItems: 'center' }, style]}>
      <View pointerEvents="none" style={{ position: 'absolute', top: 8, left: 8, right: 8, bottom: 8, borderWidth: 1, borderColor: '#f3e0d6', borderRadius: 18 }} />
      {children}
    </View>
  );
}
export function Empty({ text, icon = 'icCalendar' }: { text: string; icon?: ImgKey }) {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 30, gap: 8 }}>
      <Icon src={icon} size={72} />
      <T v="sub" style={{ textAlign: 'center' }}>{text}</T>
    </View>
  );
}
export function Status({ left, right }: { left: string; right?: string }) {
  return <Row style={{ justifyContent: 'space-between' }}><T v="cap">{left}</T>{!!right && <T v="cap">{right}</T>}</Row>;
}

const st = StyleSheet.create({
  navBack: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.soft2, alignItems: 'center', justifyContent: 'center' },
  tileGlow: { position: 'absolute', right: -30, top: -40, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,229,218,.35)' },
  chk: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' },
  inp: { backgroundColor: C.soft, borderRadius: R.inner, paddingVertical: 13, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
});
