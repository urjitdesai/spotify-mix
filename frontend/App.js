import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View, Linking } from "react-native";
import axios from "axios";
export default function App() {
  const [accessToken, setAccessToken] = useState("");
  useEffect(async () => {
    const getTokenResponse = await axios.get(
      "http://localhost:5000/auth/token"
    );
    console.log("accessToken: ", accessToken);
    if (getTokenResponse.data.status === "success") {
      setAccessToken(accessToken.access_token);
    } else {
      Linking.openURL("http://localhost:5000/auth/login");
    }
  }, []);

  return (
    <View style={styles.container}>
      {accessToken ? (
        <Text onPress={() => Linking.openURL("http://localhost:19006/")}>
          Open up App.js to start working on your app!
        </Text>
      ) : (
        <Text onPress={() => Linking.openURL("http://localhost:19006/")}>
          Hi
        </Text>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
