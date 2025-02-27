import React, { useState, useContext } from "react";
import {
  SafeAreaView,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Text,
  Image,
  ScrollView,
  RefreshControl,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "..//context/ThemeContext";
import { colors } from "..//config/theme";
import StyledText from "..//components/texts/StyledText";

const testData = [
  {
    id: "1",
    title: "Новый электромобиль Tesla Model S Plaid",
    description:
      "Tesla представила новую версию Model S с ускорением 0-100 км/ч за 1.99 секунды.",
    content: [
      { type: "image", value: "https://s.auto.drom.ru/i24224/c/photos/fullsize/volkswagen/polo/volkswagen_polo_838955.jpg" },
      { type: "text", value: "Tesla Model S Plaid — это новый флагманский электромобиль компании Tesla. Он оснащен тремя электродвигателями, которые обеспечивают невероятное ускорение: 0-100 км/ч всего за 1.99 секунды." },
      { type: "image", value: "https://kolesa-uploads.ru/r/880x/ddce4e84-4bfb-4a21-84b1-75ca6a7ec364/new-golf-91.jpg" },
      { type: "text", value: "Максимальная скорость составляет 322 км/ч, а запас хода — до 837 км." },
      { type: "text", value: "В салоне установлен новый дисплей с разрешением 2200x1300 пикселей, а также игровая консоль на базе AMD Ryzen." },
    ],
    date: "2023-10-01",
  },
  {
    id: "2",
    title: "Volkswagen ID.4 получил награду",
    description:
      "Volkswagen ID.4 признан лучшим электрокаром 2023 года по версии World Car Awards.",
    content: [
      { type: "image", value: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT-XkvtKgaTCxbVyu_3AlADqJTzCScW3krlGA&s" },
      { type: "text", value: "Volkswagen ID.4 — это компактный кроссовер на электрической тяге, который завоевал множество наград в 2023 году." },
      { type: "image", value: "https://avanta-avto-credit.ru/upload/resize_cache/iblock/89d/600_600_040cd750bba9870f18aada2478b24840a/01dlh5hj53ytwltg8p17tccdpl242v03.png.pagespeed.ce.pBqmxACF7p.png" },
      { type: "text", value: "Он оснащен батареей на 77 кВт·ч, что обеспечивает запас хода до 520 км." },
    ],
    date: "2023-09-28",
  },
];

const NewsScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const activeColors = colors[theme.mode];
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("");
  const [news, setNews] = useState(testData);
  const [originalNews, setOriginalNews] = useState(testData);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleSearch = (text) => {
    setFilter(text);
    if (text === "") {
      setNews(originalNews);
    } else {
      const filteredData = originalNews.filter((item) =>
        item.title.toLowerCase().includes(text.toLowerCase())
      );
      setNews(filteredData);
    }
  };

  const openModal = (item) => {
    setSelectedNews(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedNews(null);
  };

  const renderNewsItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.newsItem, { backgroundColor: activeColors.secondary }]}
      onPress={() => openModal(item)}
    >
      <Image source={{ uri: item.content[0].value }} style={styles.newsImage} />
      <View style={styles.newsContent}>
        <StyledText style={[styles.newsTitle, { color: activeColors.tint }]}>
          {item.title}
        </StyledText>
        <StyledText
          style={[styles.newsDescription, { color: activeColors.tint }]}
        >
          {item.description}
        </StyledText>
        <StyledText style={[styles.newsDate, { color: activeColors.tint }]}>
          {item.date}
        </StyledText>
      </View>
    </TouchableOpacity>
  );

  const renderContentItem = (item, index) => {
    if (item.type === "image") {
      return (
        <Image
          key={`image-${index}`}
          source={{ uri: item.value }}
          style={styles.modalImage}
        />
      );
    } else if (item.type === "text") {
      return (
        <StyledText
          key={`text-${index}`}
          style={[styles.modalText, { color: activeColors.tint }]}
        >
          {item.value}
        </StyledText>
      );
    }
    return null;
  };

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
          Лента
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
        placeholder="Поиск"
        placeholderTextColor={activeColors.tint}
        clearButtonMode="while-editing"
      />

      {/* Список новостей */}
      {news.length === 0 ? (
        <View style={styles.emptyContainer}>
          <StyledText style={styles.emptyText}>Новости не найдены</StyledText>
        </View>
      ) : (
        <FlatList
          data={news}
          renderItem={renderNewsItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Модальное окно с подробной информацией */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View
          style={[styles.modalContainer, { backgroundColor: activeColors.primary }]}
        >
          <View
            style={[styles.modalContent, { backgroundColor: activeColors.secondary }]}
          >
            {selectedNews && (
              <ScrollView>
                {/* Заголовок */}
                <StyledText style={[styles.modalTitle, { color: activeColors.tint }]}>
                  {selectedNews.title}
                </StyledText>

                {/* Контент (фото и текст) */}
                {selectedNews.content.map((item, index) =>
                  renderContentItem(item, index)
                )}

                {/* Кнопка закрытия */}
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: activeColors.accent }]}
                  onPress={closeModal}
                >
                  <Text style={styles.closeButtonText}>Закрыть</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  newsItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 16,
    borderRadius: 10,
    elevation: 2,
  },
  newsImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 16,
  },
  newsContent: {
    flex: 1,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  newsDescription: {
    fontSize: 14,
    marginBottom: 8,
  },
  newsDate: {
    fontSize: 12,
    color: "#888",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: "#888",
    marginTop: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: 10,
    elevation: 5,
    padding: 16,
  },
  modalImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  modalText: {
    fontSize: 14,
    marginBottom: 16,
  },
  closeButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 16,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
});

export default NewsScreen;