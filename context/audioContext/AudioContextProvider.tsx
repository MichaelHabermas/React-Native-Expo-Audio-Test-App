import { createContext, ReactElement, useContext, useEffect, useRef, useState } from 'react';
import { Audio, AVPlaybackStatus, AVPlaybackStatusSuccess } from 'expo-av';
import { IAudioContext } from './IAudioContext';
import {testAudio} from "@/assets/testAudio/testAudio";
import {One} from "@/assets/testAudio/One";
import {Three} from "@/assets/testAudio/Three";
import {Two} from "@/assets/testAudio/Two";

interface IAudioRequest {
  text: string;
  base64Audio: string
}

const audioTriplet: IAudioRequest[] = [{text: '1', base64Audio: One}, {text: '2', base64Audio: Two}, {text: '3', base64Audio: Three}]

const AudioContext = createContext<IAudioContext>({} as IAudioContext);

const useProvideAudio = (): IAudioContext => {
  const [sound, setSound] = useState<Audio.Sound | undefined>();
  const [playCount, setPlayCount] = useState<number>(0);
  const [audioStatus, setAudioStatus] = useState<string>('');
  const [audioQueue, setAudioQueue] = useState<IAudioRequest[]>([]);
  const [shouldPlayNextAudio, setShouldPlayNextAudio] = useState<boolean>(true);
  const isAudioClearedRef = useRef<boolean>(!audioQueue.length && !sound && shouldPlayNextAudio);
  const isAudioPlayingRef = useRef<boolean>(false);

  const isAVPlaybackStatusSuccess = (res: AVPlaybackStatus | void): res is AVPlaybackStatusSuccess => {
    return (res as AVPlaybackStatusSuccess).didJustFinish !== undefined;
  };

  const constructBase64AudioUri = (base64Audio: string): string => 'data:audio/mp3;base64,' + base64Audio;

  const unloadSound = async (): Promise<void> => {
    await sound?.unloadAsync().catch((e) => console.error('Error unloading sound: ', e));
    setSound(undefined);
  };

  /** NOTE: The crash happens pretty consistently at 41 plays in Android. This crash does not seem to occur on an iOS simulator. */
  const checkAudioModuleStatus = (): void => {
    if (sound) {
      sound
        .getStatusAsync()
        .then((s) => setAudioStatus(`getStatusAsync() result: ` +  JSON.stringify(s)))
        .catch((e) => setAudioStatus(`getStatusAsync() Error:` +  JSON.stringify(e)));
    } else {
      setAudioStatus('Sound Object not loaded.')
    }
  };

  const onPlaybackStatusUpdate = async (playbackStatus: AVPlaybackStatus): Promise<void> => {
    console.log(playbackStatus);
    if (isAVPlaybackStatusSuccess(playbackStatus) && playbackStatus.didJustFinish && !playbackStatus.isLooping) {
      isAudioPlayingRef.current = false;
      await unloadSound();
      setShouldPlayNextAudio(true);
    }
  };

  const playAudio = async (audioString: IAudioRequest): Promise<void> => {
    isAudioPlayingRef.current = true;
    const uri = constructBase64AudioUri(audioString.base64Audio);
    const soundObj = new Audio.Sound();
    soundObj.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
    setSound(soundObj);
    setPlayCount(p => p + 1)

    try {
      await soundObj
        .loadAsync({ uri }, { shouldPlay: true })
        .catch((error) => console.error('Error loading audio:' + ' ', error));
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const handleAddAudio = (): void => setAudioQueue((prev) => ([...prev, ...audioTriplet]));

  useEffect(() => {
    if (audioQueue.length > 0 && shouldPlayNextAudio && !sound) {
      isAudioClearedRef.current = false;

      setAudioQueue((prev) => {
        const audioToPlay = prev.shift();

        if (audioToPlay) {
          setShouldPlayNextAudio(false);
          playAudio(audioToPlay);
          return prev;
        }
        return [];
      });
    }
  }, [sound, audioQueue.length, shouldPlayNextAudio]);

  useEffect(() => {
    if (!audioQueue.length && !sound && !isAudioClearedRef.current && !isAudioPlayingRef.current) {
      isAudioClearedRef.current = true;
    }
  }, [audioQueue.length, sound]);

  return { handleAddAudio, audioStatus, audioQueueCount: audioQueue.length, isAudioClearedRef, isAudioPlayingRef, checkAudioModuleStatus, playCount };
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
