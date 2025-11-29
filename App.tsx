import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Image } from "react-native";
import { FriendlyPhysioTheme } from "./src/theme/FriendlyPhysioTheme";
import { PaperProvider, Text } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  return (
    <PaperProvider theme={FriendlyPhysioTheme}>
      <View style={styles.container}>
        <Text>Can you see the logo?</Text>
        <Image
          source={require("./assets/FF_logo_PurpleOrange.png")}
          style={styles.logo}
        />
        <StatusBar style="light" />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 150,
    height: 150,
    marginTop: 20,
    resizeMode: "contain",
  },
});
