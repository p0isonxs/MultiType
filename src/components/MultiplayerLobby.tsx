// ✅ CONTEXT FIX - File: src/components/MultiplayerLobby.tsx
import { useNavigate } from "react-router";
import { useEffect, useState, useCallback } from "react";
import { LOBBY_CONTENT, ROOM_CODE_CONFIG } from "../config/loby";
import { ImageWithFallback } from "./ui/ImageWithFallback";
import { useUserData } from "../contexts/UserContext"; // ✅ Import UserContext

export default function MultiplayerLobby() {
  const navigate = useNavigate();
  const [joinedCode, setJoinedCode] = useState("");

  // ✅ FIXED: Use UserContext instead of localStorage
  const { userData, updateUserData } = useUserData();

  // ✅ FIXED: Authentication check using UserContext
  useEffect(() => {
    if (!userData.initials) {
      navigate("/");
    }
  }, [navigate, userData.initials]);

  const handleCreateRoom = useCallback(() => {
    navigate("/create-room");
  }, [navigate]);

  const handleJoinRoom = useCallback(() => {
    const trimmedCode = joinedCode.trim();
    if (!trimmedCode) return;
    const roomCode = trimmedCode.toUpperCase();

    // ✅ FIXED: Clear room settings using UserContext instead of localStorage
    updateUserData({ roomSettings: {} });

    navigate(`/room/${roomCode}/lobby`);
  }, [joinedCode, navigate, updateUserData]);

  const handleBackNavigation = useCallback(() => {
    navigate("/mode");
  }, [ navigate]);

  const handleCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setJoinedCode(e.target.value.toUpperCase());
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && joinedCode.trim()) {
        handleJoinRoom();
      }
    },
    [joinedCode, handleJoinRoom]
  );

  const isJoinDisabled = !joinedCode.trim();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="flex justify-between items-center p-3 sm:p-4">
        <button
          type="button"
          onClick={handleBackNavigation}
          className="px-3 py-2 sm:px-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg border border-gray-600 transition-all duration-200 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black"
          aria-label="Go back to mode selection"
        >
          ← Back
        </button>

        <div className="text-gray-400 text-sm sm:text-base">
          Mode <span className="text-white font-mono">multiplayer</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              {LOBBY_CONTENT.TITLE}
            </h1>
            <p className="text-gray-400 text-lg">{LOBBY_CONTENT.SUBTITLE}</p>
          </div>

          {/* Lobby Options */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Create Room */}
            <section className="bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-700">
              <div className="text-center">
                <div className="mb-6">
                  <div className="flex justify-center mb-4">
                    <ImageWithFallback
                      src="./multiplayer.png"
                      alt="Create Room"
                      fallbackIcon={LOBBY_CONTENT.CREATE_ROOM.fallbackIcon}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                    />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    {LOBBY_CONTENT.CREATE_ROOM.title}
                  </h2>
                  <p className="text-gray-400 text-sm sm:text-base">
                    {LOBBY_CONTENT.CREATE_ROOM.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCreateRoom}
                  className="w-full px-6 py-4 bg-white hover:bg-gray-200 text-black font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  {LOBBY_CONTENT.CREATE_ROOM.button}
                </button>
              </div>
            </section>

            {/* Join Room */}
            <section className="bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-700">
              <div className="text-center">
                <div className="mb-6">
                  <div className="flex justify-center mb-4">
                    <ImageWithFallback
                      src="./join.png"
                      alt="Join Room"
                      fallbackIcon={LOBBY_CONTENT.JOIN_ROOM.fallbackIcon}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                    />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    {LOBBY_CONTENT.JOIN_ROOM.title}
                  </h2>
                  <p className="text-gray-400 text-sm sm:text-base">
                    {LOBBY_CONTENT.JOIN_ROOM.description}
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleJoinRoom();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <label
                      htmlFor="room-code"
                      className="block text-sm font-semibold text-gray-300 uppercase tracking-wide text-left"
                    >
                      {LOBBY_CONTENT.JOIN_ROOM.label}
                    </label>
                    <input
                      id="room-code"
                      type="text"
                      placeholder={LOBBY_CONTENT.JOIN_ROOM.placeholder}
                      value={joinedCode}
                      onChange={handleCodeChange}
                      onKeyDown={handleKeyDown}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 text-center font-mono uppercase"
                      maxLength={ROOM_CODE_CONFIG.MAX_LENGTH}
                      autoComplete="off"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isJoinDisabled}
                    className="w-full px-6 py-4 bg-white hover:bg-gray-200 text-black font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:bg-gray-600 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900"
                  >
                    {joinedCode.trim()
                      ? `Join Room ${joinedCode}`
                      : "Enter Room Code"}
                  </button>
                </form>
              </div>
            </section>
          </div>

          {/* Footer Info */}
          <footer className="text-center mt-8">
            <p className="text-sm text-gray-500">{LOBBY_CONTENT.FOOTER}</p>
          </footer>
        </div>
      </main>
    </div>
  );
}
