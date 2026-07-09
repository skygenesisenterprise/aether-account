import * as React from "react";

import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { useMobileAuth } from "@/components/mobile/mobile-auth-provider";
import { ScreenTransition } from "@/components/mobile/screen-transition";
import { mobileTheme } from "@/components/mobile/theme";
import { usePhoneSafeAreaInsets } from "@/components/mobile/use-phone-safe-area";
import { authApi } from "@/lib/api/auth";

export default function RegisterScreen() {
  const insets = usePhoneSafeAreaInsets();
  const { signIn } = useMobileAuth();
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSubmit() {
    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await authApi.register({
        displayName: [firstName, lastName].filter(Boolean).join(" ").trim() || "Membre Aether",
        email: email || "member@aethermeet.local",
        password,
        workspaceName: "Aether Meet",
      });
      const displayName = response.user.displayName?.trim() || firstName || "Membre";
      const [resolvedFirstName, ...resolvedLastNameParts] = displayName.split(" ");

      signIn({
        email: response.user.email,
        firstName: resolvedFirstName,
        lastName: resolvedLastNameParts.join(" ") || lastName,
      });
    } catch {
      setError("Création impossible. Vérifiez l'API locale ou utilisez un compte existant.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenTransition>
      <View style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandBlock}>
            <Text style={styles.brandName}>Aether Meet</Text>
            <Text style={styles.brandTagline}>Configurer votre accès mobile workspace.</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.row}>
              <View style={[styles.fieldBlock, styles.rowItem]}>
                <Text style={styles.label}>Prénom</Text>
                <TextInput onChangeText={setFirstName} placeholder="Liam" placeholderTextColor={mobileTheme.color.mutedForeground} style={styles.inputBox} value={firstName} />
              </View>
              <View style={[styles.fieldBlock, styles.rowItem]}>
                <Text style={styles.label}>Nom</Text>
                <TextInput onChangeText={setLastName} placeholder="Dispa" placeholderTextColor={mobileTheme.color.mutedForeground} style={styles.inputBox} value={lastName} />
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Email professionnel</Text>
              <View style={styles.inputWrap}>
                <MaterialIcons color={mobileTheme.color.mutedForeground} name="mail-outline" size={18} />
                <TextInput
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onChangeText={setEmail}
                  placeholder="prenom@entreprise.com"
                  placeholderTextColor={mobileTheme.color.mutedForeground}
                  style={styles.input}
                  value={email}
                />
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputWrap}>
                <MaterialIcons color={mobileTheme.color.mutedForeground} name="lock-outline" size={18} />
                <TextInput
                  onChangeText={setPassword}
                  placeholder="Mot de passe"
                  placeholderTextColor={mobileTheme.color.mutedForeground}
                  secureTextEntry
                  style={styles.input}
                  value={password}
                />
              </View>
            </View>

            <Pressable onPress={handleSubmit} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>
                {submitting ? "Création..." : "Entrer dans Aether Meet"}
              </Text>
            </Pressable>

            {error ? (
              <View style={styles.errorBox}>
                <MaterialIcons color={mobileTheme.color.destructive} name="error-outline" size={18} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>

          <Pressable onPress={() => router.push("/login")} style={styles.switchLink}>
            <Text style={styles.switchText}>J'ai déjà un accès</Text>
          </Pressable>
        </ScrollView>
      </View>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: mobileTheme.color.background, flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 20 },
  brandBlock: { alignItems: "center", gap: 8, marginBottom: 30 },
  brandName: { color: mobileTheme.color.foreground, fontSize: 34, fontWeight: "900", letterSpacing: 0 },
  brandTagline: { color: mobileTheme.color.mutedForeground, fontSize: 15, fontWeight: "600", lineHeight: 22, textAlign: "center" },
  formCard: { backgroundColor: mobileTheme.color.popover, borderColor: mobileTheme.color.border, borderRadius: 20, borderWidth: 1, gap: 14, padding: 20, ...mobileTheme.shadow.subtle },
  row: { flexDirection: "row", gap: 10 },
  rowItem: { flex: 1 },
  fieldBlock: { gap: 7 },
  label: { color: mobileTheme.color.foreground, fontSize: 13, fontWeight: "800" },
  inputWrap: { alignItems: "center", backgroundColor: mobileTheme.color.card, borderColor: mobileTheme.color.input, borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 10, height: 48, paddingHorizontal: 13 },
  input: { color: mobileTheme.color.foreground, flex: 1, fontSize: 15, fontWeight: "600", paddingVertical: 0 },
  inputBox: { backgroundColor: mobileTheme.color.card, borderColor: mobileTheme.color.input, borderRadius: 14, borderWidth: 1, color: mobileTheme.color.foreground, fontSize: 15, fontWeight: "600", height: 48, paddingHorizontal: 13 },
  primaryButton: { alignItems: "center", backgroundColor: mobileTheme.color.primary, borderRadius: 999, height: 50, justifyContent: "center", marginTop: 4 },
  primaryButtonText: { color: mobileTheme.color.primaryForeground, fontSize: 15, fontWeight: "900" },
  errorBox: { alignItems: "center", backgroundColor: mobileTheme.color.destructiveSurface, borderColor: mobileTheme.color.destructive, borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 8, padding: 12 },
  errorText: { color: mobileTheme.color.destructive, flex: 1, fontSize: 13, fontWeight: "700", lineHeight: 18 },
  switchLink: { alignItems: "center", marginTop: 22 },
  switchText: { color: mobileTheme.color.primary, fontSize: 14, fontWeight: "800" },
});
