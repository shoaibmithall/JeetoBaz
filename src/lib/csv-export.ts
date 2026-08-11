import { Platform, Share } from 'react-native';

function escapeCsvValue(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsvValue(row[header])).join(','));
  }
  return lines.join('\n');
}

/**
 * Web: triggers a real file download. Native: falls back to the share sheet
 * with the raw CSV text, since there's no bundled file-system/sharing module
 * to write an actual .csv file to disk on device.
 */
export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) {
    alert('No data to export yet.');
    return;
  }

  const csv = rowsToCsv(rows);

  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  Share.share({ message: csv, title: filename }).catch(() => {
    alert('Export failed. Try again from the web admin panel.');
  });
}
