import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const AuthLoadingScreen = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token_avtosat');
        navigation.replace(token ? 'Footer' : 'Login');
      } catch (error) {
        console.error('Ошибка при чтении токена из AsyncStorage:', error);
        navigation.replace('Login');
      } finally {
        setIsLoading(false);
      }
    };

    checkToken();
  }, [navigation]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null;
};

export default AuthLoadingScreen;
