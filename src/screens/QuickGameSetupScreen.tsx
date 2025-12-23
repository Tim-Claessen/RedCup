/**
 * QuickGameSetupScreen Component
 *
 * Screen for configuring a quick beer pong game before starting.
 * Allows users to select game type (1v1 or 2v2), cup count (6 or 10),
 * and enter player names for each team.
 *
 * Features:
 * - Game type selection (1v1/2v2) - automatically adjusts player count
 * - Cup count selection (6 or 10 cups)
 * - Player name input for each team
 * - Auto-populates logged-in user's handle in Team 1, Player 1
 * - Validates all required fields before allowing game start
 * - User search and selection for adding other players
 */

import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import {
  Text,
  TextInput,
  Button,
  SegmentedButtons,
  Card,
  useTheme,
  IconButton,
  List,
  Portal,
  Dialog,
  ActivityIndicator,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { searchUsersByHandle, getUserByHandle } from "../services/userService";
import { QuickGameSetupScreenNavigationProp } from "../types/navigation";
import { useAuth } from "../contexts/AuthContext";
import { DesignSystem } from "../theme";

interface QuickGameSetupScreenProps {
  navigation: QuickGameSetupScreenNavigationProp;
}

/**
 * Player interface for team roster management
 */
interface Player {
  id: string;
  handle: string;
  userId?: string; // Firebase Auth UID if user is logged in
}

const QuickGameSetupScreen: React.FC<QuickGameSetupScreenProps> = ({
  navigation,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [cupCount, setCupCount] = useState<"6" | "10">("6");
  const [gameType, setGameType] = useState<"1v1" | "2v2">("1v1");
  const [team1Players, setTeam1Players] = useState<Player[]>([
    { id: `${Date.now()}-${Math.random()}`, handle: "", userId: user?.uid },
  ]);
  const [team2Players, setTeam2Players] = useState<Player[]>([
    { id: `${Date.now()}-${Math.random()}`, handle: "" },
  ]);

  // User search state
  const [userSearchVisible, setUserSearchVisible] = useState(false);
  const [searchingPlayer, setSearchingPlayer] = useState<{
    team: 1 | 2;
    playerId: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ userId: string; handle: string }>
  >([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle validation state - track which players have valid existing handles
  const [handleValidations, setHandleValidations] = useState<
    Map<string, { isValid: boolean; userId?: string; handle?: string }>
  >(new Map());
  const handleValidationTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(
    new Map()
  );

  useEffect(() => {
    if (user?.handle && team1Players[0]?.handle === "") {
      setTeam1Players((prev) => {
        const updated = [...prev];
        updated[0] = {
          ...updated[0],
          handle: user.handle || "",
          userId: user.uid,
        };
        return updated;
      });
    }
  }, [user]);

  // Sync player count with game type (1v1 = 1 player/team, 2v2 = 2 players/team)
  // Preserves logged-in user's handle and userId in Team 1, Player 1
  useEffect(() => {
    if (gameType === "1v1") {
      setTeam1Players((prev) => {
        if (prev.length > 1) {
          return [prev[0]];
        }
        if (prev.length === 0) {
          return [
            {
              id: `${Date.now()}-${Math.random()}`,
              handle: user?.handle || "",
              userId: user?.uid,
            },
          ];
        }
        return prev;
      });
      setTeam2Players((prev) => {
        if (prev.length > 1) {
          return [prev[0]];
        }
        if (prev.length === 0) {
          return [{ id: `${Date.now()}-${Math.random()}`, handle: "" }];
        }
        return prev;
      });
    } else {
      setTeam1Players((prev) => {
        if (prev.length < 2) {
          const newPlayers = [...prev];
          if (newPlayers.length === 0) {
            newPlayers.push({
              id: `${Date.now()}-${Math.random()}`,
              handle: user?.handle || "",
              userId: user?.uid,
            });
          }
          while (newPlayers.length < 2) {
            newPlayers.push({
              id: `${Date.now()}-${Math.random()}`,
              handle: "",
            });
          }
          return newPlayers;
        } else if (prev.length > 2) {
          return prev.slice(0, 2);
        }
        return prev;
      });
      setTeam2Players((prev) => {
        if (prev.length < 2) {
          const newPlayers = [...prev];
          while (newPlayers.length < 2) {
            newPlayers.push({
              id: `${Date.now()}-${Math.random()}`,
              handle: "",
            });
          }
          return newPlayers;
        } else if (prev.length > 2) {
          return prev.slice(0, 2);
        }
        return prev;
      });
    }
  }, [gameType, user]);

  const updatePlayer = (
    team: 1 | 2,
    playerId: string,
    handle: string,
    userId?: string,
    clearUserId: boolean = false // Allow clearing userId when manually typing
  ) => {
    const setter = team === 1 ? setTeam1Players : setTeam2Players;
    const players = team === 1 ? team1Players : team2Players;

    // If userId is explicitly provided (from search selection), use it
    // If clearUserId is true (manual typing), clear userId and revalidate
    // Otherwise, check validation state
    let finalUserId = userId;
    if (clearUserId) {
      // User is manually typing, clear userId and let validation determine it
      finalUserId = undefined;
    } else if (userId === undefined) {
      // Check validation state for existing valid handle
      const validation = handleValidations.get(playerId);
      if (validation?.isValid && validation.userId) {
        finalUserId = validation.userId;
        // Use the exact handle from the database (case-sensitive)
        if (validation.handle) {
          handle = validation.handle;
        }
      }
    }

    setter(
      players.map((p) =>
        p.id === playerId ? { ...p, handle, userId: finalUserId } : p
      )
    );

    // Trigger validation when manually typing (clearUserId) or when userId not provided
    if (clearUserId || userId === undefined) {
      validateHandle(playerId, handle);
    }
  };

  const openUserSearch = (team: 1 | 2, playerId: string) => {
    setSearchingPlayer({ team, playerId });
    setSearchQuery("");
    setSearchResults([]);
    setUserSearchVisible(true);
  };

  const handleUserSearch = (query: string) => {
    setSearchQuery(query);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    // Debounce search by 300ms
    searchTimeoutRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await searchUsersByHandle(query, 10);
        const filtered = results.filter(
          (r: { userId: string; handle: string }) => r.userId !== user?.uid
        );
        setSearchResults(filtered);
      } catch (error) {
        console.error("Error searching users:", error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      // Clear all handle validation timeouts
      handleValidationTimeoutRef.current.forEach((timeout) =>
        clearTimeout(timeout)
      );
      handleValidationTimeoutRef.current.clear();
    };
  }, []);

  // Validate handle as user types (debounced)
  const validateHandle = async (playerId: string, handle: string) => {
    // Clear existing timeout for this player
    const existingTimeout = handleValidationTimeoutRef.current.get(playerId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const trimmedHandle = handle.trim();

    // If handle is empty or matches logged-in user, skip validation
    if (trimmedHandle.length === 0) {
      setHandleValidations((prev) => {
        const next = new Map(prev);
        next.delete(playerId);
        return next;
      });
      return;
    }

    // Debounce validation by 500ms
    const timeout = setTimeout(async () => {
      try {
        // Special case: if this is the logged-in user's handle, it's valid
        if (
          user?.handle &&
          trimmedHandle.toLowerCase() === user.handle.toLowerCase()
        ) {
          setHandleValidations((prev) => {
            const next = new Map(prev);
            next.set(playerId, {
              isValid: true,
              userId: user.uid,
              handle: user.handle ?? undefined,
            });
            return next;
          });
          return;
        }

        const userData = await getUserByHandle(trimmedHandle);
        setHandleValidations((prev) => {
          const next = new Map(prev);
          if (userData) {
            next.set(playerId, {
              isValid: true,
              userId: userData.userId,
              handle: userData.handle,
            });
          } else {
            next.set(playerId, { isValid: false });
          }
          return next;
        });
      } catch (error) {
        console.error("Error validating handle:", error);
        setHandleValidations((prev) => {
          const next = new Map(prev);
          next.set(playerId, { isValid: false });
          return next;
        });
      }
      handleValidationTimeoutRef.current.delete(playerId);
    }, 500);

    handleValidationTimeoutRef.current.set(playerId, timeout);
  };

  const selectUser = (selectedUser: { userId: string; handle: string }) => {
    if (!searchingPlayer) return;

    // Set validation state so tick shows up
    setHandleValidations((prev) => {
      const next = new Map(prev);
      next.set(searchingPlayer.playerId, {
        isValid: true,
        userId: selectedUser.userId,
        handle: selectedUser.handle,
      });
      return next;
    });

    updatePlayer(
      searchingPlayer.team,
      searchingPlayer.playerId,
      selectedUser.handle,
      selectedUser.userId
    );
    setUserSearchVisible(false);
    setSearchingPlayer(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const createTemporaryHandle = () => {
    if (!searchingPlayer) return;
    const trimmedHandle = searchQuery.trim();

    if (trimmedHandle.length === 0) {
      return; // Don't create empty handle
    }

    // Create temporary handle (no userId = temporary)
    updatePlayer(
      searchingPlayer.team,
      searchingPlayer.playerId,
      trimmedHandle,
      undefined // No userId = temporary handle
    );
    setUserSearchVisible(false);
    setSearchingPlayer(null);
    setSearchQuery("");
    setSearchResults([]);
  };

  const canStartGame = () => {
    const requiredPlayers = gameType === "1v1" ? 1 : 2;
    const allPlayers = [...team1Players, ...team2Players];
    return (
      team1Players.length === requiredPlayers &&
      team2Players.length === requiredPlayers &&
      allPlayers.every((p) => p.handle.trim() !== "")
    );
  };

  const handleStartGame = () => {
    if (!canStartGame()) return;

    navigation.navigate("Game", {
      cupCount: parseInt(cupCount),
      team1Players: team1Players.map((p) => ({
        handle: p.handle.trim() || "Guest",
        userId: p.userId, // undefined for temporary handles
      })),
      team2Players: team2Players.map((p) => ({
        handle: p.handle.trim() || "Guest",
        userId: p.userId, // undefined for temporary handles
      })),
      gameType: gameType,
    });
  };

  const renderTeam = (team: 1 | 2, players: Player[], teamName: string) => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <Text
          variant="titleMedium"
          style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
        >
          {teamName}
        </Text>
        {players.map((player, index) => {
          const validation = handleValidations.get(player.id);
          const isValidUser = validation?.isValid === true;
          const isInvalidUser = validation?.isValid === false;
          const hasValidation = validation !== undefined;
          const showWarning =
            isInvalidUser && player.handle.trim().length > 0 && !player.userId;

          return (
            <View key={player.id} style={styles.playerInputContainer}>
              <View style={styles.playerRow}>
                <TextInput
                  mode="outlined"
                  label={`Player ${index + 1}`}
                  placeholder="Enter name or search..."
                  value={player.handle}
                  onChangeText={(text) => {
                    // Clear validation state immediately when manually typing
                    setHandleValidations((prev) => {
                      const next = new Map(prev);
                      next.delete(player.id);
                      return next;
                    });
                    // Allow clearing/resetting when manually typing
                    updatePlayer(team, player.id, text, undefined, true);
                  }}
                  style={styles.playerInput}
                  contentStyle={styles.inputContent}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                  textColor={theme.colors.onSurface}
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  right={
                    isValidUser ? (
                      <TextInput.Icon icon="check-circle" />
                    ) : undefined
                  }
                />
                <IconButton
                  icon="account-search"
                  size={24}
                  iconColor={theme.colors.primary}
                  onPress={() => openUserSearch(team, player.id)}
                  style={styles.searchButton}
                />
              </View>
              {showWarning && (
                <Text
                  variant="bodySmall"
                  style={[
                    styles.validationWarning,
                    { color: theme.colors.error },
                  ]}
                >
                  User doesn't exist, no player stats will be recorded for this
                  player.
                </Text>
              )}
            </View>
          );
        })}
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top", "bottom"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.header}>
          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            textColor={theme.colors.onSurface}
            icon="arrow-left"
          >
            Back
          </Button>
          <Text
            variant="headlineSmall"
            style={{ color: theme.colors.onBackground }}
          >
            Game Setup
          </Text>
          <View style={{ width: 80 }} />
        </View>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              Game Type
            </Text>
            <SegmentedButtons
              value={gameType}
              onValueChange={(value) => {
                if (value === "1v1" || value === "2v2") {
                  setGameType(value);
                }
              }}
              buttons={[
                { value: "1v1", label: "1 vs 1" },
                { value: "2v2", label: "2 vs 2" },
              ]}
              style={styles.segmentedButtons}
              theme={{
                colors: {
                  secondaryContainer: theme.colors.primary,
                  onSecondaryContainer: theme.colors.onPrimary,
                },
              }}
            />
          </Card.Content>
        </Card>

        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text
              variant="titleMedium"
              style={[styles.sectionTitle, { color: theme.colors.onSurface }]}
            >
              Cup Configuration
            </Text>
            <SegmentedButtons
              value={cupCount}
              onValueChange={(value) => {
                if (value === "6" || value === "10") {
                  setCupCount(value);
                }
              }}
              buttons={[
                { value: "6", label: "6 Cups" },
                { value: "10", label: "10 Cups" },
              ]}
              style={styles.segmentedButtons}
              theme={{
                colors: {
                  secondaryContainer: theme.colors.primary,
                  onSecondaryContainer: theme.colors.onPrimary,
                },
              }}
            />
          </Card.Content>
        </Card>

        {renderTeam(1, team1Players, "Team 1")}
        {renderTeam(2, team2Players, "Team 2")}

        <Button
          mode="contained"
          onPress={handleStartGame}
          disabled={!canStartGame()}
          style={styles.startButton}
          contentStyle={styles.startButtonContent}
          labelStyle={styles.startButtonLabel}
          buttonColor={
            canStartGame() ? theme.colors.primary : theme.colors.surfaceDisabled
          }
        >
          Start Game
        </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      <Portal>
        <Dialog
          visible={userSearchVisible}
          onDismiss={() => {
            setUserSearchVisible(false);
            setSearchingPlayer(null);
            setSearchQuery("");
            setSearchResults([]);
          }}
          style={styles.dialog}
        >
          <Dialog.Title>Search Users</Dialog.Title>
          <Dialog.Content>
            <Text
              variant="bodySmall"
              style={[
                styles.searchHint,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Search for users by their handle.
            </Text>
            <TextInput
              mode="outlined"
              label="Search by handle"
              placeholder="Type at least 2 characters..."
              value={searchQuery}
              onChangeText={handleUserSearch}
              style={styles.searchInput}
              contentStyle={styles.inputContent}
              outlineColor={theme.colors.outline}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              autoCapitalize="none"
              autoCorrect={false}
              left={<TextInput.Icon icon="magnify" />}
            />
            {searchLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            )}
            {!searchLoading && searchResults.length > 0 && (
              <ScrollView style={styles.searchResults} nestedScrollEnabled>
                {searchResults.map((result) => (
                  <List.Item
                    key={result.userId}
                    title={result.handle}
                    left={(props) => <List.Icon {...props} icon="account" />}
                    onPress={() => selectUser(result)}
                    style={styles.searchResultItem}
                  />
                ))}
              </ScrollView>
            )}
            {!searchLoading &&
              searchQuery.length >= 2 &&
              searchResults.length === 0 && (
                <View style={styles.noResultsContainer}>
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.noResults,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    No users found
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.noResultsHint,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    Use a temporary handle for this game
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={createTemporaryHandle}
                    style={styles.createTemporaryButton}
                    buttonColor={theme.colors.surfaceVariant}
                    textColor={theme.colors.onSurfaceVariant}
                    disabled={searchQuery.trim().length === 0}
                  >
                    Use Temporary Handle
                  </Button>
                </View>
              )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setUserSearchVisible(false);
                setSearchingPlayer(null);
                setSearchQuery("");
                setSearchResults([]);
              }}
            >
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: DesignSystem.spacing.md,
    paddingBottom: DesignSystem.spacing.xxl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.lg,
  },
  card: {
    marginBottom: DesignSystem.spacing.md,
    elevation: DesignSystem.elevation.level1,
  },
  sectionTitle: {
    marginBottom: DesignSystem.spacing.md,
  },
  segmentedButtons: {
    marginTop: DesignSystem.spacing.sm,
  },
  sideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.md,
  },
  playerInputContainer: {
    marginBottom: DesignSystem.spacing.sm,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignSystem.spacing.xs,
  },
  validationWarning: {
    marginTop: DesignSystem.spacing.xs,
    marginLeft: DesignSystem.spacing.sm,
    fontSize: 12,
  },
  playerInput: {
    flex: 1,
  },
  searchButton: {
    margin: 0,
  },
  dialog: {
    maxHeight: "80%",
  },
  searchHint: {
    marginBottom: DesignSystem.spacing.sm,
    textAlign: "center",
  },
  searchInput: {
    marginBottom: DesignSystem.spacing.md,
  },
  loadingContainer: {
    padding: DesignSystem.spacing.md,
    alignItems: "center",
  },
  searchResults: {
    maxHeight: 300,
    marginTop: DesignSystem.spacing.sm,
  },
  searchResultItem: {
    paddingVertical: DesignSystem.spacing.xs,
  },
  noResults: {
    padding: DesignSystem.spacing.md,
    textAlign: "center",
  },
  noResultsContainer: {
    alignItems: "center",
    padding: DesignSystem.spacing.md,
  },
  noResultsHint: {
    marginTop: DesignSystem.spacing.xs,
    marginBottom: DesignSystem.spacing.md,
    textAlign: "center",
  },
  createTemporaryButton: {
    marginTop: DesignSystem.spacing.sm,
  },
  inputContent: {
    minHeight: DesignSystem.dimensions.inputHeight,
  },
  startButton: {
    marginTop: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.xl,
  },
  startButtonContent: {
    paddingVertical: DesignSystem.spacing.md,
    minHeight: DesignSystem.dimensions.buttonHeightLarge,
  },
  startButtonLabel: {
    fontSize: DesignSystem.typography.labelLarge.fontSize,
    fontWeight: DesignSystem.typography.labelLarge.fontWeight,
    letterSpacing: 0.1,
  },
});

export default QuickGameSetupScreen;
