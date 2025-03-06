import React from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

const LoadingAnimation = () => (
  <View style={styles.container}>
    <LottieView
      source={require('../../assets/car-drives.json')}
      autoPlay
      loop
      style={styles.animation}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: 100,
    height: 100,
  },
});

export default LoadingAnimation;