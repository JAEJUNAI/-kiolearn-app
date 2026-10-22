// nachocode.io에서 뽑은 색과 규격. 화면 시안(scratchpad/app3)과 같은 값.
export const C = {
  bg: '#ffffff',
  fg: '#0a0a0a',
  fg2: '#4b4b4b',
  muted: '#808080',
  line: '#eeeeee',
  soft: '#f8f8f8',
  soft2: '#f3f3f3',
  orange: '#f96d32',
  orangeDeep: '#e8551a',
  orangeLight: '#fb9a6a',
  peach: '#ffe5da',
  ok: '#1f7a3a',
  okBg: '#e7f6ec',
  danger: '#d23c1e',
  dangerBg: '#f3d5cc',
  white: '#ffffff',
};

export const R = { card: 24, inner: 16, tile: 18, chip: 999, pill: 999 };

export const F = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
  extra: 'Pretendard-ExtraBold',
};

export const S = { page: 18, gap: 12 };

export const IMG = {
  teacher: require('../assets/img/teacher.jpg'),
  teacher2: require('../assets/img/teacher2.jpg'),
  teacher3: require('../assets/img/teacher3.jpg'),
  lesson: require('../assets/img/photo-lesson.jpg'),
  kiosk: require('../assets/img/photo-kiosk.jpg'),
  cls: require('../assets/img/class.jpg'),
  seniorMan: require('../assets/img/senior-man.jpg'),
  kids: require('../assets/img/kids.jpg'),
  fourcut: require('../assets/img/fourcut.jpg'),
  icFamily: require('../assets/img/ic-family.png'),
  icActivity: require('../assets/img/ic-activity.png'),
  icWork: require('../assets/img/ic-work.png'),
  icOrg: require('../assets/img/ic-org.png'),
  icGift: require('../assets/img/ic-gift.png'),
  icCert: require('../assets/img/ic-cert.png'),
  icPhone: require('../assets/img/ic-phone.png'),
  icCalendar: require('../assets/img/ic-calendar.png'),
  icPin: require('../assets/img/ic-pin.png'),
  icBell: require('../assets/img/ic-bell.png'),
  icBook: require('../assets/img/ic-book.png'),
} as const;

export type ImgKey = keyof typeof IMG;
