"use client";

import { useSyncExternalStore } from "react";
import {
  subscribe,
  getPredictions,
  getProfile,
  getBonus,
  type Profile,
} from "@/lib/storage";
import type { Prediction } from "@/lib/scoring";

const SERVER_PREDS: Prediction[] = [];
const SERVER_PROFILE: Profile = { deviceId: "", name: "", avatar: "", favoriteTeam: "" };

export function usePredictions(): Prediction[] {
  return useSyncExternalStore(subscribe, getPredictions, () => SERVER_PREDS);
}

export function useBonus(): number {
  return useSyncExternalStore(subscribe, getBonus, () => 0);
}

export function useProfile(): Profile {
  return useSyncExternalStore(subscribe, getProfile, () => SERVER_PROFILE);
}
