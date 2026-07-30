import { SvgXml } from 'react-native-svg';
import { FLAT_CATEGORY_ICONS } from '@/lib/flat-category-icons';

export function FlatCategoryIcon({ categoryKey, size = 20 }: { categoryKey: string; size?: number }) {
  const xml = FLAT_CATEGORY_ICONS[categoryKey] || FLAT_CATEGORY_ICONS.all;
  return <SvgXml xml={xml} width={size} height={size} />;
}
