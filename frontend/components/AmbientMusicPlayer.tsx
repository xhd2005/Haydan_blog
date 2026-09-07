'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/lib/i18n';
import { Music, Volume2, VolumeX, Play, Pause } from 'lucide-react';

interface AmbientMusicPlayerProps {
  musicUrl?: string;
}

export function AmbientMusicPlayer({ musicUrl }: AmbientMusicPlayerProps) {
  const { t } = useI18n();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioSource = musicUrl || 'https://cdn.freesound.org/previews/518/518175_6142149-lq.mp3';

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <audio ref={audioRef} src={audioSource} loop preload="none" />

      <div
        className={`flex items-center gap-2 p-2 rounded-full border border-border bg-card/90 backdrop-blur-md shadow-lg transition-all duration-300 ${
          expanded ? 'pr-4' : ''
        }`}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className={`p-2.5 rounded-full transition-all ${
            isPlaying
              ? 'bg-emerald-500 text-white animate-pulse'
              : 'bg-secondary text-muted-foreground hover:text-foreground'
          }`}
          title={t('music.title')}
          aria-label={t('music.title')}
        >
          <Music className="w-4 h-4" />
        </button>

        {expanded && (
          <div className="flex items-center gap-2 text-xs font-mono text-foreground animate-in fade-in duration-200">
            <span className="text-[11px] text-muted-foreground font-sans">
              {isPlaying ? t('music.playing') : t('music.idle')}
            </span>

            <button
              onClick={togglePlay}
              className="p-1.5 rounded-full hover:bg-secondary text-foreground transition-colors"
              aria-label={isPlaying ? t('music.pause') : t('music.play')}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={toggleMute}
              className="p-1.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              aria-label={isMuted ? t('music.unmute') : t('music.mute')}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
