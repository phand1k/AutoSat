// components/LoadingIndicator.js
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const LoadingIndicator = () => {
  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: 'https://cdn.pixabay.com/animation/2023/10/08/03/19/03-19-26-213_512.gif' }} 
        style={styles.image} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  image: {
    width: 100,
    height: 100,
  },
});

export default LoadingIndicator;
