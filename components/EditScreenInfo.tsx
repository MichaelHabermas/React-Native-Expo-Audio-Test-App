import React from 'react';
import {Button, StyleSheet} from 'react-native';

import { ExternalLink } from './ExternalLink';
import { Text, View } from './Themed';

import Colors from '@/constants/Colors';
import { useAudioContext } from "@/context/audioContext/AudioContextProvider";

export default function EditScreenInfo({ path }: { path: string }) {
  const {audioQueueCount, checkAudioModuleStatus, audioStatus, playCount, handleAddAudio } = useAudioContext()
  
  return (
    <View>
      <View style={styles.getStartedContainer}>

        <Button title={"Add 3 audio clips"} onPress={handleAddAudio}  />
        <Button title={"Check expo-av getStatusAsync()"} onPress={checkAudioModuleStatus} />

        {audioStatus && <Text
            style={styles.getStartedText}
            lightColor="rgba(0,0,0,0.8)"
            darkColor="rgba(255,255,255,0.8)">
          {audioStatus}
        </Text>}

        <Text
          style={styles.getStartedText}
          lightColor="rgba(0,0,0,0.8)"
          darkColor="rgba(255,255,255,0.8)">
          {`Number of audio clips played: ${playCount}`}
        </Text>

        <Text
          style={styles.getStartedText}
          lightColor="rgba(0,0,0,0.8)"
          darkColor="rgba(255,255,255,0.8)">
          {`Number of audio clips in queue: ${audioQueueCount}`}
        </Text>
      </View>

      <View style={styles.helpContainer}>
        <ExternalLink
          style={styles.helpLink}
          href="https://docs.expo.io/get-started/create-a-new-app/#opening-the-app-on-your-phonetablet">
          <Text style={styles.helpLinkText} lightColor={Colors.light.tint}>
            Tap here if your app doesn't automatically update after making changes
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
    gap: 20
  },
  homeScreenFilename: {
    marginVertical: 7,
  },
  codeHighlightContainer: {
    borderRadius: 3,
    paddingHorizontal: 4,
  },
  getStartedText: {
    fontSize: 17,
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
});
