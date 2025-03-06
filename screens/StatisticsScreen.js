import React, { useState, useEffect, useContext } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemeContext } from "../context/ThemeContext";
import { colors } from "../config/theme";
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get("window");

const StatisticsScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];
  const [revenue, setRevenue] = useState(null);
  const [servicesData, setServicesData] = useState([]);
  const [carsData, setCarsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllServices, setShowAllServices] = useState(false); // Для "Распределение услуг"
  const [showAllCars, setShowAllCars] = useState(false); // Для "Популярные машины"
  const daysOfWeekTranslation = {
    Monday: "Понедельник",
    Tuesday: "Вторник",
    Wednesday: "Среда",
    Thursday: "Четверг",
    Friday: "Пятница",
    Saturday: "Суббота",
    Sunday: "Воскресенье",
  };
  const [busiestDays, setBusiestDays] = useState({});
  const [clientStatistics, setClientStatistics] = useState({
    newClientsCount: 0,
    activeClientsCount: 0,
    averageCheck: 0,
    visitFrequency: 0,
  });

  useEffect(() => {
    const fetchClientStatistics = async () => {
      try {
        const token = await AsyncStorage.getItem("access_token_avtosat");
        const SatApiURL = await AsyncStorage.getItem("SatApiURL");
        const cleanedSatApiURL = SatApiURL.trim();
  
        const response = await fetch(`${cleanedSatApiURL}/api/Marketing/ClientStatistics`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (!response.ok) {
          throw new Error("Ошибка при загрузке данных");
        }
  
        const data = await response.json();
        setClientStatistics(data);
      } catch (error) {
        console.error("Ошибка при загрузке статистики по клиентам:", error);
        Alert.alert("Ошибка", "Не удалось загрузить данные о клиентах.");
      }
    };
  
    fetchClientStatistics();
  }, []);



  useEffect(() => {
    const loadRevenue = async () => {
      const revenueData = await fetchRevenue();
      if (revenueData !== null) {
        setRevenue(revenueData);
      }
    };
  
    loadRevenue();
  }, []);

useEffect(() => {
  const fetchBusiestDays = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token_avtosat");
      const SatApiURL = await AsyncStorage.getItem("SatApiURL");
      const cleanedSatApiURL = SatApiURL.trim();

      const response = await fetch(`${cleanedSatApiURL}/api/Marketing/BusiestDays`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Ошибка при загрузке данных");
      }

      const data = await response.json();
      setBusiestDays(data);
    } catch (error) {
      console.error("Ошибка при загрузке данных о загруженности:", error);
      Alert.alert("Ошибка", "Не удалось загрузить данные о загруженности.");
    }
  };

  fetchBusiestDays();
}, []);


const fetchRevenue = async () => {
  try {
    const token = await AsyncStorage.getItem("access_token_avtosat");
    const SatApiURL = await AsyncStorage.getItem("SatApiURL");
    const cleanedSatApiURL = SatApiURL.trim();

    const response = await fetch(`${cleanedSatApiURL}/api/Marketing/GetRevenue`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Ошибка при загрузке данных");
    }

    const revenue = await response.json();
    return revenue; // Возвращаем значение выручки
  } catch (error) {
    console.error("Ошибка при загрузке выручки:", error);
    Alert.alert("Ошибка", "Не удалось загрузить данные о выручке.");
    return null; // Возвращаем null в случае ошибки
  }
};

  // Функция для получения данных о популярных услугах
  const fetchPopularServices = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token_avtosat");
      const SatApiURL = await AsyncStorage.getItem("SatApiURL");
      const cleanedSatApiURL = SatApiURL.trim();

      const response = await fetch(
        `${cleanedSatApiURL}/api/Marketing/MostPopularServices`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Ошибка при загрузке данных");
      }

      const data = await response.json();
      setServicesData(data.$values);
    } catch (error) {
      console.error("Ошибка при загрузке популярных услуг:", error);
      Alert.alert("Ошибка", "Не удалось загрузить данные о популярных услугах.");
    }
  };

  // Функция для получения данных о популярных машинах
  const fetchPopularCars = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token_avtosat");
      const SatApiURL = await AsyncStorage.getItem("SatApiURL");
      const cleanedSatApiURL = SatApiURL.trim();

      const response = await fetch(
        `${cleanedSatApiURL}/api/Marketing/MostPopularCars`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Ошибка при загрузке данных");
      }

      const data = await response.json();
      setCarsData(data.$values);
    } catch (error) {
      console.error("Ошибка при загрузке популярных машин:", error);
      Alert.alert("Ошибка", "Не удалось загрузить данные о популярных машинах.");
    }
  };

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchPopularServices();
      await fetchPopularCars();
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Если данные загружаются, показываем индикатор загрузки
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: activeColors.primary }]}>
        <ActivityIndicator size="large" color={activeColors.tint} />
      </View>
    );
  }

  // Функция для округления процентов
  const formatPercentage = (percentage) => {
    return `${parseFloat(percentage).toFixed(1)}%`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: activeColors.primary }]}>
      {/* Заголовок и кнопка "Назад" */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={activeColors.tint} style={styles.backButton} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: activeColors.tint }]}>Статистика</Text>
      </View>

      {/* Основной контент */}
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Карточка с популярным сервисом */}
        
        <View style={[styles.card, { backgroundColor: activeColors.secondary }]}>
          <LinearGradient colors={["#99999e", "#c1c1c9"]} style={styles.gradient}>
            <Text style={styles.cardTitle}>Самый популярный сервис</Text>
            <Text style={styles.cardValue}>
              {servicesData.length > 0 ? servicesData[0].name : "Нет данных"}
            </Text>
            <Text style={styles.cardSubtitle}>
              {servicesData.length > 0
                ? `${formatPercentage(servicesData[0].usagePercent)} использований`
                : "Нет данных"}
            </Text>
          </LinearGradient>
        </View>

        {/* Карточка с общей выручкой */}
        <Animatable.View 
  animation="fadeInUp" 
  duration={1000} 
  delay={200} 
  useNativeDriver
>
  <Animatable.View 
    animation="pulse" 
    iterationCount="infinite" 
    duration={2000} 
    useNativeDriver
  >
        <View style={[styles.card, { backgroundColor: activeColors.secondary }]}>
         <LinearGradient colors={["#007bff", "#1a70d9"]} style={styles.gradient}>
  <Text style={styles.cardTitle}>Общая выручка</Text>
  <Text style={styles.cardValue}>
    {revenue !== null ? `${revenue} ₸` : "Нет данных"}
  </Text>
  <Text style={styles.cardSubtitle}>За последний месяц</Text>
</LinearGradient>
        </View>
        </Animatable.View>
        </Animatable.View>
        {/* Секция с распределением услуг */}
        
        <View style={[styles.card, { backgroundColor: activeColors.secondary }]}>
  <Text style={[styles.sectionHeader, { color: activeColors.tint }]}>Распределение услуг</Text>
  <View style={styles.servicesList}>
    {servicesData
      .slice(0, showAllServices ? servicesData.length : 5) // Отображаем первые 5 или все элементы
      .map((service, index) => (
        <View key={index} style={styles.serviceItem}>
          <View style={[styles.serviceIcon, { backgroundColor: "#007bff" }]} />
          <Text style={[styles.serviceName, { color: activeColors.tint }]}>{service.name}</Text>
          <Text style={[styles.servicePercentage, { color: activeColors.tint }]}>
            {formatPercentage(service.usagePercent)}
          </Text>
        </View>
      ))}
  </View>
  {servicesData.length > 5 && ( // Показываем кнопку, если элементов больше 5
    <TouchableOpacity
      onPress={() => setShowAllServices(!showAllServices)}
      style={styles.showMoreButton}
    >
      <Text style={[styles.showMoreText, { color: activeColors.tint }]}>
        {showAllServices ? "Свернуть" : "Показать все"}
      </Text>
    </TouchableOpacity>
  )}
</View>

        {/* Секция с популярными машинами */}
         <View style={[styles.card, { backgroundColor: activeColors.secondary }]}>
           <Text style={[styles.sectionHeader, { color: activeColors.tint }]}>Популярные машины</Text>
            <View style={styles.popularCars}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableColumn, { color: activeColors.tint }, { flex: 2, fontWeight: "bold" }]}>Машина</Text>
      <Text style={[styles.tableColumn, { color: activeColors.tint }, { flex: 1, fontWeight: "bold" }]}>Процент</Text>
      <Text style={[styles.tableColumn, { color: activeColors.tint }, { flex: 1, fontWeight: "bold" }]}>Кол-во</Text>
    </View>
    {carsData
      .slice(0, showAllCars ? carsData.length : 5) // Отображаем первые 5 или все элементы
      .map((car, index) => (
        <View key={index} style={styles.tableRow}>
          <Text style={[styles.serviceIcon, { backgroundColor: "#99999e" }]} />
          <Text style={[styles.tableColumn, { color: activeColors.tint }, { flex: 2 }]}>{car.carName}</Text>
          <Text style={[styles.tableColumn, { color: activeColors.tint }, { flex: 1 }]}>{formatPercentage(car.usagePercent)}</Text>
          <Text style={[styles.tableColumn, { color: activeColors.tint }, { flex: 1 }]}>{car.count}</Text>
        </View>
      ))}
  </View>
  {carsData.length > 5 && ( // Показываем кнопку, если элементов больше 5
    <TouchableOpacity
      onPress={() => setShowAllCars(!showAllCars)}
      style={styles.showMoreButton}
    >
      <Text style={[styles.showMoreText, { color: activeColors.tint }]}>
        {showAllCars ? "Свернуть" : "Показать все"}
      </Text>
    </TouchableOpacity>
  )}
 
</View>
<View style={[styles.card, { backgroundColor: activeColors.secondary }]}>
  <Text style={[styles.sectionHeader, { color: activeColors.tint }]}>Загруженность по дням недели</Text>
  <View style={styles.busiestDaysList}>
    {Object.entries(busiestDays).map(([day, count]) => (
      <View key={day} style={styles.busiestDayItem}>
        <Text style={[styles.serviceIcon, { backgroundColor: "#007bff" }]} />
        <Text style={[styles.busiestDayName, { color: activeColors.tint }]}>
          {daysOfWeekTranslation[day] || day} {/* Переводим день недели */}
        </Text>
        <Text style={[styles.busiestDayCount, { color: activeColors.tint }]}>
          {count} заказов
        </Text>
      </View>
    ))}
  </View>
</View>

<View style={[styles.card, { backgroundColor: activeColors.secondary }]}>
  <Text style={[styles.sectionHeader, { color: activeColors.tint }]}>Статистика по клиентам</Text>
  <View style={styles.statisticsList}>
    <View style={styles.statisticItem}>
      <Text style={[styles.statisticLabel, { color: activeColors.tint }]}>Новые клиенты:</Text>
      <Text style={[styles.statisticValue, { color: activeColors.tint }]}>{clientStatistics.newClientsCount}</Text>
    </View>
    <View style={styles.statisticItem}>
      <Text style={[styles.statisticLabel, { color: activeColors.tint }]}>Активные клиенты:</Text>
      <Text style={[styles.statisticValue, { color: activeColors.tint }]}>{clientStatistics.activeClientsCount}</Text>
    </View>
    <View style={styles.statisticItem}>
      <Text style={[styles.statisticLabel, { color: activeColors.tint }]}>Средний чек:</Text>
      <Text style={[styles.statisticValue, { color: activeColors.tint }]}>{clientStatistics.averageCheck} ₸</Text>
    </View>
    <View style={styles.statisticItem}>
      <Text style={[styles.statisticLabel, { color: activeColors.tint }]}>Частота посещений:</Text>
      <Text style={[styles.statisticValue, { color: activeColors.tint }]}>{clientStatistics.visitFrequency.toFixed(2)}</Text>
    </View>
  </View>
</View>



      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  busiestDaysList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  busiestDayItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  busiestDayName: {
    fontSize: 16,
    flex: 1,
  },
  busiestDayCount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  showMoreButton: {
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  showMoreText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007bff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  content: {
    paddingBottom: 20,
  },
  card: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
  },
  tableColumn: {
    fontSize: 16,
    textAlign: "center",
  },
  
  gradient: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  cardValue: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
    marginVertical: 8,
  },
  statisticsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statisticItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statisticLabel: {
    fontSize: 16,
    flex: 1,
  },
  statisticValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.8,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  servicesList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  serviceIcon: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  serviceName: {
    fontSize: 16,
    flex: 1,
  },
  servicePercentage: {
    fontSize: 16,
    fontWeight: "bold",
  },
  popularCars: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  carItem: {
    marginBottom: 8,
  },
  carName: {
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default StatisticsScreen;