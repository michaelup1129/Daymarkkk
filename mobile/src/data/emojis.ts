import type { Locale } from '../i18n/messages';

export const categories = ['feeling', 'activity', 'food', 'nature'] as const;
export type Category = typeof categories[number];
export type Emoji = {
  id: string; symbol: string; category: Category; ko: string; en: string;
};

export const emojis: Emoji[] = [
  { id: 'smile', symbol: '😊', category: 'feeling', ko: '행복 미소 기쁨', en: 'happy smile joy' },
  { id: 'laugh', symbol: '😂', category: 'feeling', ko: '웃음 재미', en: 'laugh fun' },
  { id: 'love', symbol: '🥰', category: 'feeling', ko: '사랑 감사', en: 'love grateful' },
  { id: 'calm', symbol: '😌', category: 'feeling', ko: '평온 편안 휴식', en: 'calm relaxed' },
  { id: 'tired', symbol: '😴', category: 'feeling', ko: '피곤 잠 졸림', en: 'tired sleepy' },
  { id: 'sad', symbol: '😢', category: 'feeling', ko: '슬픔 눈물', en: 'sad crying' },
  { id: 'angry', symbol: '😤', category: 'feeling', ko: '화남 답답 스트레스', en: 'angry frustrated stress' },
  { id: 'party', symbol: '🥳', category: 'feeling', ko: '축하 파티 생일', en: 'party celebrate birthday' },
  { id: 'study', symbol: '📚', category: 'activity', ko: '공부 독서 책 학교', en: 'study books school' },
  { id: 'work', symbol: '💻', category: 'activity', ko: '일 업무 코딩', en: 'work coding laptop' },
  { id: 'run', symbol: '🏃', category: 'activity', ko: '달리기 운동', en: 'run exercise' },
  { id: 'music', symbol: '🎧', category: 'activity', ko: '음악 노래', en: 'music song' },
  { id: 'movie', symbol: '🎬', category: 'activity', ko: '영화 드라마', en: 'movie cinema drama' },
  { id: 'game', symbol: '🎮', category: 'activity', ko: '게임 놀이', en: 'game play' },
  { id: 'travel', symbol: '✈️', category: 'activity', ko: '여행 비행기', en: 'travel flight' },
  { id: 'home', symbol: '🏠', category: 'activity', ko: '집 가족', en: 'home family' },
  { id: 'coffee', symbol: '☕', category: 'food', ko: '커피 카페 차', en: 'coffee cafe tea' },
  { id: 'cake', symbol: '🍰', category: 'food', ko: '케이크 디저트', en: 'cake dessert' },
  { id: 'rice', symbol: '🍚', category: 'food', ko: '밥 식사', en: 'rice meal' },
  { id: 'noodle', symbol: '🍜', category: 'food', ko: '라면 국수', en: 'ramen noodle' },
  { id: 'pizza', symbol: '🍕', category: 'food', ko: '피자', en: 'pizza' },
  { id: 'salad', symbol: '🥗', category: 'food', ko: '샐러드 건강', en: 'salad healthy' },
  { id: 'beer', symbol: '🍺', category: 'food', ko: '맥주 술', en: 'beer drink' },
  { id: 'cook', symbol: '🍳', category: 'food', ko: '요리 아침', en: 'cooking breakfast' },
  { id: 'sun', symbol: '☀️', category: 'nature', ko: '해 맑음 햇살', en: 'sun sunny' },
  { id: 'rain', symbol: '🌧️', category: 'nature', ko: '비 흐림', en: 'rain cloudy' },
  { id: 'moon', symbol: '🌙', category: 'nature', ko: '달 밤', en: 'moon night' },
  { id: 'flower', symbol: '🌸', category: 'nature', ko: '꽃 봄', en: 'flower spring' },
  { id: 'tree', symbol: '🌳', category: 'nature', ko: '나무 산책 공원', en: 'tree walk park' },
  { id: 'sea', symbol: '🌊', category: 'nature', ko: '바다 파도', en: 'sea ocean wave' },
  { id: 'cat', symbol: '🐱', category: 'nature', ko: '고양이', en: 'cat' },
  { id: 'dog', symbol: '🐶', category: 'nature', ko: '강아지 개', en: 'dog puppy' },
];

export function getEmoji(id: string | null) {
  return emojis.find(emoji => emoji.id === id);
}

export function emojiLabel(id: string | null, locale: Locale) {
  return getEmoji(id)?.[locale] ?? '';
}

export function searchEmojis(query: string) {
  const words = query.normalize('NFKC').toLowerCase().trim().split(/\s+/);
  return emojis.filter(emoji => words.every(word =>
    `${emoji.symbol} ${emoji.ko} ${emoji.en}`.normalize('NFKC').toLowerCase().includes(word),
  ));
}
