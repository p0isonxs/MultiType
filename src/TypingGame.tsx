import { useState, useEffect, useRef, useCallback } from "react";
import {
  useReactModelRoot,
  useSession,
  usePublish,
  useSubscribe,
  useViewId,
  useLeaveSession,
} from "@multisynq/react";
import { TypingModel } from "./multisynq/TypingModel";
import { useNavigate } from "react-router";
import { useUserData } from "./contexts/UserContext";

const DEFAULT_AVATAR = "/avatars/avatar1.png";

type Props = {
  roomCode?: string;
};

export default function TypingGame({ roomCode }: Props) {
  const model = useReactModelRoot<TypingModel>();
  const session = useSession();
  const [inputValue, setInputValue] = useState("");
  const [wordError, setWordError] = useState(false);
  const [userId, setUserId] = useState("");
  const [, forceUpdate] = useState(0);
  const navigate = useNavigate();
  const viewId = useViewId();
  const leaveSession = useLeaveSession();

  const { userData } = useUserData();

  // ✅ FIXED: Remove local countdown states, use model's countdown
  const [gameState, setGameState] = useState("waiting");
  const [isHost, setIsHost] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // ✅ FIXED: Refs for anti-loop optimization
  const lastPlayersRef = useRef<string>("");
  const initsSentRef = useRef(false);

  const sendInitials = usePublish<string>((initials) => [
    viewId!,
    "set-initials",
    initials,
  ]);
  const sendAvatar = usePublish<string>((url) => [viewId!, "set-avatar", url]);
  const sendTypedWord = usePublish<boolean>((correct) => [
    viewId!,
    "typed-word",
    correct,
  ]);
  const startGame = usePublish(() => ["game", "start"]);
  const resetGame = usePublish(() => ["game", "reset"]);

  // ✅ FIXED: Use model's countdown state instead of local state
  useEffect(() => {
    if (model?.countdownActive && model?.countdown === 0) {
      // Auto-focus when countdown finishes
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [model?.countdownActive, model?.countdown]);

  // ✅ FIXED: Send user info only once with proper guards
  useEffect(() => {
    if (model && viewId && !initsSentRef.current) {
      const userExists = model.players.has(viewId);
      if (userExists && model.players.get(viewId)?.initials) {
        initsSentRef.current = true;
        setUserId(userData.initials);
        return;
      }

      setUserId(userData.initials);
      sendInitials(userData.initials);
      sendAvatar(userData.avatarUrl);
      initsSentRef.current = true;
    }
  }, [
    model,
    viewId,
    roomCode,
    sendInitials,
    sendAvatar,
    userData.initials,
    userData.avatarUrl,
  ]);

  // ✅ FIXED: Simplified game state management using model state
  useEffect(() => {
    if (!model || !viewId) return;

    const playerCount = model.players.size;
    
  

    // ✅ FIXED: Check countdown FIRST, before checking started
    if (model.countdownActive) {
      setGameState("countdown");
    } else if (model.started && model.timeLeft > 0) {
      setGameState("playing");
    } else if (!model.started && model.timeLeft === 0) {
      setGameState("finished");
    } else if (!model.started && playerCount < 2) {
      setGameState("waiting");
    } else {
      setGameState("ready");
    }
  }, [
    model?.started,
    model?.players?.size,
    model?.timeLeft,
    model?.countdownActive,
    model?.countdown,
    viewId,
  ]);

  if (!model || !viewId || !model.players.has(viewId)) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading Typing Battle...</p>
        </div>
      </div>
    );
  }

  const handleExit = () => {
    if (!model.started) {
      navigate(`/room/${roomCode}/lobby`);
    } else {
      leaveSession();
      navigate("/multiplayer");
    }
  };

  // ✅ FIXED: Optimized player update with proper comparison
  const updatePlayers = useCallback(() => {
    if (!model) return;

    const entries = Array.from(model.players.entries());
    const playersKey = entries
      .map(([id, p]) => `${id}:${p.initials}:${p.progress}:${p.score}`)
      .join("|");

    if (playersKey !== lastPlayersRef.current) {
      lastPlayersRef.current = playersKey;
      forceUpdate((prev) => prev + 1);
      if (viewId && entries.length > 0) {
        const firstViewId = entries[0][0];
        setIsHost(viewId === firstViewId);
      }
    }
  }, [model]);

  useSubscribe("view", "update", updatePlayers);

  const player = model.players.get(viewId)!;
  const currentIndex = player.index;
  const word = model.words[currentIndex];
  const isCompleted = currentIndex >= model.words.length;

  useEffect(() => {
    if (model.started && inputRef.current && !isCompleted && gameState === "playing") {
      inputRef.current.focus();
    }
  }, [model.started, isCompleted, gameState]);

  const handleSubmit = () => {
    if (!inputValue.trim() || isCompleted || gameState !== "playing") return;

    const correct = inputValue.trim() === word;

    new Audio(correct ? "/uwu-sound-119010.mp3" : "/fart-83471.mp3").play();

    if (!correct) {
      setWordError(true);
      setTimeout(() => setWordError(false), 500);
    } else {
      if (inputRef.current) {
        inputRef.current.classList.add("correct");
        setTimeout(() => {
          inputRef.current?.classList.remove("correct");
        }, 250);
      }
    }

    sendTypedWord(correct);
    setInputValue("");
  };

  const getTimeColor = () => {
    if (model.timeLeft > model.timeLimit * 0.5) return "text-white";
    if (model.timeLeft > model.timeLimit * 0.25) return "text-yellow-400";
    return "text-red-400";
  };

  const getPlayerAvatar = useCallback(
    (playerId: string, player: any) => {
      if (playerId === viewId) {
        return userData.avatarUrl;
      }
      return player.avatarUrl || DEFAULT_AVATAR;
    },
    [viewId, userData.avatarUrl]
  );

  const getTruncatedName = (name: string) => {
    return name.length > 8 ? name.substring(0, 8) + "..." : name;
  };

  // ✅ FIXED: Use model's startWithCountdown instead of direct start
  const handlePlayAgain = () => {
    if (!isHost) return;
    resetGame();
    
    setTimeout(() => {
      // This will trigger the countdown in the model
      startGame();
    }, 100);
  };

  const WORDS_PER_CHUNK = 20;

  const getCurrentChunk = () => {
    const chunkIndex = Math.floor(currentIndex / WORDS_PER_CHUNK);
    const startIndex = chunkIndex * WORDS_PER_CHUNK;
    const endIndex = Math.min(startIndex + WORDS_PER_CHUNK, model.words.length);

    return {
      words: model.words.slice(startIndex, endIndex),
      startIndex: startIndex,
      chunkIndex: chunkIndex,
    };
  };

  const renderChunkedText = () => {
    if (isCompleted) {
      return (
        <div className="text-center text-lg font-bold text-green-400 bg-gray-900 rounded-lg p-6 border border-gray-700">
          🎉 Congratulations! You completed all words! 🎉
        </div>
      );
    }

    const chunk = getCurrentChunk();
    const relativeIndex = currentIndex - chunk.startIndex;

    return (
      <div className="text-xs sm:text-sm md:text-base font-mono leading-relaxed bg-gray-900 rounded-md p-2 sm:p-3 border border-gray-700 min-h-[100px] sm:min-h-[120px] max-h-[180px] sm:max-h-[200px] overflow-hidden transition-opacity duration-300 select-none">
        <div className="flex flex-wrap gap-x-1 gap-y-1">
          {chunk.words.map((chunkWord, wordIndex) => (
            <span key={chunk.startIndex + wordIndex} className="inline-block">
              {wordIndex < relativeIndex
                ? chunkWord.split("").map((letter, letterIndex) => (
                  <span
                    key={letterIndex}
                    className="text-green-400 rounded-sm"
                  >
                    {letter}
                  </span>
                ))
                : wordIndex === relativeIndex
                  ? chunkWord.split("").map((letter, letterIndex) => {
                    const isTyped = letterIndex < inputValue.length;
                    const isCorrect =
                      isTyped && inputValue[letterIndex] === letter;
                    const isIncorrect =
                      isTyped && inputValue[letterIndex] !== letter;
                    const isCurrent = letterIndex === inputValue.length;

                    return (
                      <span
                        key={letterIndex}
                        className={`rounded-sm ${isCorrect
                          ? "text-green-400"
                          : isIncorrect
                            ? "text-red-400"
                            : isCurrent
                              ? "text-white"
                              : "text-gray-300"
                          }`}
                      >
                        {letter}
                      </span>
                    );
                  })
                  : chunkWord.split("").map((letter, letterIndex) => (
                    <span key={letterIndex} className="text-gray-400">
                      {letter}
                    </span>
                  ))}
            </span>
          ))}
        </div>

        <div className="mt-2 text-center text-xs text-gray-500">
          Word {currentIndex + 1} of {model.words.length} | Chunk{" "}
          {Math.floor(currentIndex / WORDS_PER_CHUNK) + 1} of{" "}
          {Math.ceil(model.words.length / WORDS_PER_CHUNK)}
        </div>
      </div>
    );
  };

  const getIndexProgress = (p: typeof player) => {
    if (!model.words.length) return 0;
    return Math.min((p.index / model.words.length) * 100, 100);
  };

  const showGameOver = model.timeLeft === 0 || isCompleted;

  const getTrackLanes = () => {
    const players = [...model.players.entries()];
    const laneHeight = 50;

    return players.map(([id, p], index) => ({
      id,
      player: p,
      yPosition: index * laneHeight,
      isCurrentPlayer: id === viewId,
    }));
  };

  // ✅ FIXED: Use model's countdown state
  const CountdownOverlay = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="text-center">
          <div className="text-8xl sm:text-9xl font-bold text-white mb-4 animate-pulse">
            {model.countdown > 0 ? model.countdown : "GO!"}
          </div>
          <div className="text-xl sm:text-2xl text-gray-300">
            {model.countdown > 0 ? "Get Ready..." : "Start Typing!"}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
  
      {model.countdownActive && <CountdownOverlay />}

      {/* Header with room code */}
      <div className="flex justify-between items-center p-1 sm:p-2">
        <button
          onClick={handleExit}
          className="px-2 py-1 sm:px-2 sm:py-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-md border border-gray-600 transition-all duration-200 text-xs"
        >
          ← {model.started ? "Exit Game" : "Back to Lobby"}
        </button>
        <div className="text-gray-400 text-xs">
          {roomCode ? (
            <>
              Room <span className="text-white font-mono">{roomCode}</span>
            </>
          ) : (
            <>
              Mode <span className="text-white font-mono">multiplayer</span>
            </>
          )}
        </div>
      </div>

      {/* Single Multiplayer Racing Track */}
      <div className="px-1 sm:px-2 py-1 sm:py-2">
        <div className="max-w-5xl mx-auto">
          <div className="mb-2 sm:mb-3">
            <div className="relative bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-700">
              {getTrackLanes().map((lane) => (
                <div
                  key={`name-${lane.id}`}
                  className="absolute left-0 transform -translate-x-full -translate-y-1/2 pr-2 flex items-center"
                  style={{ top: `${lane.yPosition + 37}px` }}
                >
                  <div
                    className={`text-xs font-semibold whitespace-nowrap ${lane.isCurrentPlayer ? "text-blue-400" : "text-white"
                      }`}
                  >
                    {getTruncatedName(lane.player.initials || lane.id)}
                    {lane.isCurrentPlayer && (
                      <span className="text-blue-400 ml-1">(You)</span>
                    )}
                  </div>
                </div>
              ))}

              {getTrackLanes().map((lane) => (
                <div
                  key={`progress-${lane.id}`}
                  className="absolute right-0 transform translate-x-full -translate-y-1/2 pl-2"
                  style={{ top: `${lane.yPosition + 37}px` }}
                >
                  <div className="text-xs text-gray-400">
                    {Math.round(lane.player.progress)}%
                  </div>
                  {lane.player.progress >= 100 && (
                    <div className="text-xs text-yellow-400 font-bold">
                      FINISHED!
                    </div>
                  )}
                </div>
              ))}

              <div
                className="relative bg-gray-700 rounded-md border-3 border-gray-600 overflow-hidden"
                style={{ height: `${getTrackLanes().length * 50}px` }}
              >
                {getTrackLanes().map(
                  (lane, index) =>
                    index > 0 && (
                      <div
                        key={`divider-${index}`}
                        className="absolute left-0 right-0 h-0.5 bg-gray-600"
                        style={{ top: `${lane.yPosition}px` }}
                      />
                    )
                )}

                {getTrackLanes().map((lane, index) => (
                  <div
                    key={`centerline-${index}`}
                    className="absolute left-0 right-0 h-0.5 border-t-2 border-dotted border-gray-500"
                    style={{ top: `${lane.yPosition + 25}px` }}
                  />
                ))}

                <div className="absolute left-8 top-0 bottom-0 w-1 bg-white" />

                <div className="absolute right-0 top-0 bottom-0 w-3">
                  <div className="grid grid-cols-2 h-full">
                    {Array.from(
                      { length: getTrackLanes().length * 3 },
                      (_, i) => (
                        <div
                          key={i}
                          className={`${i % 2 === 0 ? "bg-white" : "bg-black"
                            } border border-gray-400`}
                        />
                      )
                    )}
                  </div>
                </div>

                {getTrackLanes().map((lane) => (
                  <div
                    key={lane.id}
                    className={`absolute transform -translate-y-1/2 transition-all duration-500 ease-out ${lane.player.progress >= 100 ? "animate-bounce" : ""
                      }`}
                    style={{
                      left: `${getIndexProgress(lane.player)}%`,
                      top: `${lane.yPosition + 25}px`,
                    }}
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16">
                      <img
                        src={getPlayerAvatar(lane.id, lane.player)}
                        alt={lane.player.initials || lane.id}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_AVATAR;
                        }}
                      />
                    </div>
                    {lane.player.progress >= 100 && (
                      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                        <span className="text-sm">👑</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Game Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
            <div className="bg-gray-900 rounded-md p-2 text-center border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Time</div>
              <div className={`text-sm font-bold ${getTimeColor()}`}>
                {model.timeLeft}s
              </div>
            </div>
            <div className="bg-gray-900 rounded-md p-2 text-center border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Players</div>
              <div className="text-sm font-bold">
                {model.players.size}/{model.maxPlayers || 6}
              </div>
            </div>
            <div className="bg-gray-900 rounded-md p-2 text-center border border-gray-700 col-span-2 sm:col-span-1">
              <div className="text-xs text-gray-400 mb-1">WPM</div>
              <div className="text-sm font-bold">{player.wpm || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Text Display */}
      <div className="px-2 sm:px-3 py-2 sm:py-3">
        <div className="max-w-5xl mx-auto">
          {gameState === "waiting" ? (
            <div className="text-center bg-gray-900 rounded-md p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-2">
                Waiting for Players
              </h2>
              <p className="text-gray-400 mb-4">
                {model.players.size} of {model.maxPlayers || 6} players joined
              </p>
              {model.players.size >= 2 && (
                <p className="text-green-400">Game will start automatically!</p>
              )}
            </div>
          ) : gameState === "playing" && !isCompleted ? (
            <div className="text-center">{renderChunkedText()}</div>
          ) : (
            <div className="text-center">
              {showGameOver ? (
                <div className="space-y-3 bg-gray-900 rounded-md p-6 border border-gray-700">
                  <h2 className="text-lg font-bold text-white mb-2">
                    {isCompleted
                      ? "Race Finished!"
                      : player.score === model.words.length
                        ? "Perfect Score!"
                        : "Game Over!"}
                  </h2>

                  <div className="text-base mb-2">
                    Final Score:{" "}
                    <span className="font-bold">{player.score}</span> /{" "}
                    {model.words.length} words
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-2 text-sm">
                    <div className="text-gray-400">
                      <div>WPM</div>
                      <div className="text-white font-bold">
                        {player.wpm || 0}
                      </div>
                    </div>
                    <div className="text-gray-400">
                      <div>Accuracy</div>
                      <div className="text-white font-bold">
                        {player.score > 0
                          ? Math.round((player.score / currentIndex) * 100)
                          : 100}
                        %
                      </div>
                    </div>
                    <div className="text-gray-400">
                      <div>Progress</div>
                      <div className="text-white font-bold">
                        {Math.round(player.progress) || 0}%
                      </div>
                    </div>
                  </div>
                  {isHost && (
                    <button
                      onClick={handlePlayAgain}
                      className="px-4 py-2 bg-white hover:bg-gray-200 text-black font-bold rounded-md text-sm shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      Play Again
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2 bg-gray-900 rounded-md p-3 sm:p-4 border border-gray-700">
                  <h2 className="text-base sm:text-lg font-bold text-white mb-2">
                    Ready to Race?
                  </h2>
                  <p className="text-gray-400 mb-2 text-xs">
                    Multiplayer typing challenge with {model.words.length} words
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2 text-xs">
                    <div className="text-gray-400">
                      <div>Theme</div>
                      <div className="text-white font-semibold">
                        {model.theme || "Default"}
                      </div>
                    </div>
                    <div className="text-gray-400">
                      <div>Max Length</div>
                      <div className="text-white font-semibold">
                        {model.words.length}
                      </div>
                    </div>
                    <div className="text-gray-400">
                      <div>Time Limit</div>
                      <div className="text-white font-semibold">
                        {model.timeLimit}s
                      </div>
                    </div>
                  </div>

                  {isHost && model.players.size >= 2 && (
                    <button
                      onClick={() => startGame()}
                      className="px-3 sm:px-4 py-2 bg-white hover:bg-gray-200 text-black font-bold rounded-md text-xs sm:text-sm shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                    >
                      Start Race
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input Field - show when game is playing */}
      {gameState === "playing" && !isCompleted && !model.countdownActive && (
        <div className="px-1 sm:px-2 pb-2">
          <div className="max-w-4xl mx-auto">
            <label className="block text-gray-400 text-xs mb-1">
              Type here
            </label>
            <input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => {
                if (gameState === "playing") {
                  setInputValue(e.target.value);
                }
              }}
              onKeyDown={(e) => {
                if ([" ", "Enter"].includes(e.key)) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className={`w-full px-2 py-2 text-sm bg-white rounded-md text-black focus:outline-none transition-all duration-200 ${wordError
                ? "ring-2 ring-red-500"
                : "focus:ring-2 focus:ring-blue-500"
                }`}
              placeholder={word || "Start typing..."}
            />
            <div className="mt-1 text-center text-gray-400 text-xs">
              Press space or enter to submit
            </div>
          </div>
        </div>
      )}

      {/* Live Leaderboard */}
      {(gameState === "waiting" || showGameOver) && (
        <div className="px-2 sm:px-3 pb-4 sm:pb-6">
          <div className="bg-gray-900 rounded-md p-2 border border-gray-700 max-w-5xl mx-auto">
            <h3 className="text-sm sm:text-base font-bold text-white mb-2 text-center">
              {showGameOver ? "Final Results" : "Live Leaderboard"}
            </h3>
            <div className="space-y-1">
              {[...model.players.entries()]
                .sort((a, b) => {
                  const aCompleted = a[1].progress >= 100 ? 1 : 0;
                  const bCompleted = b[1].progress >= 100 ? 1 : 0;

                  if (aCompleted !== bCompleted) {
                    return bCompleted - aCompleted;
                  }

                  return b[1].score - a[1].score;
                })
                .map(([id, p], index) => (
                  <div
                    key={id}
                    className="flex justify-between items-center p-2 bg-gray-800 rounded-md"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xs">
                        {p.progress >= 100
                          ? "🏁"
                          : index === 0
                            ? "🥇"
                            : index === 1
                              ? "🥈"
                              : index === 2
                                ? "🥉"
                                : "🏆"}
                      </span>
                      <img
                        src={getPlayerAvatar(id, p)}
                        alt={p.initials || id}
                        className="w-5 h-5 rounded-full"
                        onError={(e) => {
                          e.currentTarget.src = DEFAULT_AVATAR;
                        }}
                      />
                      <span
                        className={`font-semibold text-xs ${id === viewId ? "text-blue-400" : "text-white"
                          }`}
                      >
                        {id === viewId
                          ? `${getTruncatedName(p.initials || id)} (You)`
                          : getTruncatedName(p.initials || id)}
                      </span>
                      {p.progress >= 100 && (
                        <span className="text-xs text-yellow-400 font-bold">
                          FINISHED
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-xs text-white">
                        {p.score} words
                      </span>
                      <div className="text-xs text-gray-400">
                        {p.wpm || 0} WPM | {Math.round(p.progress)}%
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}