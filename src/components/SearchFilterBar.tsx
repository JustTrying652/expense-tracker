import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, fonts } from '../theme';

export type TypeFilter = 'all' | 'income' | 'expense';
export type DateFilter = 'all' | 'thisMonth' | 'lastMonth' | 'last3Months';

interface Props {
  search: string;
  onSearchChange: (text: string) => void;
  typeFilter: TypeFilter;
  onTypeFilterChange: (f: TypeFilter) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (f: DateFilter) => void;
}

const TYPE_OPTIONS: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: 'ALL' },
  { key: 'income', label: 'INCOME' },
  { key: 'expense', label: 'EXPENSE' },
];

const DATE_OPTIONS: { key: DateFilter; label: string }[] = [
  { key: 'all', label: 'ALL TIME' },
  { key: 'thisMonth', label: 'THIS MONTH' },
  { key: 'lastMonth', label: 'LAST MONTH' },
  { key: 'last3Months', label: 'LAST 3 MONTHS' },
];

export default function SearchFilterBar({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  dateFilter,
  onDateFilterChange,
}: Props) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search by note or category..."
        placeholderTextColor={colors.ash}
        value={search}
        onChangeText={onSearchChange}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {TYPE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.chip, typeFilter === opt.key && styles.chipActive]}
            onPress={() => onTypeFilterChange(opt.key)}
          >
            <Text style={[styles.chipText, typeFilter === opt.key && styles.chipTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {DATE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.chip, dateFilter === opt.key && styles.chipActiveGold]}
            onPress={() => onDateFilterChange(opt.key)}
          >
            <Text style={[styles.chipText, dateFilter === opt.key && styles.chipTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: colors.paper },
  searchInput: {
    borderWidth: 1.5,
    borderColor: '#D9D3C4',
    borderRadius: 8,
    padding: 10,
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.ink,
    backgroundColor: colors.white,
    marginBottom: 10,
  },
  chipRow: { gap: 8, paddingBottom: 8 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D9D3C4',
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipActiveGold: { backgroundColor: colors.kangaGold, borderColor: colors.kangaGold },
  chipText: { fontFamily: fonts.displayMedium, fontSize: 10, color: colors.ash, letterSpacing: 0.5 },
  chipTextActive: { color: colors.white },
});