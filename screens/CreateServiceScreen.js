        import React, { useContext, useState } from "react";
        import { SafeAreaView, View, Text, TextInput, TouchableOpacity, Image } from "react-native";
        import { ThemeContext } from "../context/ThemeContext";
        import { colors } from "../config/theme";
        import AsyncStorage from '@react-native-async-storage/async-storage';
        import { Ionicons } from "@expo/vector-icons";

        import CustomButton from "../components/CustomButton";

        const CreateServiceScreen = ({ navigation }) => {
        const { theme } = useContext(ThemeContext);
        const activeColors = colors[theme.mode];
        const [serviceName, setServiceName] = useState('');
        const [price, setPrice] = useState('');
        const [error, setError] = useState('');
        const [loading, setLoading] = useState(false);

        const handleCreateService = async () => {
            if (!serviceName || !price) {
            setError('Все поля должны быть заполнены');
            setLoading(false);
            return;
            }
            if (isNaN(price)) {
            setError('Цена должна быть числом');
            setLoading(false);
            return;
            }

            setLoading(true);
            try {
            console.log('Service Name:', serviceName, 'Price:', price);
            await AsyncStorage.setItem('service_info', JSON.stringify({ serviceName, price }));
            navigation.goBack();
            } catch (error) {
            console.error('Error:', error);
            setError('Произошла ошибка при создании услуги');
            } finally {
            setLoading(false);
            }
        };

        return (
            <SafeAreaView style={{ backgroundColor: activeColors.primary, flex: 1 }}>
            <TouchableOpacity 
                style={{ marginLeft: 10, marginTop: 10 }}
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="arrow-back" size={30} color={activeColors.tint} />
            </TouchableOpacity>

            <View style={{ paddingHorizontal: 25, flex: 1, justifyContent: "center" }}>
                <Image
                source={require("../images/servicelogo.png")}
                style={{
                    height: 300,
                    width: 300,
                    transform: [{ rotate: "0deg" }],
                }}
                />
                <Text style={{ fontSize: 28, fontWeight: "500", color: activeColors.tint, marginBottom: 30 }}>
                Создать Услугу
                </Text>

                <TextInput
                style={{
                    borderBottomWidth: 1,
                    borderBottomColor: activeColors.secondary,
                    marginBottom: 20,
                    fontSize: 16,
                    color: activeColors.tint,
                    paddingBottom: 10,
                }}
                placeholder="Название услуги"
                placeholderTextColor="#aaaaaa"
                onChangeText={setServiceName}
                value={serviceName}
                />

                <TextInput
                style={{
                    borderBottomWidth: 1,
                    borderBottomColor: activeColors.secondary,
                    marginBottom: 20,
                    fontSize: 16,
                    color: activeColors.tint,
                    paddingBottom: 10,
                }}
                placeholder="Цена"
                placeholderTextColor="#aaaaaa"
                keyboardType="numeric"
                onChangeText={setPrice}
                value={price}
                />

                <CustomButton
                label={"Сохранить"}
                onPress={handleCreateService}
                disabled={loading}
                />

                {error ? <Text style={{ color: 'red', textAlign: 'center', marginTop: 20 }}>{error}</Text> : null}
            </View>
            </SafeAreaView>
        );
        };

        export default CreateServiceScreen;
