import AsyncStorage from "@react-native-async-storage/async-storage";

//those two functions are used to store and retrieve data from the async storage

export const storeData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch ({ message }) {
    alert(message);
  }
};
const getUserRole = async () => {
  const role = await AsyncStorage.getItem('role_user_avtosat');
  return role;
};

export const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch ({ message }) {
    alert(message);
  }
};
