import React, { useState } from 'react';
import { GameKey, GameMode, Player, UserProfile } from '../types/game';
import { GAMES_CATALOG } from './ArenaView';
import { ArrowRight, Crown } from 'lucide-react';
import { playSound } from '../utils/audio';

interface AcceptChallengeViewProps {
  hostName: string;
  gameKey: GameKey;
  mode: GameMode;
  playerCount: number;
  userProfile: UserProfile;
  onAccept: (customPseudo: string, playVsBotOnly: boolean) => void;
}

export const AcceptChallengeView: React.FC<AcceptChallengeViewProps> = ({
  hostName,
  gameKey,
  mode,
  playerCount,
  userProfile,
  onAccept,
}) => {
  const [pseudo, setPseudo] = useState<string>(
    userProfile.pseudo !== hostName ? userProfile.pseudo : 'Sami'
  );
  const currentGame = GAMES_CATALOG.find((g) => g.id === gameKey) || GAMES_CATALOG[1];

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Hero Banner with 3D board graphic (matching Image 1) */}
      <div className="relative rounded-3xl overflow-hidden border border-[#1c2b3b] min-h-[280px] sm:min-h-[320px] p-6 sm:p-10 flex flex-col justify-center bg-[#07100f] shadow-2xl">
        {/* Background Image Artwork */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/games/dames_hero_banner.png"
            alt={currentGame.name}
            className="w-full h-full object-cover object-right opacity-80"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = currentGame.coverImage;
            }}
          />
          {/* Measured gradient scrim for perfect contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#07100f] via-[#07100f]/85 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-xl">
          <h1 className="text-4xl sm:text-6xl font-black italic tracking-tight uppercase text-white font-['Barlow_Condensed'] leading-none">
            {hostName} te défie <br />
            aux <span className="text-[#00f59b]">{currentGame.name}</span>
          </h1>

          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00f59b] text-[#032014] font-black text-base sm:text-lg uppercase tracking-wide shadow-[0_0_15px_rgba(0,245,155,0.4)]">
            <span>{mode === 'hacking' ? '🕵️ Mode Hacking' : '👑 Mode Empire Roi'}</span>
            <span>·</span>
            <span>{playerCount} joueurs</span>
          </div>
        </div>
      </div>

      {/* Players Setup Card (matching Image 1) */}
      <div className="p-6 rounded-2xl border border-[#1c2b3b] bg-[#0e1722] shadow-xl flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-lg font-bold text-[#8da0b5]">
            👥 Joueurs (1/{playerCount})
          </span>
        </div>

        {/* Host Avatar & Name */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-14 h-14 rounded-full border-2 border-[#00f59b] overflow-hidden bg-[#0c2a25] shadow-lg flex items-center justify-center">
            <img
              src="/assets/avatars/karim.png"
              alt={hostName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="text-2xl">😎</span>
          </div>
          <div>
            <p className="text-xl font-black text-white leading-tight">{hostName}</p>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#ffd84d]">
              <Crown className="w-3 h-3 fill-current" />
              <span>Hôte</span>
            </span>
          </div>
        </div>

        {/* Plus separator */}
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#8da0b5]/40 flex items-center justify-center text-2xl text-[#8da0b5] shrink-0">
          +
        </div>

        {/* Pseudo Input Field */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-bold uppercase tracking-wider text-[#8da0b5] mb-1.5">
            Ton pseudo
          </label>
          <input
            type="text"
            value={pseudo}
            maxLength={14}
            onChange={(e) => setPseudo(e.target.value)}
            placeholder="Sami"
            className="w-full bg-[#0a121b] border-2 border-[#00f59b] rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#00f59b]/50 shadow-[0_0_12px_rgba(0,245,155,0.2)]"
          />
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="flex flex-col items-center justify-center gap-4 mt-2">
        <button
          onClick={() => {
            playSound('click');
            onAccept(pseudo.trim() || 'Sami', false);
          }}
          className="w-full max-w-md py-4 rounded-xl font-black text-xl uppercase tracking-wider bg-[#00f59b] text-[#032014] shadow-[0_0_28px_rgba(0,245,155,0.45)] hover:bg-[#1affaa] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span>⚡</span>
          <span>Accepter le défi</span>
          <ArrowRight className="w-6 h-6 ml-1" />
        </button>

        <button
          onClick={() => {
            playSound('click');
            onAccept(pseudo.trim() || 'Sami', true);
          }}
          className="text-base sm:text-lg font-bold text-[#8da0b5] hover:text-[#00f59b] underline transition-colors cursor-pointer"
        >
          Jouer contre le bot
        </button>

        <p className="text-xs text-[#8da0b5]/70 text-center">
          Aperçu hors ligne : l'hôte est simulé par l'IA ou jouable sur le même écran.
        </p>
      </div>
    </div>
  );
};
