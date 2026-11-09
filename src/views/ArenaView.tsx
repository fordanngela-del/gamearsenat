import React, { useState } from 'react';
import { GameKey, GameMode, GameInfo } from '../types/game';
import { NovaCommentator } from '../components/NovaCommentator';
import { ArrowRight, Zap, Crown, Bot, Users, Share2, X } from 'lucide-react';
import { playSound } from '../utils/audio';

interface ArenaViewProps {
  currentMode: GameMode;
  onModeChange: (mode: GameMode) => void;
  onSelectGame: (gameKey: GameKey) => void;
  onQuickLaunch: (gameKey: GameKey, isTwoPlayer: boolean) => void;
  onCreateChallenge: (gameKey?: GameKey) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  novaComment: string;
}

export const GAMES_CATALOG: GameInfo[] = [
  {
    id: 'ludo',
    name: 'Ludo',
    emoji: '🎲',
    accent: '#7a2230',
    maxPlayers: 4,
    coverImage: '/assets/games/ludo_card.png',
    description: 'Course rapide multijoueur. Sors avec un 6, capture les pions rivaux et rentre à la maison !',
  },
  {
    id: 'dames',
    name: 'Dames',
    emoji: '⚫',
    accent: '#5a3a1a',
    maxPlayers: 2,
    coverImage: '/assets/games/dames_card.png',
    description: 'Jeu classique de stratégie. La prise est obligatoire ! Enchaîne les sauts pour sacrer ta Dame.',
  },
  {
    id: 'echecs',
    name: 'Échecs',
    emoji: '♞',
    accent: '#173a5c',
    maxPlayers: 2,
    coverImage: '/assets/games/echecs_card.png',
    description: 'Le duel des rois. Contrôle le centre, calcule chaque coup et assène un échec et mat implacable.',
  },
  {
    id: 'monopoly',
    name: 'Empire Monopoly',
    emoji: '🏙️',
    accent: '#5c4a14',
    maxPlayers: 4,
    coverImage: '/assets/games/monopoly_card.png',
    description: 'Bâtis ton empire immobilier. Achète les avenues prestigieuses, encaisse les loyers et ruine tes adversaires.',
  },
  {
    id: 'fruitslasher',
    name: 'Fruit Arena',
    emoji: '🍉',
    accent: '#2e7d32',
    maxPlayers: 4,
    coverImage: '/assets/games/fruitslasher_card.png',
    description: 'Arène ninja explosive ! Tranche les fruits propulsés par les canons, esquive les bombes et décroche la couronne.',
  },
];

export const ArenaView: React.FC<ArenaViewProps> = ({
  currentMode,
  onModeChange,
  onSelectGame,
  onQuickLaunch,
  onCreateChallenge,
  isMuted,
  onToggleMute,
  novaComment,
}) => {
  const [selectedGameForModal, setSelectedGameForModal] = useState<GameInfo | null>(null);

  const handleCardClick = (game: GameInfo) => {
    playSound('click');
    setSelectedGameForModal(game);
  };

  const handleDirectArrowClick = (e: React.MouseEvent, game: GameInfo) => {
    e.stopPropagation();
    playSound('click');
    onQuickLaunch(game.id, false); // Instant launch vs bot
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Hero Header matching Image 4 */}
      <div>
        <h1 className="text-4xl sm:text-6xl font-black italic tracking-tight uppercase text-white font-['Barlow_Condensed']">
          Choisis ton <span className="text-[#00f59b]">arène</span>
        </h1>
      </div>

      {/* Mode Selector and Challenge CTA Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Segmented Mode Control */}
        <div className="inline-flex p-1.5 rounded-full bg-[#0e1722] border border-[#1c2b3b]">
          <button
            onClick={() => {
              playSound('click');
              onModeChange('hacking');
            }}
            className={`flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-full font-bold text-base sm:text-lg tracking-wide uppercase transition-all cursor-pointer ${
              currentMode === 'hacking'
                ? 'bg-[#00f59b] text-[#032014] shadow-[0_0_16px_rgba(0,245,155,0.4)]'
                : 'text-[#8da0b5] hover:text-white'
            }`}
          >
            <span>🕵️</span>
            <span>Mode Hacking</span>
          </button>

          <button
            onClick={() => {
              playSound('click');
              onModeChange('empire');
            }}
            className={`flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-full font-bold text-base sm:text-lg tracking-wide uppercase transition-all cursor-pointer ${
              currentMode === 'empire'
                ? 'bg-[#00f59b] text-[#032014] shadow-[0_0_16px_rgba(0,245,155,0.4)]'
                : 'text-[#8da0b5] hover:text-white'
            }`}
          >
            <Crown className="w-4 h-4 text-[#ffd84d]" />
            <span>Mode Empire Roi</span>
          </button>
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => {
            playSound('click');
            onCreateChallenge();
          }}
          className="flex items-center gap-2 px-7 sm:px-8 py-3.5 rounded-xl font-extrabold text-lg sm:text-xl uppercase tracking-wider bg-[#00f59b] text-[#032014] shadow-[0_0_24px_rgba(0,245,155,0.4)] hover:bg-[#1affaa] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
        >
          <Zap className="w-5 h-5 fill-current" />
          <span>Créer un défi</span>
          <ArrowRight className="w-5 h-5 ml-1" />
        </button>
      </div>

      {/* 5 3D Game Cards Grid (matching reference cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
        {GAMES_CATALOG.map((game) => (
          <div
            key={game.id}
            onClick={() => handleCardClick(game)}
            className="group relative flex flex-col justify-between h-[360px] sm:h-[400px] rounded-2xl border border-[#1c2b3b] bg-[#0e1722] overflow-hidden hover:border-[#00f59b] hover:shadow-[0_0_30px_rgba(0,245,155,0.25)] transition-all duration-300 cursor-pointer transform hover:-translate-y-1.5"
          >
            {/* 3D Realistic Board Render */}
            <div className="relative w-full h-[72%] overflow-hidden bg-[#070d14]">
              <img
                src={game.coverImage}
                alt={game.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e1722] via-transparent to-black/20" />
            </div>

            {/* Bottom Card Title and Arrow */}
            <div className="p-4 sm:p-5 flex items-center justify-between z-10">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black italic tracking-wide text-white uppercase group-hover:text-[#00f59b] transition-colors font-['Barlow_Condensed']">
                  {game.name}
                </h3>
                <span className="text-xs text-[#8da0b5] font-semibold">
                  {game.maxPlayers} joueurs max · {currentMode === 'hacking' ? '1 Piratage ⚡' : 'Couronnes 👑'}
                </span>
              </div>

              {/* Circle Arrow Action Button -> Launches direct match! */}
              <button
                onClick={(e) => handleDirectArrowClick(e, game)}
                title="Lancer le match immédiatement"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-white/20 bg-white/10 group-hover:bg-[#00f59b] group-hover:border-[#00f59b] group-hover:text-[#032014] text-white flex items-center justify-center transition-all shadow-md cursor-pointer hover:scale-110 active:scale-95"
              >
                <ArrowRight className="w-5 h-5 transform group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* NOVA Voice Banner at Bottom (matching Image 4) */}
      <div className="mt-4">
        <NovaCommentator
          variant="banner"
          latestMessage={novaComment}
          isMuted={isMuted}
          onToggleMute={onToggleMute}
        />
      </div>

      {/* Quick Launch Modal when clicking a card */}
      {selectedGameForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl border-2 border-[#00f59b] bg-[#0e1722] p-6 shadow-[0_0_40px_rgba(0,245,155,0.3)] space-y-5">
            {/* Close Button */}
            <button
              onClick={() => setSelectedGameForModal(null)}
              className="absolute top-4 right-4 p-2 text-[#8da0b5] hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Game Preview */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#1c2b3b] shrink-0">
                <img
                  src={selectedGameForModal.coverImage}
                  alt={selectedGameForModal.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-3xl font-black italic uppercase text-white font-['Barlow_Condensed']">
                  {selectedGameForModal.name}
                </h3>
                <p className="text-xs sm:text-sm text-[#8da0b5]">
                  {selectedGameForModal.description}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              {/* Option 1: Direct Solo vs Bot */}
              <button
                onClick={() => {
                  const g = selectedGameForModal.id;
                  setSelectedGameForModal(null);
                  onQuickLaunch(g, false);
                }}
                className="w-full py-3.5 px-4 rounded-xl font-extrabold text-lg uppercase tracking-wider bg-[#00f59b] text-[#032014] shadow-[0_0_20px_rgba(0,245,155,0.35)] hover:bg-[#1affaa] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Bot className="w-5 h-5" />
                <span>Lancer le duel (Solo vs Bot IA)</span>
              </button>

              {/* Option 2: 2 Players on same screen */}
              <button
                onClick={() => {
                  const g = selectedGameForModal.id;
                  setSelectedGameForModal(null);
                  onQuickLaunch(g, true);
                }}
                className="w-full py-3 px-4 rounded-xl font-bold text-base uppercase tracking-wider border border-[#00f59b]/50 text-white hover:bg-[#00f59b]/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Users className="w-5 h-5 text-[#00f59b]" />
                <span>Jouer à 2 joueurs (Sur cet écran)</span>
              </button>

              {/* Option 3: Create Challenge Link */}
              <button
                onClick={() => {
                  const g = selectedGameForModal.id;
                  setSelectedGameForModal(null);
                  onCreateChallenge(g);
                }}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm text-[#8da0b5] hover:text-white hover:bg-[#1c2b3b]/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Créer un défi et inviter un ami</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
