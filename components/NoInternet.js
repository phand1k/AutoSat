// NoInternet.js
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const NoInternet = () => {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://cdni.iconscout.com/illustration/premium/thumb/no-internet-connection-5521509-4610093.png' }}
        style={styles.image}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 9999,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  text: {
    fontSize: 18,
    color: 'white',
  },
});

export default NoInternet;
