// src/App.tsx
import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router";
import { useUserData } from "./contexts/UserContext";
import UsernameInput from "./components/UsernameInput";
import ModeSelector from "./components/ModeSelector";
import MultiplayerLobby from "./components/MultiplayerLobby";
import SinglePlayer from "./pages/SinglePlayerGame";
import RoomLobbyWrapper from "./components/RoomLobbyWrapper";
import RoomGameWrapper from "./components/RoomGameWrapper";
import RoomSettings from "./components/RoomSettings";

export default function App() {
  const { userData, updateUserData } = useUserData();

  const [initials, setInitials] = useState<string | null>(() => {
    const initial = userData.initials;
    return initial && initial !== "" ? initial : null;
  });

  const [avatar, setAvatar] = useState<string | null>(() => {
    const avatarUrl = userData.avatarUrl;
    return avatarUrl && avatarUrl !== "/avatars/avatar1.png" ? avatarUrl : null;
  });

  useEffect(() => {
    if (userData.initials && userData.initials !== "" && userData.avatarUrl && userData.avatarUrl !== "/avatars/avatar1.png") {
      setInitials(userData.initials);
      setAvatar(userData.avatarUrl);
    }
  }, [userData.initials, userData.avatarUrl]);

  useEffect(() => {
    const handleStorageChange = () => {
      const storedInitials = localStorage.getItem("initials");
      const storedAvatar = localStorage.getItem("avatarUrl");

      if (!storedInitials || !storedAvatar) {
        setInitials(null);
        setAvatar(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const isAuthenticated = initials && avatar && initials !== "";

  return (
    <Routes>
      <Route
        path="/"
        element={
          !isAuthenticated ? (
            <UsernameInput
              onSubmit={(name, avatarUrl) => {
                updateUserData({ initials: name, avatarUrl });
                setInitials(name);
                setAvatar(avatarUrl);
              }}
            />
          ) : (
            <Navigate to="/mode" />
          )
        }
      />

      <Route
        path="/mode"
        element={isAuthenticated ? <ModeSelector /> : <Navigate to="/" />}
      />

      <Route
        path="/settings"
        element={isAuthenticated ? <RoomSettings /> : <Navigate to="/" />}
      />

      <Route
        path="/single"
        element={isAuthenticated ? <SinglePlayer /> : <Navigate to="/" />}
      />

      <Route
        path="/multiplayer"
        element={isAuthenticated ? <MultiplayerLobby /> : <Navigate to="/" />}
      />

      <Route
        path="/create-room"
        element={
          isAuthenticated ? <RoomSettings mode="create" /> : <Navigate to="/" />
        }
      />

      <Route
        path="/room/:code/lobby"
        element={isAuthenticated ? <RoomLobbyWrapper /> : <Navigate to="/" />}
      />

      <Route
        path="/room/:code"
        element={isAuthenticated ? <RoomGameWrapper /> : <Navigate to="/" />}
      />


    </Routes>
  );
}