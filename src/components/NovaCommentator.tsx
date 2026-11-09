import React from 'react';
import { Volume2, VolumeX, Mic, Pause, Play } from 'lucide-react';
import { playSound } from '../utils/audio';

interface NovaCommentatorProps {
  variant?: 'banner' | 'sidebar';
  latestMessage: string;
  previousMessage?: string;
  isMuted: boolean;
  onToggleMute: () => void;
  isPaused?: boolean;
  onTogglePause?: () => void;
  stepProgress?: number; // 0 to 20
}

export const NovaCommentator: React.FC<NovaCommentatorProps> = ({
  variant = 'banner',
  latestMessage,
  previousMessage,
  isMuted,
  onToggleMute,
  isPaused = false,
  onTogglePause,
  stepProgress = 5,
}) => {
  // Generate 36-48 waveform bars with distinct heights and animation delays
  const waveformBars = Array.from({ length: variant === 'banner' ? 44 : 26 }).map((_, i) => {
    const height = 8 + Math.round(Math.abs(Math.sin(i * 1.6)) * 24);
    const delay = (i * 45) % 800;
    return (
      <i
        key={i}
        className="w-[3px] bg-[#00f59b] rounded-full waveform-bar transition-all"
        style={{
          height: `${height}px`,
          animationDelay: `${delay}ms`,
        }}
      />
    );
  });

  if (variant === 'banner') {
    return (
      <div className="flex items-center gap-4 p-3.5 sm:p-4 rounded-2xl border border-[#1c2b3b] bg-[#0e1722]/95 backdrop-blur shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        {/* NOVA Avatar */}
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full border-2 border-[#00f59b] overflow-hidden bg-[#0c2a25] shadow-[0_0_12px_rgba(0,245,155,0.4)] flex items-center justify-center">
            <img
              src="/assets/avatars/nova.png"
              alt="NOVA IA"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="text-xl">🤖</span>
          </div>
          <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#00f59b] rounded-full border-2 border-[#0e1722] animate-pulse" />
        </div>

        {/* Live quote message */}
        <div className="flex-1 text-base sm:text-xl font-bold tracking-wide text-[#eaf2ff] truncate">
          <span className="text-[#00f59b] font-black mr-1">NOVA :</span>
          <span>{latestMessage.startsWith('NOVA') ? latestMessage.replace(/^NOVA\s*:\s*/, '') : `« ${latestMessage} »`}</span>
        </div>

        {/* Audio waveform */}
        <div className="hidden md:flex items-center gap-[3px] h-9 px-2">
          {waveformBars}
        </div>

        {/* Audio toggle button */}
        <button
          onClick={() => {
            playSound('click');
            onToggleMute();
          }}
          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
            isMuted
              ? 'border-[#1c2b3b] bg-[#070d14] text-[#8da0b5] hover:text-white'
              : 'border-[#00f59b]/40 bg-[#073a2b] text-[#00f59b] shadow-[0_0_15px_rgba(0,245,155,0.3)]'
          }`}
          title={isMuted ? 'Activer la voix' : 'Couper la voix'}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>
    );
  }

  // Sidebar widget in Game View (matching Image 3)
  return (
    <aside className="flex flex-col gap-3 p-4 sm:p-5 rounded-2xl border border-[#1c2b3b] bg-[#0e1722] shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
      {/* NOVA Header */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-full border-2 border-[#00f59b] overflow-hidden bg-[#0c2a25] shadow-[0_0_15px_rgba(0,245,155,0.35)] flex items-center justify-center">
            <img
              src="/assets/avatars/nova.png"
              alt="NOVA IA"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="text-xl">🤖</span>
          </div>
          <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#00f59b] rounded-full border-2 border-[#0e1722] animate-pulse" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-xl sm:text-2xl font-black italic tracking-wide text-white leading-tight">
            NOVA
          </h3>
          <p className="text-xs sm:text-sm font-medium text-[#8da0b5] tracking-wide">
            Commentateur IA
          </p>
        </div>

        {/* Small animated equalizer */}
        <div className="flex items-center gap-[2px] h-7">
          {waveformBars}
        </div>
      </div>

      {/* Primary speech bubble with microphone and glowing border */}
      <div className="flex items-start gap-3 p-3.5 sm:p-4 rounded-xl border-2 border-[#00f59b] bg-[#073a2b]/70 shadow-[0_0_20px_rgba(0,245,155,0.2)]">
        <Mic className="w-5 h-5 text-[#00f59b] shrink-0 mt-0.5 animate-pulse" />
        <p className="text-base sm:text-xl font-bold text-white tracking-wide leading-snug">
          {latestMessage.startsWith('NOVA') ? latestMessage : `NOVA : « ${latestMessage} »`}
        </p>
      </div>

      {/* Secondary speech bubble (previous comment) */}
      {previousMessage && (
        <div className="flex items-start gap-3 p-3 sm:p-3.5 rounded-xl border border-[#1c2b3b] bg-[#0a121b]/80">
          <Mic className="w-4 h-4 text-[#8da0b5] shrink-0 mt-0.5 opacity-60" />
          <p className="text-sm sm:text-base font-semibold text-[#8da0b5] tracking-wide leading-snug">
            {previousMessage.startsWith('«') ? previousMessage : `« ${previousMessage} »`}
          </p>
        </div>
      )}

      {/* Bottom controls: Pause, Step dots, Volume */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#1c2b3b] mt-1">
        {onTogglePause && (
          <button
            onClick={() => {
              playSound('click');
              onTogglePause();
            }}
            className="p-2 sm:px-3 sm:py-2 rounded-xl border border-[#1c2b3b] bg-[#0a121b] text-white hover:border-[#00f59b]/50 transition-all cursor-pointer flex items-center gap-1.5 text-sm font-bold"
            title={isPaused ? 'Reprendre' : 'Pause'}
          >
            {isPaused ? <Play className="w-4 h-4 text-[#00f59b]" /> : <Pause className="w-4 h-4 text-[#eaf2ff]" />}
            <span className="hidden sm:inline">{isPaused ? 'Reprendre' : 'Pause'}</span>
          </button>
        )}

        {/* Step dots */}
        <div className="flex items-center gap-1.5 flex-1 justify-center px-2">
          {Array.from({ length: 16 }).map((_, i) => (
            <i
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i <= stepProgress % 16 ? 'bg-[#00f59b] shadow-[0_0_6px_#00f59b]' : 'bg-[#1c2b3b]'
              }`}
            />
          ))}
        </div>

        {/* Sound toggle */}
        <button
          onClick={() => {
            playSound('click');
            onToggleMute();
          }}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            isMuted
              ? 'border-[#1c2b3b] bg-[#0a121b] text-[#8da0b5] hover:text-white'
              : 'border-[#00f59b]/40 bg-[#073a2b] text-[#00f59b] shadow-[0_0_12px_rgba(0,245,155,0.25)]'
          }`}
          title={isMuted ? 'Activer le son' : 'Couper le son'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
