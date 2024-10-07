import React, { useContext, useState, useEffect, useCallback } from "react";
import { View, TextInput, Modal, RefreshControl, FlatList, TouchableOpacity, StyleSheet, Text, Alert } from "react-native";
import { ThemeContext } from "../../context/ThemeContext";
import { colors } from "../../config/theme";
import StyledText from "../../components/texts/StyledText";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Swipeable } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
const ListOfDetailingOrdersScreen = () => {
    const { theme } = useContext(ThemeContext);
    const activeColors = colors[theme.mode] || colors.light;
    const navigation = useNavigation();
    const [confirmActionVisible, setConfirmActionVisible] = useState(false);
    const [confirmActionType, setConfirmActionType] = useState(null); // Тип действия ('delete' или 'complete')
    const [confirmOrderId, setConfirmOrderId] = useState(null);
    const [openSwipeableRef, setOpenSwipeableRef] = useState(null); // Ссылка на открытый свайп
    const [userRole, setUserRole] = useState(null); // Состояние для роли пользователя
    const [refreshing, setRefreshing] = useState(false);
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        const fetchUserRole = async () => {
            const role = await AsyncStorage.getItem('role_user_avtosat');
            setUserRole(role);
        };

        fetchUserRole(); // Загружаем роль пользователя при монтировании компонента
    }, []);

    const renderConfirmActionModal = () => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={confirmActionVisible}
    onRequestClose={() => {
      setConfirmActionVisible(false);
      if (openSwipeableRef) {
        openSwipeableRef.close();  // Возвращаем свайп к исходному состоянию
        setOpenSwipeableRef(null);
      }
    }}
  >
    <View style={styles.modalOverlay}>
      <View style={[styles.confirmModalView, { backgroundColor: activeColors.primary }]}>
        <Ionicons
          name={confirmActionType === 'complete' ? "checkmark-circle-outline" : "trash-outline"}
          size={60}
          color={confirmActionType === 'complete' ? "#4CAF50" : "#f44336"}
          style={styles.confirmIcon}
        />
        
        <StyledText style={[styles.confirmModalTitle, { color: activeColors.tint }]}>
          {confirmActionType === 'complete' ? 'Завершить заказ?' : 'Удалить заказ?'}
        </StyledText>
        <StyledText style={[styles.confirmModalSubtitle, { color: activeColors.tint }]}>
          {confirmActionType === 'complete'
            ? 'Вы уверены, что хотите завершить этот заказ? Это действие нельзя отменить.'
            : 'Вы уверены, что хотите удалить этот заказ? Это действие нельзя отменить.'}
        </StyledText>
        <View style={styles.confirmModalButtonContainer}>
          <TouchableOpacity
            style={[styles.confirmModalButton, { backgroundColor: '#007bff' }]} // Синий цвет для кнопки "Да"
            onPress={() => {
              if (confirmActionType === 'complete') {
                handleToggleSwitch(confirmOrderId, true);  // Завершение заказа
              } else if (confirmActionType === 'delete') {
                handleDeleteOrder(confirmOrderId);  // Удаление заказа
              }
              setConfirmActionVisible(false);
              setOpenSwipeableRef(null);
            }}
          >
            <Ionicons name="checkmark" size={24} color="#fff" />
            <Text style={styles.confirmModalButtonText}>Да</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.confirmModalButton, styles.confirmModalCancelButton]}
            onPress={() => {
              setConfirmActionVisible(false);
              if (openSwipeableRef) {
                openSwipeableRef.close();  // Возвращаем свайп к исходному состоянию
                setOpenSwipeableRef(null);
              }
            }}
          >
            <Ionicons name="close" size={24} color="#fff" />
            <Text style={styles.confirmModalButtonText}>Отмена</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

    const deleteOrder = async (orderId) => {
        try {
            const token = await AsyncStorage.getItem('access_token_avtosat');
            const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/DetailingOrder/DeleteDetailingOrder?id=${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
    
            if (response.ok) {
                Alert.alert('Удалено', 'Заказ-наряд успешно удален');
                fetchOrders(); // Обновить список заказов после удаления
            } else {
                throw new Error('Не удалось удалить заказ-наряд');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Ошибка', 'Произошла ошибка при удалении заказа-наряда');
        }
    };
    
    const fetchOrders = useCallback(async () => {
        try {
            setRefreshing(true);
            const token = await AsyncStorage.getItem('access_token_avtosat');
            const response = await fetch('https://avtosat-001-site1.ftempurl.com/api/DetailingOrder/AllNotCompletedOrders', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 403) {
                    Alert.alert('Истекла подписка', 'Истек срок действия подписки');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const idMap = {};
            data.$values.forEach(item => {
                idMap[item.$id] = item;
                if (item.car) idMap[item.car.$id] = item.car;
                if (item.modelCar) idMap[item.modelCar.$id] = item.modelCar;
            });

            const resolveReferences = (obj) => {
                if (obj && obj.$ref) {
                    return resolveReferences(idMap[obj.$ref]);
                }
                if (typeof obj === 'object') {
                    for (let key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            obj[key] = resolveReferences(obj[key]);
                        }
                    }
                }
                return obj;
            };

            const ordersData = await Promise.all(data.$values.map(async order => {
                const resolvedOrder = resolveReferences(order);
                const car = resolvedOrder.car || {};
                const modelCar = resolvedOrder.modelCar || {};

                const sumResponse = await fetch(`https://avtosat-001-site1.ftempurl.com/api/DetailingOrder/GetSummOfDetailingServicesOnOrder?id=${resolvedOrder.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const sum = await sumResponse.text();

                return {
                    id: resolvedOrder.id,
                    name: `${car.name || 'Неизвестная марка'} ${modelCar.name || 'Неизвестная модель'}`,
                    carNumber: resolvedOrder.carNumber,
                    carId: resolvedOrder.carId,
                    modelCarId: resolvedOrder.modelCarId,
                    brand: car.name || 'Неизвестно',
                    model: modelCar.name || 'Неизвестно',
                    timeAgo: formatDistanceToNow(parseISO(resolvedOrder.dateOfCreated), { locale: ru }),
                    totalServices: `${sum} тенге`,
                    status: 'В работе', // Тестовые данные
                };
            }));

            setOrders(ordersData);
            setFilteredOrders(ordersData);
        } catch (error) {
            console.error(error);
            Alert.alert('Ошибка', 'Не удалось загрузить заказы.');
        } finally {
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleSearch = (text) => {
        setFilteredOrders(
            orders.filter(order =>
                order.name.toLowerCase().includes(text.toLowerCase()) ||
                order.carNumber.toLowerCase().includes(text.toLowerCase())
            )
        );
    };

    const openAssignServiceScreen = (order) => {
        navigation.navigate('AssignService', { selectedOrder: order });
    };

    const renderBrandInitials = (brand) => {
        const initials = brand ? brand.substring(0, 3).toUpperCase() : "UNK";
        return (
            <View style={[styles.iconContainer, { backgroundColor: activeColors.accent }]}>
                <Text style={styles.iconText}>{initials}</Text>
            </View>
        );
    };

    const renderOrderItem = ({ item }) => (
        <Swipeable
            renderLeftActions={() => (
                <View style={styles.swipeActionComplete}>
                    <Text style={styles.swipeActionText}>Завершить</Text>
                </View>
            )}
            renderRightActions={() => (
                <View style={styles.swipeActionDelete}>
                    <Text style={styles.swipeActionText}>Удалить</Text>
                </View>
            )}
            onSwipeableLeftOpen={() => {
                console.log("Swipe left detected");
                setConfirmOrderId(item.id); // Сохраняем ID заказа
                setConfirmActionType('complete'); // Указываем, что действие — завершение заказа
                setConfirmActionVisible(true); // Отображаем модальное окно
            }}
            
            onSwipeableRightOpen={() => 
                Alert.alert(
                    'Удалить заказ',
                    'Вы уверены, что хотите удалить этот заказ?',
                    [
                        { text: 'Отмена', style: 'cancel' },
                        { text: 'Удалить', style: 'destructive', onPress: () => deleteOrder(item.id) }
                    ]
                )
            }
        >
            <TouchableOpacity onPress={() => openAssignServiceScreen(item)} style={[styles.itemContainer, { backgroundColor: activeColors.secondary }]}>
                {renderBrandInitials(item.brand)}
                <View style={styles.orderDetails}>
                    <StyledText style={styles.itemName}>{item.name}</StyledText>
                    <StyledText style={styles.itemDescription}>{item.carNumber}</StyledText>
                    <StyledText style={styles.totalTime}>{item.totalServices}</StyledText>
                    <StyledText style={styles.itemStatus}>{item.status}</StyledText>
                    <View style={styles.createdInfo}>
                        <StyledText style={styles.itemTimeAgo}>Создано: {item.timeAgo} назад</StyledText>
                    </View>
                </View>
            </TouchableOpacity>
        </Swipeable>
    );
    const handleToggleSwitch = async (orderId, isCompleted) => {
        if (isCompleted) {
            try {
                const token = await AsyncStorage.getItem('access_token_avtosat');
                const response = await fetch(`https://avtosat-001-site1.ftempurl.com/api/DetailingOrder/ReadyDetailingOrder?detailingOrderId=${orderId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
    
                if (response.ok) {
                    Alert.alert('Успех', 'Заказ-наряд успешно завершён');
                    fetchOrders(); // Обновить список заказов после завершения
                } else {
                    throw new Error('Не удалось завершить заказ-наряд');
                }
            } catch (error) {
                console.error(error);
                Alert.alert('Ошибка', 'Произошла ошибка при завершении заказа-наряда');
            }
        }
    };
    
    
    

    return (
        <View style={[{ backgroundColor: activeColors.primary }, styles.container]}>
            {/* Заголовок, поиск и список */}
            <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: activeColors.tint }]}>Заказы на детейлинг</Text>
            </View>
            <TextInput
                style={[styles.searchBox, { backgroundColor: activeColors.secondary, borderColor: activeColors.secondary, color: activeColors.tint }]}
                onChangeText={handleSearch}
                placeholder="Поиск"
                placeholderTextColor={activeColors.tint}
                clearButtonMode="while-editing"
            />
            <FlatList
                data={filteredOrders}
                renderItem={renderOrderItem}
                keyExtractor={(item) => item.id.toString()}
                style={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchOrders} tintColor={activeColors.tint} />}
            />
            {userRole !== 'Мастер' && (
                <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.reportButton, { backgroundColor: activeColors.accent }]}
                    onPress={() => navigation.navigate('CompletedDetailingOrders')}
                >
                    <Ionicons name="bar-chart-outline" size={15} color={activeColors.primary} style={styles.reportIcon} />
                    
                    <Text style={[styles.reportButtonText, { color: activeColors.primary }]}>Отчет</Text>
                </TouchableOpacity>
                {renderConfirmActionModal()}
            </View>
            )}
            
    
            {/* Модальное окно для выбора типа оплаты */}
            <Modal
            visible={isPaymentModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setIsPaymentModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.paymentModalContainer, { backgroundColor: activeColors.primary }]}>
                    <Ionicons
                        name="card-outline"
                        size={40}
                        color={activeColors.accent}
                        style={styles.paymentIcon}
                    />
                    <StyledText style={[styles.modalTitle, { color: activeColors.tint }]}>Выберите способ оплаты</StyledText>
                    
                    <TouchableOpacity
                        style={[styles.paymentOption, { backgroundColor: '#f1c40f' }]}
                        onPress={() => {
                            setIsPaymentModalVisible(false);
                            Alert.alert('Оплата наличными выбрана');
                        }}
                    >
                        <Ionicons name="cash-outline" size={24} color={activeColors.primary} />
                        <Text style={[styles.paymentOptionText, { color: activeColors.primary }]}>Наличный</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={[styles.paymentOption, { backgroundColor: '#3498db' }]}
                        onPress={() => {
                            setIsPaymentModalVisible(false);
                            Alert.alert('Безналичный расчёт выбран');
                        }}
                    >
                        <Ionicons name="card-outline" size={24} color={activeColors.primary} />
                        <Text style={[styles.paymentOptionText, { color: activeColors.primary }]}>Безналичный</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={[styles.paymentOption, { backgroundColor: '#2ecc71' }]}
                        onPress={() => {
                            setIsPaymentModalVisible(false);
                            Alert.alert('Смешанная оплата выбрана');
                        }}
                    >
                        <Ionicons name="wallet-outline" size={24} color={activeColors.primary} />
                        <Text style={[styles.paymentOptionText, { color: activeColors.primary }]}>Смешанная оплата</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={[styles.paymentOption, { backgroundColor: '#e74c3c' }]}
                        onPress={() => setIsPaymentModalVisible(false)}
                    >
                        <Ionicons name="close-circle-outline" size={24} color={activeColors.primary} />
                        <Text style={[styles.paymentOptionText, { color: activeColors.primary }]}>Отмена</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
        </View>
    );
    
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        paddingTop: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    searchBox: {
        height: 50,
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 15,
        marginVertical: 15,
        fontSize: 18,
    },
    list: {
        flex: 1,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 10,
        marginVertical: 5,
        marginHorizontal: 10,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    orderDetails: {
        flex: 1,
        marginLeft: 10,
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    itemDescription: {
        fontSize: 14,
    },
    totalTime: {
        fontSize: 20,
        color: '#007bff',
    },
    itemStatus: {
        fontSize: 14,
        color: '#007bff',
        marginTop: 5,
    },
    createdInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemTimeAgo: {
        fontSize: 12,
        color: '#888',
    },
    reportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginHorizontal: 10,
        marginVertical: 15,
        elevation: 3, // Добавление тени для кнопки
      },
      modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    paymentModalContainer: {
        width: '80%',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        elevation: 10,
    },
    paymentIcon: {
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    paymentOption: {
        width: '100%',
        padding: 15,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginVertical: 10,
    },
    paymentOptionText: {
        fontSize: 18,
        marginLeft: 10,
        fontWeight: '500',
    },
    cancelButton: {
        marginTop: 20,
        backgroundColor: '#f44336',
    },
    reportButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
      },
    
      reportIcon: {
        marginRight: 10,
      },
    swipeActionComplete: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
        backgroundColor: 'green',
        marginVertical: 5,
        borderRadius: 10,
    },
    swipeActionDelete: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
        backgroundColor: 'red',
        marginVertical: 5,
        borderRadius: 10,
    },
    swipeActionText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
      },
    iconText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default ListOfDetailingOrdersScreen;
