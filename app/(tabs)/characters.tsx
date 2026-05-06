import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadow, Fonts } from '../../constants/theme';
import { DUCKS, Duck, DuckRarity } from '../../constants/ducks';
import { useCollectionStore } from '../../stores/collectionStore';
import DuckAvatar from '../../components/ui/DuckAvatar';

const RARITY_COLORS: Record<DuckRarity, string> = {
  common: Colors.common,
  rare: Colors.rare,
  epic: Colors.epic,
  legendary: Colors.legendary,
};

const RARITY_LABELS: Record<DuckRarity, string> = {
  common: 'Común',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Legendario',
};

function DuckCard({ duck, unlocked, onPress }: { duck: Duck; unlocked: boolean; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.duckCard, !unlocked && styles.lockedCard]}
      onPress={onPress}
    >
      <DuckAvatar duck={duck} size={48} dimmed={!unlocked} style={styles.duckAvatar} />
      {!unlocked && <Text style={styles.lockIcon}>🔒</Text>}
      <View style={[styles.rarityBadge, { backgroundColor: RARITY_COLORS[duck.rarity] }]}>
        <Text style={styles.rarityText}>{RARITY_LABELS[duck.rarity][0]}</Text>
      </View>
      <Text style={styles.duckName} numberOfLines={2}>{duck.name}</Text>
    </Pressable>
  );
}

export default function CharactersScreen() {
  const { unlockedDucks, setFavorite, favoriteDuck } = useCollectionStore();
  const [selectedDuck, setSelectedDuck] = useState<Duck | null>(null);

  const unlockedCount = unlockedDucks.length;
  const totalCount = DUCKS.length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>🦆 Personajes</Text>
        <Text style={styles.subtitle}>{unlockedCount} / {totalCount} desbloqueados</Text>
      </View>

      <FlatList
        data={DUCKS}
        numColumns={3}
        keyExtractor={(d) => d.duck_id}
        renderItem={({ item }) => (
          <DuckCard
            duck={item}
            unlocked={unlockedDucks.includes(item.duck_id)}
            onPress={() => setSelectedDuck(item)}
          />
        )}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />

      {/* Detail Modal */}
      <Modal
        visible={!!selectedDuck}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDuck(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setSelectedDuck(null)}>
          {selectedDuck && (
            <View style={styles.modal}>
              <DuckAvatar duck={selectedDuck} size={112} style={styles.modalAvatar} />
              <Text style={styles.modalName}>{selectedDuck.name}</Text>
              <View
                style={[
                  styles.modalRarity,
                  { backgroundColor: RARITY_COLORS[selectedDuck.rarity] + '33' },
                ]}
              >
                <Text style={[styles.modalRarityText, { color: RARITY_COLORS[selectedDuck.rarity] }]}>
                  {RARITY_LABELS[selectedDuck.rarity]}
                </Text>
              </View>
              <Text style={styles.modalLore}>{selectedDuck.lore}</Text>

              {unlockedDucks.includes(selectedDuck.duck_id) ? (
                <Pressable
                  style={[
                    styles.favoriteBtn,
                    favoriteDuck === selectedDuck.duck_id && styles.favoriteBtnActive,
                  ]}
                  onPress={() => {
                    setFavorite(selectedDuck.duck_id);
                    setSelectedDuck(null);
                  }}
                >
                  <Text style={styles.favoriteBtnText}>
                    {favoriteDuck === selectedDuck.duck_id ? '⭐ Favorito actual' : '☆ Establecer favorito'}
                  </Text>
                </Pressable>
              ) : (
                <View style={styles.lockedInfo}>
                  <Text style={styles.lockedInfoText}>
                    {selectedDuck.unlock_method === 'level'
                      ? `Se desbloquea en nivel ${selectedDuck.unlock_level}`
                      : selectedDuck.unlock_method === 'event'
                      ? 'Disponible en eventos especiales'
                      : 'Se obtiene mediante gacha'}
                  </Text>
                </View>
              )}
            </View>
          )}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: Fonts.h2,
    fontWeight: '800',
    color: Colors.blackPremium,
  },
  subtitle: {
    fontSize: Fonts.small,
    color: Colors.gray,
    marginTop: 2,
  },
  grid: {
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  row: {
    gap: Spacing.sm,
    justifyContent: 'flex-start',
  },
  duckCard: {
    width: '31%',
    aspectRatio: 0.9,
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    position: 'relative',
    ...Shadow.card,
  },
  lockedCard: {
    opacity: 0.5,
    backgroundColor: Colors.grayLight,
  },
  duckAvatar: {
    marginBottom: 4,
  },
  lockIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
    fontSize: 14,
  },
  rarityBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  rarityText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  duckName: {
    fontSize: 10,
    color: Colors.blackPremium,
    fontWeight: '600',
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    ...Shadow.card,
  },
  modalAvatar: {
    marginBottom: Spacing.sm,
  },
  modalName: {
    fontSize: Fonts.h3,
    fontWeight: '800',
    color: Colors.blackPremium,
    marginBottom: Spacing.sm,
  },
  modalRarity: {
    borderRadius: Radius.badge,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.md,
  },
  modalRarityText: {
    fontWeight: '700',
    fontSize: Fonts.small,
  },
  modalLore: {
    fontSize: Fonts.small,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  favoriteBtn: {
    backgroundColor: Colors.yellowSoft,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.yellow,
  },
  favoriteBtnActive: {
    backgroundColor: Colors.yellow,
  },
  favoriteBtnText: {
    fontWeight: '700',
    color: Colors.blackPremium,
    fontSize: Fonts.body,
  },
  lockedInfo: {
    backgroundColor: Colors.background,
    borderRadius: Radius.badge,
    padding: Spacing.sm,
  },
  lockedInfoText: {
    color: Colors.gray,
    fontSize: Fonts.small,
    textAlign: 'center',
  },
});
