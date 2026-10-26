import { createContext, useContext, type ReactNode } from 'react';
import { getSettings } from './api';
import { useAsync } from '../hooks/useAsync';
import type { Settings } from '../types';

const Ctx = createContext<Settings>({});
export const useSettings = () => useContext(Ctx);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data } = useAsync(getSettings, []);
  return <Ctx.Provider value={data ?? {}}>{children}</Ctx.Provider>;
}

export const SOCIALS: { key: string; label: string }[] = [
  { key: 'social_github', label: 'GitHub' }, { key: 'social_discord', label: 'Discord' },
  { key: 'social_youtube', label: 'YouTube' }, { key: 'social_x', label: 'X' }, { key: 'social_instagram', label: 'Instagram' },
];
