import { todayKo, todayEn } from './today';

export const ko = {
  ...todayKo,
  today: '오늘', calendar: '달력', recap: '리캡', settings: '설정',
  tagline: '세 개의 이모지, 하나의 하루.',
  todayTitle: '오늘을 붙여두세요',
  todayBody: '길게 쓰지 않아도 괜찮아요. 기억하고 싶은 순간 세 개면 충분해요.',
  sample: '하루 우표 예시',
  sampleLabel: '미소, 커피, 달 이모지로 만든 하루 우표',
  private: '기록은 기본적으로 나만 볼 수 있어요.',
  next: '다음 단계에서 이모지 선택과 기록하기가 열려요.',
  calendarTitle: '하루가 모이는 곳',
  calendarBody: '4단계에서 월간 달력과 날짜별 기록을 연결해요.',
  recapTitle: '나의 작은 패턴',
  recapBody: '5단계에서 주간·월간 이모지와 연속 기록을 확인해요.',
  settingsTitle: '나에게 맞게',
  language: '앱 언어', korean: '한국어', english: 'English',
  languageHint: '지금은 앱을 다시 시작하면 한국어로 돌아와요. 언어 저장은 6단계에서 연결해요.',
  privacyTitle: '나만의 기록부터',
  privacyBody: '공유는 내가 고른 기록만, 직접 실행할 때 이루어지도록 만들어요.',
};

export type MessageKey = keyof typeof ko;
export type Locale = 'ko' | 'en';

const en: Record<MessageKey, string> = {
  ...todayEn,
  today: 'Today', calendar: 'Calendar', recap: 'Recap', settings: 'Settings',
  tagline: 'Three emoji. One little day.',
  todayTitle: 'Give today a place',
  todayBody: 'No long diary needed. Three moments worth keeping are enough.',
  sample: 'A sample day stamp',
  sampleLabel: 'A day stamp with a smile, coffee, and moon emoji',
  private: 'Your entries are private by default.',
  next: 'Emoji selection and journaling arrive in the next step.',
  calendarTitle: 'Days, collected',
  calendarBody: 'Step 4 connects the monthly calendar and entries by date.',
  recapTitle: 'Your little patterns',
  recapBody: 'Step 5 brings weekly and monthly emoji recaps and your streak.',
  settingsTitle: 'Make it yours',
  language: 'App language', korean: '한국어', english: 'English',
  languageHint: 'Restarting currently resets to Korean. Language persistence arrives in step 6.',
  privacyTitle: 'Start with a private space',
  privacyBody: 'Sharing will only happen when you choose an entry and explicitly share it.',
};

export const messages: Record<Locale, Record<MessageKey, string>> = { ko, en };
