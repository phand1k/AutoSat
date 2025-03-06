import React, { useState, useContext } from "react";
import {
  SafeAreaView,
  View,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "..//context/ThemeContext";
import { colors } from "..//config/theme";
import StyledText from "..//components/texts/StyledText";

const servicesData = [
  // Тестовые данные из предыдущего шага
];

const ServicesScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];
  const [filter, setFilter] = useState("");
  const [services, setServices] = useState(servicesData);
  const [originalServices, setOriginalServices] = useState(servicesData);

  const handleSearch = (text) => {
    setFilter(text);
    if (text === "") {
      setServices(originalServices);
    } else {
      const filteredData = originalServices.filter((item) =>
        item.title.toLowerCase().includes(text.toLowerCase())
      );
      setServices(filteredData);
    }
  };

  const renderServiceItem = ({ item }) => (
    <ServiceItem item={item} colors={activeColors} />
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: activeColors.primary }]}
    >
      {/* Заголовок и кнопка "Назад" */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={activeColors.tint}
            style={styles.backButton}
          />
        </TouchableOpacity>
        <StyledText style={[styles.headerTitle, { color: activeColors.tint }]}>
          Услуги
        </StyledText>
      </View>

      {/* Поиск */}
      <TextInput
        style={[
          styles.searchBox,
          {
            backgroundColor: activeColors.primary,
            borderColor: activeColors.secondary,
            color: activeColors.tint,
          },
        ]}
        value={filter}
        onChangeText={handleSearch}
        placeholder="Поиск услуг"
        placeholderTextColor={activeColors.tint}
        clearButtonMode="while-editing"
      />

      {/* Список услуг */}
      {services.length === 0 ? (
        <View style={styles.emptyContainer}>
          <StyledText style={styles.emptyText}>Услуги не найдены</StyledText>
        </View>
      ) : (
        <FlatList
          data={services}
          renderItem={renderServiceItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  searchBox: {
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    margin: 16,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  serviceItem: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 10,
    elevation: 2,
  },
  serviceContent: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  serviceDetail: {
    fontSize: 14,
    marginBottom: 4,
  },
  popularBadge: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "#FF6347",
    padding: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#888",
  },
});

export default ServicesScreen;