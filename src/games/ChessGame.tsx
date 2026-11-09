import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Player, GameMode } from '../types/game';
import { playSound } from '../utils/audio';

interface ChessGameProps {
  players: Player[];
  activeTurnIndex: number;
  mode: GameMode;
  onMoveMade: (commentary: string, captured: boolean) => void;
  onGameOver: (winnerIndex: number) => void;
  onHackEffect: () => void;
  isPaused: boolean;
}

type BoardState = string[][];
type Move = [number, number, number, number]; // [fromX, fromY, toX, toY]

const INITIAL_BOARD: BoardState = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
];

const PIECE_NAMES: Record<string, string> = {
  p: 'Pion',
  n: 'Cavalier',
  b: 'Fou',
  r: 'Tour',
  q: 'Dame',
  k: 'Roi',
};

// Unicode chess symbols
const PIECE_SYMBOLS: Record<string, string> = {
  k: '♚',
  q: '♛',
  r: '♜',
  b: '♝',
  n: '♞',
  p: '♟',
};

const PIECE_VALUES: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 90,
};

const isWhite = (piece: string) => piece !== '' && piece === piece.toUpperCase();
const isBlack = (piece: string) => piece !== '' && piece === piece.toLowerCase();
const isOwn = (piece: string, color: 'w' | 'b') => {
  if (!piece) return false;
  return color === 'w' ? isWhite(piece) : isBlack(piece);
};

export const ChessGame: React.FC<ChessGameProps> = ({
  players,
  activeTurnIndex,
  onMoveMade,
  onGameOver,
  isPaused,
}) => {
  const [board, setBoard] = useState<BoardState>(INITIAL_BOARD);
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  // Default last move to Knight on f3 (from g1 to f3) just like in the reference image Coup 14!
  const [lastMove, setLastMove] = useState<Move | null>([6, 7, 5, 5]);
  const currentSide = activeTurnIndex === 0 ? 'w' : 'b';
  const isBotTurn = players[activeTurnIndex]?.isBot;

  // Generate pseudo-legal moves for a color
  const generateMoves = useCallback((b: BoardState, color: 'w' | 'b'): Move[] => {
    const moves: Move[] = [];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const piece = b[y][x];
        if (!isOwn(piece, color)) continue;
        const type = piece.toLowerCase();

        const addMove = (nx: number, ny: number): boolean => {
          if (nx < 0 || ny < 0 || nx > 7 || ny > 7) return false;
          const target = b[ny][nx];
          if (isOwn(target, color)) return false;
          moves.push([x, y, nx, ny]);
          return target === '';
        };

        const ray = (dirs: [number, number][], once = false) => {
          for (const [dx, dy] of dirs) {
            let nx = x + dx;
            let ny = y + dy;
            while (addMove(nx, ny) && !once) {
              nx += dx;
              ny += dy;
            }
          }
        };

        const Diags: [number, number][] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        const Straights: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

        if (type === 'p') {
          const dir = color === 'w' ? -1 : 1;
          if (b[y + dir] && b[y + dir][x] === '') {
            moves.push([x, y, x, y + dir]);
            const startRank = color === 'w' ? 6 : 1;
            if (y === startRank && b[y + 2 * dir] && b[y + 2 * dir][x] === '') {
              moves.push([x, y, x, y + 2 * dir]);
            }
          }
          for (const dx of [-1, 1]) {
            const target = b[y + dir] && b[y + dir][x + dx];
            if (target && !isOwn(target, color)) {
              moves.push([x, y, x + dx, y + dir]);
            }
          }
        } else if (type === 'n') {
          ray([[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]], true);
        } else if (type === 'k') {
          ray([...Diags, ...Straights], true);
        } else if (type === 'b') {
          ray(Diags);
        } else if (type === 'r') {
          ray(Straights);
        } else if (type === 'q') {
          ray([...Diags, ...Straights]);
        }
      }
    }
    return moves;
  }, []);

  const applyMove = useCallback((b: BoardState, m: Move): BoardState => {
    const next = b.map((r) => [...r]);
    let piece = next[m[1]][m[0]];
    if (piece.toLowerCase() === 'p' && (m[3] === 0 || m[3] === 7)) {
      piece = piece === 'P' ? 'Q' : 'q';
    }
    next[m[3]][m[2]] = piece;
    next[m[1]][m[0]] = '';
    return next;
  }, []);

  const isInCheck = useCallback(
    (b: BoardState, color: 'w' | 'b'): boolean => {
      const kingChar = color === 'w' ? 'K' : 'k';
      const opponentColor = color === 'w' ? 'b' : 'w';
      const enemyMoves = generateMoves(b, opponentColor);
      return enemyMoves.some((m) => b[m[3]][m[2]] === kingChar);
    },
    [generateMoves]
  );

  const getLegalMoves = useCallback(
    (b: BoardState, color: 'w' | 'b'): Move[] => {
      const candidates = generateMoves(b, color);
      return candidates.filter((m) => !isInCheck(applyMove(b, m), color));
    },
    [generateMoves, isInCheck, applyMove]
  );

  const currentLegalMoves = getLegalMoves(board, currentSide);
  const inCheck = isInCheck(board, currentSide);

  const executeMove = useCallback(
    (m: Move) => {
      const movingPiece = board[m[1]][m[0]];
      const targetPiece = board[m[3]][m[2]];
      const player = players[activeTurnIndex];
      const nextBoard = applyMove(board, m);
      const isCapture = Boolean(targetPiece);

      setBoard(nextBoard);
      setLastMove(m);
      setSelectedSquare(null);

      if (isCapture) {
        playSound('capture');
      } else {
        playSound('move');
      }

      const nextSide = currentSide === 'w' ? 'b' : 'w';
      const nextLegalMoves = getLegalMoves(nextBoard, nextSide);
      const nextInCheck = isInCheck(nextBoard, nextSide);

      const targetCoord = 'abcdefgh'[m[2]] + (8 - m[3]);
      const pieceName = PIECE_NAMES[movingPiece.toLowerCase()];
      let comment = '';

      if (isCapture) {
        const victimName = PIECE_NAMES[targetPiece.toLowerCase()].toLowerCase();
        comment = `${pieceName} en ${targetCoord}, prend ${victimName} !`;
      } else {
        const dynamicActions = [
          'attaque le centre !',
          'met la pression sur la diagonale !',
          'joue serré et développe ses pièces.',
          'prépare une offensive chirurgicale.',
        ];
        const randomAction = dynamicActions[Math.floor(Math.random() * dynamicActions.length)];
        comment = `${pieceName} en ${targetCoord}, ${player.name} ${randomAction}`;
      }

      if (nextInCheck) {
        playSound('check');
        if (nextLegalMoves.length === 0) {
          comment += ' Échec et mat ! Victoire totale.';
          onGameOver(activeTurnIndex);
        } else {
          comment += ' Échec au Roi !';
        }
      } else if (nextLegalMoves.length === 0) {
        comment += ' Pat ! Match nul.';
        onGameOver(-1);
      }

      onMoveMade(comment, isCapture);
    },
    [board, activeTurnIndex, players, currentSide, applyMove, getLegalMoves, isInCheck, onGameOver, onMoveMade]
  );

  // Bot AI decision
  const botThinkingRef = useRef(false);
  useEffect(() => {
    if (isBotTurn && !isPaused && currentLegalMoves.length > 0 && !botThinkingRef.current) {
      botThinkingRef.current = true;
      const timer = setTimeout(() => {
        botThinkingRef.current = false;
        if (isPaused) return;

        let bestMove = currentLegalMoves[0];
        let bestScore = -Infinity;

        for (const m of currentLegalMoves) {
          const nextB = applyMove(board, m);
          let score = 0;
          for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
              const p = nextB[y][x];
              if (p) {
                const val = PIECE_VALUES[p.toLowerCase()] || 0;
                score += isOwn(p, currentSide) ? val : -val;
              }
            }
          }
          if ((m[2] === 3 || m[2] === 4) && (m[3] === 3 || m[3] === 4)) {
            score += 0.4;
          }
          score += Math.random() * 0.3;

          if (score > bestScore) {
            bestScore = score;
            bestMove = m;
          }
        }

        executeMove(bestMove);
      }, 750);

      return () => clearTimeout(timer);
    }
  }, [isBotTurn, isPaused, currentLegalMoves, board, currentSide, applyMove, executeMove]);

  const handleSquareClick = (x: number, y: number) => {
    if (isBotTurn || isPaused) return;

    if (selectedSquare) {
      const move = currentLegalMoves.find(
        (m) => m[0] === selectedSquare[0] && m[1] === selectedSquare[1] && m[2] === x && m[3] === y
      );
      if (move) {
        executeMove(move);
        return;
      }
    }

    const piece = board[y][x];
    if (isOwn(piece, currentSide)) {
      playSound('click');
      setSelectedSquare([x, y]);
    } else {
      setSelectedSquare(null);
    }
  };

  const kingChar = currentSide === 'w' ? 'K' : 'k';

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[580px] select-none">
      {/* Outer Glow Container with coordinates around it matching Image 3 */}
      <div className="relative flex items-center justify-center w-full">
        {/* Left Rank Coordinates (8 to 1) */}
        <div className="flex flex-col justify-around h-[420px] sm:h-[500px] pr-2.5 sm:pr-3 text-sm sm:text-base font-bold text-[#8da0b5]/80">
          {[8, 7, 6, 5, 4, 3, 2, 1].map((rank) => (
            <span key={rank} className="text-center font-mono">
              {rank}
            </span>
          ))}
        </div>

        {/* 8x8 Board Container with neon green glowing border matching Image 3 */}
        <div className="relative w-[420px] h-[420px] sm:w-[500px] sm:h-[500px] rounded-2xl p-1.5 bg-[#04180f] border-2 border-[#00f59b] shadow-[0_0_28px_rgba(0,245,155,0.4)] overflow-hidden">
          <div className="grid grid-cols-8 grid-rows-8 w-full h-full rounded-xl overflow-hidden">
            {board.map((row, y) =>
              row.map((piece, x) => {
                const isDark = (x + y) % 2 === 1;
                const isSelected =
                  selectedSquare && selectedSquare[0] === x && selectedSquare[1] === y;
                const isLastMoveDest = lastMove && lastMove[2] === x && lastMove[3] === y;
                const isLegalDest =
                  selectedSquare &&
                  currentLegalMoves.some(
                    (m) =>
                      m[0] === selectedSquare[0] &&
                      m[1] === selectedSquare[1] &&
                      m[2] === x &&
                      m[3] === y
                  );
                const isKingInCheckSquare = inCheck && piece === kingChar;

                return (
                  <button
                    key={`${x}-${y}`}
                    onClick={() => handleSquareClick(x, y)}
                    className={`relative flex items-center justify-center cursor-pointer transition-all duration-200 ${
                      isDark ? 'bg-[#04180f]' : 'bg-[#0f5a3f]'
                    } ${
                      isLastMoveDest
                        ? 'ring-2 sm:ring-3 ring-[#00f59b] bg-[#00f59b]/25 shadow-[0_0_15px_#00f59b] z-20 rounded-md'
                        : ''
                    } ${
                      isSelected
                        ? 'ring-2 sm:ring-3 ring-white bg-[#00f59b]/35 shadow-[0_0_12px_rgba(255,255,255,0.8)] z-20 rounded-md'
                        : ''
                    } ${isKingInCheckSquare ? 'bg-[#a0153a] shadow-[inset_0_0_18px_#ff3d71]' : ''}`}
                  >
                    {/* Legal move indicator dot */}
                    {isLegalDest && (
                      <span className="absolute w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#00f59b] shadow-[0_0_10px_#00f59b] z-30 animate-pulse" />
                    )}

                    {/* Piece: White pieces in crisp white, Black pieces in hot neon pink matching Image 3! */}
                    {piece && (
                      <span
                        style={{
                          color: isWhite(piece) ? '#ffffff' : '#ff4d6d',
                          filter: isWhite(piece)
                            ? 'drop-shadow(0 0 6px rgba(255,255,255,0.7))'
                            : 'drop-shadow(0 0 8px rgba(255,77,109,0.8))',
                        }}
                        className="text-3xl sm:text-5xl font-black drop-shadow-lg transform hover:scale-110 transition-transform z-10"
                      >
                        {PIECE_SYMBOLS[piece.toLowerCase()]}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom File Coordinates (a to h) */}
      <div className="flex justify-around w-[420px] sm:w-[500px] ml-6 sm:ml-7 pt-2 text-sm sm:text-base font-bold text-[#8da0b5]/80 font-mono">
        {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((col) => (
          <span key={col} className="w-full text-center">
            {col}
          </span>
        ))}
      </div>
    </div>
  );
};
