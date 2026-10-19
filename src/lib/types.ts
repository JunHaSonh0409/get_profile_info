export interface ProfileData {
  id?: string;
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
  photos?: string[];
  created_at?: string;
}

export interface AnimalOption {
  id: string;
  label: string;
  emoji: string;
  tagline: string;
}

export const ANIMAL_OPTIONS: AnimalOption[] = [
  { id: 'dog', label: '강아지상', emoji: '🐶', tagline: '다정하고 순하며 밝은 인상' },
  { id: 'cat', label: '고양이상', emoji: '🐱', tagline: '도도하고 세련되며 깔끔한 인상' },
  { id: 'fox', label: '여우상', emoji: '🦊', tagline: '매력적인 눈매와 센스 있는 분위기' },
  { id: 'rabbit', label: '토끼상', emoji: '🐰', tagline: '귀엽고 사랑스러우며 맑은 인상' },
  { id: 'bear', label: '곰돌이상', emoji: '🐻', tagline: '포근하고 듬직하며 든든한 매력' },
  { id: 'dino', label: '공룡상', emoji: '🦖', tagline: '뚜렷한 이목구비와 시원한 인상' },
  { id: 'wolf', label: '늑대상', emoji: '🐺', tagline: '카리스마 있고 날렵한 눈매' },
  { id: 'deer', label: '사슴상', emoji: '🦌', tagline: '맑고 선한 눈망울과 우아한 인상' },
  { id: 'any', label: '상관없음', emoji: '✨', tagline: '동물상보다는 성격과 분위기 우선' },
];

export interface RegionGroup {
  province: string;
  districts: string[];
}
