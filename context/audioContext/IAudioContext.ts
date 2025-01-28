import { MutableRefObject } from 'react';

export interface IAudioContext {
  handleAddAudio: () => void;
  isAudioClearedRef: MutableRefObject<boolean>;
  isAudioPlayingRef: MutableRefObject<boolean>;
  checkAudioModuleStatus: () => Promise<void>;
  playCount: number;
  audioQueueCount: number;
  audioStatus: string;
  // New methods
  clearAudioQueue: () => void;
  pauseAudio: () => Promise<void>;
  resumeAudio: () => Promise<void>;
  isLoading: boolean;
}
