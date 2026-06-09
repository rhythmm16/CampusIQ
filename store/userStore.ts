import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessibilityProfile } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface UserState {
  accessibilityProfile: AccessibilityProfile;
  isFirstLaunch: boolean;
  deviceId: string;
  hasCompletedOnboarding: boolean;
  updateProfile: (profile: Partial<AccessibilityProfile>) => void;
  completeOnboarding: () => void;
  resetProfile: () => void;
}

const defaultProfile: AccessibilityProfile = {
  wheelchair: false,
  visual_impairment: false,
  hearing_impairment: false,
  elevator_required: false,
  avoid_stairs: false,
  slow_walker: false,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      accessibilityProfile: defaultProfile,
      isFirstLaunch: true,
      deviceId: uuidv4(),
      hasCompletedOnboarding: false,
      updateProfile: (profile) =>
        set((state) => ({
          accessibilityProfile: { ...state.accessibilityProfile, ...profile },
        })),
      completeOnboarding: () =>
        set({
          isFirstLaunch: false,
          hasCompletedOnboarding: true,
        }),
      resetProfile: () => set({ accessibilityProfile: defaultProfile }),
    }),
    {
      name: 'campusway-user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        accessibilityProfile: state.accessibilityProfile,
        isFirstLaunch: state.isFirstLaunch,
        deviceId: state.deviceId,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
      }),
    }
  )
);
