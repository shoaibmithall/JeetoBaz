import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/hooks/use-theme';
import { parseBlogContent } from '@/lib/blog';

export function BlogContent({ content }: { content: string }) {
  const { theme } = useAppTheme();
  const blocks = parseBlogContent(content);

  return (
    <View style={styles.wrap}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <Text key={index} style={[styles.heading, { color: theme.gold }]}>
              {block.text}
            </Text>
          );
        }
        if (block.type === 'bullet') {
          return (
            <View key={index} style={styles.bulletGroup}>
              {block.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.bulletRow}>
                  <View style={[styles.bulletDot, { backgroundColor: theme.primary }]} />
                  <Text style={[styles.bulletText, { color: theme.text }]}>{item}</Text>
                </View>
              ))}
            </View>
          );
        }
        return (
          <Text key={index} style={[styles.paragraph, { color: theme.text }]}>
            {block.text}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  heading: { fontSize: 19, fontWeight: '800', marginTop: 10, lineHeight: 25 },
  paragraph: { fontSize: 15, lineHeight: 24 },
  bulletGroup: { gap: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  bulletText: { flex: 1, fontSize: 15, lineHeight: 23 },
});
