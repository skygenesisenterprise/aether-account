import * as React from "react";

import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useMobileAuth } from "@/components/mobile/mobile-auth-provider";
import { ScreenTransition } from "@/components/mobile/screen-transition";
import { mobileTheme } from "@/components/mobile/theme";
import { usePhoneSafeAreaInsets } from "@/components/mobile/use-phone-safe-area";

export default function UnlockScreen() {
  const insets = usePhoneSafeAreaInsets();
  const { biometricLabel, isAuthenticated, session, signOut, unlockWithBiometrics } = useMobileAuth();
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated]);

  async function handleUnlock() {
    setError("");
    const result = await unlockWithBiometrics();
    if (!result.ok) {
      setError(result.error ?? "Authentification refusee.");
      return;
    }
  }

  function handleSwitchAccount() {
    signOut();
    router.replace("/login");
  }

  const name = [session?.user.firstName, session?.user.lastName].filter(Boolean).join(" ") || session?.user.email || "Membre Aether";

  return (
    <ScreenTransition>
      <View style={styles.safeArea}>
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.avatar}>
              <MaterialIcons color={mobileTheme.color.primaryForeground} name="groups-2" size={32} />
            </View>
            <Text style={styles.title}>Aether Meet</Text>
            <Text style={styles.subtitle}>{name}</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable onPress={handleUnlock} style={styles.primaryButton}>
              <MaterialIcons color={mobileTheme.color.primaryForeground} name="fingerprint" size={22} />
              <Text style={styles.primaryButtonText}>Déverrouiller avec {biometricLabel}</Text>
            </Pressable>
            <Pressable onPress={handleSwitchAccount}>
              <Text style={styles.switchText}>Changer de compte</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: mobileTheme.color.background, flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 20 },
  card: { alignItems: "center", backgroundColor: mobileTheme.color.popover, borderColor: mobileTheme.color.border, borderRadius: 22, borderWidth: 1, gap: 14, padding: 24, ...mobileTheme.shadow.subtle },
  avatar: { alignItems: "center", backgroundColor: mobileTheme.color.primary, borderRadius: 24, height: 72, justifyContent: "center", width: 72 },
  title: { color: mobileTheme.color.foreground, fontSize: 28, fontWeight: "900", letterSpacing: 0 },
  subtitle: { color: mobileTheme.color.mutedForeground, fontSize: 15, fontWeight: "700" },
  error: { color: mobileTheme.color.destructive, fontSize: 13, fontWeight: "700", textAlign: "center" },
  primaryButton: { alignItems: "center", alignSelf: "stretch", backgroundColor: mobileTheme.color.primary, borderRadius: 999, flexDirection: "row", gap: 10, height: 52, justifyContent: "center", marginTop: 8 },
  primaryButtonText: { color: mobileTheme.color.primaryForeground, fontSize: 15, fontWeight: "900" },
  switchText: { color: mobileTheme.color.primary, fontSize: 14, fontWeight: "800", marginTop: 4 },
});
