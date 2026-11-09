import React, { useState, useEffect, useRef } from 'react';
import { Player, GameMode } from '../types/game';
import { playSound } from '../utils/audio';
import { Building2, Home, Landmark, ShieldAlert, Sparkles, TrendingUp, X, Check, Dices } from 'lucide-react';

interface MonopolyGameProps {
  players: Player[];
  activeTurnIndex: number;
  mode: GameMode;
  onMoveMade: (commentary: string, captured: boolean) => void;
  onGameOver: (winnerIndex: number) => void;
  isPaused: boolean;
}

export interface PropertyData {
  id: number;
  name: string;
  price: number;
  baseRent: number;
  group: number; // 0-7: colors, 8: utilities, 9: stations, -1: special
  housePrice: number;
}

// 40 Classic French Monopoly Squares with authentic data
export const BOARD_PROPERTIES: PropertyData[] = [
  { id: 0, name: 'Départ', price: 0, baseRent: 0, group: -1, housePrice: 0 },
  { id: 1, name: 'Bd de Belleville', price: 60, baseRent: 4, group: 0, housePrice: 50 },
  { id: 2, name: 'Caisse', price: 0, baseRent: 0, group: -1, housePrice: 0 },
  { id: 3, name: 'Rue Lecourbe', price: 60, baseRent: 6, group: 0, housePrice: 50 },
  { id: 4, name: 'Impôts', price: 0, baseRent: 0, group: -1, housePrice: 0 },
  { id: 5, name: 'Gare Montparnasse', price: 200, baseRent: 25, group: 9, housePrice: 0 },
  { id: 6, name: 'Rue de Vaugirard', price: 100, baseRent: 8, group: 1, housePrice: 50 },
  { id: 7, name: 'Chance', price: 0, baseRent: 0, group: -1, housePrice: 0 },
  { id: 8, name: 'Rue de Courcelles', price: 100, baseRent: 8, group: 1, housePrice: 50 },
  { id: 9, name: 'Avenue de la République', price: 120, baseRent: 10, group: 1, housePrice: 50 },
  { id: 10, name: 'Prison', price: 0, baseRent: 0, group: -1, housePrice: 0 },
  { id: 11, name: 'Bd de la Villette', price: 140, baseRent: 12, group: 2, housePrice: 100 },
  { id: 12, name: 'Compagnie Électricité', price: 150, baseRent: 15, group: 8, housePrice: 0 },
  { id: 13, name: 'Avenue de Neuilly', price: 140, baseRent: 12, group: 2, housePrice: 100 },
  { id: 14, name: 'Rue de Paradis', price: 160, baseRent: 14, group: 2, housePrice: 100 },
  { id: 15, name: 'Gare de Lyon', price: 200, baseRent: 25, group: 9, housePrice: 0 },
  { id: 16, name: 'Avenue Mozart', price: 180, baseRent: 16, group: 3, housePrice: 100 },
  { id: 17, name: 'Caisse', price: 0, baseRent: 0, group: -1, housePrice: 0 },
  { id: 18, name: 'Bd Saint-Michel', price: 180, baseRent: 16, group: 3, housePrice: 100 },
  { id: 19, name: 'Place Pigalle', price: 200, baseRent: 18, group: 3, housePrice: 100 },
  { id: 20, name: 'Parc Gratuit', price: 0, baseRent: 0, group: -1, housePrice: 0 },
  { id: 21, name: 'Avenue Matignon', price: 220, baseRent: 20, group: 4, housePrice: 150 },
  { id: 22, name: 'Chance', price: 0, baseRent: 0, group: -1, housePrice: 0 },
  { id: 23, name: 'Bd Malesherbes', price: 220, baseRent: 20, group: 4, housePrice: 150 },
  { id: 24, name: 'Avenue Henri-Martin', price: 240, baseRent: 22, group: 4, housePrice: 150 },
  { id: 25, name: 'Gare du Nord', price: 200, baseRent: 25, group: 9, housePrice: 0 },
  { id: 26, name: 'Faubourg Saint-Honoré', price: 260, baseRent: 24, group: 5, housePrice: 150 },
  { id: 27, name: 'Place de la Bourse', price: 260, baseRent: 24, group: 5, housePrice: 150 },
  { id: 28, name: 'Compagnie des Eaux', price: 150, baseRent: 15, group: 8, housePrice: 0 },
  { id: 29, name: 'Rue La Fayette', price: 280, baseRent: 26, group: 5, housePrice: 150 },
  { id: 30, name: 'Allez en Prison', price: 0, baseRent: 0, group: -1, housePrice: 0 },
  { id: 31, name: 'Avenue de Breteuil', price: 300, baseRent: 28, group: 6, housePrice: 200 },
  { id: 32, name: 'Avenue Foch', price: 300, baseRent: 28, group: 6, housePrice: 200 },
  { id: 33, name: 'Caisse', price: 0, baseRent: 0, group: -1, housePrice: 0 },
  { id: 34, name: 'Bd des Capucines', price: 320, baseRent: 30, group: 6, housePrice: 200 },
  { id: 35, name: 'Gare Saint-Lazare', price: 200, baseRent: 25, group: 9, housePrice: 0 },
  { id: 36, name: 'Chance', price: 0, baseRent: 0, group: -1, housePrice: 0 },
  { id: 37, name: 'Avenue des Champs-Élysées', price: 350, baseRent: 35, group: 7, housePrice: 200 },
  { id: 38, name: 'Taxe de Luxe', price: 0, baseRent: 0, group: -1, housePrice: 0 },
  { id: 39, name: 'Rue de la Paix', price: 400, baseRent: 50, group: 7, housePrice: 200 },
];

export const GROUP_CONFIG: Record<number, { name: string; color: string; totalInGroup: number }> = {
  0: { name: 'Marron', color: '#8d5b4c', totalInGroup: 2 },
  1: { name: 'Bleu Ciel', color: '#74c0fc', totalInGroup: 3 },
  2: { name: 'Rose', color: '#f06595', totalInGroup: 3 },
  3: { name: 'Orange', color: '#ff922b', totalInGroup: 3 },
  4: { name: 'Rouge', color: '#fa5252', totalInGroup: 3 },
  5: { name: 'Jaune', color: '#fcc419', totalInGroup: 3 },
  6: { name: 'Vert', color: '#40c057', totalInGroup: 3 },
  7: { name: 'Bleu Nuit', color: '#339af0', totalInGroup: 2 },
  8: { name: 'Services', color: '#adb5bd', totalInGroup: 2 },
  9: { name: 'Gares', color: '#dee2e6', totalInGroup: 4 },
};

const PLAYER_TOKENS = ['🏎️', '💎', '🎩', '🛥️'];
const PLAYER_PIECE_COLORS = ['#00f59b', '#ff3d71', '#3d8bff', '#ffd84d'];

interface ChanceCard {
  title: string;
  description: string;
  action: (currentCash: number[], playerIdx: number) => { cashDelta: number; message: string };
}

const CHANCE_CARDS: ChanceCard[] = [
  {
    title: 'Coup de Bourse Impérial',
    description: 'Vos investissements dans la City explosent ! Recevez un dividende exceptionnel.',
    action: () => ({ cashDelta: 150, message: 'La bourse s\'envole : +150 💰 !' }),
  },
  {
    title: 'Rénovation Urbaine',
    description: 'La mairie exige une mise aux normes écologiques de vos façades.',
    action: () => ({ cashDelta: -75, message: 'Travaux de voirie : -75 💰.' }),
  },
  {
    title: 'Héritage Privilégié',
    description: 'Un lointain baron d\'industrie vous cède une part de son empire.',
    action: () => ({ cashDelta: 200, message: 'Héritage impérial perçu : +200 💰 !' }),
  },
  {
    title: 'Frais de Réception & Gala',
    description: 'Organisation du grand gala des investisseurs de GameArena.',
    action: () => ({ cashDelta: -50, message: 'Soirée de prestige : -50 💰.' }),
  },
];

// 11x11 perimeter grid layout calculation (0 to 39)
const getPerimeterCoord = (idx: number): [number, number] => {
  if (idx <= 10) return [10 - idx, 10]; // Bottom row: 0 is bottom-right, 10 is bottom-left
  if (idx <= 20) return [0, 20 - idx]; // Left column: 10 is bottom-left, 20 is top-left
  if (idx <= 30) return [idx - 20, 0]; // Top row: 20 is top-left, 30 is top-right
  return [10, idx - 30]; // Right column: 30 is top-right, 39 is above bottom-right
};

export const MonopolyGame: React.FC<MonopolyGameProps> = ({
  players,
  activeTurnIndex,
  onMoveMade,
  onGameOver,
  isPaused,
}) => {
  const [positions, setPositions] = useState<number[]>(() => players.map(() => 0));
  const [cash, setCash] = useState<number[]>(() => players.map(() => 1500));
  // Property ID -> owner player index
  const [ownedProperties, setOwnedProperties] = useState<Record<number, number>>({});
  // Property ID -> number of houses (1 to 4: houses, 5: hotel)
  const [buildings, setBuildings] = useState<Record<number, number>>({});
  const [inJail, setInJail] = useState<boolean[]>(() => players.map(() => false));
  const [dice, setDice] = useState<[number, number]>([3, 4]);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'board' | 'portfolio'>('board');

  // Interactive Modals
  const [inspectedSquare, setInspectedSquare] = useState<PropertyData | null>(null);
  const [drawnCard, setDrawnCard] = useState<ChanceCard | null>(null);
  const [purchasePrompt, setPurchasePrompt] = useState<PropertyData | null>(null);

  const currentPlayer = players[activeTurnIndex];
  const isBot = currentPlayer?.isBot;

  // Rent calculation with monopoly bonus & houses
  const getRent = (propertyId: number, diceRoll = 7): number => {
    const prop = BOARD_PROPERTIES[propertyId];
    const owner = ownedProperties[propertyId];
    if (owner === undefined || prop.price === 0) return 0;

    // Stations
    if (prop.group === 9) {
      const stationsOwned = [5, 15, 25, 35].filter((id) => ownedProperties[id] === owner).length;
      return prop.baseRent * Math.pow(2, stationsOwned - 1);
    }
    // Utilities
    if (prop.group === 8) {
      const utilsOwned = [12, 28].filter((id) => ownedProperties[id] === owner).length;
      return diceRoll * (utilsOwned === 2 ? 10 : 4);
    }

    // Street properties
    const houseCount = buildings[propertyId] || 0;
    if (houseCount === 0) {
      // Check full monopoly of color
      const groupProps = BOARD_PROPERTIES.filter((p) => p.group === prop.group);
      const isMonopoly = groupProps.every((p) => ownedProperties[p.id] === owner);
      return isMonopoly ? prop.baseRent * 2 : prop.baseRent;
    }
    if (houseCount === 1) return prop.baseRent * 5;
    if (houseCount === 2) return prop.baseRent * 15;
    if (houseCount === 3) return prop.baseRent * 40;
    if (houseCount === 4) return prop.baseRent * 70;
    return prop.baseRent * 100; // Hotel (5)
  };

  // Roll dice action
  const rollDice = () => {
    if (isRolling || purchasePrompt || drawnCard || isPaused) return;

    playSound('dice');
    setIsRolling(true);

    let rolls = 0;
    const interval = setInterval(() => {
      setDice([Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1]);
      rolls++;
      if (rolls > 6) {
        clearInterval(interval);
        setIsRolling(false);

        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const total = d1 + d2;
        setDice([d1, d2]);

        // Jail check
        if (inJail[activeTurnIndex]) {
          setInJail((prev) => prev.map((j, i) => (i === activeTurnIndex ? false : j)));
          const comment = `${currentPlayer.name} purge sa peine et sort de prison.`;
          onMoveMade(comment, false);
          return;
        }

        const oldPos = positions[activeTurnIndex];
        const newPos = (oldPos + total) % 40;
        const passedGo = oldPos + total >= 40;

        let nextCash = [...cash];
        if (passedGo) {
          nextCash[activeTurnIndex] += 200;
          playSound('win');
        }

        setPositions((prev) => prev.map((p, i) => (i === activeTurnIndex ? newPos : p)));
        setCash(nextCash);

        const square = BOARD_PROPERTIES[newPos];
        let comment = `${currentPlayer.name} lance ${d1} + ${d2} (${total}) ➔ ${square.name}.`;
        if (passedGo) comment += ' Départ validé : +200 💰 !';

        // Check landing square type
        const owner = ownedProperties[newPos];

        // 1. Purchasable property
        if (square.price > 0 && owner === undefined) {
          if (nextCash[activeTurnIndex] >= square.price) {
            if (isBot) {
              // Bot AI: buy if they keep at least 200 cushion
              setTimeout(() => {
                if (nextCash[activeTurnIndex] - square.price >= 150) {
                  buyProperty(newPos);
                } else {
                  onMoveMade(`${currentPlayer.name} préfère garder sa trésorerie.`, false);
                }
              }, 700);
            } else {
              setPurchasePrompt(square);
              comment += ` Propriété disponible pour ${square.price} 💰.`;
              onMoveMade(comment, false);
              return;
            }
          } else {
            comment += ` Trésorerie insuffisante pour acheter ${square.name}.`;
          }
        }
        // 2. Rent to opponent
        else if (square.price > 0 && owner !== undefined && owner !== activeTurnIndex) {
          const rent = getRent(newPos, total);
          playSound('capture');
          nextCash[activeTurnIndex] -= rent;
          nextCash[owner] += rent;
          setCash([...nextCash]);
          comment += ` Loyer princier de ${rent} 💰 versé à ${players[owner].name} !`;

          if (nextCash[activeTurnIndex] < 0) {
            comment += ` Faillite retentissante de ${currentPlayer.name} !`;
            onGameOver(owner);
          }
        }
        // 3. Go to Jail
        else if (newPos === 30) {
          setPositions((prev) => prev.map((p, i) => (i === activeTurnIndex ? 10 : p)));
          setInJail((prev) => prev.map((j, i) => (i === activeTurnIndex ? true : j)));
          comment += ` 🚨 Arrestation immédiate ! Direction la prison.`;
        }
        // 4. Taxes
        else if (newPos === 4 || newPos === 38) {
          const tax = newPos === 4 ? 200 : 100;
          nextCash[activeTurnIndex] -= tax;
          setCash([...nextCash]);
          comment += ` Prélèvement fiscal impérial : -${tax} 💰.`;
        }
        // 5. Chance / Caisse cards
        else if ([2, 7, 17, 22, 33, 36].includes(newPos)) {
          const card = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
          const outcome = card.action(nextCash, activeTurnIndex);
          nextCash[activeTurnIndex] += outcome.cashDelta;
          setCash([...nextCash]);
          setDrawnCard(card);
          comment += ` 📜 ${card.title} : ${outcome.message}`;
        }

        onMoveMade(comment, false);
      }
    }, 60);
  };

  const buyProperty = (propertyId: number) => {
    const prop = BOARD_PROPERTIES[propertyId];
    if (cash[activeTurnIndex] < prop.price) return;

    playSound('move');
    setCash((prev) => prev.map((c, i) => (i === activeTurnIndex ? c - prop.price : c)));
    setOwnedProperties((prev) => ({ ...prev, [propertyId]: activeTurnIndex }));
    setPurchasePrompt(null);

    const comment = `👑 ${currentPlayer.name} acquiert ${prop.name} pour ${prop.price} 💰 !`;
    onMoveMade(comment, true);
  };

  // Build house on a property
  const buildHouse = (propertyId: number) => {
    const prop = BOARD_PROPERTIES[propertyId];
    const currentBuildings = buildings[propertyId] || 0;
    if (currentBuildings >= 5) return; // Already a hotel
    if (cash[activeTurnIndex] < prop.housePrice) return;

    playSound('win');
    setCash((prev) => prev.map((c, i) => (i === activeTurnIndex ? c - prop.housePrice : c)));
    setBuildings((prev) => ({ ...prev, [propertyId]: currentBuildings + 1 }));

    const isHotel = currentBuildings + 1 === 5;
    const comment = isHotel
      ? `🏨 ${currentPlayer.name} inaugure un Grand Hôtel Impérial sur ${prop.name} !`
      : `🏡 ${currentPlayer.name} bâtit une nouvelle villa sur ${prop.name} (Niveau ${currentBuildings + 1}) !`;
    onMoveMade(comment, true);
  };

  // Bot AI auto-play
  const botTimerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (isBot && !isPaused && !isRolling && !purchasePrompt && !drawnCard) {
      botTimerRef.current = setTimeout(() => {
        // Bot check if it can build houses on owned monopolies
        const ownedByBot = Object.keys(ownedProperties)
          .map(Number)
          .filter((id) => ownedProperties[id] === activeTurnIndex);

        let didBuild = false;
        for (const id of ownedByBot) {
          const prop = BOARD_PROPERTIES[id];
          if (prop.group >= 0 && prop.group < 8) {
            const groupProps = BOARD_PROPERTIES.filter((p) => p.group === prop.group);
            const isMonopoly = groupProps.every((p) => ownedProperties[p.id] === activeTurnIndex);
            const curB = buildings[id] || 0;
            if (isMonopoly && curB < 5 && cash[activeTurnIndex] > prop.housePrice + 200) {
              buildHouse(id);
              didBuild = true;
              break;
            }
          }
        }

        if (!didBuild) {
          rollDice();
        }
      }, 800);

      return () => {
        if (botTimerRef.current) clearTimeout(botTimerRef.current);
      };
    }
  }, [isBot, isPaused, isRolling, purchasePrompt, drawnCard, activeTurnIndex, cash]);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[580px] select-none">
      {/* View Switcher: Plateau vs Patrimoine */}
      <div className="flex items-center justify-between w-full mb-3 px-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0e1722] border border-[#1c2b3b]">
          <button
            onClick={() => setActiveTab('board')}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'board'
                ? 'bg-[#00f59b] text-[#032014] shadow-[0_0_12px_rgba(0,245,155,0.3)]'
                : 'text-[#8da0b5] hover:text-white'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Plateau</span>
          </button>

          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'portfolio'
                ? 'bg-[#00f59b] text-[#032014] shadow-[0_0_12px_rgba(0,245,155,0.3)]'
                : 'text-[#8da0b5] hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Patrimoine & Travaux</span>
          </button>
        </div>

        {/* Total Wealth Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#1c2b3b] bg-[#0e1722] text-xs font-mono font-bold text-white">
          <span className="text-[#8da0b5]">Solde :</span>
          <span className="text-[#ffd84d]">{cash[activeTurnIndex]} 💰</span>
        </div>
      </div>

      {activeTab === 'board' ? (
        /* 11x11 Luxury Empire Monopoly Board */
        <div className="relative w-full aspect-square max-w-[560px] rounded-3xl bg-[#061510] border-3 border-[#00f59b] shadow-[0_0_40px_rgba(0,245,155,0.3)] p-1.5 sm:p-2 overflow-hidden">
          <div className="grid grid-cols-11 grid-rows-11 gap-[2px] w-full h-full rounded-2xl overflow-hidden bg-[#0a1e18] border border-[#1c382b]">
            {BOARD_PROPERTIES.map((square) => {
              const [gx, gy] = getPerimeterCoord(square.id);
              const owner = ownedProperties[square.id];
              const ownerColor = owner !== undefined ? PLAYER_PIECE_COLORS[owner % 4] : null;
              const houseCount = buildings[square.id] || 0;
              const isCorner = square.id % 10 === 0;

              return (
                <button
                  key={square.id}
                  onClick={() => setInspectedSquare(square)}
                  style={{
                    gridColumn: gx + 1,
                    gridRow: gy + 1,
                    boxShadow: ownerColor ? `inset 0 0 0 2px ${ownerColor}` : 'none',
                  }}
                  className={`relative flex flex-col justify-between items-center text-center p-0.5 sm:p-1 overflow-hidden transition-all hover:brightness-125 cursor-pointer ${
                    isCorner ? 'bg-[#08221b]' : 'bg-[#0b1f1a]'
                  }`}
                >
                  {/* Color Header Banner */}
                  {square.group >= 0 && square.group < 8 && (
                    <div
                      style={{ backgroundColor: GROUP_CONFIG[square.group]?.color }}
                      className="w-full h-2 sm:h-3 rounded-t-sm shadow-sm relative flex items-center justify-center"
                    >
                      {/* Houses / Hotel icons */}
                      {houseCount > 0 && (
                        <div className="flex items-center gap-0.5">
                          {houseCount === 5 ? (
                            <span className="text-[8px] leading-none drop-shadow">🏨</span>
                          ) : (
                            Array.from({ length: houseCount }).map((_, i) => (
                              <span key={i} className="text-[7px] leading-none text-white drop-shadow">
                                🏠
                              </span>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Corner special markers */}
                  {isCorner && (
                    <div className="text-[10px] sm:text-xs">
                      {square.id === 0 && '🚩'}
                      {square.id === 10 && '🔒'}
                      {square.id === 20 && '🚗'}
                      {square.id === 30 && '🚨'}
                    </div>
                  )}

                  {/* Property Name */}
                  <span className="text-[6px] sm:text-[8px] font-bold text-[#eaf2ff] leading-none line-clamp-2 px-0.5">
                    {square.name}
                  </span>

                  {/* Price Tag or Rent */}
                  {square.price > 0 && (
                    <span className="text-[6px] sm:text-[8px] font-mono font-black text-[#00f59b]">
                      {square.price} 💰
                    </span>
                  )}

                  {/* Player Token Pawns */}
                  <div className="absolute inset-0 flex items-center justify-center gap-0.5 pointer-events-none z-10">
                    {positions.map((pos, pIdx) =>
                      pos === square.id ? (
                        <span
                          key={pIdx}
                          className="text-xs sm:text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-bounce"
                        >
                          {PLAYER_TOKENS[pIdx % 4]}
                        </span>
                      ) : null
                    )}
                  </div>
                </button>
              );
            })}

            {/* Central Empire Tycoon Boardroom */}
            <div className="col-start-2 col-end-11 row-start-2 row-end-11 rounded-2xl bg-gradient-to-br from-[#0c2e24] via-[#09221a] to-[#04120e] border border-[#00f59b]/40 p-4 sm:p-6 flex flex-col items-center justify-center text-center gap-3 sm:gap-4 shadow-2xl relative overflow-hidden">
              {/* Subtle gold watermarked emblem */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <span className="text-9xl">👑</span>
              </div>

              {/* Gold Luxury MONOPOLY Banner */}
              <div className="relative z-10 px-5 sm:px-7 py-1.5 sm:py-2 bg-gradient-to-r from-[#b71c1c] via-[#d32f2f] to-[#b71c1c] text-white font-black italic tracking-widest text-xl sm:text-3xl uppercase rounded-xl border-2 border-[#ffd84d] shadow-[0_0_20px_rgba(255,216,77,0.4)]">
                MONOPOLY <span className="text-[#ffd84d] text-base sm:text-xl font-normal">EMPIRE</span>
              </div>

              {/* 3D Realistic Rolling Dice */}
              <div className="relative z-10 flex items-center gap-4">
                {[dice[0], dice[1]].map((val, idx) => (
                  <div
                    key={idx}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#ffffff] via-[#f1f3f5] to-[#dee2e6] border-2 border-[#ced4da] shadow-[0_8px_16px_rgba(0,0,0,0.6)] flex items-center justify-center text-3xl sm:text-4xl text-[#1a1a1a] select-none font-bold ${
                      isRolling ? 'animate-spin' : 'transform hover:scale-105'
                    }`}
                  >
                    {['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][val - 1]}
                  </div>
                ))}
              </div>

              {/* Primary Action Button: Lancer les Dés */}
              {!isBot && (
                <button
                  disabled={isRolling || isPaused}
                  onClick={rollDice}
                  className="relative z-10 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-extrabold text-base sm:text-lg uppercase tracking-wider bg-[#00f59b] text-[#032014] shadow-[0_0_25px_rgba(0,245,155,0.45)] hover:bg-[#1affaa] hover:scale-105 active:scale-95 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Dices className="w-5 h-5" />
                  <span>Lancer les dés</span>
                </button>
              )}

              {/* Player Wealth Summary */}
              <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 mt-1">
                {players.map((p, idx) => (
                  <div
                    key={idx}
                    style={{ borderColor: PLAYER_PIECE_COLORS[idx % 4] }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-[#05110d]/80 text-xs sm:text-sm font-mono font-bold text-white shadow-sm"
                  >
                    <span>{PLAYER_TOKENS[idx % 4]}</span>
                    <span>{p.name} :</span>
                    <span className="text-[#ffd84d]">{cash[idx]} 💰</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Real Estate Portfolio & Building Manager */
        <div className="w-full max-w-[560px] rounded-3xl bg-[#0e1722] border-2 border-[#1c2b3b] p-4 sm:p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#1c2b3b] pb-3">
            <h3 className="text-xl font-black italic uppercase text-white flex items-center gap-2 font-['Barlow_Condensed']">
              <Building2 className="w-5 h-5 text-[#00f59b]" />
              <span>Portefeuille de {currentPlayer.name}</span>
            </h3>
            <span className="text-xs font-mono text-[#8da0b5]">
              Valeur : {cash[activeTurnIndex]} 💰
            </span>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {BOARD_PROPERTIES.filter((p) => ownedProperties[p.id] === activeTurnIndex).length === 0 ? (
              <p className="text-sm text-[#8da0b5] py-8 text-center">
                Aucune propriété acquise pour l'instant. Lance les dés pour bâtir ton empire !
              </p>
            ) : (
              BOARD_PROPERTIES.filter((p) => ownedProperties[p.id] === activeTurnIndex).map((prop) => {
                const houseCount = buildings[prop.id] || 0;
                const canBuild =
                  prop.housePrice > 0 &&
                  houseCount < 5 &&
                  cash[activeTurnIndex] >= prop.housePrice;

                return (
                  <div
                    key={prop.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-[#1c2b3b] bg-[#070d14]"
                  >
                    <div className="flex items-center gap-3">
                      {prop.group >= 0 && prop.group < 8 && (
                        <div
                          style={{ backgroundColor: GROUP_CONFIG[prop.group]?.color }}
                          className="w-3.5 h-10 rounded-sm"
                        />
                      )}
                      <div>
                        <h4 className="text-base font-bold text-white">{prop.name}</h4>
                        <p className="text-xs text-[#8da0b5]">
                          Loyer actuel : <span className="text-[#00f59b] font-bold">{getRent(prop.id)} 💰</span>
                          {houseCount > 0 && ` · ${houseCount === 5 ? 'Hôtel' : `${houseCount} maison(s)`}`}
                        </p>
                      </div>
                    </div>

                    {prop.housePrice > 0 && (
                      <button
                        disabled={!canBuild}
                        onClick={() => buildHouse(prop.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                          canBuild
                            ? 'bg-[#00f59b] text-[#032014] hover:bg-[#1affaa] shadow-[0_0_10px_rgba(0,245,155,0.3)]'
                            : 'border border-[#1c2b3b] text-[#8da0b5] opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <Home className="w-3 h-3" />
                        <span>Bâtir ({prop.housePrice} 💰)</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Property Purchase Modal (when landing on unowned square) */}
      {purchasePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-2xl border-2 border-[#00f59b] bg-[#0e1722] p-6 shadow-[0_0_40px_rgba(0,245,155,0.4)] space-y-4">
            {/* Title Deed Header */}
            <div
              style={{
                backgroundColor:
                  purchasePrompt.group >= 0 && purchasePrompt.group < 8
                    ? GROUP_CONFIG[purchasePrompt.group]?.color
                    : '#1c2b3b',
              }}
              className="p-3 rounded-xl text-center shadow-md"
            >
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/80">
                Titre de Propriété
              </span>
              <h3 className="text-xl font-black italic uppercase text-white font-['Barlow_Condensed']">
                {purchasePrompt.name}
              </h3>
            </div>

            {/* Rent Breakdown */}
            <div className="space-y-1.5 text-xs font-mono text-[#8da0b5] border-y border-[#1c2b3b] py-3">
              <div className="flex justify-between">
                <span>Prix d'achat :</span>
                <span className="text-[#00f59b] font-bold">{purchasePrompt.price} 💰</span>
              </div>
              <div className="flex justify-between">
                <span>Loyer de base :</span>
                <span className="text-white font-bold">{purchasePrompt.baseRent} 💰</span>
              </div>
              {purchasePrompt.housePrice > 0 && (
                <>
                  <div className="flex justify-between">
                    <span>Loyer avec 1 Maison :</span>
                    <span className="text-white">{purchasePrompt.baseRent * 5} 💰</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loyer avec Grand Hôtel :</span>
                    <span className="text-[#ffd84d] font-bold">{purchasePrompt.baseRent * 100} 💰</span>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => buyProperty(purchasePrompt.id)}
                className="flex-1 py-3 rounded-xl font-black text-base uppercase tracking-wider bg-[#00f59b] text-[#032014] shadow-[0_0_15px_rgba(0,245,155,0.4)] hover:bg-[#1affaa] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Acheter ({purchasePrompt.price} 💰)</span>
              </button>
              <button
                onClick={() => setPurchasePrompt(null)}
                className="px-4 py-3 rounded-xl font-bold text-sm text-[#8da0b5] border border-[#1c2b3b] hover:text-white transition-all cursor-pointer"
              >
                Passer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Property Inspection Modal (when tapping any tile on board) */}
      {inspectedSquare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-2xl border-2 border-[#1c2b3b] bg-[#0e1722] p-5 shadow-2xl space-y-4">
            <button
              onClick={() => setInspectedSquare(null)}
              className="absolute top-3 right-3 p-1.5 text-[#8da0b5] hover:text-white rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div
              style={{
                backgroundColor:
                  inspectedSquare.group >= 0 && inspectedSquare.group < 8
                    ? GROUP_CONFIG[inspectedSquare.group]?.color
                    : '#1c2b3b',
              }}
              className="p-3 rounded-xl text-center shadow-md"
            >
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/80">
                Fiche d'Investissement
              </span>
              <h3 className="text-xl font-black italic uppercase text-white font-['Barlow_Condensed']">
                {inspectedSquare.name}
              </h3>
            </div>

            <div className="space-y-1.5 text-xs font-mono text-[#8da0b5]">
              <div className="flex justify-between">
                <span>Statut :</span>
                <span className="text-white font-bold">
                  {ownedProperties[inspectedSquare.id] !== undefined
                    ? `Détenu par ${players[ownedProperties[inspectedSquare.id]].name}`
                    : inspectedSquare.price > 0
                    ? 'Disponible à l\'achat'
                    : 'Case spéciale'}
                </span>
              </div>
              {inspectedSquare.price > 0 && (
                <>
                  <div className="flex justify-between">
                    <span>Prix :</span>
                    <span className="text-[#00f59b] font-bold">{inspectedSquare.price} 💰</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loyer effectif :</span>
                    <span className="text-white font-bold">{getRent(inspectedSquare.id)} 💰</span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setInspectedSquare(null)}
              className="w-full py-2.5 rounded-xl font-bold text-sm bg-[#1c2b3b] text-white hover:bg-[#263b4f] transition-all cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Chance / Caisse Drawn Golden Card */}
      {drawnCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-sm rounded-2xl border-2 border-[#ffd84d] bg-gradient-to-b from-[#1c1a0e] to-[#0e1722] p-6 shadow-[0_0_35px_rgba(255,216,77,0.35)] text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#ffd84d]/10 border border-[#ffd84d] flex items-center justify-center text-3xl">
              <Sparkles className="w-7 h-7 text-[#ffd84d]" />
            </div>

            <h3 className="text-2xl font-black italic uppercase text-[#ffd84d] font-['Barlow_Condensed']">
              {drawnCard.title}
            </h3>

            <p className="text-sm text-[#eaf2ff] leading-relaxed">
              {drawnCard.description}
            </p>

            <button
              onClick={() => setDrawnCard(null)}
              className="w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider bg-[#ffd84d] text-[#032014] hover:bg-[#ffe37d] transition-all cursor-pointer shadow-lg"
            >
              Valider la carte
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
