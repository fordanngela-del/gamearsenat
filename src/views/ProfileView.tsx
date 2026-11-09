import React, { useState } from 'react';
import { UserProfile, GameKey } from '../types/game';
import { GAMES_CATALOG } from './ArenaView';
import { Crown, Trophy, Award, Check } from 'lucide-react';
import { playSound } from '../utils/audio';

interface ProfileViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

const AVATAR_PRESETS = [
  { id: 'karim', src: '/assets/avatars/karim.png', label: 'Karim' },
  { id: 'lea', src: '/assets/avatars/lea.png', label: 'Léa' },
  { id: 'sara', src: '/assets/avatars/sara.png', label: 'Sara' },
  { id: 'robot', src: '/assets/avatars/nova.png', label: 'NOVA Cyber' },
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  userProfile,
  onUpdateProfile,
}) => {
  const [pseudo, setPseudo] = useState(userProfile.pseudo);
  const [saved, setSaved] = useState(false);

  const handleSavePseudo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pseudo.trim()) return;
    playSound('click');
    onUpdateProfile({ pseudo: pseudo.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSelectAvatar = (src: string) => {
    playSound('click');
    onUpdateProfile({ avatar: src });
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div>
        <h1 className="text-4xl sm:text-6xl font-black italic tracking-tight uppercase text-white font-['Barlow_Condensed']">
          Ton <span className="text-[#00f59b]">profil</span>
        </h1>
        <p className="text-base sm:text-lg text-[#8da0b5] font-medium mt-1">
          Personnalise ton pseudo, ton avatar et consulte ton palmarès esport.
        </p>
      </div>

      {/* Profile & Avatar Config */}
      <section className="p-6 rounded-2xl border border-[#1c2b3b] bg-[#0e1722] shadow-xl flex flex-col md:flex-row gap-6 items-start md:items-center">
        {/* Current Avatar */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full border-3 border-[#00f59b] overflow-hidden bg-[#0c2a25] shadow-[0_0_20px_rgba(0,245,155,0.35)] flex items-center justify-center">
            <img
              src={userProfile.avatar || '/assets/avatars/karim.png'}
              alt={userProfile.pseudo}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="text-3xl">😎</span>
          </div>
        </div>

        {/* Pseudo form */}
        <form onSubmit={handleSavePseudo} className="flex-1 w-full space-y-3">
          <label className="block text-sm font-bold uppercase tracking-wider text-[#8da0b5]">
            Modifier ton Pseudo
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={pseudo}
              maxLength={16}
              onChange={(e) => setPseudo(e.target.value)}
              className="flex-1 bg-[#0a121b] border-2 border-[#1c2b3b] focus:border-[#00f59b] rounded-xl px-4 py-2.5 text-lg font-bold text-white focus:outline-none transition-all"
            />
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold bg-[#00f59b] text-[#032014] hover:bg-[#1affaa] transition-all cursor-pointer shadow-md flex items-center gap-1.5"
            >
              {saved ? <Check className="w-4 h-4" /> : null}
              <span>{saved ? 'Enregistré' : 'Sauvegarder'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* Avatar Presets Selection */}
      <section className="p-6 rounded-2xl border border-[#1c2b3b] bg-[#0e1722] shadow-xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#8da0b5] mb-3">
          Choisir un Avatar Esport
        </h3>
        <div className="flex flex-wrap gap-4">
          {AVATAR_PRESETS.map((preset) => {
            const isSelected = userProfile.avatar === preset.src;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectAvatar(preset.src)}
                className={`flex items-center gap-3 p-2.5 pr-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#00f59b] bg-[#073a2b]/40 shadow-[0_0_15px_rgba(0,245,155,0.3)]'
                    : 'border-[#1c2b3b] bg-[#0a121b] hover:border-[#8da0b5]'
                }`}
              >
                <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden bg-[#0c1a24] flex items-center justify-center">
                  <img src={preset.src} alt={preset.label} className="w-full h-full object-cover" />
                </div>
                <span className="font-bold text-sm text-white">{preset.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Crowns & Stats */}
      <section className="p-6 rounded-2xl border border-[#1c2b3b] bg-[#0e1722] shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#1c2b3b] pb-4">
          <div>
            <h2 className="text-3xl font-black italic uppercase text-white flex items-center gap-2">
              <Crown className="w-7 h-7 text-[#ffd84d] fill-current" />
              <span>{userProfile.crowns} Couronnes Royales</span>
            </h2>
            <p className="text-sm text-[#8da0b5]">Gagnées dans les modes Hacking et Empire Roi.</p>
          </div>
          <Award className="w-10 h-10 text-[#00f59b]" />
        </div>

        {/* Per-Game Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GAMES_CATALOG.map((game) => {
            const st = userProfile.stats[game.id] || { wins: 0, losses: 0 };
            const total = st.wins + st.losses;
            const winRate = total > 0 ? Math.round((st.wins / total) * 100) : 0;

            return (
              <div
                key={game.id}
                className="p-4 rounded-xl border border-[#1c2b3b] bg-[#0a121b] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{game.emoji}</span>
                  <div>
                    <h4 className="text-xl font-black italic text-white uppercase">{game.name}</h4>
                    <p className="text-xs text-[#8da0b5]">
                      {st.wins} victoire(s) · {st.losses} défaite(s)
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-lg font-mono font-bold text-[#00f59b]">{winRate}%</span>
                  <p className="text-[10px] uppercase tracking-wider text-[#8da0b5]">Taux victoire</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
