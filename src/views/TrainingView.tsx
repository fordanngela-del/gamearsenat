import React from 'react';
import { GameKey } from '../types/game';
import { GAMES_CATALOG } from './ArenaView';
import { Play } from 'lucide-react';
import { playSound } from '../utils/audio';

interface TrainingViewProps {
  onStartSoloGame: (gameKey: GameKey) => void;
}

export const TrainingView: React.FC<TrainingViewProps> = ({ onStartSoloGame }) => {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div>
        <h1 className="text-4xl sm:text-6xl font-black italic tracking-tight uppercase text-white font-['Barlow_Condensed']">
          Entraîne<span className="text-[#00f59b]">ment</span>
        </h1>
        <p className="text-base sm:text-lg text-[#8da0b5] font-medium mt-1">
          Affronte le bot IA de NOVA, teste tes stratégies sans pression.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5 mt-4">
        {GAMES_CATALOG.map((game) => (
          <div
            key={game.id}
            onClick={() => {
              playSound('click');
              onStartSoloGame(game.id);
            }}
            className="group relative flex flex-col justify-between h-[340px] rounded-2xl border border-[#1c2b3b] bg-[#0e1722] overflow-hidden hover:border-[#00f59b] hover:shadow-[0_0_24px_rgba(0,245,155,0.2)] transition-all cursor-pointer transform hover:-translate-y-1"
          >
            <div className="relative w-full h-[70%] overflow-hidden bg-[#070d14]">
              <img
                src={game.coverImage}
                alt={game.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e1722] via-transparent to-black/20" />
            </div>

            <div className="p-4 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black italic text-white uppercase group-hover:text-[#00f59b] transition-colors">
                  {game.name}
                </h3>
                <span className="text-xs text-[#8da0b5]">Match solo vs Bot IA</span>
              </div>

              <div className="w-10 h-10 rounded-full border border-white/20 bg-[#00f59b] text-[#032014] flex items-center justify-center font-bold shadow-md">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
