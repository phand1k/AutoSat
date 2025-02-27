import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CarContext = createContext();

export const CarProvider = ({ children }) => {
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);

    // Загрузка данных о марках и моделях из AsyncStorage
    useEffect(() => {
        const loadCarData = async () => {
            try {
                const storedBrands = await AsyncStorage.getItem('carBrands');
                const storedModels = await AsyncStorage.getItem('carModels');

                if (storedBrands) {
                    setBrands(JSON.parse(storedBrands));
                }

                if (storedModels) {
                    setModels(JSON.parse(storedModels));
                }
            } catch (error) {
                console.error('Error loading car data from storage:', error);
            }
        };

        loadCarData();
    }, []);

    return (
        <CarContext.Provider value={{ brands, models }}>
            {children}
        </CarContext.Provider>
    );
};
