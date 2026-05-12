import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, Shadow, Fonts } from '../../constants/theme';
import GameAsset from '../../components/ui/GameAsset';
import type { AppAssetName } from '../../constants/assets';

interface ShopItem {
  id: string;
  label: string;
  description: string;
  price: string;
  emoji: string;
  asset?: AppAssetName;
  coins?: number;
  clues?: number;
}

const COIN_PACKS: ShopItem[] = [
  { id: 'coins_200', label: '200 Monedas', description: 'Bolsita de oro', price: '$0.99', emoji: '👛', asset: 'coin', coins: 200 },
  { id: 'coins_600', label: '600 Monedas', description: 'Saco de monedas', price: '$2.49', emoji: '💰', asset: 'coin', coins: 600 },
  { id: 'coins_1500', label: '1,500 Monedas', description: 'Cofre del detective', price: '$4.99', emoji: '💎', asset: 'coin', coins: 1500 },
];

const HINT_PACKS: ShopItem[] = [
  { id: 'hints_3', label: '3 Pistas', description: 'Mini lupa', price: '$0.99', emoji: '🔍', asset: 'clue', clues: 3 },
  { id: 'hints_10', label: '10 Pistas', description: 'Lupa detective', price: '$1.99', emoji: '🔎', asset: 'clue', clues: 10 },
  { id: 'hints_25', label: '25 Pistas', description: 'Maletín de pistas', price: '$3.99', emoji: '🧳', asset: 'clue', clues: 25 },
];

interface SkinPack {
  id: string;
  label: string;
  description: string;
  price: string;
  preview: string[];
  accent: string;
}

const SKIN_PACKS: SkinPack[] = [
  {
    id: 'skin_noir',
    label: 'Pack Detective Noir',
    description: '5 skins en blanco y negro de cine clásico',
    price: '$2.99',
    preview: ['🕵️', '🎩', '🔍', '🚬', '📰'],
    accent: '#11112A',
  },
  {
    id: 'skin_neon',
    label: 'Pack Neón Quack',
    description: '5 skins brillantes estilo arcade',
    price: '$2.99',
    preview: ['🦆', '✨', '💫', '🌈', '⚡'],
    accent: '#6C63FF',
  },
  {
    id: 'skin_gold',
    label: 'Pack Oro Legendario',
    description: '3 skins doradas + marco de perfil dorado',
    price: '$4.99',
    preview: ['👑', '🏆', '💎'],
    accent: '#D99A00',
  },
  {
    id: 'skin_pirate',
    label: 'Pack Aventura Pirata',
    description: '4 skins de alta mar y un mapa del tesoro',
    price: '$2.49',
    preview: ['🏴‍☠️', '⚓', '🗺️', '🦜'],
    accent: '#2E7D5B',
  },
];

function ShopCard({ item }: { item: ShopItem }) {
  return (
    <Pressable
      style={styles.shopCard}
      onPress={() => Alert.alert('Próximamente', 'Las compras estarán disponibles pronto 🚀')}
    >
      {item.asset ? (
        <GameAsset name={item.asset} size={42} />
      ) : (
        <Text style={styles.shopEmoji}>{item.emoji}</Text>
      )}
      <View style={styles.shopInfo}>
        <Text style={styles.shopLabel}>{item.label}</Text>
        <Text style={styles.shopDesc}>{item.description}</Text>
      </View>
      <View style={styles.priceChip}>
        <Text style={styles.priceText}>{item.price}</Text>
      </View>
    </Pressable>
  );
}

function SkinPackCard({ pack }: { pack: SkinPack }) {
  return (
    <Pressable
      style={styles.skinCard}
      onPress={() => Alert.alert('Próximamente', 'Las skins se podrán comprar y equipar al lanzamiento ✨')}
    >
      <View style={[styles.skinAccent, { backgroundColor: pack.accent }]} />
      <View style={styles.skinBody}>
        <View style={styles.skinPreviewRow}>
          {pack.preview.map((emoji, i) => (
            <Text key={`${pack.id}-${i}`} style={styles.skinPreviewEmoji}>{emoji}</Text>
          ))}
        </View>
        <Text style={styles.skinLabel}>{pack.label}</Text>
        <Text style={styles.skinDesc}>{pack.description}</Text>
        <View style={styles.skinFooter}>
          <View style={styles.priceChip}>
            <Text style={styles.priceText}>{pack.price}</Text>
          </View>
          <Text style={styles.skinBadge}>NUEVO</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function ShopScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>🛒 Tienda</Text>
        </View>

        {/* Sub banner */}
        <View style={styles.subBanner}>
          <View style={styles.subLeft}>
            <Text style={styles.subEmoji}>🕵️</Text>
            <View>
              <Text style={styles.subTitle}>Detective Plus</Text>
              <Text style={styles.subDesc}>Sin anuncios · 500 monedas/mes · 10 pistas/mes</Text>
            </View>
          </View>
          <Pressable
            style={styles.subBtn}
            onPress={() => Alert.alert('Próximamente', 'Suscripción disponible al lanzamiento')}
          >
            <Text style={styles.subBtnText}>$2.99/mes</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <GameAsset name="coin" size={28} />
            <Text style={styles.sectionTitle}>Monedas</Text>
          </View>
          {COIN_PACKS.map((item) => <ShopCard key={item.id} item={item} />)}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <GameAsset name="clue" size={28} />
            <Text style={styles.sectionTitle}>Pistas</Text>
          </View>
          {HINT_PACKS.map((item) => <ShopCard key={item.id} item={item} />)}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.skinSectionIcon}>🎨</Text>
            <Text style={styles.sectionTitle}>Skins de patos</Text>
          </View>
          <Text style={styles.skinSectionHint}>Personaliza tus sospechosos. Equípalas en Personajes.</Text>
          {SKIN_PACKS.map((pack) => <SkinPackCard key={pack.id} pack={pack} />)}
        </View>

        <View style={styles.freeSection}>
          <Text style={styles.freeSectionTitle}>Gratis</Text>
          <Pressable
            style={styles.freeCard}
            onPress={() => Alert.alert('Anuncio', 'Ver anuncio para obtener 3 pistas (próximamente)')}
          >
            <Text style={styles.freeEmoji}>📺</Text>
            <View style={styles.freeReward}>
              <Text style={styles.freeLabel}>Ver anuncio → +3</Text>
              <GameAsset name="clue" size={22} />
            </View>
          </Pressable>
        </View>
      </ScrollView>
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
  subBanner: {
    margin: Spacing.md,
    backgroundColor: Colors.blackPremium,
    borderRadius: Radius.card,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadow.button,
  },
  subLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  subEmoji: {
    fontSize: 32,
  },
  subTitle: {
    color: Colors.yellow,
    fontWeight: '800',
    fontSize: Fonts.body,
  },
  subDesc: {
    color: Colors.grayLight,
    fontSize: 11,
  },
  subBtn: {
    backgroundColor: Colors.yellow,
    borderRadius: Radius.button,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  subBtnText: {
    fontWeight: '700',
    color: Colors.blackPremium,
    fontSize: Fonts.small,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Fonts.h3,
    fontWeight: '700',
    color: Colors.blackPremium,
    marginBottom: Spacing.xs,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  shopCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.card,
    marginBottom: Spacing.xs,
  },
  shopEmoji: {
    fontSize: 32,
  },
  shopInfo: {
    flex: 1,
  },
  shopLabel: {
    fontSize: Fonts.body,
    fontWeight: '700',
    color: Colors.blackPremium,
  },
  shopDesc: {
    fontSize: Fonts.small,
    color: Colors.gray,
  },
  priceChip: {
    backgroundColor: Colors.yellow,
    borderRadius: Radius.badge,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  priceText: {
    fontWeight: '700',
    fontSize: Fonts.small,
    color: Colors.blackPremium,
  },
  skinSectionIcon: {
    fontSize: 24,
  },
  skinSectionHint: {
    fontSize: Fonts.small,
    color: Colors.gray,
    marginBottom: Spacing.xs,
  },
  skinCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Shadow.card,
    marginBottom: Spacing.sm,
  },
  skinAccent: {
    width: 8,
  },
  skinBody: {
    flex: 1,
    padding: Spacing.md,
    gap: 4,
  },
  skinPreviewRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  skinPreviewEmoji: {
    fontSize: 26,
  },
  skinLabel: {
    fontSize: Fonts.body,
    fontWeight: '800',
    color: Colors.blackPremium,
  },
  skinDesc: {
    fontSize: Fonts.small,
    color: Colors.gray,
  },
  skinFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  skinBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.yellowDark,
    letterSpacing: 1,
  },
  freeSection: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
  },
  freeSectionTitle: {
    fontSize: Fonts.h3,
    fontWeight: '700',
    color: Colors.blackPremium,
    marginBottom: Spacing.sm,
  },
  freeCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.card,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.yellow,
    ...Shadow.card,
  },
  freeEmoji: {
    fontSize: 28,
  },
  freeLabel: {
    fontSize: Fonts.body,
    fontWeight: '600',
    color: Colors.blackPremium,
  },
  freeReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
});
