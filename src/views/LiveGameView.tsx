import React, { useState, useEffect } from 'react';
import { GameKey, GameMode, Player } from '../types/game';
import { GAMES_CATALOG } from '../views/ArenaView';
import { PlayerCards } from '../components/PlayerCards';
import { NovaCommentator } from '../components/NovaCommentator';
import { ChessGame } from '../games/ChessGame';
import { CheckersGame } from '../games/CheckersGame';
import { LudoGame } from '../games/LudoGame';
import { MonopolyGame } from '../games/MonopolyGame';
import { FruitSlasherGame } from '../games/FruitSlasherGame';
import { GAME_RULES } from './RulesView';
import { RotateCcw, ArrowLeft, BookOpen, X } from 'lucide-react';
import { playSound } from '../utils/audio';

interface LiveGameViewProps {
  gameKey: GameKey;
  mode: GameMode;
  initialPlayers: Player[];
  isMuted: boolean;
  onToggleMute: () => void;
  onReturnToArena: () => void;
  onRecordMatchOutcome: (gameKey: GameKey, winnerPlayerId: string, crownsWon: number) => void;
}

export const LiveGameView: React.FC<LiveGameViewProps> = ({
  gameKey,
  mode,
  initialPlayers,
  isMuted,
  onToggleMute,
  onReturnToArena,
  onRecordMatchOutcome,
}) => {
  const currentGame = GAMES_CATALOG.find((g) => g.id === gameKey) || GAMES_CATALOG[2];

  const [players, setPlayers] = useState<Player[]>(() =>
    initialPlayers.map((p, idx) => {
      const assignedSeat =
        p.seat !== undefined
          ? p.seat
          : initialPlayers.length === 2 && idx === 1
          ? 2
          : idx % 4;

      const ludoColors = ['#e53935', '#43a047', '#fbc02d', '#1e88e5'];

      return {
        ...p,
        seat: assignedSeat,
        timeLeft: p.timeLeft || (idx === 0 ? 761 : 608), // e.g. 12:41 and 10:08 like screenshot
        crowns: p.crowns || 0,
        hackUsed: false,
        color:
          gameKey === 'ludo'
            ? ludoColors[assignedSeat % 4]
            : gameKey === 'monopoly'
            ? ['#ff4d4d', '#3d8bff', '#22c55e', '#ffc83d'][idx % 4]
            : idx === 0
            ? '#00f59b'
            : '#ff3d71',
      };
    })
  );

  const [activeTurnIndex, setActiveTurnIndex] = useState<number>(0);
  const [moveCount, setMoveCount] = useState<number>(14); // Match Coup 14 from image
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const currentGameRule = GAME_RULES.find((r) => r.gameKey === gameKey);

  // Exact commentary quotes from Image 3
  const [primaryComment, setPrimaryComment] = useState<string>(
    gameKey === 'echecs'
      ? 'Cavalier en f3, Karim attaque le centre !'
      : `Les pièces sont en place, ${players[0].name} prend l'initiative !`
  );
  const [secondaryComment, setSecondaryComment] = useState<string>(
    gameKey === 'echecs'
      ? '« Léa hésite... piège possible. »'
      : `« Match intense en direct sur GameArena. »`
  );

  // Turn timer countdown
  useEffect(() => {
    if (isPaused || isGameOver) return;

    const interval = setInterval(() => {
      setPlayers((prev) =>
        prev.map((p, i) =>
          i === activeTurnIndex && p.timeLeft > 0 ? { ...p, timeLeft: p.timeLeft - 1 } : p
        )
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTurnIndex, isPaused, isGameOver]);

  // Check for timeout
  useEffect(() => {
    if (isGameOver) return;
    const active = players[activeTurnIndex];
    if (active && active.timeLeft === 0) {
      const otherIdx = (activeTurnIndex + 1) % players.length;
      handleGameOver(otherIdx);
    }
  }, [players, activeTurnIndex, isGameOver]);

  const handleMoveMade = (
    commentary: string,
    wasCaptureOrSpecial: boolean,
    advanceTurn: boolean = true
  ) => {
    setSecondaryComment(primaryComment);
    setPrimaryComment(commentary);
    setMoveCount((prev) => prev + 1);

    if (mode === 'empire' && wasCaptureOrSpecial) {
      setPlayers((prev) =>
        prev.map((p, i) => (i === activeTurnIndex ? { ...p, crowns: p.crowns + 1 } : p))
      );
    }

    if (advanceTurn) {
      setActiveTurnIndex((prev) => (prev + 1) % players.length);
    }
  };

  const handleGameOver = (winnerIdx: number) => {
    setIsGameOver(true);
    setWinnerIndex(winnerIdx);
    playSound('win');

    if (winnerIdx >= 0) {
      const winner = players[winnerIdx];
      const bonusCrowns = mode === 'empire' ? 3 : 1;
      setPlayers((prev) =>
        prev.map((p, i) => (i === winnerIdx ? { ...p, crowns: p.crowns + bonusCrowns } : p))
      );
      setPrimaryComment(`VICTOIRE de ${winner.name} ! Une partie d'élite.`);
      onRecordMatchOutcome(gameKey, winner.id, bonusCrowns);
    } else {
      setPrimaryComment('Fin de partie : Match nul !');
    }
  };

  const handleTriggerHack = (playerIndex: number) => {
    if (players[playerIndex].hackUsed) return;

    playSound('hack');
    setPlayers((prev) =>
      prev.map((p, i) => (i === playerIndex ? { ...p, hackUsed: true } : p))
    );

    setSecondaryComment(primaryComment);
    setPrimaryComment(`⚡ ${players[playerIndex].name} active son Piratage Hacking !`);
  };

  const handleRestart = () => {
    playSound('click');
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        timeLeft: 760,
        hackUsed: false,
      }))
    );
    setActiveTurnIndex(0);
    setMoveCount(1);
    setIsGameOver(false);
    setWinnerIndex(null);
    setPrimaryComment(`Nouvelle manche ! ${players[0].name} commence.`);
    setSecondaryComment('Bonne chance aux deux stratèges.');
  };

  return (
    <div className="flex flex-col gap-3 sm:gap-4 max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-5">
      {/* Subheader Row (strictly matching Image 3) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
        {/* Left: Mode tag, Title "Duel en direct", Game tag */}
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-extrabold uppercase tracking-wide bg-[#00f59b] text-[#032014] shadow-[0_0_12px_rgba(0,245,155,0.3)] shrink-0">
            <span>⚡</span>
            <span>{mode === 'hacking' ? 'Mode Hacking' : 'Mode Empire Roi'}</span>
          </span>

          <h1 className="text-3xl sm:text-5xl font-black italic tracking-wide uppercase text-white font-['Barlow_Condensed'] shrink-0">
            Duel en direct
          </h1>

          <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#1c2b3b] bg-[#0e1722] text-sm sm:text-base font-bold text-white shrink-0">
            <span>{currentGame.emoji}</span>
            <span>{currentGame.name}</span>
          </span>
        </div>

        {/* Right: Live indicator + Coup count + Back button (matching Image 3) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#1c2b3b] bg-[#0e1722]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff3d71] animate-ping" />
            <span className="text-xs sm:text-sm font-black tracking-wider text-[#ff3d71] uppercase">
              EN DIRECT
            </span>
            <span className="text-xs sm:text-sm text-white font-mono border-l border-[#1c2b3b] pl-2.5 ml-1">
              Coup {moveCount}
            </span>
          </div>

          <button
            onClick={() => {
              playSound('click');
              setShowRulesModal(true);
            }}
            className="p-2 sm:px-3 sm:py-2 rounded-xl border border-[#00f59b]/50 bg-[#073a2b]/40 text-[#00f59b] hover:bg-[#00f59b]/10 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Consulter les règles du jeu"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Règles</span>
          </button>

          <button
            onClick={() => {
              playSound('click');
              onReturnToArena();
            }}
            className="p-2 sm:px-3 sm:py-2 rounded-xl border border-[#1c2b3b] bg-[#0e1722] text-[#8da0b5] hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Quitter la partie"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Quitter</span>
          </button>
        </div>
      </div>

      {/* Player Cards Strip (matching Image 3) */}
      <PlayerCards
        players={players}
        activeTurnIndex={activeTurnIndex}
        mode={mode}
        onTriggerHack={handleTriggerHack}
      />

      {/* Match Viewport: Board (Left) + NOVA Commentator (Right) (matching Image 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start mt-2">
        {/* Left Column: Board */}
        <div className="lg:col-span-8 relative rounded-2xl border border-[#1c2b3b] bg-[#070d14]/90 p-3 sm:p-5 shadow-2xl flex items-center justify-center min-h-[480px]">
          {gameKey === 'echecs' && (
            <ChessGame
              players={players}
              activeTurnIndex={activeTurnIndex}
              mode={mode}
              onMoveMade={handleMoveMade}
              onGameOver={handleGameOver}
              onHackEffect={() => {}}
              isPaused={isPaused}
            />
          )}

          {gameKey === 'dames' && (
            <CheckersGame
              players={players}
              activeTurnIndex={activeTurnIndex}
              mode={mode}
              onMoveMade={handleMoveMade}
              onGameOver={handleGameOver}
              isPaused={isPaused}
            />
          )}

          {gameKey === 'ludo' && (
            <LudoGame
              players={players}
              activeTurnIndex={activeTurnIndex}
              mode={mode}
              onMoveMade={handleMoveMade}
              onGameOver={handleGameOver}
              isPaused={isPaused}
            />
          )}

          {gameKey === 'monopoly' && (
            <MonopolyGame
              players={players}
              activeTurnIndex={activeTurnIndex}
              mode={mode}
              onMoveMade={handleMoveMade}
              onGameOver={handleGameOver}
              isPaused={isPaused}
            />
          )}

          {gameKey === 'fruitslasher' && (
            <FruitSlasherGame
              players={players}
              activeTurnIndex={activeTurnIndex}
              mode={mode}
              onMoveMade={handleMoveMade}
              onGameOver={handleGameOver}
              isPaused={isPaused}
            />
          )}

          {/* In-game Rules Modal */}
          {showRulesModal && currentGameRule && (
            <div className="absolute inset-0 z-40 rounded-2xl bg-[#070d14]/95 backdrop-blur-md p-5 sm:p-6 overflow-y-auto animate-fadeIn flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#1c2b3b] pb-3">
                  <h3 className="text-2xl font-black italic uppercase text-white font-['Barlow_Condensed'] flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-[#00f59b]" />
                    <span>Règles : {currentGameRule.title}</span>
                  </h3>
                  <button
                    onClick={() => setShowRulesModal(false)}
                    className="p-1.5 text-[#8da0b5] hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-3.5 rounded-xl border border-[#00f59b]/40 bg-[#073a2b]/40">
                  <span className="text-xs font-bold uppercase text-[#00f59b]">Objectif</span>
                  <p className="text-sm font-semibold text-white mt-0.5">{currentGameRule.objective}</p>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase text-[#8da0b5]">Comment jouer</span>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-[#eaf2ff]">
                    {currentGameRule.howToPlay.map((step, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#00f59b] font-bold">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 rounded-lg border border-[#ffd84d]/40 bg-[#1c1808]">
                    <span className="font-bold text-[#ffd84d] uppercase block mb-1">⚡ Pouvoir Hacking</span>
                    <p className="text-[#eaf2ff]">{currentGameRule.hackingPower}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-[#ff3d71]/40 bg-[#2b0c16]">
                    <span className="font-bold text-[#ff3d71] uppercase block mb-1">👑 Règle Empire Roi</span>
                    <p className="text-[#eaf2ff]">{currentGameRule.empirePower}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowRulesModal(false)}
                className="mt-4 w-full py-2.5 rounded-xl font-bold text-sm bg-[#00f59b] text-[#032014] hover:bg-[#1affaa] transition-all cursor-pointer"
              >
                Fermer et reprendre
              </button>
            </div>
          )}

          {/* Victory Modal Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 z-30 rounded-2xl bg-[#050a10]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
              <span className="text-6xl mb-2 drop-shadow-[0_0_20px_#ffd84d]">
                {winnerIndex !== null && winnerIndex >= 0 ? '🏆' : '🤝'}
              </span>

              <h2 className="text-4xl sm:text-6xl font-black italic tracking-wide uppercase text-white font-['Barlow_Condensed']">
                {winnerIndex !== null && winnerIndex >= 0
                  ? `${players[winnerIndex].name} Gagne !`
                  : 'Match Nul !'}
              </h2>

              <p className="text-lg text-[#8da0b5] mt-2 mb-6 max-w-md">
                {winnerIndex !== null && winnerIndex >= 0
                  ? `Une victoire éclatante célébrée par NOVA ! ${players[winnerIndex].crowns} couronnes au palmarès.`
                  : 'Une égalité parfaite après un duel acharné.'}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={handleRestart}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-extrabold text-lg uppercase tracking-wider bg-[#00f59b] text-[#032014] shadow-[0_0_20px_rgba(0,245,155,0.4)] hover:bg-[#1affaa] transition-all cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Rejouer</span>
                </button>

                <button
                  onClick={() => {
                    playSound('click');
                    onReturnToArena();
                  }}
                  className="px-6 py-3.5 rounded-xl font-bold text-lg text-white border border-[#1c2b3b] hover:border-[#00f59b] transition-all cursor-pointer"
                >
                  Retour à l'arène
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: NOVA AI Commentator Widget (strictly matching Image 3) */}
        <div className="lg:col-span-4 sticky top-20">
          <NovaCommentator
            variant="sidebar"
            latestMessage={primaryComment}
            previousMessage={secondaryComment}
            isMuted={isMuted}
            onToggleMute={onToggleMute}
            isPaused={isPaused}
            onTogglePause={() => setIsPaused((prev) => !prev)}
            stepProgress={moveCount}
          />
        </div>
      </div>
    </div>
  );
};
