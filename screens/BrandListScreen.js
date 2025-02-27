import React, { useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { CarContext } from '../components/CarContext';

const BrandListScreen = () => {
    const { brands, models } = useContext(CarContext);

    return (
        <View>
            <Text>Марки автомобилей:</Text>
            <FlatList
                data={brands}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity>
                        <Text>{item.name}</Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

export default BrandListScreen;
