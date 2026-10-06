import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { JournalRepository } from './repository';

export const journal = new JournalRepository(AsyncStorage, {
  id: randomUUID,
  now: () => new Date(),
  timeZone: () => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || null; }
    catch { return null; }
  },
});
