// ✅ COMPLETELY FIXED - File: src/components/RoomLobbyWrapper.tsx
import { useParams, Navigate, useLocation } from "react-router";
import { MultisynqRoot } from "@multisynq/react";
import RoomLobby from "./RoomLobby";
import { RoomTypingModel } from "../multisynq/RoomTypingModel";
import { useUserData } from "../contexts/UserContext";
import { useEffect } from "react";

export default function RoomLobbyWrapper() {
  const { code } = useParams();
  const location = useLocation();
  const { userData, updateUserData } = useUserData();

  // Check if required data exists
  if (!code || !userData.initials || !userData.avatarUrl) {
    return <Navigate to="/" />;
  }

  // ✅ FIXED: Move room settings update to useEffect
  useEffect(() => {
    const isHost = location.state && Object.keys(location.state).length > 0;
    
    if (isHost && location.state) {
      // Host brings room settings from create flow
      updateUserData({ roomSettings: location.state });
    }
  }, [location.state]); // Only depend on location.state

  // ✅ Set room settings in model before initialization
  useEffect(() => {
    if (userData.roomSettings && Object.keys(userData.roomSettings).length > 0) {
      RoomTypingModel.setRoomSettings(userData.roomSettings);
    }
  }, [userData.roomSettings]);

  return (
    <MultisynqRoot
      sessionParams={{
        model: RoomTypingModel,
        appId: import.meta.env.VITE_MULTISYNQ_APP_ID,
        apiKey: import.meta.env.VITE_MULTISYNQ_API_KEY,
        name: `typing-room-${code}`,
        password: `pw-${code}`,
      }}
    >
      <RoomLobby />
    </MultisynqRoot>
  );
}