export type GameKey = 'ludo' | 'dames' | 'echecs' | 'monopoly' | 'fruitslasher';
export type GameMode = 'hacking' | 'empire';
export type NavTab = 'arene' | 'defis' | 'entr' | 'regles' | 'profil';

export interface GameInfo {
  id: GameKey;
  name: string;
  emoji: string;
  accent: string;
  maxPlayers: number;
  coverImage: string;
  description: string;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isBot?: boolean;
  isHost?: boolean;
  crowns: number;
  hackUsed: boolean;
  seat: number;
  timeLeft: number; // in seconds
  score?: number; // for arena games like fruit slasher
}

export interface UserProfile {
  pseudo: string;
  avatar: string;
  crowns: number;
  stats: Record<GameKey, { wins: number; losses: number }>;
}

export interface GameSession {
  gameKey: GameKey;
  mode: GameMode;
  players: Player[];
  turnIndex: number;
  moveCount: number;
  isPaused: boolean;
  isOver: boolean;
  winnerIndex: number | null;
  historyMessages: string[];
  activeInfo?: string;
}

export interface GameRuleSection {
  gameKey: GameKey;
  title: string;
  subtitle: string;
  objective: string;
  howToPlay: string[];
  specialRules: string[];
  hackingPower: string;
  empirePower: string;
  proTips: string[];
}
