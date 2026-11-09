import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Player, GameMode } from '../types/game';
import { playSound } from '../utils/audio';
import { Zap, Crown, Flame, Sparkles } from 'lucide-react';

interface FruitSlasherGameProps {
  players: Player[];
  activeTurnIndex: number;
  mode: GameMode;
  onMoveMade: (commentary: string, captured: boolean) => void;
  onGameOver: (winnerIndex: number) => void;
  isPaused: boolean;
}

interface FlyingFruit {
  id: number;
  emoji: string;
  name: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  vx: number; // velocity
  vy: number;
  points: number;
  isBomb?: boolean;
  isSliced: boolean;
  sliceAngle?: number;
  spawnTime: number;
}

interface SlashEffect {
  x: number;
  y: number;
  text: string;
  color: string;
}

const FRUIT_TYPES = [
  { emoji: '🍉', name: 'Pastèque Géante', points: 30, weight: 20 },
  { emoji: '🍍', name: 'Ananas d\'Or', points: 50, weight: 15 },
  { emoji: '🍎', name: 'Pomme Royale', points: 15, weight: 25 },
  { emoji: '🍊', name: 'Orange Solaire', points: 15, weight: 20 },
  { emoji: '🍌', name: 'Banane Impériale', points: 25, weight: 15 },
  { emoji: '🍓', name: 'Fraise Écarlate', points: 10, weight: 20 },
  { emoji: '💣', name: 'Bombe Explosive', points: -50, isBomb: true, weight: 12 },
];

export const FruitSlasherGame: React.FC<FruitSlasherGameProps> = ({
  players,
  mode,
  onMoveMade,
  onGameOver,
  isPaused,
}) => {
  const [scores, setScores] = useState<number[]>(() => players.map(() => 0));
  const [fruits, setFruits] = useState<FlyingFruit[]>([]);
  const [slashEffects, setSlashEffects] = useState<SlashEffect[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(45); // 45-second intense battle
  const [combo, setCombo] = useState<number>(0);
  const [comboMultiplier, setComboMultiplier] = useState<number>(1);
  const [isFrozen, setIsFrozen] = useState<boolean>(false);
  const nextFruitId = useRef<number>(1);

  const fruitsRef = useRef<FlyingFruit[]>(fruits);
  fruitsRef.current = fruits;
  const scoresRef = useRef<number[]>(scores);
  scoresRef.current = scores;
  const comboRef = useRef<number>(combo);
  comboRef.current = combo;
  const hasGameOverFired = useRef<boolean>(false);

  // Sound effect for slicing
  const playSliceSound = () => {
    playSound('capture');
  };

  // Spawn flying fruits from the 4 corner cannons
  const spawnFruit = useCallback(() => {
    if (isPaused) return;

    // Pick a random cannon (0: Top-Left, 1: Top-Right, 2: Bottom-Left, 3: Bottom-Right)
    const cannon = Math.floor(Math.random() * 4);
    let startX = 10;
    let startY = 10;
    let targetX = 50 + (Math.random() * 20 - 10);
    let targetY = 50 + (Math.random() * 20 - 10);

    if (cannon === 0) {
      startX = 8;
      startY = 8;
    } else if (cannon === 1) {
      startX = 92;
      startY = 8;
    } else if (cannon === 2) {
      startX = 8;
      startY = 92;
    } else {
      startX = 92;
      startY = 92;
    }

    // Weighted fruit selection
    const totalWeight = FRUIT_TYPES.reduce((acc, f) => acc + f.weight, 0);
    let randomNum = Math.random() * totalWeight;
    let chosen = FRUIT_TYPES[0];
    for (const f of FRUIT_TYPES) {
      if (randomNum < f.weight) {
        chosen = f;
        break;
      }
      randomNum -= f.weight;
    }

    const dx = (targetX - startX) * 0.02 + (Math.random() - 0.5) * 0.5;
    const dy = (targetY - startY) * 0.02 + (Math.random() - 0.5) * 0.5;

    const newFruit: FlyingFruit = {
      id: nextFruitId.current++,
      emoji: chosen.emoji,
      name: chosen.name,
      x: startX,
      y: startY,
      vx: dx,
      vy: dy,
      points: chosen.points,
      isBomb: chosen.isBomb,
      isSliced: false,
      spawnTime: Date.now(),
    };

    setFruits((prev) => [...prev.slice(-18), newFruit]);
  }, [isPaused]);

  // Main physics & animation loop
  useEffect(() => {
    if (isPaused) return;

    const frameInterval = setInterval(() => {
      setFruits((prev) =>
        prev
          .map((f) => {
            if (f.isSliced) return f;
            if (isFrozen) return f; // Frozen in time during Hacking power!

            const nextX = f.x + f.vx;
            const nextY = f.y + f.vy;

            return {
              ...f,
              x: nextX,
              y: nextY,
            };
          })
          .filter((f) => {
            // Remove fruits that flew out of the arena or have been sliced > 1.2s ago
            if (f.isSliced) return Date.now() - f.spawnTime < 3500;
            return f.x >= -5 && f.x <= 105 && f.y >= -5 && f.y <= 105;
          })
      );
    }, 40);

    return () => clearInterval(frameInterval);
  }, [isPaused, isFrozen]);

  // Periodic fruit spawn
  useEffect(() => {
    if (isPaused) return;

    const spawnInterval = setInterval(() => {
      spawnFruit();
      if (Math.random() > 0.4) {
        setTimeout(spawnFruit, 250);
      }
    }, 900);

    return () => clearInterval(spawnInterval);
  }, [isPaused, spawnFruit]);

  // Countdown timer (45 seconds)
  useEffect(() => {
    if (isPaused || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, timeLeft]);

  // Game over dispatch when time reaches 0
  useEffect(() => {
    if (timeLeft === 0 && !hasGameOverFired.current) {
      hasGameOverFired.current = true;
      let maxScore = -Infinity;
      let winnerIdx = 0;
      scoresRef.current.forEach((s, idx) => {
        if (s > maxScore) {
          maxScore = s;
          winnerIdx = idx;
        }
      });
      onGameOver(winnerIdx);
    } else if (timeLeft > 0) {
      hasGameOverFired.current = false;
    }
  }, [timeLeft, onGameOver]);

  // Slice action performed by Player (or Bot)
  const handleSliceFruit = useCallback(
    (fruitId: number, playerIdx = 0) => {
      if (isPaused) return;

      const target = fruitsRef.current.find((f) => f.id === fruitId && !f.isSliced);
      if (!target) return;

      // Mark sliced immediately in ref & state
      target.isSliced = true;
      const sliceAngle = (Math.random() - 0.5) * 60;
      setFruits((prev) =>
        prev.map((f) => (f.id === fruitId ? { ...f, isSliced: true, sliceAngle } : f))
      );

      playSliceSound();

      if (target.isBomb) {
        playSound('capture');
        setScores((sc) =>
          sc.map((s, i) => (i === playerIdx ? Math.max(0, s + target.points) : s))
        );
        setCombo(0);
        comboRef.current = 0;
        setComboMultiplier(1);

        setSlashEffects((effects) => [
          ...effects.slice(-6),
          { x: target.x, y: target.y, text: '💥 BOOM! -50', color: '#ff3d71' },
        ]);

        onMoveMade(`🚨 ${players[playerIdx]?.name || 'Joueur'} a tranché une bombe ! Étourdissement.`, false);
      } else {
        const nextCombo = comboRef.current + 1;
        comboRef.current = nextCombo;
        const multiplier = nextCombo >= 5 ? 3 : nextCombo >= 3 ? 2 : 1;
        const earnedPoints = target.points * multiplier;

        setCombo(nextCombo);
        setComboMultiplier(multiplier);

        setScores((sc) =>
          sc.map((s, i) => (i === playerIdx ? s + earnedPoints : s))
        );

        setSlashEffects((effects) => [
          ...effects.slice(-6),
          {
            x: target.x,
            y: target.y,
            text: multiplier > 1 ? `+${earnedPoints} (x${multiplier})` : `+${earnedPoints}`,
            color: target.emoji === '🍍' ? '#ffd84d' : '#00f59b',
          },
        ]);

        let comment = `${players[playerIdx]?.name || 'Joueur'} tranche ${target.name} (+${earnedPoints} pts) !`;
        if (multiplier > 1) {
          comment += ` 🔥 COMBO x${multiplier} !`;
        }
        if (target.emoji === '🍍' && mode === 'empire') {
          comment += ` 👑 Ananas Royal : Couronne décernée !`;
        }
        onMoveMade(comment, target.emoji === '🍍');
      }
    },
    [isPaused, mode, onMoveMade, players]
  );

  // Bot AI automated slicing
  useEffect(() => {
    if (isPaused) return;

    const botInterval = setInterval(() => {
      // Find bots in the game (players 1, 2, 3)
      players.forEach((p, idx) => {
        if (p.isBot) {
          // Find closest unsliced fruit that is NOT a bomb
          const availableFruit = fruitsRef.current.find(
            (f) => !f.isSliced && !f.isBomb && Math.random() > 0.35
          );
          if (availableFruit) {
            handleSliceFruit(availableFruit.id, idx);
          }
        }
      });
    }, 750);

    return () => clearInterval(botInterval);
  }, [isPaused, players, handleSliceFruit]);

  // Touch / Mouse dragging blade trail
  const [bladeTrail, setBladeTrail] = useState<{ x: number; y: number }[]>([]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPaused) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;

    setBladeTrail((prev) => [...prev.slice(-6), { x: px, y: py }]);

    // Check collision with unsliced fruits near the pointer (radius 7%)
    fruitsRef.current.forEach((f) => {
      if (!f.isSliced) {
        const dist = Math.hypot(f.x - px, f.y - py);
        if (dist < 7) {
          handleSliceFruit(f.id, 0);
        }
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[620px] select-none">
      {/* Top HUD: Combo & Timer */}
      <div className="flex items-center justify-between w-full mb-3 px-2">
        {/* Combo Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-[#00f59b] bg-[#073a2b]/80 shadow-[0_0_15px_rgba(0,245,155,0.3)]">
          <Flame className="w-4 h-4 text-[#ffd84d] animate-pulse" />
          <span className="text-sm font-black italic tracking-wide text-white uppercase font-['Barlow_Condensed']">
            Combo : <span className="text-[#00f59b] text-base">{combo}</span>
            {comboMultiplier > 1 && (
              <span className="text-[#ffd84d] ml-1 font-mono font-bold">(x{comboMultiplier})</span>
            )}
          </span>
        </div>

        {/* Live Scores Bar */}
        <div className="flex items-center gap-2">
          {players.map((p, idx) => (
            <div
              key={idx}
              style={{ borderColor: idx === 0 ? '#00f59b' : '#ff3d71' }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg border bg-[#0e1722] text-xs font-mono font-bold text-white"
            >
              <span className="truncate max-w-[70px]">{p.name}</span>:
              <span className="text-[#ffd84d]">{scores[idx] || 0} pts</span>
            </div>
          ))}
        </div>

        {/* 45s Match Countdown Timer */}
        <div className="px-3.5 py-1.5 rounded-xl border border-[#ff3d71] bg-[#2a0c18] font-mono text-sm sm:text-base font-black text-[#ff3d71] shadow-inner">
          ⏱ {timeLeft}s
        </div>
      </div>

      {/* The 3D Fruit Arena Viewport (matching Screenshot_20261109-125237_f3122511.jpg) */}
      <div
        onPointerMove={handlePointerMove}
        className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden border-3 border-[#00f59b] shadow-[0_0_40px_rgba(0,245,155,0.4)] bg-[#3e6b28] cursor-crosshair touch-none"
      >
        {/* Arena Background Landscape (Lush green field with fences and rocks) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2b5a1b] via-[#4d8532] to-[#244f15]">
          {/* Subtle field rings & grass textures */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          {/* Battle Circle */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] rounded-full border-2 border-white/20 bg-white/5 pointer-events-none" />
        </div>

        {/* 4 Corner Fruit Cannons (matching the screenshot!) */}
        {/* Top-Left Cannon (Red) */}
        <div className="absolute top-2 left-2 flex items-center gap-1 rotate-45 pointer-events-none z-10">
          <div className="w-12 h-8 rounded-lg bg-gradient-to-r from-[#e53935] to-[#7f1d1d] border-2 border-white shadow-lg flex items-center justify-end pr-1 text-xs">
            💥
          </div>
        </div>

        {/* Top-Right Cannon (Blue) */}
        <div className="absolute top-2 right-2 flex items-center gap-1 -rotate-45 pointer-events-none z-10">
          <div className="w-12 h-8 rounded-lg bg-gradient-to-r from-[#1e88e5] to-[#0d47a1] border-2 border-white shadow-lg flex items-center justify-start pl-1 text-xs">
            💥
          </div>
        </div>

        {/* Bottom-Left Cannon (Green) */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 -rotate-45 pointer-events-none z-10">
          <div className="w-12 h-8 rounded-lg bg-gradient-to-r from-[#43a047] to-[#1b5e20] border-2 border-white shadow-lg flex items-center justify-end pr-1 text-xs">
            💥
          </div>
        </div>

        {/* Bottom-Right Cannon (Yellow) */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rotate-45 pointer-events-none z-10">
          <div className="w-12 h-8 rounded-lg bg-gradient-to-r from-[#fbc02d] to-[#f57f17] border-2 border-white shadow-lg flex items-center justify-start pl-1 text-xs">
            💥
          </div>
        </div>

        {/* 4 Center Gladiator Ninjas with swords (matching screenshot) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
          <div className="relative w-36 h-36">
            {/* Red Ninja (Top) */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-3xl drop-shadow-lg animate-bounce">
              🥷
            </div>
            {/* Blue Ninja (Right) */}
            <div className="absolute top-1/2 right-2 -translate-y-1/2 text-3xl drop-shadow-lg">
              🗡️
            </div>
            {/* Green Ninja (Left) */}
            <div className="absolute top-1/2 left-2 -translate-y-1/2 text-3xl drop-shadow-lg">
              ⚔️
            </div>
            {/* Yellow Ninja (Bottom) */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-3xl drop-shadow-lg">
              🤺
            </div>
          </div>
        </div>

        {/* Flying Fruits in the Arena */}
        {fruits.map((f) => {
          if (f.isSliced) {
            // Sliced fruit split into two halves!
            return (
              <div
                key={f.id}
                style={{ left: `${f.x}%`, top: `${f.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 flex gap-1 opacity-70 transition-all duration-500 scale-90"
              >
                <span
                  style={{ transform: `rotate(${f.sliceAngle || -20}deg)` }}
                  className="text-2xl sm:text-3xl transition-transform"
                >
                  {f.emoji}
                </span>
                <span className="text-sm font-bold text-[#ffd84d]">✨</span>
              </div>
            );
          }

          return (
            <button
              key={f.id}
              onClick={() => handleSliceFruit(f.id, 0)}
              style={{ left: `${f.x}%`, top: `${f.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-3xl sm:text-4xl drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] cursor-pointer hover:scale-125 transition-transform duration-100 z-30 animate-pulse"
            >
              {f.emoji}
            </button>
          );
        })}

        {/* Blade Slash Particle Trail */}
        {bladeTrail.map((p, i) => (
          <div
            key={i}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              opacity: (i + 1) / bladeTrail.length,
              transform: `scale(${(i + 1) / bladeTrail.length})`,
            }}
            className="absolute w-4 h-4 rounded-full bg-[#00f59b] shadow-[0_0_12px_#00f59b] -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-150"
          />
        ))}

        {/* Slashed Splash Texts (+Points / Multipliers) */}
        {slashEffects.map((eff, i) => (
          <div
            key={i}
            style={{ left: `${eff.x}%`, top: `${eff.y}%`, color: eff.color }}
            className="absolute -translate-x-1/2 -translate-y-1/2 font-black italic text-lg sm:text-xl font-['Barlow_Condensed'] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] animate-ping pointer-events-none z-40"
          >
            {eff.text}
          </div>
        ))}
      </div>

      {/* Action Footer Tip */}
      <div className="flex items-center justify-between w-full mt-3 px-2 text-xs sm:text-sm text-[#8da0b5]">
        <span className="flex items-center gap-1.5">
          <span>⚔️</span>
          <span>Glisse ta souris ou clique pour trancher les fruits en vol !</span>
        </span>
        <span className="text-[#ffd84d] font-bold">Évite les bombes 💣</span>
      </div>
    </div>
  );
};
