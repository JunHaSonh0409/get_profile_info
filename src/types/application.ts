/** Profile fields a member may see about another member: no real name, no phone. */
export interface PublicCard {
  /** Application id for lineup cards, like id for "who liked me" cards. */
  id: string;
  nickname: string;
  gender: string;
  age: string;
  height: number;
  location: string;
  mbti: string;
  photos: string[];
  preferredAnimals: string[];
  preferredAppearanceDetail: string;
  preferredPartnerDetail: string;
  selfIntro: string;
  /** The applicant's message written when applying to the event. */
  memo: string;
}

/** Admin view of an application (includes name and phone). */
export interface EventApplication {
  id: string;
  eventSlug: string;
  volNumber: string;
  profileId: string | null;
  name: string;
  phone: string;
  gender: string;
  age: string;
  memo: string;
  selected: boolean;
  created_at: string;
  card: PublicCard | null;
}
