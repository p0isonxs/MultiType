// src/contexts/UserContext.tsx
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

const DEFAULT_AVATAR = "/avatars/avatar1.png";

// ✅ Step 1: Define types (includes sound)
interface UserData {
initials: string;
avatarUrl: string;
soundEnabled: boolean;
roomSettings: Record<string, any>;
}

interface UserContextType {
userData: UserData;
updateUserData: (updates: Partial<UserData>) => void;
// ✅ Sound functions merged here
playClickSound: () => void;
toggleSound: () => void;
}

// ✅ Step 2: Create Context
const UserContext = createContext<UserContextType | undefined>(undefined);

// ✅ Step 3: Create Provider (with Sound functionality)
interface UserProviderProps {
children: ReactNode;
}

export const UserProvider = ({ children }: UserProviderProps) => {
// ✅ HANYA SEKALI baca localStorage - saat initialization
const [userData, setUserData] = useState<UserData>(() => {
    const initials = localStorage.getItem("initials");
const avatarUrl = localStorage.getItem("avatarUrl");

  
  return {
    initials: initials || "", // ✅ FIXED: Empty string instead of "Player"
  avatarUrl: avatarUrl || DEFAULT_AVATAR,
    soundEnabled: localStorage.getItem("soundEnabled") !== "false", // default true
    roomSettings: JSON.parse(localStorage.getItem("roomSettings") || "{}")
  };
});

// ✅ Sound functionality merged from SoundContext
const clickRef = useRef<HTMLAudioElement | null>(null);

// Initialize sound
useEffect(() => {
  clickRef.current = new Audio("/click.mp3");
  if (clickRef.current) clickRef.current.volume = 1.0;

  const handleUserInteraction = () => {
    document.removeEventListener("click", handleUserInteraction);
  };

  if (userData.soundEnabled) {
    document.addEventListener("click", handleUserInteraction);
  }

  return () => {
    document.removeEventListener("click", handleUserInteraction);
  };
}, [userData.soundEnabled]);

// ✅ Sound functions
const playClickSound = () => {
  if (userData.soundEnabled && clickRef.current) {
    clickRef.current.currentTime = 0;
    clickRef.current.play().catch(() => {});
  }
};

const toggleSound = () => {
  const newSoundEnabled = !userData.soundEnabled;
  updateUserData({ soundEnabled: newSoundEnabled });
};

// ✅ Step 4: Update function (also updates localStorage)
const updateUserData = (updates: Partial<UserData>) => {
  setUserData(prev => {
    const newData = { ...prev, ...updates };
    
    // Update localStorage when state updates
    if (updates.initials) localStorage.setItem("initials", updates.initials);
    if (updates.avatarUrl) localStorage.setItem("avatarUrl", updates.avatarUrl);
    if (updates.soundEnabled !== undefined) localStorage.setItem("soundEnabled", String(updates.soundEnabled));
    if (updates.roomSettings) localStorage.setItem("roomSettings", JSON.stringify(updates.roomSettings));
    
    return newData;
  });
};

return (
  <UserContext.Provider value={{ 
    userData, 
    updateUserData,
    playClickSound,
    toggleSound 
  }}>
    {children}
  </UserContext.Provider>
);
};

// ✅ Step 5: Custom hooks for easy access
export const useUserData = () => {
const context = useContext(UserContext);
if (!context) {
  throw new Error("useUserData must be used within UserProvider");
}
return context;
};

// ✅ Backward compatibility hook for sound (optional)
export const useSound = () => {
const context = useContext(UserContext);
if (!context) {
  throw new Error("useSound must be used within UserProvider");
}

return {
  playClickSound: context.playClickSound,
  toggleSound: context.toggleSound,
  soundEnabled: context.userData.soundEnabled
};
};