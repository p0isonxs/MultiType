// ✅ CONTEXT FIX - File: src/components/RoomGameWrapper.tsx
import { useParams, Navigate } from "react-router";
import { MultisynqRoot } from "@multisynq/react";
import { RoomTypingModel } from "../multisynq/RoomTypingModel";
import TypingGame from "../TypingGame";
import { useUserData } from "../contexts/UserContext";
import { useEffect } from "react";

export default function RoomGameWrapper() {
  const { code } = useParams();
  
  const { userData } = useUserData();

  // Check if required data exists
  if (!code || !userData.initials || !userData.avatarUrl) {
    return <Navigate to="/" />;
  }

  // ✅ NEW: Set room settings in model before initialization
  useEffect(() => {
    if (userData.roomSettings && Object.keys(userData.roomSettings).length > 0) {
      RoomTypingModel.setRoomSettings(userData.roomSettings);
    }
  }, [userData.roomSettings]);

  return (
    <MultisynqRoot
      key={`game-${code}`}
      sessionParams={{
        model: RoomTypingModel,
        appId: import.meta.env.VITE_MULTISYNQ_APP_ID,
        apiKey: import.meta.env.VITE_MULTISYNQ_API_KEY,
        name: `typing-room-${code}`, // Same session as lobby
        password: `pw-${code}`,
      }}
    >
      <TypingGame roomCode={code} />
    </MultisynqRoot>
  );
}