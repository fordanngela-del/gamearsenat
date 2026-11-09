import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Player, GameMode } from '../types/game';
import { playSound } from '../utils/audio';
import { Zap, Crown, Sparkles, AlertCircle } from 'lucide-react';

interface LudoGameProps {
  players: Player[];
  activeTurnIndex: number;
  mode: GameMode;
  onMoveMade: (commentary: string, captured: boolean, advanceTurn?: boolean) => void;
  onGameOver: (winnerIndex: number) => void;
  isPaused: boolean;
}

// 4 Official Ludo Colors: Red, Green, Yellow, Blue
const LUDO_COLORS = ['#e53935', '#43a047', '#fbc02d', '#1e88e5'];
const LUDO_COLOR_NAMES = ['Rouge', 'Vert', 'Jaune', 'Bleu'];
const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

// 52-step standard perimeter path coordinate map (15x15 grid, x: 0-14, y: 0-14)
// Clockwise starting from Red's start square (x: 1, y: 6)
const PERIMETER_PATH: [number, number][] = [
  // Red entry and arm (going right)
  [1, 6], [2, 6], [3, 6], [4, 6], [5, 6],
  // Going up towards top arm
  [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
  // Top bridge
  [7, 0],
  // Going down right arm (Green entry is [8, 1])
  [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
  // Going right into right arm
  [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
  // Right bridge
  [14, 7],
  // Going left on bottom of right arm
  [14, 8], [13, 8], [12, 8], [11, 8], [10, 8], [9, 8],
  // Going down into bottom arm
  [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14],
  // Bottom bridge
  [7, 14],
  // Going up left of bottom arm
  [6, 14], [6, 13], [6, 12], [6, 11], [6, 10], [6, 9],
  // Going left into left arm
  [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  // Left bridge
  [0, 7],
  // Back to red start
  [0, 6],
];

// Home run paths (5 steps + center finish 6th step) for each of the 4 colors:
// 0: Red (left to right): (1,7), (2,7), (3,7), (4,7), (5,7) -> Center (6,7)
// 1: Green (top to bottom): (7,1), (7,2), (7,3), (7,4), (7,5) -> Center (7,6)
// 2: Yellow (right to left): (13,7), (12,7), (11,7), (10,7), (9,7) -> Center (8,7)
// 3: Blue (bottom to top): (7,13), (7,12), (7,11), (7,10), (7,9) -> Center (7,8)
const HOME_PATHS: [number, number][][] = [
  [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
  [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
];

// Yard pawn slot coordinates inside the 4 corners:
const YARD_SLOTS: [number, number][][] = [
  // Red (Top-Left): 6x6 area (x: 1-4, y: 1-4)
  [[2, 2], [3, 2], [2, 3], [3, 3]],
  // Green (Top-Right): x: 10-13, y: 1-4
  [[11, 2], [12, 2], [11, 3], [12, 3]],
  // Yellow (Bottom-Right): x: 10-13, y: 10-13
  [[11, 11], [12, 11], [11, 12], [12, 12]],
  // Blue (Bottom-Left): x: 1-4, y: 10-13
  [[2, 11], [3, 11], [2, 12], [3, 12]],
];

// Entry indices on perimeter path: Red: 0, Green: 13, Yellow: 26, Blue: 39
const START_INDICES = [0, 13, 26, 39];

// 8 Safe star squares where pawns cannot be captured:
// 4 starting cells (0, 13, 26, 39) + 4 sanctuary stars (8, 21, 34, 47)
const SAFE_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

interface CellPiece {
  playerIdx: number;
  tokenIdx: number;
  seat: number;
  color: string;
  step: number;
  isMovable: boolean;
}

export const LudoGame: React.FC<LudoGameProps> = ({
  players,
  activeTurnIndex,
  mode,
  onMoveMade,
  onGameOver,
  isPaused,
}) => {
  // -1: in yard, 0-50: on common path, 51-55: home corridor, 56: center goal
  const [tokens, setTokens] = useState<number[][]>(() => players.map(() => [-1, -1, -1, -1]));
  const [diceValue, setDiceValue] = useState<number>(0);
  const [hasRolled, setHasRolled] = useState<boolean>(false);
  const [movableTokens, setMovableTokens] = useState<number[]>([]);
  const [isRollingAnimation, setIsRollingAnimation] = useState<boolean>(false);
  const [consecutiveSixes, setConsecutiveSixes] = useState<number>(0);
  const [actionPrompt, setActionPrompt] = useState<string>('Lance le dé pour débuter ton tour.');
  const [hackConsumedForTurn, setHackConsumedForTurn] = useState<boolean>(false);

  const currentPlayer = players[activeTurnIndex];
  const isBot = currentPlayer?.isBot;
  const currentSeat = currentPlayer?.seat ?? activeTurnIndex;
  const currentColor = LUDO_COLORS[currentSeat % 4];
  const currentColorName = LUDO_COLOR_NAMES[currentSeat % 4];

  // Ref tracking to prevent stale state in asynchronous bot moves & timeouts
  const tokensRef = useRef<number[][]>(tokens);
  tokensRef.current = tokens;
  const activeTurnRef = useRef<number>(activeTurnIndex);
  activeTurnRef.current = activeTurnIndex;
  const hasRolledRef = useRef<boolean>(hasRolled);
  hasRolledRef.current = hasRolled;
  const movableTokensRef = useRef<number[]>(movableTokens);
  movableTokensRef.current = movableTokens;

  // Reset roll states on turn change
  useEffect(() => {
    setHasRolled(false);
    setMovableTokens([]);
    setDiceValue(0);
    setConsecutiveSixes(0);
    setHackConsumedForTurn(false);
    setActionPrompt(
      isBot
        ? `${currentPlayer.name} réfléchit et s'apprête à lancer le dé…`
        : `À toi de jouer (${currentColorName}) ! Lance le dé.`
    );
  }, [activeTurnIndex, isBot, currentColorName, currentPlayer?.name]);

  // Calculate which pawns of a player can legally move given the rolled dice
  const calculateMovableTokens = useCallback(
    (playerIdx: number, rolled: number): number[] => {
      const pTokens = tokensRef.current[playerIdx] || [];
      return pTokens
        .map((pos, pIdx) => {
          // Pawn already finished in goal
          if (pos === 56) return -1;

          // In yard: requires exactly a 6 to exit to start cell (0)
          if (pos < 0) {
            return rolled === 6 ? pIdx : -1;
          }

          // On board: must not overshoot goal (56)
          if (pos + rolled <= 56) {
            return pIdx;
          }

          return -1;
        })
        .filter((idx) => idx >= 0);
    },
    []
  );

  // Roll the dice
  const handleRollDice = useCallback(() => {
    if (hasRolledRef.current || isPaused || isRollingAnimation) return;

    playSound('dice');
    setIsRollingAnimation(true);

    // Check if player activated Hacking power (⚡ Dé Truqué: guaranteed 6)
    const isHackingActive =
      mode === 'hacking' && currentPlayer.hackUsed && !hackConsumedForTurn;

    let counter = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      counter++;
      if (counter > 6) {
        clearInterval(interval);
        setIsRollingAnimation(false);

        let finalRolled = Math.floor(Math.random() * 6) + 1;
        if (isHackingActive) {
          finalRolled = 6;
          setHackConsumedForTurn(true);
          playSound('hack');
        }

        setDiceValue(finalRolled);
        setHasRolled(true);

        const movables = calculateMovableTokens(activeTurnRef.current, finalRolled);
        setMovableTokens(movables);

        let comment = `${currentPlayer.name} (${currentColorName}) lance le dé… ${finalRolled} !`;
        if (isHackingActive) {
          comment = `⚡ HACK DÉ TRUQUÉ : ${currentPlayer.name} force un 6 absolu !`;
        } else if (finalRolled === 6) {
          comment += ' Un 6 impérial ! Sortie de camp possible ou coup bonus.';
        }

        if (movables.length === 0) {
          // No legal moves
          const noMoveComment = `${comment} Aucun pion ne peut bouger. Tour suivant.`;
          setActionPrompt(`Aucun coup possible avec un ${finalRolled}. Tour au joueur suivant.`);
          onMoveMade(noMoveComment, false, true); // advanceTurn = true
          setTimeout(() => {
            setHasRolled(false);
            setMovableTokens([]);
          }, 950);
        } else if (movables.length === 1) {
          // Single legal move available
          setActionPrompt(`Un seul pion jouable ! Clique sur le pion en surbrillance pour avancer.`);
          onMoveMade(comment, false, false); // advanceTurn = false (await user action!)
        } else {
          // Multiple legal choices
          setActionPrompt(`Dé : ${finalRolled}. Choisis quel pion déplacer parmi les pions illuminés.`);
          onMoveMade(comment, false, false); // advanceTurn = false (await user action!)
        }
      }
    }, 60);
  }, [
    calculateMovableTokens,
    currentColorName,
    currentPlayer,
    hackConsumedForTurn,
    isPaused,
    isRollingAnimation,
    mode,
    onMoveMade,
  ]);

  // Execute move of a specific token
  const moveToken = useCallback(
    (playerIdx: number, tokenIdx: number) => {
      if (
        !hasRolledRef.current ||
        isPaused ||
        playerIdx !== activeTurnRef.current ||
        !movableTokensRef.current.includes(tokenIdx)
      ) {
        return;
      }

      const currentPos = tokensRef.current[playerIdx][tokenIdx];
      const newPos = currentPos < 0 ? 0 : currentPos + diceValue;
      const seat = currentPlayer.seat ?? playerIdx;

      playSound('move');

      const nextTokens = tokensRef.current.map((arr, i) =>
        i === playerIdx ? arr.map((p, j) => (j === tokenIdx ? newPos : p)) : [...arr]
      );

      let capturedCount = 0;

      // Check capture on common ring (0 to 50) except safe star positions
      if (newPos <= 50) {
        const globalPerimeterIdx = (START_INDICES[seat % 4] + newPos) % 52;
        const isSafeStar = SAFE_INDICES.includes(globalPerimeterIdx);

        if (!isSafeStar) {
          nextTokens.forEach((opponentTokens, oppIdx) => {
            if (oppIdx !== playerIdx) {
              const oppSeat = players[oppIdx].seat ?? oppIdx;
              opponentTokens.forEach((oppPos, oppTokenIdx) => {
                if (oppPos >= 0 && oppPos <= 50) {
                  const oppGlobal = (START_INDICES[oppSeat % 4] + oppPos) % 52;
                  if (oppGlobal === globalPerimeterIdx) {
                    // Send captured pawn back to opponent's yard!
                    nextTokens[oppIdx][oppTokenIdx] = -1;
                    capturedCount++;
                  }
                }
              });
            }
          });
        }
      }

      if (capturedCount > 0) {
        playSound('capture');
      }

      setTokens(nextTokens);
      setMovableTokens([]);

      let comment = '';
      if (currentPos < 0) {
        comment = `${currentPlayer.name} déploie son pion ${tokenIdx + 1} hors du camp de départ !`;
      } else if (newPos === 56) {
        playSound('win');
        comment = `👑 Un pion de ${currentPlayer.name} atteint l'arrivée centrale !`;
      } else {
        comment = `${currentPlayer.name} avance son pion ${tokenIdx + 1} de ${diceValue} cases.`;
      }

      if (capturedCount > 0) {
        comment += ` ⚔️ Capture de ${capturedCount} pion${capturedCount > 1 ? 's' : ''} adverse renvoyé(s) au camp !`;
      }

      // 1. Victory check: All 4 pawns of player are in goal (56)
      if (nextTokens[playerIdx].every((p) => p === 56)) {
        playSound('win');
        comment += ` 🏆 Tous les pions sont rentrés ! ${currentPlayer.name} remporte la victoire royale au Ludo !`;
        onMoveMade(comment, true, false);
        onGameOver(playerIdx);
        return;
      }

      // 2. Extra turn / Replay rule:
      // In official Ludo:
      // - Rolling a 6 gives an immediate extra turn!
      // - Capturing an opponent gives a bonus roll!
      if (diceValue === 6) {
        const nextSixCount = consecutiveSixes + 1;
        if (nextSixCount >= 3) {
          // Penalty: 3 sixes in a row loses turn
          setConsecutiveSixes(0);
          setHasRolled(false);
          setMovableTokens([]);
          setDiceValue(0);
          setActionPrompt(`Trois 6 consécutifs ! Pénalité, tour passé au joueur suivant.`);
          onMoveMade(`${comment} Trois 6 d'affilée ! Pénalité, tour passé au joueur suivant.`, false, true);
        } else {
          // Bonus roll on 6!
          setConsecutiveSixes(nextSixCount);
          setHasRolled(false);
          setMovableTokens([]);
          setActionPrompt(`Un 6 impérial ! Tu rejoues immédiatement 🎲.`);
          onMoveMade(`${comment} C'est un 6 ! Rejoue immédiatement 🎲.`, capturedCount > 0, false); // advanceTurn = false!
        }
      } else if (capturedCount > 0) {
        // Bonus roll on capture!
        setConsecutiveSixes(0);
        setHasRolled(false);
        setMovableTokens([]);
        setActionPrompt(`Capture réussie ! Bonus d'attaque : relance le dé 🎲.`);
        onMoveMade(`${comment} Bonus d'attaque : relance le dé 🎲 !`, true, false); // advanceTurn = false!
      } else {
        // Normal move: turn passes to next player
        setConsecutiveSixes(0);
        setHasRolled(false);
        setMovableTokens([]);
        setDiceValue(0);
        setActionPrompt(`Tour terminé. Au joueur suivant.`);
        onMoveMade(comment, false, true); // advanceTurn = true!
      }
    },
    [
      consecutiveSixes,
      currentPlayer,
      diceValue,
      isPaused,
      onGameOver,
      onMoveMade,
      players,
    ]
  );

  // Automated Bot AI decision
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (isBot && !isPaused) {
      if (!hasRolled && !isRollingAnimation) {
        botTimerRef.current = setTimeout(() => {
          handleRollDice();
        }, 700);
      } else if (movableTokens.length > 0) {
        botTimerRef.current = setTimeout(() => {
          let bestIdx = movableTokens[0];
          let bestScore = -100;

          const seat = currentPlayer?.seat ?? activeTurnIndex;

          for (const tIdx of movableTokens) {
            const pos = tokensRef.current[activeTurnIndex][tIdx];
            const nextP = pos < 0 ? 0 : pos + diceValue;
            let score = nextP;

            // Prioritize bringing pawns out of yard
            if (pos < 0) score += 65;

            // Prioritize reaching goal
            if (nextP === 56) score += 85;

            // Prioritize safe stars
            if (nextP <= 50) {
              const globalIdx = (START_INDICES[seat % 4] + nextP) % 52;
              if (SAFE_INDICES.includes(globalIdx)) {
                score += 35;
              }
              // Prioritize capture!
              tokensRef.current.forEach((oppTokens, oppI) => {
                if (oppI !== activeTurnIndex) {
                  const oppSeat = players[oppI].seat ?? oppI;
                  oppTokens.forEach((oppP) => {
                    if (oppP >= 0 && oppP <= 50) {
                      const oppG = (START_INDICES[oppSeat % 4] + oppP) % 52;
                      if (oppG === globalIdx) {
                        score += 90; // Big bonus for capturing enemy!
                      }
                    }
                  });
                }
              });
            }

            if (score > bestScore) {
              bestScore = score;
              bestIdx = tIdx;
            }
          }

          moveToken(activeTurnIndex, bestIdx);
        }, 600);
      }

      return () => {
        if (botTimerRef.current) clearTimeout(botTimerRef.current);
      };
    }
  }, [
    isBot,
    isPaused,
    hasRolled,
    movableTokens,
    isRollingAnimation,
    activeTurnIndex,
    currentPlayer?.seat,
    diceValue,
    handleRollDice,
    moveToken,
    players,
  ]);

  // Find all pieces occupying a specific (gx, gy) grid cell
  const getCellPieces = (gx: number, gy: number): CellPiece[] => {
    const list: CellPiece[] = [];

    for (let pIdx = 0; pIdx < tokens.length; pIdx++) {
      const seat = players[pIdx].seat ?? pIdx;
      const color = LUDO_COLORS[seat % 4];

      for (let tIdx = 0; tIdx < 4; tIdx++) {
        const step = tokens[pIdx][tIdx];

        // 1. In yard slot
        if (step < 0) {
          const [yx, yy] = YARD_SLOTS[seat % 4][tIdx];
          if (yx === gx && yy === gy) {
            const isMovable =
              hasRolled &&
              pIdx === activeTurnIndex &&
              movableTokens.includes(tIdx) &&
              !isBot;
            list.push({ playerIdx: pIdx, tokenIdx: tIdx, seat, color, step, isMovable });
          }
        }
        // 2. On perimeter ring
        else if (step <= 50) {
          const globalIdx = (START_INDICES[seat % 4] + step) % 52;
          const [px, py] = PERIMETER_PATH[globalIdx];
          if (px === gx && py === gy) {
            const isMovable =
              hasRolled &&
              pIdx === activeTurnIndex &&
              movableTokens.includes(tIdx) &&
              !isBot;
            list.push({ playerIdx: pIdx, tokenIdx: tIdx, seat, color, step, isMovable });
          }
        }
        // 3. In home corridor / goal
        else {
          const homeStep = step - 51;
          const [hx, hy] = HOME_PATHS[seat % 4][homeStep];
          if (hx === gx && hy === gy) {
            const isMovable =
              hasRolled &&
              pIdx === activeTurnIndex &&
              movableTokens.includes(tIdx) &&
              !isBot;
            list.push({ playerIdx: pIdx, tokenIdx: tIdx, seat, color, step, isMovable });
          }
        }
      }
    }

    return list;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[620px] select-none">
      {/* Top Turn & Action Banner */}
      <div className="flex items-center justify-between w-full mb-3 px-3 py-2 rounded-xl border border-[#1c2b3b] bg-[#0c1520] shadow-md">
        <div className="flex items-center gap-2">
          <span
            style={{ backgroundColor: currentColor }}
            className="w-3.5 h-3.5 rounded-full ring-2 ring-white/60 shadow-[0_0_8px_currentColor] shrink-0"
          />
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-black uppercase tracking-wide text-white font-['Barlow_Condensed']">
              Tour : <span style={{ color: currentColor }}>{currentPlayer?.name}</span> ({currentColorName})
            </span>
            <span className="text-[11px] sm:text-xs text-[#8da0b5] truncate max-w-[260px] sm:max-w-md">
              {actionPrompt}
            </span>
          </div>
        </div>

        {/* Hacking / Replay indicator */}
        <div className="flex items-center gap-2">
          {mode === 'hacking' && currentPlayer?.hackUsed && !hackConsumedForTurn && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#00f59b] bg-[#073a2b]/80 text-[#00f59b] text-[10px] sm:text-xs font-bold animate-pulse">
              <Zap className="w-3 h-3 text-[#00f59b]" />
              <span>Dé Truqué (6)</span>
            </span>
          )}

          {consecutiveSixes > 0 && (
            <span className="px-2 py-0.5 rounded-md border border-[#ffd84d] bg-[#2a2408] text-[#ffd84d] text-[10px] font-bold">
              {consecutiveSixes}x 6 !
            </span>
          )}
        </div>
      </div>

      {/* 15x15 Authentic Cross Ludo Board (strictly matching standard rules & reference card) */}
      <div className="relative w-[360px] h-[360px] sm:w-[480px] sm:h-[480px] rounded-2xl p-2 bg-[#081018] border-3 border-[#00f59b] shadow-[0_0_35px_rgba(0,245,155,0.35)] overflow-hidden">
        {/* 15x15 Grid of cells */}
        <div className="grid grid-cols-15 grid-rows-15 w-full h-full rounded-xl overflow-hidden bg-[#0d1824] border border-[#1c2b3b]">
          {Array.from({ length: 15 }).map((_, y) =>
            Array.from({ length: 15 }).map((_, x) => {
              // 4 Corner 6x6 Yards
              const isRedYard = x < 6 && y < 6;
              const isGreenYard = x >= 9 && y < 6;
              const isYellowYard = x >= 9 && y >= 9;
              const isBlueYard = x < 6 && y >= 9;

              // Home Paths
              const isRedHome = y === 7 && x >= 1 && x <= 5;
              const isGreenHome = x === 7 && y >= 1 && y <= 5;
              const isYellowHome = y === 7 && x >= 9 && x <= 13;
              const isBlueHome = x === 7 && y >= 9 && y <= 13;

              // Start cells (marked with color and star)
              const isRedStart = x === 1 && y === 6;
              const isGreenStart = x === 8 && y === 1;
              const isYellowStart = x === 13 && y === 8;
              const isBlueStart = x === 6 && y === 13;

              // Other 4 Sanctuary Star positions on perimeter (index 8, 21, 34, 47)
              const isTopStar = x === 6 && y === 2;
              const isRightStar = x === 12 && y === 6;
              const isBottomStar = x === 8 && y === 12;
              const isLeftStar = x === 2 && y === 8;
              const isStarCell =
                isRedStart ||
                isGreenStart ||
                isYellowStart ||
                isBlueStart ||
                isTopStar ||
                isRightStar ||
                isBottomStar ||
                isLeftStar;

              // Center Goal (3x3: x: 6-8, y: 6-8)
              const isCenter = x >= 6 && x <= 8 && y >= 6 && y <= 8;

              // Base colors
              let cellBg = '#0e1722';
              if (isRedYard) cellBg = '#e5393520';
              else if (isGreenYard) cellBg = '#43a04720';
              else if (isYellowYard) cellBg = '#fbc02d20';
              else if (isBlueYard) cellBg = '#1e88e520';
              else if (isRedHome || isRedStart) cellBg = '#e53935';
              else if (isGreenHome || isGreenStart) cellBg = '#43a047';
              else if (isYellowHome || isYellowStart) cellBg = '#fbc02d';
              else if (isBlueHome || isBlueStart) cellBg = '#1e88e5';
              else if (isCenter) cellBg = '#070d14';

              // Pawns on this cell
              const pieces = getCellPieces(x, y);
              const movablePiece = pieces.find((p) => p.isMovable);
              const hasMovablePiece = !!movablePiece;

              return (
                <div
                  key={`${x}-${y}`}
                  style={{ backgroundColor: cellBg }}
                  className={`relative flex items-center justify-center border border-[#1c2b3b]/60 ${
                    isCenter ? 'border-none' : ''
                  }`}
                >
                  {/* Yard Pawn Docks (Embossed white circle inside yard corners) */}
                  {(isRedYard || isGreenYard || isYellowYard || isBlueYard) &&
                    ((x >= 2 && x <= 3 && y >= 2 && y <= 3) ||
                      (x >= 11 && x <= 12 && y >= 2 && y <= 3) ||
                      (x >= 11 && x <= 12 && y >= 11 && y <= 12) ||
                      (x >= 2 && x <= 3 && y >= 11 && y <= 12)) && (
                      <div className="absolute w-[80%] h-[80%] rounded-full border border-white/20 bg-white/5 pointer-events-none" />
                    )}

                  {/* Sanctuary Star Marker ★ */}
                  {isStarCell && (
                    <span className="text-[10px] sm:text-xs font-black text-white/95 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] pointer-events-none">
                      ★
                    </span>
                  )}

                  {/* Pawns rendered on this cell */}
                  {pieces.length > 0 && (
                    <div className="relative w-full h-full flex items-center justify-center">
                      {pieces.length === 1 ? (
                        // Single Pawn
                        <button
                          disabled={!pieces[0].isMovable}
                          onClick={() => moveToken(pieces[0].playerIdx, pieces[0].tokenIdx)}
                          style={{
                            backgroundColor: pieces[0].color,
                            boxShadow: pieces[0].isMovable
                              ? '0 0 16px #00f59b, 0 0 24px #00f59b'
                              : '0 4px 8px rgba(0,0,0,0.8)',
                          }}
                          className={`w-[85%] h-[85%] rounded-full border-2 border-white flex items-center justify-center z-30 transition-all ${
                            pieces[0].isMovable
                              ? 'ring-3 ring-[#00f59b] scale-125 animate-pulse cursor-pointer shadow-lg'
                              : 'cursor-default'
                          }`}
                        >
                          <span className="text-[8px] sm:text-[10px] font-black text-white drop-shadow">
                            {pieces[0].tokenIdx + 1}
                          </span>
                        </button>
                      ) : (
                        // Multiple Pawns Stacked on the same space!
                        <button
                          disabled={!hasMovablePiece}
                          onClick={() => {
                            if (movablePiece) {
                              moveToken(movablePiece.playerIdx, movablePiece.tokenIdx);
                            }
                          }}
                          style={{
                            backgroundColor: movablePiece ? movablePiece.color : pieces[0].color,
                            boxShadow: hasMovablePiece
                              ? '0 0 16px #00f59b'
                              : '0 4px 8px rgba(0,0,0,0.8)',
                          }}
                          className={`w-[85%] h-[85%] rounded-full border-2 border-white flex items-center justify-center z-30 transition-all ${
                            hasMovablePiece
                              ? 'ring-3 ring-[#00f59b] scale-125 animate-pulse cursor-pointer'
                              : 'cursor-default'
                          }`}
                        >
                          <span className="text-[8px] font-black text-white bg-black/60 px-1 rounded-full">
                            x{pieces.length}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Center Triangular Goal Overlay */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-[#1c2b3b] bg-radial from-[#0e1722] to-[#070d14] flex flex-col items-center justify-center shadow-2xl pointer-events-none z-20">
          <span className="text-xl sm:text-2xl drop-shadow-[0_0_10px_#ffd84d]">👑</span>
          <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-[#00f59b]">
            Sanctuaire
          </span>
        </div>
      </div>

      {/* Interactive Dice Roller & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between w-full mt-4 px-2 gap-3">
        {/* Helper Tip */}
        <div className="flex items-center gap-1.5 text-xs text-[#8da0b5]">
          <Sparkles className="w-4 h-4 text-[#ffd84d]" />
          <span>Fais un 6 pour sortir du camp ou rejouer !</span>
        </div>

        {/* Dice & Roll Button */}
        <div className="flex items-center gap-4">
          <button
            disabled={hasRolled || isBot || isPaused || isRollingAnimation}
            onClick={handleRollDice}
            className="px-6 py-3 rounded-xl font-extrabold text-base sm:text-lg uppercase tracking-wider bg-[#00f59b] text-[#032014] shadow-[0_0_20px_rgba(0,245,155,0.4)] hover:bg-[#1affaa] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-2"
          >
            <span>🎲</span>
            <span>{isRollingAnimation ? 'Lancer…' : 'Lancer le dé'}</span>
          </button>

          {/* 3D Dice Display Box */}
          <div
            className={`w-14 h-14 rounded-2xl border-2 border-[#00f59b]/80 bg-[#0e1722] flex items-center justify-center text-4xl text-[#00f59b] shadow-[0_0_15px_rgba(0,245,155,0.3)] select-none ${
              isRollingAnimation ? 'animate-bounce' : ''
            }`}
          >
            {diceValue ? DICE_FACES[diceValue - 1] : '🎲'}
          </div>
        </div>
      </div>
    </div>
  );
};
