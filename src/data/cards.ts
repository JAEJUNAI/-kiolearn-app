// 수업 카드 콘텐츠. 서버 lesson_cards 테이블로 옮길 것. 1회차는 첫 수업 프로토콜 고정(01 문서 7장).
export interface Card { steps: [string, string, string]; say: string; stuck: string; dont: string[]; device?: string }
const DONT_BASE = ['대신 눌러 드리지 않기', '계좌 비밀번호 묻지 않기', '사진에 계좌번호 나오지 않게'];

const CARDS: Record<string, Card> = {
  first: { steps: ['가장 불편한 것 하나 해결 (상담 메모)', '폰 정리: 글자 크기, 돋보기, 가족 단축번호', '사기 문자 카드 3장 냉장고에 붙이기'], say: '따님 ○○ 씨가 부탁하셔서 왔습니다. 오늘은 제일 답답하셨던 것 하나만 같이 해 볼게요.', stuck: '첫날 성공 하나가 목표. 안 되면 범위를 줄여서라도 어르신이 직접 누르게.', dont: [...DONT_BASE, '선생님이라고 소개하지 않기'] },
  bank: { steps: ['잔액 화면 찾아서 읽기', '가족에게 1만 원 보내기 (모의 화면)', '이체 내역에서 방금 보낸 것 확인'], say: '어머님, 받는 분 이름이 맞는지 한 번 읽어 주세요. 맞으면 어머님이 직접 눌러 보세요.', stuck: '지문이 안 되면 비밀번호 6자리로. 두 번 틀리면 오늘은 여기서 멈추고 다음에.', dont: DONT_BASE },
  kiosk: { steps: ['메뉴 찾기와 담기', '결제 수단 고르기', '영수증 번호로 받기'], say: '화면이 바뀌어도 괜찮아요. 처음부터 다시 누르면 됩니다.', stuck: '아카데미 연습 화면을 먼저 두 번 돌리고 실제 매장은 다음에.', dont: DONT_BASE },
  kakao: { steps: ['보낼 사진 고르기', '카카오톡으로 보내기', '답장 읽고 이모티콘 보내기'], say: '보내기 전에 받는 사람 이름을 소리 내어 읽어 보실까요.', stuck: '사진이 많으면 최근 사진만. 앨범 정리는 다음 회차.', dont: DONT_BASE },
  video: { steps: ['영상통화 걸기', '화면 돌리기와 소리 키우기', '끊고 다시 걸기'], say: '얼굴이 안 보이면 폰을 조금 멀리 들어 보세요.', stuck: '와이파이가 없으면 핫스팟을 켜고 짧게만.', dont: DONT_BASE },
  default: { steps: ['오늘 주제 한 번 보여 드리기', '어르신이 직접 한 번 하기', '혼자 한 번 더 하기'], say: '이번엔 제가 안 보고 있을게요. 어머님이 혼자 끝까지 해 보세요.', stuck: '한 단계만 줄여서 다시. 오늘 안 되면 다음 과제로 남기기.', dont: DONT_BASE },
};

export function lessonCard(seq: number, topic: string, device?: string): Card {
  const key = seq === 1 ? 'first' : topic.includes('은행') ? 'bank' : topic.includes('키오스크') ? 'kiosk' : topic.includes('카카오') || topic.includes('사진') ? 'kakao' : topic.includes('영상') ? 'video' : 'default';
  const c = CARDS[key];
  return { ...c, device: device ? (device.includes('아이폰') ? '아이폰: 설정 > 손쉬운 사용 > 디스플레이 > 더 큰 텍스트' : '갤럭시: 설정 > 디스플레이 > 글자 크기와 스타일') : undefined };
}
