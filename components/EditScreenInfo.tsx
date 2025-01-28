import React from 'react';
import { Button, StyleSheet, ActivityIndicator } from 'react-native';

import { ExternalLink } from './ExternalLink';
import { Text, View } from './Themed';

import Colors from '@/constants/Colors';
import { useAudioContext } from "@/context/audioContext/AudioContextProvider";

export default function EditScreenInfo({ path }: { path: string }) {
  const {
    audioQueueCount,
    checkAudioModuleStatus,
    audioStatus,
    playCount,
    handleAddAudio,
    clearAudioQueue,
    pauseAudio,
    resumeAudio,
    isLoading,
    isAudioPlayingRef
  } = useAudioContext();
  
  return (
    <View>
      <View style={styles.getStartedContainer}>
        <Button 
          title="Add 3 audio clips" 
          onPress={handleAddAudio}
          disabled={isLoading}
        />
        
        <Button 
          title="Clear Queue" 
          onPress={clearAudioQueue}
          disabled={audioQueueCount === 0 || isLoading}
        />

        <Button 
          title={isAudioPlayingRef.current ? "Pause" : "Resume"}
          onPress={isAudioPlayingRef.current ? pauseAudio : resumeAudio}
          disabled={!audioQueueCount && !isAudioPlayingRef.current}
        />

        <Button 
          title="Check Status" 
          onPress={checkAudioModuleStatus}
          disabled={isLoading}
        />

        {isLoading && (
          <ActivityIndicator 
            size="small" 
            color={Colors.light.tint}
            style={styles.loader}
          />
        )}

        {audioStatus && (
          <Text
            style={styles.getStartedText}
            lightColor="rgba(0,0,0,0.8)"
            darkColor="rgba(255,255,255,0.8)">
            {audioStatus}
          </Text>
        )}

        <Text
          style={styles.getStartedText}
          lightColor="rgba(0,0,0,0.8)"
          darkColor="rgba(255,255,255,0.8)">
          {`Played: ${playCount} | Queue: ${audioQueueCount}`}
        </Text>
      </View>

      <View style={styles.helpContainer}>
        <ExternalLink
          style={styles.helpLink}
          href="https://docs.expo.io/versions/latest/sdk/av/">
          <Text style={styles.helpLinkText} lightColor={Colors.light.tint}>
            Learn more about Expo AV
          </Text>
        </ExternalLink>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  getStartedContainer: {
    alignItems: 'center',
    marginHorizontal: 50,
    gap: 10,
  },
  homeScreenFilename: {
    marginVertical: 7,
  },
  codeHighlightContainer: {
    borderRadius: 3,
    paddingHorizontal: 4,
  },
  getStartedText: {
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'center',
  },
  helpContainer: {
    marginTop: 15,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  helpLink: {
    paddingVertical: 15,
  },
  helpLinkText: {
    textAlign: 'center',
  },
  loader: {
    marginVertical: 10,
  }
});
