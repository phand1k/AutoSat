import React, { useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from "react-native";
import * as Animatable from "react-native-animatable";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../config/theme";
import { ThemeContext } from "../context/ThemeContext";
import { useContext } from "react";
import LottieView from "lottie-react-native";
import StyledText from "../components/texts/StyledText";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const WelcomeScreen = () => {
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];
  const scrollViewRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const advantages = [
    {
      animation: require("../assets/access.json"), // Замените на ваш файл Lottie
      title: "Быстрый доступ",
      description: "Управляйте своими заказами и услугами в несколько кликов.",
    },
    {
      animation: require("../assets/stats.json"), // Замените на ваш файл Lottie
      title: "Аналитика",
      description: "Получайте статистику по продажам и заказам в реальном времени.",
    },
    {
        animation: require("../assets/usability.json"), // Замените на ваш файл Lottie
        title: "Удобство",
        description: "Простой и интуитивно понятный интерфейс для всех пользователей.",
      },
    {
      animation: require("../assets/notification.json"), // Замените на ваш файл Lottie
      title: "Уведомления",
      description: "Будьте в курсе всех важных событий и обновлений.",
    }
   
  ];

  const handleScroll = (event) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setActiveSlide(slide);
  };

  const renderItem = (item, index) => {
    return (
      <Animatable.View
        key={index}
        animation="fadeIn"
        duration={1000}
        style={styles.slide}
      >
        <LottieView
          source={item.animation}
          autoPlay
          loop
          style={styles.animation}
        />
        <Text style={[styles.title, { color: activeColors.tint }]}>
          {item.title}
        </Text>
        <Text style={[styles.description, { color: activeColors.tint }]}>
          {item.description}
        </Text>
      </Animatable.View>
    );
  };

  return (
    <LinearGradient
      colors={[activeColors.primary, activeColors.secondary]}
      style={styles.container}
    >
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {advantages.map((item, index) => renderItem(item, index))}
      </ScrollView>

      <View style={styles.pagination}>
        {advantages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              activeSlide === index && { backgroundColor: activeColors.accent },
            ]}
          />
        ))}
      </View>

      <View style={styles.buttonsContainer}>
        <Animatable.View animation="fadeInUp" duration={1000} delay={200}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: activeColors.accent }]}
            onPress={() => navigation.navigate("Login")}
          >
              <Text style={styles.buttonText}>Вход</Text>
          </TouchableOpacity>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" duration={1000} delay={400}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: "transparent", borderWidth: 2, borderColor: activeColors.accent }]}
            onPress={() => navigation.navigate("RegisterWithOutOrganization")}
          >
            <Text style={[styles.buttonText, { color: activeColors.accent }]}>Регистрация</Text>
          </TouchableOpacity>
        </Animatable.View>

        <Animatable.View animation="fadeInUp" duration={1000} delay={600}>
        </Animatable.View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  slide: {
    width: screenWidth,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  animation: {
    width: 300,
    height: 300,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    fontSize: 20,
    textAlign: "center",
    paddingHorizontal: 30,
    color: "#666",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ccc",
    marginHorizontal: 5,
  },
  buttonsContainer: {
    width: "80%",
    marginTop: 40,
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 15,
    overflow: "hidden",
  },
  buttonGradient: {
    width: "100%",
    padding: 10,
    borderRadius: 25,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 22,
    fontWeight: "bold",
  },
});

export default WelcomeScreen;