import { createContext, ReactElement, useContext, useEffect, useRef, useState } from 'react';
import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import { IAudioContext } from './IAudioContext';
import { One } from "@/assets/testAudio/One";
import { Three } from "@/assets/testAudio/Three";
import { Two } from "@/assets/testAudio/Two";

interface IAudioRequest {
  text: string;
  base64Audio: string
}

const audioTriplet: IAudioRequest[] = [{text: '1', base64Audio: One}, {text: '2', base64Audio: Two}, {text: '3', base64Audio: Three}]

const MAX_RETRY_ATTEMPTS = 3;
const AUDIO_POOL_SIZE = 2;

const AudioContext = createContext<IAudioContext>({} as IAudioContext);

const useProvideAudio = (): IAudioContext => {
  const [sound, setSound] = useState<Audio.Sound | undefined>();
  const [playCount, setPlayCount] = useState<number>(0);
  const [audioStatus, setAudioStatus] = useState<string>('');
  const [audioQueue, setAudioQueue] = useState<IAudioRequest[]>([]);
  const [shouldPlayNextAudio, setShouldPlayNextAudio] = useState<boolean>(true);
  const isAudioClearedRef = useRef<boolean>(!audioQueue.length && !sound && shouldPlayNextAudio);
  const isAudioPlayingRef = useRef<boolean>(false);
  const audioPool = useRef<Audio.Sound[]>([]);
  const retryCount = useRef<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize audio pool
  useEffect(() => {
    const initAudioPool = async () => {
      for (let i = 0; i < AUDIO_POOL_SIZE; i++) {
        const newSound = new Audio.Sound();
        audioPool.current.push(newSound);
      }
    };

    initAudioPool();

    // Cleanup audio pool on unmount
    return () => {
      audioPool.current.forEach(async (pooledSound) => {
        try {
          await pooledSound.unloadAsync();
        } catch (error) {
          console.warn('Error cleaning up audio pool:', error);
        }
      });
      audioPool.current = [];
    };
  }, []);

  const isAVPlaybackStatusSuccess = (res: AVPlaybackStatus | void): res is AVPlaybackStatusSuccess => {
    return (res as AVPlaybackStatusSuccess).didJustFinish !== undefined;
  };

  const constructBase64AudioUri = (base64Audio: string): string => 
    'data:audio/mp3;base64,' + base64Audio;

  const unloadSound = async (): Promise<void> => {
    if (!sound) return;

    try {
      await sound.unloadAsync();
      // Return the sound to the pool
      audioPool.current.push(sound);
    } catch (e) {
      console.warn('Error unloading sound:', e);
    } finally {
      setSound(undefined);
    }
  };

  const checkAudioModuleStatus = async (): Promise<void> => {
    if (!sound) {
      setAudioStatus('Sound Object not loaded.');
      return;
    }

    try {
      const status = await sound.getStatusAsync();
      setAudioStatus(`getStatusAsync() result: ${JSON.stringify(status)}`);
    } catch (e) {
      setAudioStatus(`getStatusAsync() Error: ${JSON.stringify(e)}`);
    }
  };

  const onPlaybackStatusUpdate = async (playbackStatus: AVPlaybackStatus): Promise<void> => {
    if (isAVPlaybackStatusSuccess(playbackStatus)) {
      if (playbackStatus.didJustFinish && !playbackStatus.isLooping) {
        isAudioPlayingRef.current = false;
        setShouldPlayNextAudio(true);
        retryCount.current = 0;
      }
    }
  };

  const clearAudioQueue = (): void => {
    setAudioQueue([]);
    setShouldPlayNextAudio(false);
  };

  const pauseAudio = async (): Promise<void> => {
    if (!sound) return;
    try {
      await sound.pauseAsync();
      isAudioPlayingRef.current = false;
    } catch (error) {
      console.warn('Error pausing audio:', error);
    }
  };

  const resumeAudio = async (): Promise<void> => {
    if (!sound) return;
    try {
      await sound.playAsync();
      isAudioPlayingRef.current = true;
    } catch (error) {
      console.warn('Error resuming audio:', error);
    }
  };

  const playAudio = async (audioString: IAudioRequest): Promise<void> => {
    if (retryCount.current >= MAX_RETRY_ATTEMPTS) {
      console.warn('Max retry attempts reached for audio playback');
      setShouldPlayNextAudio(true);
      retryCount.current = 0;
      return;
    }

    try {
      setIsLoading(true);
      
      const uri = constructBase64AudioUri(audioString.base64Audio);
      
      let soundObj = audioPool.current.pop();
      if (!soundObj) {
        soundObj = new Audio.Sound();
      }

      soundObj.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
      
      // Set up the sound object before loading
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      setSound(soundObj);
      // Load and play the audio
      await soundObj.loadAsync({ uri }, { shouldPlay: true });
      isAudioPlayingRef.current = true;
      setPlayCount(p => p + 1);
      
    } catch (error) {
      console.warn('Error playing audio:', error);
      isAudioPlayingRef.current = false;
      retryCount.current += 1;
      await unloadSound();
      setTimeout(() => {
        playAudio(audioString);
      }, 1000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAudio = (): void => {
    setAudioQueue(prev => [...prev, ...audioTriplet]);
  };

  // Audio queue management
  useEffect(() => {
    const processAudioQueue = async () => {
      if (audioQueue.length > 0 && shouldPlayNextAudio && !isAudioPlayingRef.current) {
        const nextAudio = audioQueue[0];
        if (nextAudio) {
          setShouldPlayNextAudio(false);
          setAudioQueue(prev => prev.slice(1));
          // Ensure sound is unloaded before playing next
          if (sound) {
            await unloadSound();
          }
          await playAudio(nextAudio);
        }
      }
    };

    processAudioQueue();
  }, [sound, audioQueue.length, shouldPlayNextAudio]);

  // Cleanup effect
  useEffect(() => {
    if (!audioQueue.length && !sound && !isAudioClearedRef.current && !isAudioPlayingRef.current) {
      isAudioClearedRef.current = true;
    }
  }, [audioQueue.length, sound]);

  return {
    handleAddAudio,
    audioStatus,
    audioQueueCount: audioQueue.length,
    isAudioClearedRef,
    isAudioPlayingRef,
    checkAudioModuleStatus,
    playCount,
    clearAudioQueue,
    pauseAudio,
    resumeAudio,
    isLoading,
  };
};

export function useAudioContext(): IAudioContext {
  return useContext(AudioContext);
}

interface IChildren {
  children: ReactElement
}

export function ProvideAudioContext({ children }: IChildren): ReactElement {
  const contextValue: IAudioContext = useProvideAudio();
  return <AudioContext.Provider value={contextValue}>{children}</AudioContext.Provider>;
}
