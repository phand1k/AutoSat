import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, Modal, SafeAreaView, ActivityIndicator, RefreshControl, Dimensions, Animated, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ThemeContext } from "../../context/ThemeContext";
import { colors } from "../../config/theme";
import { TabView, TabBar, SceneMap } from 'react-native-tab-view';
import * as Haptics from 'expo-haptics';
import DetailingPaymentSlider from "../DetailingPaymentSlider";
import { generateOrderPdf } from './pdfGenerator';
import getEnvVars from '../config';

const { apiUrl } = getEnvVars();
const initialLayout = { width: Dimensions.get('window').width };

const AssignServiceScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { selectedOrder } = route.params;
    const { theme } = useContext(ThemeContext);
    const activeColors = colors[theme.mode];
    const [pdfUri, setPdfUri] = useState(null);
    const [isPdfModalVisible, setIsPdfModalVisible] = useState(false);
    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'services', title: 'Добавление услуг' },
        { key: 'assignedServices', title: 'Назначенные услуги' },
    ]);
    const [services, setServices] = useState([]);
    const [assignedServices, setAssignedServices] = useState([]);
    const [priceList, setPriceList] = useState([]);
    const [selectedService, setSelectedService] = useState(null);
    const [editedPrice, setEditedPrice] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPrice, setSelectedPrice] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [orderDetails, setOrderDetails] = useState(null);
    const [servicesTotal, setServicesTotal] = useState(0);
    const fadeAnim = useState(new Animated.Value(0))[0];
    const [refreshing, setRefreshing] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [loadingServiceId, setLoadingServiceId] = useState(null); // Состояние для отслеживания загрузки

    useEffect(() => {
        const fetchUserRole = async () => {
            const role = await AsyncStorage.getItem('role_user_avtosat');
            setUserRole(role);
        };

        fetchUserRole();
    }, []);
    
    useEffect(() => {
        fetchOrderDetails();
        fetchServices();
        fetchAssignedServices();
        fetchServicesTotal();
    }, []);

    const fetchServicesTotal = async () => {
        try {
            const token = await AsyncStorage.getItem('access_token_avtosat');
            const response = await fetch(`${apiUrl}/api/DetailingOrder/GetSummOfDetailingServicesOnOrder?id=${selectedOrder.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const total = await response.json();
            setServicesTotal(total);
        } catch (error) {
            console.error('Ошибка при загрузке суммы услуг:', error);
            Alert.alert('Ошибка', 'Не удалось загрузить сумму услуг.');
        }
    };

    const handleCompleteOrder = async () => {
        try {
            const token = await AsyncStorage.getItem('access_token_avtosat');
            const response = await fetch(`${apiUrl}/api/DetailingOrder/CompleteDetailingOrder?id=${selectedOrder.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                Alert.alert('Завершено✅', 'Заказ-наряд успешно завершен');
                fetchServicesTotal();
                fetchAssignedServices();
            }
        } catch (error) {
            console.error('Ошибка завершения заказа:', error);
            Alert.alert('Ошибка', 'Произошла ошибка при завершении заказа.');
        }
    };

    const fetchAssignedServices = async () => {
        try {
            const token = await AsyncStorage.getItem('access_token_avtosat');
            const response = await fetch(`${apiUrl}/api/DetailingService/AllDetailingServicesOnOrderAsync?id=${selectedOrder.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            const servicesData = data.$values || [];
            setAssignedServices(servicesData);
        } catch (error) {
            console.error('Ошибка при загрузке назначенных услуг:', error);
            Alert.alert('Ошибка', 'Не удалось загрузить назначенные услуги.');
        }
    };

    const handlePriceChange = (price) => {
        const numericPrice = Number(price);
        if (isNaN(numericPrice)) {
            setEditedPrice('');
        } else {
            setEditedPrice(price);
        }
    };

    const handleGeneratePDF = async () => {
        if (!orderDetails) {
            Alert.alert('Ошибка', 'Данные о заказе не загружены.');
            return;
        }

        if (assignedServices.length === 0) {
            Alert.alert('Ошибка', 'Не удалось сформировать pdf: нет назначенных услуг для данного заказа.');
            return;
        }

        try {
            const uri = await generateOrderPdf(orderDetails, assignedServices);
            setPdfUri(uri);
            setIsPdfModalVisible(true);
        } catch (error) {
            console.error('Ошибка при создании PDF:', error);
            Alert.alert('Ошибка', 'Произошла ошибка при создании PDF.');
        }
    };

    const handleSharePDF = async () => {
        if (!pdfUri) {
            Alert.alert('Ошибка', 'PDF еще не создан. Пожалуйста, сначала создайте PDF.');
            return;
        }

        try {
            await Share.share({
                url: pdfUri,
                title: 'Поделиться PDF',
                message: 'Посмотрите этот PDF файл',
            });
            setIsPdfModalVisible(false);
        } catch (error) {
            console.error('Не удалось поделиться PDF:', error);
            Alert.alert('Ошибка', 'Не удалось поделиться PDF.');
        }
    };

    const fetchOrderDetails = async () => {
        try {
            const token = await AsyncStorage.getItem('access_token_avtosat');
            const response = await fetch(`${apiUrl}/api/DetailingOrder/DetailsDetailingOrder?id=${selectedOrder.id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            setOrderDetails(data);
        } catch (error) {
            console.error('Error fetching order details:', error);
            Alert.alert('Ошибка', 'Не удалось загрузить данные о заказ-наряде.');
        }
    };

    const fetchServices = async () => {
        try {
            const token = await AsyncStorage.getItem('access_token_avtosat');
            const response = await fetch(`${apiUrl}/api/Service/GetAllServices`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            setServices(data.$values);
            console.log(userRole);
        } catch (error) {
            console.error(error);
            Alert.alert('Ошибка', 'Не удалось загрузить услуги.');
        }
    };

    const fetchPriceList = async (serviceId) => {
        try {
            setIsLoading(true);
            const token = await AsyncStorage.getItem('access_token_avtosat');
            const response = await fetch(`${apiUrl}/api/DetailingService/PriceListForService?serviceId=${serviceId}&carId=${selectedOrder.carId}&modelCarId=${selectedOrder.modelCarId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            const priceListData = data.$values || [];
            setPriceList(priceListData);

            if (priceListData.length > 0) {
                setEditedPrice(`${priceListData[0].price}`);
            } else {
                setEditedPrice('');
            }

            setIsLoading(false);

            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();

            setIsModalVisible(true);
        } catch (error) {
            console.error('Error fetching price list:', error);
            Alert.alert('Ошибка', 'Не удалось загрузить прайс -лист.');
            setIsLoading(false);
        }
    };

    const handleServicePress = async (service) => {
        setLoadingServiceId(service.id); // Устанавливаем ID услуги, которая загружается
        try {
            await fetchPriceList(service.id); // Выполняем запрос
        } finally {
            setLoadingServiceId(null); // Сбрасываем состояние после завершения загрузки
        }
        await setSelectedService(service);
        await fetchPriceList(service.id);
    };

    const handleAssignService = async () => {
        console.log('Назначить услугу вызвана'); // Логируем вызов функции
        if (Number(editedPrice) < 100) {
            Alert.alert('Ошибка', 'Цена не может быть меньше 100 ₸.');
            return;
        }

        try {
            setIsLoading(true);
            const token = await AsyncStorage.getItem('access_token_avtosat');
            const finalPrice = selectedPrice ? selectedPrice.price : Number(editedPrice);

            const response = await fetch(`${apiUrl}/api/DetailingService/CreateDetailingService`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    serviceId: selectedService.id,
                    detailingOrderId: selectedOrder.id,
                    price: finalPrice,
                    salary: finalPrice * 0.3,
                    comment: "test"
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to assign service.");
            }

            Alert.alert("Назначено ✅", "Услуга успешно назначена на заказ-наряд");
            fetchAssignedServices();
            fetchServicesTotal();
            setIsLoading(false);
            setIsModalVisible(false);
        } catch (error) {
            Alert.alert("Ошибка ❌", "Не удалось назначить услугу.");
            setIsLoading(false);
        }
    };

    const deleteAssignedService = async (serviceId) => {
        Alert.alert(
            "Подтверждение удаления",
            "Вы уверены, что хотите удалить эту услугу?",
            [
                {
                    text: "Отмена",
                    style: "cancel"
                },
                {
                    text: "Удалить",
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('access_token_avtosat');
                            const response = await fetch(`${apiUrl}/api/DetailingService/DeleteWashServiceFromOrder?id=${serviceId}`, {
                                method: 'PATCH',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                },
                            });

                            if (!response.ok) {
                                throw new Error('Failed to delete service');
                            }

                            Alert.alert('Удалено', 'Услуга успешно удалена из заказ-наряда');
                            fetchAssignedServices();
                            fetchServicesTotal();
                        } catch (error) {
                            console.error('Ошибка при удалении услуги:', error);
                            Alert.alert('Ошибка', 'Не удалось удалить услугу.');
                        }
                    }
                }
            ]
        );
    };

    const renderServiceItem = ({ item }) => (
        <TouchableOpacity onPress={() => handleServicePress(item)}>
            <View style={[styles.itemContainer, { backgroundColor: activeColors.secondary }]}>
                <View style={styles.brandContainer}>
                    <Text style={styles.brandText}>{item.name.charAt(0)}</Text>
                </View>
                <View style={styles.orderDetails}>
                    <Text style={[styles.itemName, { color: activeColors.tint }]}>{item.name}</Text>
                    <Text style={[styles.itemPrice, { color: activeColors.tint }]}>{item.price} ₸</Text>
                </View>
                <View style={styles.addIconContainer}>
                    {loadingServiceId === item.id ? (
                        <ActivityIndicator size="small" color={activeColors.accent} />
                    ) : (
                        <Ionicons name="add-circle-outline" size={30} color={activeColors.accent} />
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
    
    

    const renderAssignedServiceItem = ({ item }) => {
        if (!item || !item.serviceName || !item.price) {
            return null;
        }

        return (
            <View style={[styles.itemContainer, { backgroundColor: activeColors.secondary }]}>
                <View style={styles.brandContainer}>
                    <Text style={styles.brandText}>{item.serviceName.charAt(0)}</Text>
                </View>
                <View style={styles.orderDetails}>
                    <Text style={[styles.itemName, { color: activeColors.tint }]}>{item.serviceName}</Text>
                    <Text style={[styles.priceText, { color: activeColors.tint }]}>{item.price} ₸</Text>
                </View>
                {userRole !== 'Мастер' && (
                    <TouchableOpacity onPress={() => deleteAssignedService(item.detailingServiceId)} style={styles.addIconContainer}>
                        <Ionicons name="trash-outline" size={30} color="red" />
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderServicesTab = () => (
        <View style={{ flex: 1, backgroundColor: activeColors.primary }}>
            {services.length === 0 ? (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Ionicons name="construct-outline" size={60} color={activeColors.tint} />
        <Text style={{ color: activeColors.tint, textAlign: 'center', marginTop: 20 }}>Нет доступных услуг.</Text>
        
        <TouchableOpacity 
            onPress={() => navigation.navigate('Список')} 
            style={{ marginTop: 20, padding: 10, backgroundColor: activeColors.accent, borderRadius: 10 }}
        >
            <Text style={{ color: activeColors.primary, textAlign: 'center' }}>Создать услугу</Text>
        </TouchableOpacity>
    </View>
) : (
   <FlatList
                data={services}
                renderItem={renderServiceItem}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchServices} />}
            />
)}

        </View>
    );

    const renderAssignedServicesTab = () => (
        <View style={{ flex: 1, backgroundColor: activeColors.primary }}>
            {assignedServices.length === 0 ? (
                <View style={{ alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <Ionicons name="clipboard-outline" size={60} color={activeColors.tint} />
                    <Text style={{ color: activeColors.tint, textAlign: 'center', marginTop: 20 }}>На данном заказ-наряде нет назначенных услуг.</Text>
                </View>
            ) : (
                <FlatList
                data={assignedServices}
                renderItem={renderAssignedServiceItem}
                keyExtractor={(item) => item.detailingServiceId?.toString()}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchAssignedServices} />}
            />
            )}
        </View>
    );

    const formatPhoneNumber = (phoneNumber) => {
        if (!/^\d{11}$/.test(phoneNumber)) {
            return phoneNumber;
        }
        return `+${phoneNumber.slice(0, 1)}-${phoneNumber.slice(1, 4)}-${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7, 9)}-${phoneNumber.slice(9, 11)}`;
    };

    const renderScene = SceneMap({
        services: renderServicesTab,
        assignedServices: renderAssignedServicesTab,
    });

    return (
        <SafeAreaView style={[{ backgroundColor: activeColors.primary }, styles.container]}>
            <View style={styles.header}>
                <Ionicons name="arrow-back" size={35} color={activeColors.tint} onPress={() => navigation.navigate('Заказы')} style={styles.backButton} />
                <Text style={[styles.headerTitle, { color: activeColors.tint }]}>Заказ-наряд</Text>
                <Ionicons
                    name="document-outline"
                    size={30}
                    color={activeColors.tint}
                    style={styles.pdfIcon}
                    onPress={handleGeneratePDF}
                />
            </View>

            {orderDetails ? (
  <View style={[styles.orderDetailsCard, { backgroundColor: activeColors.secondary }]}>
    <View style={styles.detailRow}>
      <Ionicons name="car-outline" size={24} color={activeColors.tint} />
      <Text style={[styles.detailText, { color: activeColors.tint }]}>
        Гос. номер: {orderDetails?.carNumber ?? 'Не указано'}
      </Text>
    </View>
    <View style={styles.detailRow}>
      <Ionicons name="clipboard-outline" size={24} color={activeColors.tint} />
      <Text style={[styles.detailText, { color: activeColors.tint }]}>
        Машина: {orderDetails?.car?.name ?? 'Не указано'} {orderDetails?.modelCar?.name ?? 'Не указано'}
      </Text>
    </View>
    <View style={styles.detailRow}>
      <Ionicons name="person-outline" size={24} color={activeColors.tint} />
      <Text style={[styles.detailText, { color: activeColors.tint }]}>
        Клиент: {formatPhoneNumber(orderDetails?.phoneNumber ?? 'Не указано')}
      </Text>
    </View>
    <View style={styles.detailRow}>
      <Ionicons name="chatbubble-outline" size={24} color={activeColors.tint} />
      <Text style={[styles.detailText, { color: activeColors.tint }]}>
        Комментарий: {orderDetails?.comment ?? 'Нет комментария'}
      </Text>
    </View>
    <View style={styles.detailRow}>
      <Ionicons name="pricetag-outline" size={24} color={activeColors.tint} />
      <Text style={[styles.detailTotal, { color: activeColors.accent }]}>
        Итоговая сумма: {servicesTotal} ₸
      </Text>
    </View>
  </View>
) : (
  <ActivityIndicator size="large" color={activeColors.accent} />
)}



            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                initialLayout={initialLayout}
                renderTabBar={(props) => (
                    <TabBar
                        {...props}
                        indicatorStyle={{ backgroundColor: activeColors.accent }}
                        style={{ backgroundColor: activeColors.primary }}
                        labelStyle={{ color: activeColors.tint }}
                    />
                )}
            />

            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <SafeAreaView style={styles.modalBackdrop}>
                    <View style={[styles.modalContainer, { backgroundColor: activeColors.primary }]}>
                        <Text style={[styles.modalTitle, { color: activeColors.tint }]}>Выбранная услуга: {selectedService?.name}</Text>
                        {isLoading ? (
                            <ActivityIndicator size="large" color={activeColors.accent} />
                        ) : (
                            <>
                                <TextInput
                                    style={[styles.modalInput, { borderColor: activeColors.accent, color: activeColors.tint }]}
                                    placeholder="Введите свою цену"
                                    placeholderTextColor={activeColors.tint}
                                    keyboardType="numeric"
                                    value={editedPrice}
                                    onChangeText={handlePriceChange}
                                />
                                <Text style={[styles.modalLabel, { color: activeColors.tint }]}>Или выберите из истории цен:</Text>

                                <FlatList
                                    data={priceList}
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            onPress={() => {
                                                setSelectedPrice(item);
                                                setEditedPrice(`${item.price}`);
                                            }}
                                            style={[styles.priceItem, selectedPrice?.id === item.id ? styles.selectedPriceItem : null, { backgroundColor: activeColors.secondary }]}
                                        >
                                            <Text style={[styles.priceText, { color: activeColors.tint }]}>{item.price} ₸</Text>
                                        </TouchableOpacity>
                                    )}
                                    keyExtractor={(item) => item.id.toString()}
                                    style={{ maxHeight: 200 }}
                                />

                                <TouchableOpacity onPress={handleAssignService} style={[styles.saveButton, { backgroundColor: activeColors.accent }]}>
                                    <Text style={{ color: activeColors.primary }}>Назначить услугу</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setIsModalVisible(false)} style={[styles.cancelButton, { backgroundColor: activeColors.secondary }]}>
                                    <Text style={{ color: activeColors.tint }}>Отмена</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </SafeAreaView>
            </Modal>

            <Modal
                visible={isPdfModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsPdfModalVisible(false)}
            >
                <SafeAreaView style={styles.modalBackdrop}>
                    <View style={[styles.modalContainer, { backgroundColor: activeColors.primary }]}>
                        <Text style={[styles.modalTitle, { color: activeColors.tint }]}>Документ успешно создан ✅</Text>
                        <TouchableOpacity onPress={handleSharePDF} style={[styles.saveButton, { backgroundColor: activeColors.accent }]}>
                            <Text style={{ color: activeColors.primary }}>Поделиться</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setIsPdfModalVisible(false)} style={[styles.cancelButton, { backgroundColor: activeColors.secondary }]}>
                            <Text style={{ color: activeColors.tint }}>Закрыть</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
            {userRole !== 'Мастер' && (
                <DetailingPaymentSlider
                    selectedOrder={selectedOrder}
                    onComplete={handleCompleteOrder}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    backButton: {
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        flex: 1,
    },
    orderDetailsSection: {
        marginTop: 10,
        padding: 15,
        borderRadius: 15,
        marginHorizontal: 20,
        elevation: 3,
      },
      totalSummText: {
        fontsize: 16,
        marginLeft: 180
      },
      orderDetailText: {
        fontSize: 16,
        marginBottom: 5,
      },
      detailText: {
        fontSize: 16,
        marginLeft: 10,
      },
      detailTotal: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
      },
      orderDetailTotal: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 10,
        textAlign: 'center',
      },
    pdfIcon: {
        marginRight: 10,
    },
    orderDetailsCard: {
        margin: 20,
        padding: 15,
        borderRadius: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
    orderDetailsHeader: {
        padding: 20,
        borderBottomWidth: 1,
        borderColor: '#ddd',
    },
    orderText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        marginVertical: 5,
        marginHorizontal: 10,
        borderRadius: 10,
        elevation: 2,
    },
    brandContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#1DA1F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    brandText: {
        fontSize: 18,
        color: '#fff',
        fontWeight: 'bold',
    },
    orderDetails: {
        flex: 1,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
      },
    itemName: {
        fontSize: 19,
        fontWeight: 'bold',
    },
    itemPrice: {
        fontSize: 17,
    },
    addIconContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalBackdrop: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: '90%',
        padding: 20,
        borderRadius: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    modalInput: {
        height: 40,
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginVertical: 10,
    },
    modalLabel: {
        fontSize: 16,
        marginBottom: 10,
    },
    priceItem: {
        padding: 15,
        marginVertical: 7,
        borderRadius: 15,
        borderWidth: 1,
        backgroundColor: '#2a2a2a',
    },
    selectedPriceItem: {
        borderColor: '#ff6347',
        backgroundColor: '#444',
    },
    priceText: {
        fontSize: 18,
    },
    saveButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    cancelButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
});

export default AssignServiceScreen;

