import React from 'react';
import { NavTab } from '../types/game';
import { Trophy, Flag, Dumbbell, User, Volume2, VolumeX, Settings, BookOpen } from 'lucide-react';
import { playSound } from '../utils/audio';

interface HeaderProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onTabChange,
  isMuted,
  onToggleMute,
  onOpenSettings,
}) => {
  const tabs: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'arene', label: 'Arène', icon: <Trophy className="w-4 h-4 text-[#00f59b]" /> },
    { id: 'defis', label: 'Défis', icon: <Flag className="w-4 h-4" /> },
    { id: 'entr', label: 'Entraînement', icon: <Dumbbell className="w-4 h-4" /> },
    { id: 'regles', label: 'Règles', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'profil', label: 'Profil', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-3 sm:px-6 h-16 bg-[#070d14]/90 backdrop-blur-md border-b border-[#1c2b3b]">
      {/* Brand logo */}
      <div 
        onClick={() => {
          playSound('click');
          onTabChange('arene');
        }}
        className="flex items-center gap-2 cursor-pointer select-none group mr-3 shrink-0"
      >
        <span className="text-2xl drop-shadow-[0_0_10px_rgba(0,245,155,0.4)]">👑</span>
        <span className="text-xl sm:text-2xl font-extrabold italic tracking-tight uppercase text-white font-['Barlow_Condensed']">
          Game<span className="text-[#00f59b] group-hover:drop-shadow-[0_0_8px_#00f59b] transition-all">Arena</span>
        </span>
      </div>

      {/* Navigation tabs */}
      <nav className="flex items-center gap-1 sm:gap-2 flex-1 max-w-2xl h-full overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                playSound('click');
                onTabChange(tab.id);
              }}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 h-full text-sm sm:text-base font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'text-white border-[#00f59b] bg-gradient-to-t from-[#00f59b]/10 to-transparent'
                  : 'text-[#8da0b5] border-transparent hover:text-[#eaf2ff] hover:border-[#1c2b3b]'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right controls */}
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <button
          onClick={() => {
            playSound('click');
            onToggleMute();
          }}
          title={isMuted ? 'Activer la voix de NOVA' : 'Couper le son de NOVA'}
          className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border flex items-center gap-1.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            isMuted
              ? 'border-[#1c2b3b] bg-[#0e1722] text-[#8da0b5] hover:text-white'
              : 'border-[#00f59b]/40 bg-[#073a2b]/40 text-[#00f59b] shadow-[0_0_12px_rgba(0,245,155,0.2)]'
          }`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse text-[#00f59b]" />}
          <span className="hidden md:inline">{isMuted ? 'Muet' : 'Voix NOVA'}</span>
        </button>

        {onOpenSettings && (
          <button
            onClick={() => {
              playSound('click');
              onOpenSettings();
            }}
            title="Paramètres de l'arène"
            className="p-2 sm:p-2 rounded-xl border border-[#1c2b3b] bg-[#0e1722] text-[#8da0b5] hover:text-white hover:border-[#00f59b]/50 transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
