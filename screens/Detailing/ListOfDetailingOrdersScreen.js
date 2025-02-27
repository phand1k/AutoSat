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
import { Animated } from 'react-native';
import getEnvVars from '../config';

const { apiUrl } = getEnvVars();
const scaleValue = new Animated.Value(1);

const ListOfDetailingOrdersScreen = () => {

  const animatePress = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start(() => {
      Animated.spring(scaleValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    });
  };
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
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [reportData, setReportData] = useState({
        cars: 15, // Количество машин в работе
        services: 42, // Количество услуг в работе
      });
      
      useEffect(() => {
        if (reportModalVisible) {
            fetchReportData(); // Загружаем реальные данные при открытии окна
        }
    }, [reportModalVisible]);
    useEffect(() => {
        const fetchUserRole = async () => {
            const role = await AsyncStorage.getItem('role_user_avtosat');
            setUserRole(role);
        };

        fetchUserRole(); // Загружаем роль пользователя при монтировании компонента
    }, []);
    const fetchReportData = useCallback(async () => {
      try {
          const carsInWork = await fetchCountOfCarsInWork();
          const servicesInWork = await fetchCountOfServicesInWork();
          const summOfCarsInWork = await fetchSummOfCarsInWork();
          const countOfNotReadyCars = await fetchCountOfNotReadyCars();
          const countOfReadyCars = await fetchCountOfReadyCars();
          setReportData({
              cars: carsInWork,
              services: servicesInWork,
              summ: summOfCarsInWork,
              countOfNotReady: countOfNotReadyCars,
              countOfReady: countOfReadyCars
          });
      } catch (error) {
          console.error('Ошибка при загрузке данных отчета:', error);
          Alert.alert('Ошибка', 'Не удалось загрузить данные отчета.');
      }
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



const fetchSummOfCarsInWork = async () => {
  try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch(`${apiUrl}/api/DetailingOrder/GetSummOfCarsInWork`, {
          headers: {
              'Authorization': `Bearer ${token}`,
          },
      });
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.text();
      return parseInt(data, 10); // Преобразуем строку в число
  } catch (error) {
      console.error('Ошибка при получении суммы машин в работе:', error);
      return 0;
  }
};

const fetchCountOfNotReadyCars = async () =>{
  try {
    const token = await AsyncStorage.getItem('access_token_avtosat');
    const response = await fetch(`${apiUrl}/api/DetailingOrder/GetCountOfNotReadyCars`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.text();
    return parseInt(data, 10); // Преобразуем строку в число
} catch (error) {
    console.error('Ошибка при получении суммы не готовых машин:', error);
    return 0;
}
}

const fetchCountOfReadyCars = async () =>{
  try {
    const token = await AsyncStorage.getItem('access_token_avtosat');
    const response = await fetch(`${apiUrl}/api/DetailingOrder/GetCountOfCarsReady`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.text();
    return parseInt(data, 10); // Преобразуем строку в число
} catch (error) {
    console.error('Ошибка при получении суммы готовых машин:', error);
    return 0;
}
}

const fetchCountOfServicesInWork = async () => {
  try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch(`${apiUrl}/api/DetailingOrder/GetCountOfServicesInWork`, {
          headers: {
              'Authorization': `Bearer ${token}`,
          },
      });
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.text();
      return parseInt(data, 10); // Преобразуем строку в число
  } catch (error) {
      console.error('Ошибка при получении количества услуг в работе:', error);
      return 0;
  }
};

const fetchCountOfCarsInWork = async () => {
  try {
      const token = await AsyncStorage.getItem('access_token_avtosat');
      const response = await fetch(`${apiUrl}/api/DetailingOrder/CountOfCarsInWork`, {
          headers: {
              'Authorization': `Bearer ${token}`,
          },
      });
      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.text();
      return parseInt(data, 10); // Преобразуем строку в число
  } catch (error) {
      console.error('Ошибка при получении количества машин в работе:', error);
      return 0;
  }
};

    const readyOrder = async (orderId) => {
      try {
        const token = await AsyncStorage.getItem('access_token_avtosat');
        const response = await fetch(`${apiUrl}/api/DetailingOrder/ReadyDetailingOrder?detailingOrderId=${orderId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.ok) {
            Alert.alert('Завершено', 'Заказ-наряд успешно завершен');
            fetchOrders(); // Обновить список заказов после удаления
        }
        else if (response.status == 400){
          Alert.alert('Ошибка', 'Нельзя завершить заказ-наряд, если не назначены услуги');
        }
        else {
          console.error(response.status);
            throw new Error('Не удалось завершить заказ-наряд');
        }
    } catch (error) {
        console.error(error);
        Alert.alert('Ошибка', 'Заказ-наряд уже завершен или не найден');
    }

    }
    const deleteOrder = async (orderId) => {
        try {
            const token = await AsyncStorage.getItem('access_token_avtosat');
            const response = await fetch(`${apiUrl}/api/DetailingOrder/DeleteDetailingOrder?id=${orderId}`, {
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
            const response = await fetch(`${apiUrl}/api/DetailingOrder/AllNotCompletedOrders`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            console.log(response);
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
            
              const sumResponse = await fetch(`${apiUrl}/api/DetailingOrder/GetSummOfDetailingServicesOnOrder?id=${resolvedOrder.id}`, {
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
                totalServices: `${sum} ₸`,
                isReady: resolvedOrder.isReady, // Добавляем поле isReady
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
          Alert.alert(
            'Завершить заказ',
            'Вы уверены, что хотите завершить этот заказ?',
            [
              { text: 'Отмена', style: 'cancel' },
              { text: 'Завершить', style: 'destructive', onPress: () => readyOrder(item.id) }
            ]
          );
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
        <TouchableOpacity 
          onPress={() => {
            animatePress();
            openAssignServiceScreen(item);
          }}
          style={[styles.itemContainer, { 
            backgroundColor: activeColors.secondary, 
            transform: [{ scale: scaleValue }] 
          }]}
        >
          {renderBrandInitials(item.brand)}
          <View style={styles.orderDetails}>
            <StyledText style={styles.itemName}>{item.name}</StyledText>
            <StyledText style={styles.itemDescription}>{item.carNumber}</StyledText>
            <StyledText style={styles.totalTime}>{item.totalServices}</StyledText>
            <View style={styles.createdInfo}>
              <StyledText style={styles.itemTimeAgo}>Создано: {item.timeAgo} назад</StyledText>
            </View>
            {item.isReady ? (
              <View style={[styles.statusBadge, styles.readyBadge]}>
                <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                <Text style={styles.statusText}>Готов</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, styles.inProgressBadge]}>
                <Ionicons name="time-outline" size={20} color="#FFA500" />
                <Text style={styles.statusText}>В работе</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
    
    

    return (
        <View style={[{ backgroundColor: activeColors.primary }, styles.container]}>
            {/* Заголовок, поиск и список */}
            <View style={styles.header}>
  <Text style={[styles.headerTitle, { color: activeColors.tint }]}>
    Машины в работе
  </Text>
  <TouchableOpacity
    style={[styles.headerReportButton, { backgroundColor: activeColors.accent }]}
    onPress={() => setReportModalVisible(true)}
  >
    <Ionicons name="pulse-outline" size={20} color={activeColors.primary} />
    <Text style={[styles.headerReportText, { color: activeColors.primary }]}>Текущий</Text>
  </TouchableOpacity>
</View>
<Modal
  visible={reportModalVisible}
  transparent={true}
  animationType="fade"
  onRequestClose={() => setReportModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={[styles.reportModalContainer, { backgroundColor: activeColors.primary }]}>
      {/* Верхняя часть с иконкой */}
      <View style={styles.modalHeader}>
        <Ionicons
          name="pulse-outline"
          size={50}
          color={activeColors.accent}
          style={styles.reportIcon}
        />
        <StyledText style={[styles.modalTitle, { color: activeColors.tint }]}>
          Отчет по текущей работе
        </StyledText>
      </View>

      {/* Контент */}
      <View style={styles.reportContent}>
      <View style={styles.reportRow}>
          <Ionicons
            name="cash-outline"
            size={30}
            color={activeColors.accent}
            style={styles.reportRowIcon}
          />
          <Text style={[styles.reportRowText, { color: activeColors.tint }]}>
            Сумма услуг: <Text style={styles.reportHighlight}>{reportData.summ} ₸</Text>
          </Text>
        </View>
        
        <View style={styles.reportRow}>
          <Ionicons
            name="car-outline"
            size={30}
            color={activeColors.accent}
            style={styles.reportRowIcon}
          />
          <Text style={[styles.reportRowText, { color: activeColors.tint }]}>
            Машин в работе: <Text style={styles.reportHighlight}>{reportData.cars}</Text>
          </Text>
        </View>

        <View style={styles.reportRow}>
          <Ionicons
            name="car-outline"
            size={30}
            color={activeColors.accent}
            style={styles.reportRowIcon}
          />
          <Text style={[styles.reportRowText, { color: activeColors.tint }]}>
            Готовые машины: <Text style={styles.reportHighlight}>{reportData.countOfNotReady}</Text>
          </Text>
        </View>
        
        <View style={styles.reportRow}>
          <Ionicons
            name="car-outline"
            size={30}
            color={activeColors.accent}
            style={styles.reportRowIcon}
          />
          <Text style={[styles.reportRowText, { color: activeColors.tint }]}>
            Машины в работе: <Text style={styles.reportHighlight}>{reportData.countOfReady}</Text>
          </Text>
        </View>


        
        <View style={styles.reportRow}>
          <Ionicons
            name="construct-outline"
            size={30}
            color={activeColors.accent}
            style={styles.reportRowIcon}
          />
          <Text style={[styles.reportRowText, { color: activeColors.tint }]}>
            Услуг в работе: <Text style={styles.reportHighlight}>{reportData.services}</Text>
          </Text>
        </View>

      </View>

      {/* Кнопка закрытия */}
      <TouchableOpacity
        style={[styles.closeButton, { backgroundColor: activeColors.accent }]}
        onPress={() => setReportModalVisible(false)}
      >
        <Ionicons name="close-outline" size={24} color={activeColors.primary} />
        <Text style={[styles.closeButtonText, { color: activeColors.primary }]}>Закрыть</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

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
    ListEmptyComponent={
        <View style={styles.noOrdersContainer}>
            <Ionicons name="clipboard-outline" size={60} color={activeColors.tint} />
            <Text style={[styles.noOrdersText, { color: activeColors.tint }]}>
                Нет заказов
            </Text>
            <Text style={[styles.noOrdersSubtext, { color: activeColors.tint }]}>
                Попробуйте обновить или создать новый заказ
            </Text>
        </View>
    }
    refreshControl={
        <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchOrders}
            tintColor={activeColors.tint}
        />
    }
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
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Тёмный полупрозрачный фон
      },
      reportModalContainer: {
        width: '85%',
        borderRadius: 20,
        padding: 20,
        backgroundColor: '#fff', // Основной фон карточки
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10, // Тень для Android
      },
      modalHeader: {
        alignItems: 'center',
        marginBottom: 20,
      },
      modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10,
      },
      reportContent: {
        marginTop: 10,
      },
      reportRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
      },
      reportRowIcon: {
        marginRight: 10,
      },
      reportRowText: {
        fontSize: 18,
      },
      reportHighlight: {
        fontWeight: 'bold',
        color: '#007BFF',
      },
      readyBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.2)', // Полупрозрачный зеленый фон
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
      },
      statusBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
      },
      readyBadge: {
        backgroundColor: 'rgba(76, 175, 80, 0.2)', // Полупрозрачный зеленый фон
      },
      inProgressBadge: {
        backgroundColor: 'rgba(255, 165, 0, 0.2)', // Полупрозрачный оранжевый фон
      },
      statusText: {
        fontSize: 14,
        marginLeft: 5,
        fontWeight: 'bold',
      },
      readyText: {
        color: '#4CAF50',
        fontSize: 14,
        marginLeft: 5,
        fontWeight: 'bold',
      },
      closeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginTop: 20,
      },
      closeButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
      },noOrdersContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    noOrdersText: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 10,
    },
    noOrdersSubtext: {
        fontSize: 16,
        marginTop: 5,
        textAlign: 'center',
        paddingHorizontal: 20,
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
    headerReportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        borderRadius: 10,
        marginLeft: 10,
      },
      headerReportText: {
        fontSize: 14,
        fontWeight: 'bold',
        marginLeft: 5,
      },
      reportModalContainer: {
        width: '80%',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        elevation: 10,
      },
      reportContent: {
        marginTop: 20,
        alignItems: 'center',
      },
      reportText: {
        fontSize: 18,
        marginBottom: 10,
      },
      closeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
        marginTop: 20,
      },
      closeButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 5,
        color: '#fff',
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
