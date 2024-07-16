import React, { useContext } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { ErrorContext } from '../context/ErrorContext';

const Error403Screen = () => {
  const { error403 } = useContext(ErrorContext);

  if (!error403) return null;

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/5627/5627095.png' }} 
        style={styles.image} 
      />
      <Text style={styles.text}>Доступ запрещен. Ваша подписка истекла.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  image: {
    width: 200,
    height: 200,
  },
  text: {
    marginTop: 20,
    fontSize: 18,
    color: '#333',
  },
});

export default Error403Screen;
