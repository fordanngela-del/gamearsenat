import React, { useState, useEffect, useCallback } from 'react';
import { GameKey, GameMode, NavTab, Player, UserProfile } from './types/game';
import { Header } from './components/Header';
import { ArenaView } from './views/ArenaView';
import { ChallengeView } from './views/ChallengeView';
import { AcceptChallengeView } from './views/AcceptChallengeView';
import { TrainingView } from './views/TrainingView';
import { ProfileView } from './views/ProfileView';
import { LiveGameView } from './views/LiveGameView';
import { RulesView } from './views/RulesView';
import { speakNova, playSound } from './utils/audio';

const STORAGE_KEY = 'gamearena_user_profile';

const DEFAULT_PROFILE: UserProfile = {
  pseudo: 'Karim',
  avatar: '/assets/avatars/karim.png',
  crowns: 12,
  stats: {
    ludo: { wins: 4, losses: 1 },
    dames: { wins: 7, losses: 2 },
    echecs: { wins: 9, losses: 3 },
    monopoly: { wins: 3, losses: 1 },
    fruitslasher: { wins: 5, losses: 1 },
  },
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('arene');
  const [activeMode, setActiveMode] = useState<GameMode>('hacking');
  const [selectedGame, setSelectedGame] = useState<GameKey>('echecs');
  const [isMuted, setIsMuted] = useState<boolean>(true);

  // Active match state
  const [activeMatch, setActiveMatch] = useState<{
    gameKey: GameKey;
    mode: GameMode;
    players: Player[];
  } | null>(null);

  // URL hash invitation
  const [incomingChallenge, setIncomingChallenge] = useState<{
    code: string;
    gameKey: GameKey;
    mode: GameMode;
    playerCount: number;
    hostName: string;
  } | null>(null);

  // Profile state
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return DEFAULT_PROFILE;
  });

  const [novaVoiceText, setNovaVoiceText] = useState<string>(
    'Prêt pour le duel ? Les pions sont en place.'
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.debug('Failed to save profile:', e);
    }
  }, [profile]);

  useEffect(() => {
    if (isMuted) {
      document.body.classList.add('muted-audio');
    } else {
      document.body.classList.remove('muted-audio');
    }
  }, [isMuted]);

  const handleHashChange = useCallback(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.slice(1);
    if (!hash) {
      setIncomingChallenge(null);
      return;
    }

    try {
      const params = new URLSearchParams(hash);
      const code = params.get('d');
      const g = (params.get('g') as GameKey) || 'dames';
      const m = (params.get('m') as GameMode) || 'hacking';
      const n = Number(params.get('n')) || 2;
      const h = params.get('h') || 'Karim';

      if (code) {
        setIncomingChallenge({
          code,
          gameKey: g,
          mode: m,
          playerCount: n,
          hostName: decodeURIComponent(h),
        });
        setActiveMatch(null);
      }
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [handleHashChange]);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (!nextMuted) {
      speakNova('NOVA est en ligne. Prêt pour le duel.', false);
    }
  };

  const handleModeChange = (mode: GameMode) => {
    setActiveMode(mode);
    const comment =
      mode === 'hacking'
        ? 'Mode Hacking : chaque joueur a un piratage ⚡ par partie. Prêt pour le duel ? Les pions sont en place.'
        : 'Mode Empire Roi : chaque capture ou achat rapporte une couronne 👑. La victoire en donne 3 !';
    setNovaVoiceText(comment);
    speakNova(comment, isMuted);
  };

  const handleStartGame = (gameKey: GameKey, players: Player[], mode = activeMode) => {
    setActiveMatch({
      gameKey,
      mode,
      players,
    });
    setIncomingChallenge(null);
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname);
    }
    const intro = `Duel en direct lancé sur ${gameKey.toUpperCase()}. Que le meilleur l'emporte !`;
    speakNova(intro, isMuted);
  };

  // Quick launch directly from Arena Home
  const handleQuickLaunch = (gameKey: GameKey, isTwoPlayer: boolean) => {
    const players: Player[] = [
      {
        id: 'p1',
        name: profile.pseudo || 'Karim',
        avatar: profile.avatar || '/assets/avatars/karim.png',
        color: '#00f59b',
        isHost: true,
        isBot: false,
        crowns: 0,
        hackUsed: false,
        seat: 0,
        timeLeft: 761,
      },
      {
        id: 'p2',
        name: isTwoPlayer ? 'Joueur 2' : 'Léa',
        avatar: '/assets/avatars/lea.png',
        color: '#ff3d71',
        isHost: false,
        isBot: !isTwoPlayer,
        crowns: 0,
        hackUsed: false,
        seat: 1,
        timeLeft: 608,
      },
    ];

    handleStartGame(gameKey, players, activeMode);
  };

  const handleAcceptIncomingChallenge = (customPseudo: string, vsBotOnly: boolean) => {
    if (!incomingChallenge) return;

    const me: Player = {
      id: 'guest-me',
      name: customPseudo,
      avatar: '/assets/avatars/lea.png',
      color: '#ff3d71',
      isHost: false,
      isBot: false,
      crowns: 0,
      hackUsed: false,
      seat: 1,
      timeLeft: 608,
    };

    const opponent: Player = {
      id: 'host-player',
      name: incomingChallenge.hostName,
      avatar: '/assets/avatars/karim.png',
      color: '#00f59b',
      isHost: true,
      isBot: vsBotOnly,
      crowns: 0,
      hackUsed: false,
      seat: 0,
      timeLeft: 761,
    };

    const playersList = vsBotOnly ? [me, opponent] : [opponent, me];
    handleStartGame(incomingChallenge.gameKey, playersList, incomingChallenge.mode);
  };

  const handleStartSoloTraining = (gameKey: GameKey) => {
    handleQuickLaunch(gameKey, false);
  };

  const handleRecordMatchOutcome = (gameKey: GameKey, winnerId: string, crownsWon: number) => {
    const isPlayerWin = winnerId === 'host' || winnerId === 'me' || winnerId === 'p1';

    setProfile((prev) => {
      const currentStats = prev.stats[gameKey] || { wins: 0, losses: 0 };
      return {
        ...prev,
        crowns: isPlayerWin ? prev.crowns + crownsWon : prev.crowns,
        stats: {
          ...prev.stats,
          [gameKey]: {
            wins: isPlayerWin ? currentStats.wins + 1 : currentStats.wins,
            losses: !isPlayerWin ? currentStats.losses + 1 : currentStats.losses,
          },
        },
      };
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070d14] text-[#eaf2ff]">
      {/* Global Header */}
      <Header
        currentTab={currentTab}
        onTabChange={(tab) => {
          setActiveMatch(null);
          setIncomingChallenge(null);
          if (window.location.hash) {
            history.replaceState(null, '', window.location.pathname);
          }
          setCurrentTab(tab);
        }}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onOpenSettings={() => setCurrentTab('profil')}
      />

      {/* Main Body */}
      <main className="flex-1 w-full pb-12">
        {/* Match en direct (strictly matching Image 3) */}
        {activeMatch ? (
          <LiveGameView
            gameKey={activeMatch.gameKey}
            mode={activeMatch.mode}
            initialPlayers={activeMatch.players}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onReturnToArena={() => {
              playSound('click');
              setActiveMatch(null);
              setCurrentTab('arene');
            }}
            onRecordMatchOutcome={handleRecordMatchOutcome}
          />
        ) : incomingChallenge ? (
          /* Incoming Invitation (matching Image 1) */
          <AcceptChallengeView
            hostName={incomingChallenge.hostName}
            gameKey={incomingChallenge.gameKey}
            mode={incomingChallenge.mode}
            playerCount={incomingChallenge.playerCount}
            userProfile={profile}
            onAccept={handleAcceptIncomingChallenge}
          />
        ) : currentTab === 'arene' ? (
          /* Arena Home (strictly matching Image 4) */
          <ArenaView
            currentMode={activeMode}
            onModeChange={handleModeChange}
            onSelectGame={(gKey) => {
              setSelectedGame(gKey);
              setCurrentTab('defis');
            }}
            onQuickLaunch={handleQuickLaunch}
            onCreateChallenge={(gKey) => {
              if (gKey) setSelectedGame(gKey);
              setCurrentTab('defis');
            }}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            novaComment={novaVoiceText}
          />
        ) : currentTab === 'defis' ? (
          /* Challenge Creator (strictly matching Image 2) */
          <ChallengeView
            userProfile={profile}
            selectedGame={selectedGame}
            onSelectGame={setSelectedGame}
            selectedMode={activeMode}
            onSelectMode={setActiveMode}
            onStartMatch={(players) => handleStartGame(selectedGame, players, activeMode)}
            onTestInvitation={(code) => {
              window.location.hash = `d=${code}&g=${selectedGame}&m=${activeMode}&n=2&h=${encodeURIComponent(
                profile.pseudo
              )}`;
            }}
          />
        ) : currentTab === 'entr' ? (
          /* Solo Training */
          <TrainingView onStartSoloGame={handleStartSoloTraining} />
        ) : currentTab === 'regles' ? (
          /* Official Game Rules */
          <RulesView />
        ) : (
          /* Profile & Crowns */
          <ProfileView
            userProfile={profile}
            onUpdateProfile={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
          />
        )}
      </main>
    </div>
  );
}
