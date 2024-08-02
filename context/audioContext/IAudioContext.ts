import { MutableRefObject } from 'react';

export interface IAudioContext {
  handleAddAudio: () => void;
  isAudioClearedRef: MutableRefObject<boolean>;
  isAudioPlayingRef: MutableRefObject<boolean>;
  checkAudioModuleStatus: () => void;
  playCount: number;
  audioQueueCount: number;
  audioStatus: string
}
