"use client";

import { useState, useCallback } from 'react';
import { gameAudio } from '../utils/gameAudio';

export const useGameAudio = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize audio context on first interaction
  const initAudio = useCallback(async () => {
    if (!initialized) {
      await gameAudio.init();
      setInitialized(true);
    }
  }, [initialized]);

  const toggleMute = useCallback(() => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    gameAudio.setMute(newMutedState);
  }, [isMuted]);

  const playEat = useCallback(() => gameAudio.playEatSound(), []);
  const playGameOver = useCallback(() => gameAudio.playGameOverSound(), []);
  const playStageClear = useCallback(() => gameAudio.playStageClearSound(), []);
  const playClick = useCallback(() => gameAudio.playClickSound(), []);
  
  const startBGM = useCallback(() => gameAudio.startBGM(), []);
  const stopBGM = useCallback(() => gameAudio.stopBGM(), []);

  return {
    isMuted,
    toggleMute,
    initAudio,
    playEat,
    playGameOver,
    playStageClear,
    playClick,
    startBGM,
    stopBGM
  };
};
