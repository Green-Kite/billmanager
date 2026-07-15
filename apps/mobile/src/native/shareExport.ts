import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

function safeFileName(value: string): string {
  return value.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

export async function shareCsv(fileName: string, csv: string): Promise<boolean> {
  if (!FileSystem.cacheDirectory) return false;
  const uri = `${FileSystem.cacheDirectory}${safeFileName(fileName)}.csv`;
  await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Share BillManager export',
    UTI: 'public.comma-separated-values-text',
  });
  return true;
}

export async function createAndSharePdf(fileName: string, html: string): Promise<boolean> {
  const result = await Print.printToFileAsync({ html, base64: false });
  if (!(await Sharing.isAvailableAsync())) return false;
  await Sharing.shareAsync(result.uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Share ${fileName}`,
    UTI: 'com.adobe.pdf',
  });
  return true;
}

export async function printHtml(html: string): Promise<void> {
  if (Platform.OS === 'web') {
    throw new Error('Native printing is not available in the web preview.');
  }
  await Print.printAsync({ html });
}
