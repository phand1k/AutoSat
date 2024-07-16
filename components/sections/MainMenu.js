import React, { useContext } from "react";
import { View, ScrollView, Text, Dimensions } from "react-native";
import { colors } from "../../config/theme";
import { ThemeContext } from "../../context/ThemeContext";
import CategoryCard from "../cards/CategoryCard";
import FeaturedCardComponent from "../cards/FeaturedCardComponent";
import DealsCard from "../cards/DealsCard";
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/Ionicons';

const images = [
  require("../../images/sample_image_1.jpg"),
  require("../../images/sample_image_2.jpg"),
  require("../../images/sample_image_3.jpg"),
  require("../../images/sample_image_4.jpg"),
];

const carFacts = [
  {
    title: "Fact 1",
    description: "Cars are the most recycled product in the world.",
    icon: "car-outline",
  },
  {
    title: "Fact 2",
    description: "The first car was invented in 1885 by Karl Benz.",
    icon: "construct-outline",
  },
  {
    title: "Fact 3",
    description: "Electric cars produce less greenhouse gases.",
    icon: "leaf-outline",
  },
  {
    title: "Fact 4",
    description: "Modern cars have more computing power than the Apollo 11.",
    icon: "rocket-outline",
  },
];

const MainMenu = ({ role }) => {
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];
  const screenWidth = Dimensions.get("window").width;

  const renderContentForRole = (role) => {
    switch (role) {
      case 'мастер':
        return (
          <>
            <Text style={styles.sectionTitle(activeColors)}>Запланированные работы</Text>
            <HorizontalDealsSection title="Запланированные работы" images={images} />
            <Text style={styles.sectionTitle(activeColors)}>Задачи на день</Text>
            <VerticalDealsSection title="Задачи на день" images={images} />
          </>
        );
      case 'директор':
        return (
          <>
            <Text style={styles.sectionTitle(activeColors)}>Финансовые отчеты</Text>
            <HorizontalDealsSection title="Финансовые отчеты" images={images} />
            <Text style={styles.sectionTitle(activeColors)}>Статистика по сотрудникам</Text>
            <VerticalDealsSection title="Статистика по сотрудникам" images={images} />
          </>
        );
      case 'менеджер':
        return (
          <>
            <Text style={styles.sectionTitle(activeColors)}>Управление клиентами</Text>
            <HorizontalDealsSection title="Управление клиентами" images={images} />
            <Text style={styles.sectionTitle(activeColors)}>Планирование встреч</Text>
            <VerticalDealsSection title="Планирование встреч" images={images} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView style={{ backgroundColor: activeColors.primary }}>
      <Text style={styles.mainTitle(activeColors)}>Главное меню</Text>
      <View style={styles.container}>
        {renderContentForRole(role)}
      </View>
    </ScrollView>
  );
};

const HorizontalDealsSection = ({ title, images }) => {
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle(activeColors)}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {images.map((imageSource, index) => (
          <DealsCard
            key={index}
            imageSource={imageSource}
            title={`Пример - ${index}`}
            description={`Описание для ${index}`}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const VerticalDealsSection = ({ title, images }) => {
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle(activeColors)}>{title}</Text>
      {images.map((imageSource, index) => (
        <DealsCard
          key={index}
          imageSource={imageSource}
          title={`Пример - ${index}`}
          description={`Описание для ${index}`}
        />
      ))}
    </View>
  );
};

const styles = {
  container: {
    padding: 20,
  },
  mainTitle: (activeColors) => ({
    fontSize: 28,
    fontWeight: "bold",
    color: activeColors.text,
    textAlign: 'center',
    marginVertical: 20,
  }),
  sectionTitle: (activeColors) => ({
    fontSize: 24,
    fontWeight: "bold",
    color: activeColors.text,
    marginVertical: 10,
  }),
  sectionContainer: {
    marginVertical: 10,
  },
};

export default MainMenu;
