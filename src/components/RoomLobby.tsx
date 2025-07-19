// ✅ FIXED - File: src/components/RoomLobby.tsx
import { useNavigate, useParams } from "react-router";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  useReactModelRoot,
  useSession,
  useDetachCallback,
  usePublish,
  useSubscribe,
  useViewId,
  useLeaveSession,
} from "@multisynq/react";
import { TypingModel } from "../multisynq/TypingModel";
import { useUserData } from "../contexts/UserContext"; // ✅ Import UserContext
import toast from "react-hot-toast";
import { SendIcon } from "lucide-react";

const DEFAULT_AVATAR = "/avatars/avatar1.png";

// ✅ NEW: Chat message interface
interface ChatMessage {
  id: string;
  viewId: string;
  initials: string;
  avatarUrl: string;
  message: string;
  timestamp: number;
}

export default function RoomLobby() {
  const model = useReactModelRoot<TypingModel>();
  const session = useSession();
  const { code } = useParams();
  const navigate = useNavigate();
  const viewId = useViewId();
  const leaveSession = useLeaveSession();

  // ✅ FIXED: Use UserContext instead of localStorage
  const { userData } = useUserData();

  // Refs to prevent excessive re-renders
  const lastPlayersRef = useRef<string>("");
  const initsSentRef = useRef(false);
  const settingsInitializedRef = useRef(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // ✅ NEW: Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useDetachCallback(() => {
    leaveSession();
  });

  const sendStart = usePublish(() => ["game", "start"]);
  const sendInitials = usePublish<string>((initials) => [
    viewId!,
    "set-initials",
    initials,
  ]);
  const sendAvatar = usePublish<string>((url) => [viewId!, "set-avatar", url]);
  const initializeRoomSettings = usePublish<any>((settings) => [
    "room",
    "initialize-settings",
    settings
  ]);

  // ✅ NEW: Chat publish function
  const sendChatMessage = usePublish<ChatMessage>((message) => [
    "chat",
    "message",
    message
  ]);

  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState(
    Array.from(model?.players.entries() || [])
  );

  // ✅ NEW: Handle incoming chat messages
  const handleChatMessage = useCallback((message: ChatMessage) => {
    setChatMessages(prev => [...prev, message]);

    // Increment unread count if chat is closed
    if (!isChatOpen) {
      setUnreadCount(prev => prev + 1);
    }
  }, [isChatOpen]);

  // ✅ NEW: Subscribe to chat messages
  useSubscribe("chat", "message-received", handleChatMessage);

  // ✅ NEW: Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // ✅ NEW: Reset unread count when chat is opened
  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
    }
  }, [isChatOpen]);

  // Optimized update function to prevent excessive re-renders
  const updatePlayers = useCallback(() => {
    if (!model) return;

    const entries = Array.from(model.players.entries());
    const playersKey = entries.map(([id, p]) => `${id}:${p.initials}`).join("|");

    // Only update if players actually changed
    if (playersKey !== lastPlayersRef.current) {
      lastPlayersRef.current = playersKey;
      setPlayers(entries);

      // Host determination
      if (viewId && entries.length > 0) {
        const firstViewId = entries[0][0];
        setIsHost(viewId === firstViewId);
      }
    }
  }, [model, viewId]);

  useSubscribe("view", "update", updatePlayers);

  // ✅ FIXED: Send user info only once with UserContext values
  useEffect(() => {
    if (model && viewId && !initsSentRef.current) {
      // Send user info immediately with context values
      sendInitials(userData.initials);
      sendAvatar(userData.avatarUrl);
      initsSentRef.current = true;
    }
  }, [model, viewId, sendInitials, sendAvatar, userData.initials, userData.avatarUrl]);

  useEffect(() => {
    if (model?.chatMessages && model.chatMessages.length !== chatMessages.length) {
      setChatMessages(model.chatMessages);
    }
  }, [model?.chatMessages?.length]);

  // ✅ FIXED: Initialize room settings only once with UserContext
  useEffect(() => {
    if (model && viewId && !settingsInitializedRef.current && model.players.size <= 1) {
      if (userData.roomSettings && Object.keys(userData.roomSettings).length > 0) {
        initializeRoomSettings(userData.roomSettings);
        settingsInitializedRef.current = true;
      }
    }
  }, [model, viewId, initializeRoomSettings, userData.roomSettings]);



  // ✅ FIXED: Navigate to game when COUNTDOWN STARTS, not when game starts
  useEffect(() => {
    if (model?.countdownActive && code) {
      // ✅ SMALL DELAY: Give a moment for the model to fully update
      setTimeout(() => {
        navigate(`/room/${code}`);
      }, 100);
    }
  }, [model?.countdownActive, code, navigate]);

  // ✅ FIXED: Helper functions use UserContext values
  const getPlayerAvatar = useCallback((playerId: string, player: any) => {
    if (playerId === viewId) {
      return userData.avatarUrl; // ✅ From UserContext
    }
    return player.avatarUrl || DEFAULT_AVATAR;
  }, [viewId, userData.avatarUrl]);

  const getPlayerName = useCallback((playerId: string, player: any) => {
    if (playerId === viewId) {
      return userData.initials || "You"; // ✅ From UserContext
    }
    return player.initials || `Guest_${playerId.substring(0, 6)}`;
  }, [viewId, userData.initials]);

  // ✅ NEW: Chat functions
  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim() || !viewId) return;

    const message: ChatMessage = {
      id: `${viewId}-${Date.now()}`,
      viewId,
      initials: userData.initials,
      avatarUrl: userData.avatarUrl,
      message: currentMessage.trim(),
      timestamp: Date.now()
    };

    sendChatMessage(message);
    setCurrentMessage("");
  }, [currentMessage, viewId, userData.initials, userData.avatarUrl, sendChatMessage]);

  const toggleChat = useCallback(() => {
    setIsChatOpen(prev => !prev);
  }, []);

  const formatTime = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  if (!model || !viewId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading lobby...</p>
        </div>
      </div>
    );
  }

  const handleStart = () => {
    if (!isHost) return;
    sendStart();
  };

  const handleExit = () => {
    leaveSession();
    navigate("/multiplayer");
  };

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Header */}
      <div className="flex justify-between items-center p-3 sm:p-4">
        <button
          onClick={handleExit}
          className="px-3 py-2 sm:px-4 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg border border-gray-600 transition-all duration-200 text-sm sm:text-base"
        >
          ← Exit Lobby
        </button>
        <div className="text-gray-400 text-sm sm:text-base">
          Mode <span className="text-white font-mono">multiplayer</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center p-4 min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-4xl">
          {/* Room Code Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Room Lobby
            </h1>
            <div className="mb-4">
              <p className="text-gray-400 text-lg mb-2">Room Code:</p>
              <div
                onClick={() => {
                  if (code) {
                    navigator.clipboard.writeText(code);
                    toast.success("Room code copied!");
                  }
                }}
                className="inline-block bg-gray-900 px-6 py-3 rounded-xl border border-gray-700 cursor-pointer hover:bg-gray-800 transition duration-200 group"
              >
                <span className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-widest ">
                  {code}
                </span>
              </div>
            </div>
            <p className="text-gray-400">
              Share this code with your friends to join!
            </p>
          </div>

          {/* Room Settings Display */}
          <div className="bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-700 mb-6">
            <h2 className="text-xl font-bold text-white mb-4 text-center">
              Game Settings
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Theme</div>
                <div className="text-white font-semibold capitalize">
                  {model.theme}
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Words</div>
                <div className="text-white font-semibold">
                  {model.sentenceLength}
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Time</div>
                <div className="text-white font-semibold">
                  {model.timeLimit}s
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
                <div className="text-xs text-gray-400 mb-1">Max Players</div>
                <div className="text-white font-semibold">
                  {model.maxPlayers}
                </div>
              </div>
            </div>
          </div>

          {/* Players Section */}
          <div className="bg-gray-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-700 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-6 text-center">
              Players ({players.length}/{model.maxPlayers})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {players.map(([id, player]) => (
                <div
                  key={id}
                  className="bg-gray-800 rounded-xl p-4 border border-gray-600 animate-fadeIn"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={getPlayerAvatar(id, player)}
                      alt={getPlayerName(id, player)}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-600"
                      onError={(e) => {
                        e.currentTarget.src = DEFAULT_AVATAR;
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white">
                          {getPlayerName(id, player)}
                        </span>
                        {id === viewId && (
                          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                            You
                          </span>
                        )}
                        {players[0] && players[0][0] === id && (
                          <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                            Host
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: model.maxPlayers - players.length }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="bg-gray-800 rounded-xl p-4 border-2 border-dashed border-gray-600 opacity-50"
                >
                  <div className="flex items-center justify-center h-12">
                    <span className="text-gray-500 text-sm">Waiting for player...</span>
                  </div>
                </div>
              ))}
            </div>

            {players.length <= 1 && (
              <div className="text-center mt-6 p-4 bg-gray-800 rounded-xl border border-gray-600">
                <div className="animate-pulse">
                  <div className="w-8 h-8 bg-gray-600 rounded-full mx-auto mb-3"></div>
                  <p className="text-gray-400">
                    Waiting for more players to join...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Section */}
          <div className="text-center">
            {isHost ? (
              <button
                onClick={handleStart}
                disabled={players.length <= 1}
                className="px-8 py-4 bg-white hover:bg-gray-200 text-black font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:bg-gray-600 disabled:text-gray-400 text-lg"
              >
                {players.length <= 1 ? "Need More Players" : "Start Game"}
              </button>
            ) : (
              <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <p className="text-gray-400 text-lg">
                    Waiting for host to start the game...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ NEW: Chat Toggle Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 bg-gray-900 hover:bg-gray-800 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 z-50"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* ✅ NEW: Chat Panel */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-40 animate-slideUp">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Room Chat</h3>
            <button
              onClick={toggleChat}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Chat Messages */}
          <div
            ref={chatScrollRef}
            className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-800"
          >
            {chatMessages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm">No messages yet</p>
                <p className="text-xs">Start the conversation!</p>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-2 ${msg.viewId === viewId ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                >
                  <img
                    src={msg.avatarUrl || DEFAULT_AVATAR}
                    alt={msg.initials}
                    className="w-8 h-8 rounded-full object-cover border border-gray-600 flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_AVATAR;
                    }}
                  />
                  <div className={`max-w-[70%] ${msg.viewId === viewId ? 'text-right' : ''}`}>
                  <div className="flex items-center justify-end gap-2 w-full pr-1 mb-1">
                      <span className="text-xs font-medium text-gray-300">
                        {msg.viewId === viewId ? 'You' : msg.initials}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <div
                      className={`px-3 py-2 rounded-lg text-sm ${msg.viewId === viewId
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-100'
                        }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={200}
              />
              <button
                type="submit"
                disabled={!currentMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors duration-200"
              >
               <SendIcon className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}