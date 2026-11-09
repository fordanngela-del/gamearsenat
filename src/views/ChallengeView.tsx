import React, { useState } from 'react';
import { GameKey, GameMode, Player, UserProfile } from '../types/game';
import { GAMES_CATALOG } from './ArenaView';
import { Copy, Check, MessageCircle, Zap, Crown, UserPlus, Bot } from 'lucide-react';
import { playSound } from '../utils/audio';

interface ChallengeViewProps {
  userProfile: UserProfile;
  selectedGame: GameKey;
  onSelectGame: (game: GameKey) => void;
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onStartMatch: (players: Player[]) => void;
  onTestInvitation: (challengeCode: string) => void;
}

export const ChallengeView: React.FC<ChallengeViewProps> = ({
  userProfile,
  selectedGame,
  onSelectGame,
  selectedMode,
  onSelectMode,
  onStartMatch,
  onTestInvitation,
}) => {
  const currentGame = GAMES_CATALOG.find((g) => g.id === selectedGame) || GAMES_CATALOG[0];
  const [playerCount, setPlayerCount] = useState<number>(Math.min(4, currentGame.maxPlayers));
  const [copied, setCopied] = useState<boolean>(false);
  const [challengeCode] = useState<string>(() =>
    Math.random().toString(36).substring(2, 7).toUpperCase()
  );

  // Slots for other players: 0: Waiting, 1: Friend joined, 2: AI Bot
  const [guestSlots, setGuestSlots] = useState<number[]>([1, 0, 0]);

  const defaultFriends = [
    { name: 'Sara', avatar: '/assets/avatars/sara.png' },
    { name: 'Léa', avatar: '/assets/avatars/lea.png' },
    { name: 'Yanis', avatar: '🧑🏾‍🚀' },
  ];

  const shareLink = typeof window !== 'undefined'
    ? `${window.location.origin}/#d=${challengeCode}&g=${selectedGame}&m=${selectedMode}&n=${playerCount}&h=${encodeURIComponent(
        userProfile.pseudo
      )}`
    : `https://arena.app/d/${challengeCode}`;

  const handleCopyLink = () => {
    playSound('click');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCycleSlot = (slotIdx: number) => {
    playSound('click');
    setGuestSlots((prev) => {
      const next = [...prev];
      next[slotIdx] = (next[slotIdx] + 1) % 3; // 0 (waiting) -> 1 (joined) -> 2 (bot)
      return next;
    });
  };

  const handleLaunch = () => {
    playSound('click');
    const players: Player[] = [
      {
        id: 'host',
        name: userProfile.pseudo || 'Karim',
        avatar: userProfile.avatar || '/assets/avatars/karim.png',
        color: '#00f59b',
        isHost: true,
        crowns: 0,
        hackUsed: false,
        seat: 0,
        timeLeft: 900,
      },
    ];

    for (let i = 1; i < playerCount; i++) {
      const state = guestSlots[i - 1];
      const friend = defaultFriends[i - 1];
      const colors = ['#ff3d71', '#3d8bff', '#ffd84d'];

      if (state === 1) {
        // Friend joined
        players.push({
          id: `guest-${i}`,
          name: friend.name,
          avatar: friend.avatar,
          color: colors[i - 1],
          isHost: false,
          isBot: false,
          crowns: 0,
          hackUsed: false,
          seat: i,
          timeLeft: 900,
        });
      } else {
        // Bot
        players.push({
          id: `bot-${i}`,
          name: `Bot ${friend.name}`,
          avatar: '🤖',
          color: colors[i - 1],
          isHost: false,
          isBot: true,
          crowns: 0,
          hackUsed: false,
          seat: i,
          timeLeft: 900,
        });
      }
    }

    onStartMatch(players);
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* View Header */}
      <div>
        <h1 className="text-4xl sm:text-6xl font-black italic tracking-tight uppercase text-white font-['Barlow_Condensed']">
          Créer un <span className="text-[#00f59b]">défi</span>
        </h1>
        <p className="text-base sm:text-lg text-[#8da0b5] font-medium mt-1">
          Lance une partie et invite tes amis à te rejoindre.
        </p>
      </div>

      {/* Configuration Panel (matching Image 2) */}
      <section className="p-5 sm:p-6 rounded-2xl border border-[#1c2b3b] bg-[#0e1722] shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Jeu Selector */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-[#8da0b5] mb-2 flex items-center gap-1.5">
              <span>🎮</span>
              <span>Jeu</span>
            </label>
            <div className="relative">
              <select
                value={selectedGame}
                onChange={(e) => {
                  const g = e.target.value as GameKey;
                  onSelectGame(g);
                  const selectedG = GAMES_CATALOG.find((x) => x.id === g);
                  if (selectedG && playerCount > selectedG.maxPlayers) {
                    setPlayerCount(selectedG.maxPlayers);
                  }
                }}
                className="w-full bg-[#0a121b] border-2 border-[#00f59b]/80 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-[#00f59b] focus:ring-1 focus:ring-[#00f59b] transition-all cursor-pointer"
              >
                {GAMES_CATALOG.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.emoji} {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Mode Selector */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-[#8da0b5] mb-2 flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-[#ffd84d]" />
              <span>Mode</span>
            </label>
            <select
              value={selectedMode}
              onChange={(e) => onSelectMode(e.target.value as GameMode)}
              className="w-full bg-[#0a121b] border border-[#1c2b3b] rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-[#00f59b] transition-all cursor-pointer"
            >
              <option value="hacking">🕵️ Mode Hacking (1 Piratage ⚡)</option>
              <option value="empire">👑 Mode Empire Roi (Couronnes)</option>
            </select>
          </div>

          {/* 3. Player Count Selector */}
          <div>
            <label className="block text-sm font-bold uppercase tracking-wider text-[#8da0b5] mb-2 flex items-center gap-1.5">
              <span>👥</span>
              <span>Nombre de joueurs</span>
            </label>
            <div className="flex items-center gap-2 p-1 bg-[#0a121b] border border-[#1c2b3b] rounded-xl">
              {[2, 3, 4]
                .filter((n) => n <= currentGame.maxPlayers)
                .map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      playSound('click');
                      setPlayerCount(n);
                    }}
                    className={`flex-1 py-2.5 rounded-lg font-extrabold text-base tracking-wide transition-all cursor-pointer ${
                      playerCount === n
                        ? 'bg-[#00f59b] text-[#032014] shadow-[0_0_12px_rgba(0,245,155,0.35)]'
                        : 'text-[#8da0b5] hover:text-white'
                    }`}
                  >
                    {n} joueurs
                  </button>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Challenge Link Panel (matching Image 2) */}
      <section className="p-5 sm:p-6 rounded-2xl border border-[#1c2b3b] bg-[#0e1722] shadow-xl flex flex-wrap items-center gap-3">
        <span className="text-base sm:text-lg font-bold text-[#8da0b5] flex items-center gap-2 shrink-0">
          <span className="text-lg text-[#00f59b]">🔗</span>
          <span>Lien du défi</span>
        </span>

        {/* Link display */}
        <div className="flex-1 min-w-[220px] px-3.5 py-2.5 rounded-xl bg-[#0a121b] border border-[#1c2b3b] font-mono text-xs sm:text-sm text-[#00f59b] truncate select-all">
          {shareLink}
        </div>

        {/* Copy Link Button */}
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-base bg-[#00f59b] text-[#032014] hover:bg-[#1affaa] transition-all cursor-pointer shadow-md shrink-0"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copié ✓' : 'Copier le lien'}</span>
        </button>

        {/* WhatsApp Button */}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(
            `Rejoins mon défi sur GameArena (${currentGame.name}) : ${shareLink}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-base border border-[#1c2b3b] bg-[#0a121b] text-white hover:border-[#25D366] hover:text-[#25D366] transition-all cursor-pointer shrink-0"
        >
          <MessageCircle className="w-4 h-4 text-[#25D366]" />
          <span>WhatsApp</span>
        </a>
      </section>

      {/* Guests Panel (matching Image 2) */}
      <section className="p-5 sm:p-6 rounded-2xl border border-[#1c2b3b] bg-[#0e1722] shadow-xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#8da0b5] mb-4 flex items-center gap-2">
          <span>👥</span>
          <span>Invités ({playerCount} places)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Host Slot */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl border-2 border-[#00f59b] bg-[#0a121b] shadow-[0_0_15px_rgba(0,245,155,0.2)]">
            <div className="w-12 h-12 rounded-full border-2 border-[#00f59b] overflow-hidden bg-[#0c2a25] flex items-center justify-center shrink-0">
              <img
                src={userProfile.avatar || '/assets/avatars/karim.png'}
                alt={userProfile.pseudo}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="text-xl">😎</span>
            </div>
            <div>
              <p className="text-base sm:text-lg font-bold text-white leading-tight">
                {userProfile.pseudo || 'Karim'} (hôte)
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-[#ffd84d]">
                <Crown className="w-3 h-3 fill-current" />
                <span>Hôte</span>
              </span>
            </div>
          </div>

          {/* Guest Slots */}
          {Array.from({ length: playerCount - 1 }).map((_, i) => {
            const state = guestSlots[i];
            const friend = defaultFriends[i];

            return (
              <button
                key={i}
                type="button"
                onClick={() => handleCycleSlot(i)}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
                  state === 1
                    ? 'border-[#00f59b]/50 bg-[#0a121b]'
                    : state === 2
                    ? 'border-[#1c2b3b] bg-[#0a121b]'
                    : 'border-2 border-dashed border-[#1c2b3b] bg-[#070d14]/60 hover:border-[#8da0b5]'
                }`}
              >
                {state === 1 ? (
                  <>
                    <div className="w-12 h-12 rounded-full border-2 border-[#ff3d71] overflow-hidden bg-[#2a0c18] flex items-center justify-center shrink-0">
                      <img
                        src={friend.avatar}
                        alt={friend.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <span className="text-xl">👩🏽‍🎤</span>
                    </div>
                    <div>
                      <p className="text-base font-bold text-white">{friend.name} a rejoint</p>
                      <span className="text-xs font-bold text-[#00f59b] flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Rejoint</span>
                      </span>
                    </div>
                  </>
                ) : state === 2 ? (
                  <>
                    <div className="w-12 h-12 rounded-full border-2 border-[#1c2b3b] bg-[#0e1722] flex items-center justify-center text-xl shrink-0">
                      <Bot className="w-6 h-6 text-[#00f59b]" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-white">Bot IA</p>
                      <span className="text-xs text-[#8da0b5]">Clique pour changer</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#8da0b5]/40 flex items-center justify-center text-xl text-[#8da0b5] shrink-0">
                      <UserPlus className="w-5 h-5 text-[#8da0b5]" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-[#8da0b5]">En attente…</p>
                      <span className="text-xs text-[#8da0b5]/60">Clique pour inviter</span>
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Action Buttons Bar */}
      <div className="flex flex-wrap items-center gap-4 pt-2">
        <button
          onClick={handleLaunch}
          className="flex items-center gap-2 px-8 py-4 rounded-xl font-extrabold text-xl uppercase tracking-wider bg-[#00f59b] text-[#032014] shadow-[0_0_24px_rgba(0,245,155,0.4)] hover:bg-[#1affaa] transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        >
          <Zap className="w-5 h-5 fill-current" />
          <span>Lancer la partie →</span>
        </button>

        <button
          onClick={() => {
            playSound('click');
            onTestInvitation(challengeCode);
          }}
          className="px-6 py-4 rounded-xl font-bold text-lg text-[#00f59b] border border-[#00f59b]/50 hover:bg-[#00f59b]/10 transition-all cursor-pointer"
        >
          Tester l'invitation
        </button>
      </div>

      <p className="text-xs sm:text-sm text-[#8da0b5] mt-1">
        Sans serveur complexe, les amis peuvent jouer en direct sur le même écran tour par tour ;
        les places en attente sont automatiquement comblées par des bots IA. Le lien ouvre l'écran
        d'invitation sur n'importe quel appareil.
      </p>
    </div>
  );
};
