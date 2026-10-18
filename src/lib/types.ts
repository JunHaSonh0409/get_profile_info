export interface ProfileData {
  name: string;
  nickname: string;
  phone: string;
  gender: '남성' | '여성' | '';
  age: string; // 몇년생 (예: '98년생')
  height: number | '';
  location: string;
  preferredAnimals: string[];
  preferredAppearanceDetail: string; // 외적인 구체적인 상 설명
  preferredPartnerDetail: string;
  selfIntro: string;
}

export interface AnimalOption {
  id: string;
  label: string;
  emoji: string;
  tagline: string;
}

export const ANIMAL_OPTIONS: AnimalOption[] = [
  { id: 'dog', label: '강아지상', emoji: '🐶', tagline: '다정하고 순하고 활발한 매력' },
  { id: 'cat', label: '고양이상', emoji: '🐱', tagline: '도도하고 시크하며 츤데레 매력' },
  { id: 'fox', label: '여우상', emoji: '🦊', tagline: '센스 넘치고 매력적인 눈매' },
  { id: 'rabbit', label: '토끼상', emoji: '🐰', tagline: '귀엽고 사랑스러운 과즙미' },
  { id: 'bear', label: '곰돌이상', emoji: '🐻', tagline: '포근하고 듬직하고 다정한 매력' },
  { id: 'dino', label: '공룡상', emoji: '🦖', tagline: '뚜렷한 T존과 시원시원한 호감형' },
  { id: 'wolf', label: '늑대상', emoji: '🐺', tagline: '카리스마 있고 샤프한 매력' },
  { id: 'deer', label: '사슴상', emoji: '🦌', tagline: '선하고 맑고 우아한 눈망울' },
  { id: 'any', label: '상관없음', emoji: '✨', tagline: '외모나 동물상보다는 통하는 느낌 우선' },
];

export interface RegionGroup {
  province: string;
  districts: string[];
}
