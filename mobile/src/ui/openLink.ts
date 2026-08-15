import { Alert, Linking } from 'react-native';

/**
 * يفتح رابطًا خارجيًّا في متصفّح النظام.
 * ترفض الدالّة ما ليس `http(s)` — لا `javascript:` ولا `data:`.
 */
export async function openExternal(url: string | null | undefined): Promise<boolean> {
  if (!url || !/^https?:\/\//i.test(url.trim())) {
    Alert.alert('رابط غير صالح', 'هذا الرابط غير صالح للفتح.');
    return false;
  }
  try {
    await Linking.openURL(url.trim());
    return true;
  } catch {
    Alert.alert('تعذّر فتح الرابط', 'لم نتمكّن من فتح هذا الرابط على جهازك.');
    return false;
  }
}
