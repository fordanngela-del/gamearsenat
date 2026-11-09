import React from 'react';
import { Player, GameMode } from '../types/game';
import { Zap, Crown, Wifi } from 'lucide-react';
import { playSound } from '../utils/audio';

interface PlayerCardsProps {
  players: Player[];
  activeTurnIndex: number;
  mode: GameMode;
  onTriggerHack?: (playerIndex: number) => void;
  formatTime?: (seconds: number) => string;
}

export const PlayerCards: React.FC<PlayerCardsProps> = ({
  players,
  activeTurnIndex,
  mode,
  onTriggerHack,
  formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  },
}) => {
  const isTwoPlayers = players.length === 2;

  return (
    <div
      className={`grid gap-4 my-2 ${
        isTwoPlayers
          ? 'grid-cols-1 sm:grid-cols-2'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      }`}
    >
      {players.map((player, idx) => {
        const isActive = idx === activeTurnIndex;
        const color = player.color || (idx === 0 ? '#00f59b' : '#ff3d71');

        return (
          <div
            key={player.id || idx}
            style={{
              borderColor: isActive ? color : '#1c2b3b',
              boxShadow: isActive ? `0 0 20px ${color}40` : 'none',
            }}
            className={`flex items-center justify-between gap-3 p-3 sm:p-4 rounded-2xl border bg-[#0e1722] transition-all duration-300 ${
              isActive ? 'opacity-100 ring-1 ring-inset ring-white/10' : 'opacity-70 hover:opacity-90'
            }`}
          >
            {/* Left: Avatar with glowing lightning badge and name */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div
                  style={{ borderColor: color }}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 overflow-hidden bg-[#0c1a24] shadow-md flex items-center justify-center text-2xl font-bold"
                >
                  {player.avatar.startsWith('/') || player.avatar.startsWith('http') ? (
                    <img
                      src={player.avatar}
                      alt={player.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <span>{player.avatar || '👤'}</span>
                  )}
                </div>

                {/* Lightning badge matching Image 3 */}
                <div
                  style={{ backgroundColor: color }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-[#032014] font-black border-2 border-[#0e1722] shadow-sm"
                >
                  ⚡
                </div>
              </div>

              {/* Name & Latency */}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl sm:text-2xl font-black italic tracking-wide text-white font-['Barlow_Condensed'] truncate">
                    {player.name}
                  </span>

                  {/* Hack Button if mode hacking and user's turn */}
                  {mode === 'hacking' && !player.isBot && (
                    <button
                      disabled={player.hackUsed || !isActive}
                      onClick={() => {
                        if (!player.hackUsed && isActive && onTriggerHack) {
                          playSound('hack');
                          onTriggerHack(idx);
                        }
                      }}
                      title={
                        player.hackUsed
                          ? 'Piratage déjà utilisé'
                          : isActive
                          ? 'Activer le Piratage ⚡ !'
                          : 'Disponible à ton tour'
                      }
                      className={`p-1 rounded-full transition-all ${
                        player.hackUsed
                          ? 'opacity-30 text-gray-500 cursor-not-allowed'
                          : isActive
                          ? 'text-[#ffd84d] hover:scale-125 animate-bounce cursor-pointer shadow-[0_0_8px_#ffd84d]'
                          : 'text-[#ffd84d]/60'
                      }`}
                    >
                      <Zap className="w-4 h-4 fill-current" />
                    </button>
                  )}
                </div>

                {/* Latency signal bars matching Image 3 */}
                <div className="flex items-center gap-1 mt-0.5" title="Signal live parfait">
                  <div className="flex items-end gap-[2px] h-3">
                    <span
                      style={{ backgroundColor: color }}
                      className="w-[3px] h-1.5 rounded-sm"
                    />
                    <span
                      style={{ backgroundColor: color }}
                      className="w-[3px] h-2 rounded-sm"
                    />
                    <span
                      style={{ backgroundColor: color }}
                      className="w-[3px] h-2.5 rounded-sm"
                    />
                    <span
                      style={{ backgroundColor: color }}
                      className="w-[3px] h-3 rounded-sm"
                    />
                  </div>
                  <span className="text-[11px] font-mono text-[#8da0b5]">
                    {player.isBot ? 'Bot' : 'Live'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Digital Timer box and Crown box */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Digital Timer box matching Image 3 (e.g. 12:41 in green / 10:08 in pink) */}
              {player.timeLeft !== undefined && (
                <div
                  style={{
                    color,
                    borderColor: `${color}40`,
                    backgroundColor: `${color}12`,
                  }}
                  className="px-3 sm:px-4 py-1.5 rounded-xl border font-mono text-xl sm:text-2xl font-bold tracking-tight shadow-inner"
                >
                  {formatTime(player.timeLeft)}
                </div>
              )}

              {/* Crown Box matching Image 3 (crown icon + 0) */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#1c2b3b] bg-[#070d14] text-base sm:text-lg font-bold text-[#eaf2ff]">
                <Crown className="w-4 h-4 text-[#ffd84d]" />
                <span>{player.crowns || 0}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
