import { useCallback, useState } from "react";
import { useNavigate } from "react-router";

interface Player {
    score: number;
    progress: number;
    index: number;
    wpm: number;
    initials: string;
    avatarUrl: string;
}

interface ResultsModalProps {
    isOpen: boolean;
    onClose: () => void;
    player: Player;
    allPlayers: [string, Player][];
    viewId: string;
    model: any;
    roomCode?: string;
    currentIndex: number;
    isHost: boolean;
    onPlayAgain: () => void;
    getPlayerAvatar: (id: string, player: Player) => string;
}

export default function ResultsModal({
    isOpen,
    onClose,
    player,
    allPlayers,
    viewId,
    model,
    roomCode,
    currentIndex,
    isHost,
    onPlayAgain,
    getPlayerAvatar
}: ResultsModalProps) {
    const navigate = useNavigate();
    const [showShareMenu, setShowShareMenu] = useState(false);

    const sortedPlayers = [...allPlayers].sort((a, b) => {
        const aCompleted = a[1].progress >= 100 ? 1 : 0;
        const bCompleted = b[1].progress >= 100 ? 1 : 0;
        if (aCompleted !== bCompleted) return bCompleted - aCompleted;
        if (a[1].score !== b[1].score) return b[1].score - a[1].score;
        return b[1].wpm - a[1].wpm;
    });

    const playerRank = sortedPlayers.findIndex(([id]) => id === viewId) + 1;
    const isWinner = playerRank === 1;
    const accuracy = player.score > 0 && currentIndex > 0
        ? Math.round((player.score / Math.max(player.index, 1)) * 100)
        : 100;

    const getShareText = useCallback(() => {
        const status = isWinner ? "1st Place" : `${playerRank}${playerRank === 2 ? 'nd' : playerRank === 3 ? 'rd' : 'th'} Place`;
        return {
            title: `Typing Race Results - ${status}`,
            text: `Typing Race Results:

Rank: ${playerRank}/${allPlayers.length}
Score: ${player.score}/${model.words.length} words
Speed: ${player.wpm || 0} WPM
Accuracy: ${accuracy}%
Theme: ${model.theme}

${isWinner ? "Achieved first place!" : `Finished in ${status}!`}

Challenge yourself: ${window.location.origin}`,
            hashtags: ["TypingRace", "WPM", "TypingSpeed"],
            url: "https://multisync-type-battle.vercel.app"
        };
    }, [playerRank, allPlayers.length, player, model, accuracy, isWinner, currentIndex]);

    const shareToTwitter = useCallback(() => {
        const shareData = getShareText();
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&hashtags=${shareData.hashtags.join(',')}&url=${encodeURIComponent(shareData.url)}`;
        window.open(url, '_blank', 'width=550,height=420');
        setShowShareMenu(false);
    }, [getShareText]);

    const shareToLinkedIn = useCallback(() => {
        const shareData = getShareText();
        const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareData.url)}&title=${encodeURIComponent(shareData.title)}&summary=${encodeURIComponent(shareData.text)}`;
        window.open(url, '_blank', 'width=550,height=420');
        setShowShareMenu(false);
    }, [getShareText]);

    const copyToClipboard = useCallback(() => {
        const shareData = getShareText();
        navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`);
        setShowShareMenu(false);
    }, [getShareText]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Background */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-gray-900 rounded-lg shadow-xl border border-gray-700">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white">Race Results</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">

                    {/* Your Results */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-white">Your Performance</h3>
                            <div className="text-sm text-gray-400">
                                Rank: <span className="text-white font-medium">#{playerRank}</span> / {allPlayers.length}
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-4">
                            <div className="bg-gray-800 rounded-lg p-3 text-center">
                                <div className="text-lg font-bold text-blue-400">{player.wpm || 0}</div>
                                <div className="text-xs text-gray-400">WPM</div>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-3 text-center">
                                <div className="text-lg font-bold text-green-400">{accuracy}%</div>
                                <div className="text-xs text-gray-400">Accuracy</div>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-3 text-center">
                                <div className="text-lg font-bold text-purple-400">{player.score}</div>
                                <div className="text-xs text-gray-400">Words</div>
                            </div>
                            <div className="bg-gray-800 rounded-lg p-3 text-center">
                                <div className="text-lg font-bold text-orange-400">{Math.round(player.progress)}%</div>
                                <div className="text-xs text-gray-400">Progress</div>
                            </div>
                        </div>
                    </div>

                    {/* Leaderboard */}
                    <div className="mb-6">
                        <h3 className="text-lg font-medium text-white mb-3">Final Standings</h3>
                        <div className="bg-gray-800 rounded-lg p-4 max-h-48 overflow-y-auto">
                            {sortedPlayers.slice(0, 8).map(([id, p], index) => {
                                const isCurrentUser = id === viewId;
                                const rank = index + 1;

                                return (
                                    <div
                                        key={id}
                                        className={`flex items-center justify-between py-2 px-3 rounded ${isCurrentUser ? "bg-blue-600/20 border border-blue-500/50" : "hover:bg-gray-700/50"
                                            }`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${rank === 1 ? "bg-yellow-500 text-black" :
                                                    rank === 2 ? "bg-gray-400 text-black" :
                                                        rank === 3 ? "bg-orange-600 text-white" :
                                                            "bg-gray-600 text-white"
                                                }`}>
                                                {rank}
                                            </div>

                                            <img
                                                src={getPlayerAvatar(id, p)}
                                                alt={p.initials}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />

                                            <div>
                                                <div className={`font-medium text-sm ${isCurrentUser ? "text-blue-300" : "text-white"}`}>
                                                    {p.initials || `Player ${id.slice(0, 4)}`}
                                                    {isCurrentUser && <span className="text-xs text-blue-400 ml-1">(You)</span>}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-sm font-medium text-white">{p.score}</div>
                                            <div className="text-xs text-gray-400">{p.wpm || 0} WPM</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Game Info */}
                    <div className="mb-6 p-3 bg-gray-800 rounded-lg">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Theme: <span className="text-white capitalize">{model.theme}</span></span>
                            <span className="text-gray-400">Words: <span className="text-white">{model.words.length}</span></span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 justify-center">

                        {/* Share */}
                        <div className="relative">
                            <button
                                onClick={() => setShowShareMenu(!showShareMenu)}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors flex items-center space-x-1"
                            >
                                <span>Share</span>
                                <span className={`transition-transform text-xs ${showShareMenu ? 'rotate-180' : ''}`}>▼</span>
                            </button>

                            {showShareMenu && (
                                <div className="absolute bottom-full left-0 mb-1 w-32 bg-gray-800 border border-gray-600 rounded shadow-lg overflow-hidden">
                                    <button
                                        onClick={shareToTwitter}
                                        className="w-full px-3 py-2 text-left hover:bg-gray-700 text-white text-sm"
                                    >
                                        Twitter
                                    </button>
                                    <button
                                        onClick={shareToLinkedIn}
                                        className="w-full px-3 py-2 text-left hover:bg-gray-700 text-white text-sm"
                                    >
                                        LinkedIn
                                    </button>
                                    <button
                                        onClick={copyToClipboard}
                                        className="w-full px-3 py-2 text-left hover:bg-gray-700 text-white text-sm"
                                    >
                                        Copy
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Host Actions */}
                        {isHost && (
                            <button
                                onClick={onPlayAgain}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                            >
                                New Race
                            </button>
                        )}

                        <button
                            onClick={() => navigate(`/room/${roomCode}/lobby`)}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded transition-colors"
                        >
                            Lobby
                        </button>

                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}