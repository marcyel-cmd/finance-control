import { Capacitor } from '@capacitor/core';

// Ponto único de detecção de plataforma. Toda lógica condicional mobile/web
// deve passar por aqui, com fallback gracioso para o build web puro.
export const isNative = (): boolean => Capacitor.isNativePlatform();

export const getPlatform = (): 'ios' | 'android' | 'web' =>
  Capacitor.getPlatform() as 'ios' | 'android' | 'web';
