import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Player, GameMode } from '../types/game';
import { playSound } from '../utils/audio';

interface CheckersGameProps {
  players: Player[];
  activeTurnIndex: number;
  mode: GameMode;
  onMoveMade: (commentary: string, captured: boolean) => void;
  onGameOver: (winnerIndex: number) => void;
  isPaused: boolean;
}

type CheckersBoard = string[][]; // 'w', 'b', 'W' (King), 'B' (King), ''
type CheckersMove = [number, number, number, number, number, number]; // [fx, fy, tx, ty, capX, capY]

const INITIAL_CHECKERS_BOARD: CheckersBoard = Array.from({ length: 8 }).map((_, y) =>
  Array.from({ length: 8 }).map((_, x) => {
    if ((x + y) % 2 === 1) {
      if (y < 3) return 'b';
      if (y > 4) return 'w';
    }
    return '';
  })
);

export const CheckersGame: React.FC<CheckersGameProps> = ({
  players,
  activeTurnIndex,
  onMoveMade,
  onGameOver,
  isPaused,
}) => {
  const [board, setBoard] = useState<CheckersBoard>(INITIAL_CHECKERS_BOARD);
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [chainSquare, setChainSquare] = useState<[number, number] | null>(null);
  const [lastMoveDest, setLastMoveDest] = useState<[number, number] | null>(null);
  const currentSide = activeTurnIndex === 0 ? 'w' : 'b';
  const isBotTurn = players[activeTurnIndex]?.isBot;

  // Generate legal moves with mandatory capture rule
  const getMoves = useCallback(
    (b: CheckersBoard, color: 'w' | 'b', chain: [number, number] | null): CheckersMove[] => {
      const captures: CheckersMove[] = [];
      const simpleMoves: CheckersMove[] = [];

      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const piece = b[y][x];
          if (!piece || piece.toLowerCase() !== color) continue;
          if (chain && (chain[0] !== x || chain[1] !== y)) continue;

          const isKing = piece === piece.toUpperCase();
          const dirs: [number, number][] = isKing
            ? [[1, 1], [-1, 1], [1, -1], [-1, -1]]
            : color === 'w'
            ? [[1, -1], [-1, -1]]
            : [[1, 1], [-1, 1]];

          for (const [dx, dy] of dirs) {
            const stepX = x + dx;
            const stepY = y + dy;

            if (stepX >= 0 && stepX < 8 && stepY >= 0 && stepY < 8 && b[stepY][stepX] === '') {
              simpleMoves.push([x, y, stepX, stepY, -1, -1]);
            }

            const jumpX = x + 2 * dx;
            const jumpY = y + 2 * dy;
            if (
              jumpX >= 0 &&
              jumpX < 8 &&
              jumpY >= 0 &&
              jumpY < 8 &&
              b[jumpY][jumpX] === ''
            ) {
              const victim = b[stepY] && b[stepY][stepX];
              if (victim && victim.toLowerCase() !== color) {
                captures.push([x, y, jumpX, jumpY, stepX, stepY]);
              }
            }
          }
        }
      }

      // Capture is strictly mandatory!
      return captures.length > 0 ? captures : chain ? [] : simpleMoves;
    },
    []
  );

  const currentLegalMoves = getMoves(board, currentSide, chainSquare);

  const executeCheckersMove = useCallback(
    (m: CheckersMove) => {
      const nextBoard = board.map((r) => [...r]);
      let piece = nextBoard[m[1]][m[0]];
      const isCapture = m[4] >= 0;
      let crowned = false;
      const player = players[activeTurnIndex];

      nextBoard[m[1]][m[0]] = '';

      if (isCapture) {
        nextBoard[m[5]][m[4]] = '';
        playSound('capture');
      } else {
        playSound('move');
      }

      if (piece === currentSide && m[3] === (currentSide === 'w' ? 0 : 7)) {
        piece = currentSide.toUpperCase();
        crowned = true;
      }

      nextBoard[m[3]][m[2]] = piece;
      setLastMoveDest([m[2], m[3]]);

      let nextChain: [number, number] | null = null;
      if (isCapture && !crowned) {
        const furtherCaptures = getMoves(nextBoard, currentSide, [m[2], m[3]]);
        if (furtherCaptures.length > 0) {
          nextChain = [m[2], m[3]];
        }
      }

      setBoard(nextBoard);
      setChainSquare(nextChain);
      setSelectedSquare(nextChain);

      let comment = '';
      if (crowned) {
        comment = `${player.name} couronne sa Dame ♛ ! Percée magistrale.`;
      } else if (isCapture) {
        if (nextChain) {
          comment = `${player.name} capture un pion et enchaîne une seconde prise !`;
        } else {
          comment = `${player.name} capture un pion adverse !`;
        }
      } else {
        const squareNotation = 'abcdefgh'[m[2]] + (8 - m[3]);
        comment = `${player.name} avance son pion en ${squareNotation}.`;
      }

      const nextSide = currentSide === 'w' ? 'b' : 'w';
      const enemyMoves = getMoves(nextBoard, nextSide, null);
      if (enemyMoves.length === 0) {
        comment += ` L'adversaire est bloqué ! Victoire de ${player.name} !`;
        onGameOver(activeTurnIndex);
      }

      onMoveMade(comment, isCapture);
    },
    [board, activeTurnIndex, players, currentSide, getMoves, onGameOver, onMoveMade]
  );

  // Bot AI decision
  const botRef = useRef(false);
  useEffect(() => {
    if (isBotTurn && !isPaused && currentLegalMoves.length > 0 && !botRef.current) {
      botRef.current = true;
      const timer = setTimeout(() => {
        botRef.current = false;
        if (isPaused) return;

        let best = currentLegalMoves[0];
        let bestScore = -999;

        for (const m of currentLegalMoves) {
          let score = 0;
          if (m[4] >= 0) score += 6;
          if (currentSide === 'w' && m[3] === 0) score += 5;
          if (currentSide === 'b' && m[3] === 7) score += 5;
          score += (currentSide === 'w' ? 7 - m[3] : m[3]) * 0.2;
          score += Math.random() * 0.4;

          if (score > bestScore) {
            bestScore = score;
            best = m;
          }
        }

        executeCheckersMove(best);
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [isBotTurn, isPaused, currentLegalMoves, currentSide, executeCheckersMove]);

  const handleSquareClick = (x: number, y: number) => {
    if (isBotTurn || isPaused) return;

    if (selectedSquare) {
      const move = currentLegalMoves.find(
        (m) => m[0] === selectedSquare[0] && m[1] === selectedSquare[1] && m[2] === x && m[3] === y
      );
      if (move) {
        executeCheckersMove(move);
        return;
      }
    }

    if (!chainSquare) {
      const pieceCanMove = currentLegalMoves.some((m) => m[0] === x && m[1] === y);
      if (pieceCanMove) {
        playSound('click');
        setSelectedSquare([x, y]);
      } else {
        setSelectedSquare(null);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[580px] select-none">
      {/* Outer Glow Container with coordinates around it */}
      <div className="relative flex items-center justify-center w-full">
        {/* Left Rank Coordinates (8 to 1) */}
        <div className="flex flex-col justify-around h-[420px] sm:h-[500px] pr-2.5 sm:pr-3 text-sm sm:text-base font-bold text-[#c58a4a]/80 font-mono">
          {[8, 7, 6, 5, 4, 3, 2, 1].map((rank) => (
            <span key={rank} className="text-center">
              {rank}
            </span>
          ))}
        </div>

        {/* 8x8 Wooden Checkers Board with warm rich wood styling matching reference image */}
        <div className="relative w-[420px] h-[420px] sm:w-[500px] sm:h-[500px] rounded-2xl p-2 sm:p-2.5 bg-[#2c1607] border-3 border-[#c58a4a] shadow-[0_0_30px_rgba(197,138,74,0.45)] overflow-hidden">
          <div className="grid grid-cols-8 grid-rows-8 w-full h-full rounded-xl overflow-hidden border border-[#542d0e]">
            {board.map((row, y) =>
              row.map((piece, x) => {
                const isPlayable = (x + y) % 2 === 1;
                const isSelected =
                  selectedSquare && selectedSquare[0] === x && selectedSquare[1] === y;
                const isLastMove = lastMoveDest && lastMoveDest[0] === x && lastMoveDest[1] === y;
                const isLegalDest =
                  selectedSquare &&
                  currentLegalMoves.some(
                    (m) =>
                      m[0] === selectedSquare[0] &&
                      m[1] === selectedSquare[1] &&
                      m[2] === x &&
                      m[3] === y
                  );
                const pieceHasMandatoryMove =
                  !isBotTurn && currentLegalMoves.some((m) => m[0] === x && m[1] === y);

                return (
                  <button
                    key={`${x}-${y}`}
                    onClick={() => handleSquareClick(x, y)}
                    className={`relative flex items-center justify-center cursor-pointer transition-all duration-150 ${
                      isPlayable ? 'bg-[#5c3014]' : 'bg-[#e5be8a]'
                    } ${
                      isLastMove
                        ? 'ring-2 sm:ring-3 ring-[#00f59b] bg-[#00f59b]/20 shadow-[0_0_12px_#00f59b] z-10'
                        : ''
                    } ${isSelected ? 'ring-3 ring-white bg-[#00f59b]/30 z-20' : ''}`}
                  >
                    {/* Legal move indicator dot */}
                    {isLegalDest && (
                      <span className="absolute w-4 h-4 rounded-full bg-[#00f59b] shadow-[0_0_10px_#00f59b] z-20 animate-pulse" />
                    )}

                    {/* Realistic 3D Wooden Checkers Disc */}
                    {piece && (
                      <div
                        className={`w-[78%] h-[78%] rounded-full flex items-center justify-center font-bold text-xl sm:text-2xl shadow-[0_6px_12px_rgba(0,0,0,0.7)] border-2 transition-all transform hover:scale-105 ${
                          piece.toLowerCase() === 'w'
                            ? 'bg-gradient-to-br from-[#fff7e6] via-[#ecd1a4] to-[#caa066] text-[#633e07] border-[#fff7e6] ring-1 ring-[#a6793b]'
                            : 'bg-gradient-to-br from-[#3b3b3b] via-[#1c1c1c] to-[#080808] text-[#ffd84d] border-[#555] ring-1 ring-[#222]'
                        } ${
                          pieceHasMandatoryMove
                            ? 'ring-3 ring-[#00f59b] ring-offset-2 ring-offset-[#5c3014] animate-pulse'
                            : ''
                        }`}
                      >
                        {piece === piece.toUpperCase() ? (
                          <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] text-xl sm:text-2xl">
                            ♛
                          </span>
                        ) : (
                          // Concentric circle detailing on draughts
                          <div
                            className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border opacity-50 ${
                              piece.toLowerCase() === 'w' ? 'border-[#633e07]' : 'border-[#ffd84d]'
                            }`}
                          />
                        )}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom File Coordinates (a to h) */}
      <div className="flex justify-around w-[420px] sm:w-[500px] ml-6 sm:ml-7 pt-2 text-sm sm:text-base font-bold text-[#c58a4a]/80 font-mono">
        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((col) => (
          <span key={col} className="w-full text-center">
            {col}
          </span>
        ))}
      </div>
    </div>
  );
};
