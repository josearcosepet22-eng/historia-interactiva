export type GenreKey = 'cyberpunk' | 'fantasy' | 'scifi' | 'custom';

export interface GenreDefinition {
  id: GenreKey;
  number: number;
  name: string;
  tagline: string;
  description: string;
  dimensionName: string;
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    border: string;
    bgGlow: string;
  };
  sampleItems: string[];
}

export interface StoryOption {
  id: number;
  text: string;
  raw: string;
  approach: 'action' | 'stealth' | 'wit' | 'restart';
}

export interface StoryTurn {
  id: string;
  timestamp: number;
  chapter: number;
  dimension: string;
  narrative: string;
  status: string;
  options: StoryOption[];
  rawMarkdown: string;
  choiceMade?: string;
  choiceApproach?: string;
  isGameOver?: boolean;
}

export interface GameSettings {
  genre: GenreKey;
  genreTitle: string;
  customIdea: string;
  protagonistName: string;
  tension: 'normal' | 'hard' | 'nightmare';
}
