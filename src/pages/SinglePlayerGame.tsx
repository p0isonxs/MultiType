import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useLocation } from "react-router";
import isEqual from "lodash.isequal";
const DEFAULT_AVATAR = "/avatars/avatar1.png";
import { useUserData } from "../contexts/UserContext";

export default function SinglePlayer() {

  const location = useLocation();
  const { userData, updateUserData } = useUserData();
  const settings = location.state || userData.roomSettings;
  const sentenceLength = settings.sentenceLength || 30;
  const duration = settings.timeLimit || 30;
  const fallbackWords = [
    "blockchain",
    "crypto",
    "wallet",
    "dao",
    "airdrop",
    "gas",
    "token",
    "mint",
    "burn",
    "web3",
    "staking",
    "zkproof",
    "defi",
    "bridge",
    "vault",
    "multisynq",
    "monad",
    "layer2",
    "protocol",
    "consensus",
  ];

  const wordPool = settings.words?.length
    ? settings.words
    : fallbackWords.filter((w) => w.length <= sentenceLength);

  const [words, setWords] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [gameStarted, setGameStarted] = useState(false);
  const [chunkTransition, setChunkTransition] = useState(false);

  const [singleHighscores, setSingleHighscores] = useState<
    Record<string, number>
  >(() => {
    const saved = localStorage.getItem("singleHighscores");
    return saved ? JSON.parse(saved) : {};
  });

  const [highscores, setHighscores] =
    useState<Record<string, number>>(singleHighscores);

  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const WORDS_PER_CHUNK = 20;

  const getTruncatedName = (name: string) => {
    return name.length > 5 ? name.substring(0, 5) + "..." : name;
  };


  useEffect(() => {
    if (
      location.state &&
      !isEqual(location.state, userData.roomSettings)
    ) {
      updateUserData({ roomSettings: location.state });
    }
  }, [location.state, userData.roomSettings]);

  useEffect(() => {
    if (gameStarted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((t: number) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (timeLeft === 0) {
      const old = highscores[userData.initials] || 0;
      const updated = {
        ...highscores,
        [userData.initials]: Math.max(score, old),
      };
      setHighscores(updated);
      setSingleHighscores(updated);
      localStorage.setItem("singleHighscores", JSON.stringify(updated));
    }
}, [timeLeft, gameStarted, score, userData.initials]); // ✅ FIXED: Remove highscores dependency

  const shuffle = (array: string[]) => {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  const startGame = () => {
    setIndex(0);
    setInput("");
    setScore(0);
    setWords(shuffle(wordPool));
    setTimeLeft(duration);
    setGameStarted(true);
    setChunkTransition(false);
 setTimeout(() => {
  inputRef.current?.focus();
}, 50);

  };

  const getCurrentChunk = () => {
    const chunkStart = Math.floor(index / WORDS_PER_CHUNK) * WORDS_PER_CHUNK;
    const chunkEnd = Math.min(chunkStart + WORDS_PER_CHUNK, words.length);
    return {
      words: words.slice(chunkStart, chunkEnd),
      startIndex: chunkStart,
      endIndex: chunkEnd,
    };
  };

  const handleSubmit = () => {
    if (!input.trim()) return;

    const correct = input.trim() === words[index];
    new Audio(correct ? "/uwu-sound-119010.mp3" : "/fart-83471.mp3").play();

    if (!correct) {
      setError(true);
      setTimeout(() => setError(false), 500);
    } else {
      setScore((s) => s + 1);
      const newIndex = index + 1;

      if (newIndex >= words.length) {
        setIndex(newIndex);
        setGameStarted(false);
        setTimeLeft(0);
        setInput("");
        return;
      }

      setIndex(newIndex);

      const currentChunkEnd =
        Math.floor(index / WORDS_PER_CHUNK) * WORDS_PER_CHUNK + WORDS_PER_CHUNK;
      const nextChunkStart =
        Math.floor(newIndex / WORDS_PER_CHUNK) * WORDS_PER_CHUNK;

      if (
        currentChunkEnd <= newIndex &&
        nextChunkStart !== Math.floor(index / WORDS_PER_CHUNK) * WORDS_PER_CHUNK
      ) {
        setChunkTransition(true);
        setTimeout(() => {
          setChunkTransition(false);
        }, 300);
      }
    }

    setInput("");
  };

  const getTimeColor = () => {
    if (timeLeft > duration * 0.5) return "text-white";
    if (timeLeft > duration * 0.25) return "text-yellow-400";
    return "text-red-400";
  };

  const getProgressPercentage = () => {
    if (words.length === 0) return 0;
    return Math.min((score / words.length) * 100, 100);
  };

  // ✅ FIXED: Use cached avatarUrl
  const PlayerAvatar = ({ size = "w-14 h-14 sm:w-16 sm:h-16" }: { size?: string }) => (
    <div className={`${size} overflow-hidden`}>
      <img
        src={userData.avatarUrl}
        alt="Player avatar"
        className="w-full h-full"
        onError={(e) => {
          e.currentTarget.src = DEFAULT_AVATAR;
        }}
      />
    </div>
  );

  const renderChunkedText = () => {
    const chunk = getCurrentChunk();
    const relativeIndex = index - chunk.startIndex;

    return (
      <div
        className={`text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-mono leading-relaxed bg-gray-900 rounded-lg p-2 sm:p-3 md:p-4 border border-gray-700 min-h-[120px] sm:min-h-[140px] md:min-h-[160px] max-h-[200px] sm:max-h-[220px] md:max-h-[240px] overflow-hidden transition-opacity duration-300 select-none ${
          chunkTransition ? "opacity-50" : "opacity-100"
        }`}
      >
        <div className="flex flex-wrap gap-x-1 gap-y-1">
          {chunk.words.map((word, wordIndex) => (
            <span key={chunk.startIndex + wordIndex} className="inline-block">
              {wordIndex < relativeIndex
                ? word.split("").map((letter, letterIndex) => (
                    <span
                      key={letterIndex}
                      className="text-green-400 rounded-sm"
                    >
                      {letter}
                    </span>
                  ))
                : wordIndex === relativeIndex
                ? word.split("").map((letter, letterIndex) => {
                    const isTyped = letterIndex < input.length;
                    const isCorrect = isTyped && input[letterIndex] === letter;
                    const isIncorrect =
                      isTyped && input[letterIndex] !== letter;
                    const isCurrent = letterIndex === input.length;

                    return (
                      <span
                        key={letterIndex}
                        className={`rounded-sm ${
                          isCorrect
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
                : word.split("").map((letter, letterIndex) => (
                    <span key={letterIndex} className="text-gray-400">
                      {letter}
                    </span>
                  ))}
            </span>
          ))}
        </div>

        <div className="mt-2 sm:mt-3 text-center text-xs text-gray-500">
          Chunk {Math.floor(index / WORDS_PER_CHUNK) + 1} of{" "}
          {Math.ceil(words.length / WORDS_PER_CHUNK)}
          {chunk.words.length < WORDS_PER_CHUNK && " (Final)"}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex justify-between items-center p-2 sm:p-3">
        <button
          onClick={() => navigate("/mode")}
          className="px-2 py-1 sm:px-3 sm:py-2 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg border border-gray-600 transition-all duration-200 text-xs sm:text-sm"
        >
          ← Back
        </button>
        <div className="text-gray-400 text-xs sm:text-sm">
          Mode <span className="text-white font-mono">solo</span>
        </div>
      </div>

      <div className="px-2 sm:px-3 py-2 sm:py-3">
        <div className="max-w-5xl mx-auto">
          <div className="relative mb-3 sm:mb-4">
            <div className="relative bg-gray-800 rounded-xl p-3 sm:p-4 md:p-5 border border-gray-700">
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full pr-3 flex items-center">
                <div className="text-xs sm:text-sm text-white font-semibold whitespace-nowrap">
                {getTruncatedName(userData.initials)}
                </div>
              </div>

              <div className="relative h-12 sm:h-16 md:h-18 bg-gray-700 rounded-lg border-4 border-gray-600 overflow-hidden">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white opacity-30 transform -translate-y-1/2"></div>
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white opacity-30 transform -translate-y-1/2 border-t-2 border-dotted border-white"></div>

                <div className="absolute left-10 top-0 bottom-0 w-1 bg-white"></div>

                <div className="absolute right-0 top-0 bottom-0 w-3 sm:w-4">
                  <div className="grid grid-cols-2 h-full">
                    {Array.from({ length: 8 }, (_, i) => (
                      <div
                        key={i}
                        className={`${
                          i % 2 === 0 ? "bg-white" : "bg-black"
                        } border border-gray-400`}
                      ></div>
                    ))}
                  </div>
                </div>

                <div
                  className="absolute top-1/2 transform -translate-y-1/2 transition-all duration-500 ease-out"
                  style={{
                    left: `${getProgressPercentage()}%`,
                  }}
                >
                  <PlayerAvatar size="w-14 h-14 sm:w-16 sm:h-16" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-3">
            <div className="bg-gray-900 rounded-lg p-2 text-center border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Time</div>
              <div
                className={`text-base sm:text-lg font-bold ${getTimeColor()}`}
              >
                {timeLeft}s
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-2 text-center border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Score</div>
              <div className="text-base sm:text-lg font-bold">{score}</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-2 text-center border border-gray-700 col-span-2 sm:col-span-1">
              <div className="text-xs text-gray-400 mb-1">WPM</div>
              <div className="text-base sm:text-lg font-bold">
                {gameStarted
                  ? Math.round((score / Math.max(1, duration - timeLeft)) * 60)
                  : 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-2 sm:px-3 py-2 sm:py-3">
        <div className="max-w-5xl mx-auto">
          {gameStarted && timeLeft > 0 ? (
            <div className="text-center">{renderChunkedText()}</div>
          ) : (
            <div className="text-center">
              {timeLeft === 0 ? (
                <div className="space-y-3 bg-gray-900 rounded-lg p-6 border border-gray-700">
                  <div className="text-3xl mb-2"></div>
                  <h2 className="text-xl font-bold text-white mb-2">
                    {score === words.length ? "🏁 Finish Line!" : "Game Over!"}
                  </h2>

                  <div className="text-lg mb-3">
                    Final Score: <span className="font-bold">{score}</span>{" "}
                    words
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
                    <div className="text-gray-400">
                      <div>WPM</div>
                      <div className="text-white font-bold">
                        {Math.round((score / duration) * 60)}
                      </div>
                    </div>
                    <div className="text-gray-400">
                      <div>Accuracy</div>
                      <div className="text-white font-bold">
                        {Math.round(
                          (score / (score + (words.length - score))) * 100
                        ) || 0}
                        %
                      </div>
                    </div>
                    <div className="text-gray-400">
                      <div>Progress</div>
                      <div className="text-white font-bold">
                        {Math.round((index / words.length) * 100) || 0}%
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={startGame}
                    className="px-5 py-2 bg-white hover:bg-gray-200 text-black font-bold rounded-lg text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    Play Again
                  </button>
                </div>
              ) : (
                <div className="space-y-3 bg-gray-900 rounded-lg p-3 sm:p-4 md:p-6 border border-gray-700">
                  <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
                    Ready to Race?
                  </h2>
                  <p className="text-gray-400 mb-3 text-sm">
                    Solo typing challenge with {settings.sentenceLength} words
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 mb-3 text-xs sm:text-sm">
                    <div className="text-gray-400">
                      <div>Theme</div>
                      <div className="text-white font-semibold">
                        {settings.theme || "Default"}
                      </div>
                    </div>
                    <div className="text-gray-400">
                      <div>Max Length</div>
                      <div className="text-white font-semibold">
                        {settings.sentenceLength}
                      </div>
                    </div>
                    <div className="text-gray-400">
                      <div>Time Limit</div>
                      <div className="text-white font-semibold">
                        {duration}s
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={startGame}
                    className="px-4 sm:px-5 py-2 bg-white hover:bg-gray-200 text-black font-bold rounded-lg text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    Start Race
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {gameStarted && timeLeft > 0 && (
        <div className="px-2 sm:px-3 pb-3">
          <div className="max-w-5xl mx-auto">
            <label className="block text-gray-400 text-xs mb-2">
              Type here
            </label>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if ([" ", "Enter"].includes(e.key)) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              className={`w-full px-3 py-2 text-sm sm:text-base bg-white rounded-lg text-black focus:outline-none transition-all duration-200 ${
                error
                  ? "ring-2 ring-red-500"
                  : "focus:ring-2 focus:ring-blue-500"
              }`}
              placeholder={words[index] || "Start typing..."}
            />
            <div className="mt-2 text-center text-gray-400 text-xs">
              Press space or enter to submit
            </div>
          </div>
        </div>
      )}

      {(!gameStarted || timeLeft === 0) && (
        <div className="px-2 sm:px-3 pb-4 sm:pb-6">
          <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 max-w-5xl mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-white mb-2 text-center">
              Your Highest Scores
            </h3>
            <div className="space-y-2">
              {Object.entries(highscores).length > 0 ? (
                Object.entries(highscores)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([name, score], index) => (
                    <div
                      key={name}
                      className="flex justify-between items-center p-2 bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">
                          {index === 0
                            ? "🥇"
                            : index === 1
                            ? "🥈"
                            : index === 2
                            ? "🥉"
                            : "🏆"}
                        </span>
                        <span className="font-semibold text-white text-xs sm:text-sm">
                          {getTruncatedName(name)}
                        </span>
                      </div>
                      <span className="font-bold text-xs sm:text-sm">
                        {score} words
                      </span>
                    </div>
                  ))
              ) : (
                <div className="text-center text-gray-400 py-3 text-xs sm:text-sm">
                  No scores yet. Be the first to play!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
