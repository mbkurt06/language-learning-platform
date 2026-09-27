import { StyleSheet, Text, View } from "react-native";

export default function Home() {
  return <View style={styles.container}>
    <Text style={styles.eyebrow}>MOBILE CLIENT</Text>
    <Text style={styles.title}>Öğrenme akışına her cihazdan devam et</Text>
    <Text style={styles.body}>Aynı learning item, encounter ve ilerleme verisi Platform API üzerinden paylaşılacak.</Text>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 28, justifyContent: "center", backgroundColor: "#f8fafc" },
  eyebrow: { fontWeight: "800", color: "#2563eb", marginBottom: 8 },
  title: { fontSize: 30, fontWeight: "700", marginBottom: 12, color: "#0f172a" },
  body: { fontSize: 17, lineHeight: 25, color: "#475569" }
});
