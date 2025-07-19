// src/components/RoyaleComingSoonModal.tsx
import { useSound } from "../contexts/UserContext";

interface Props {
  onClose: () => void;
}

export default function RoyaleComingSoonModal({ onClose }: Props) {
  const { playClickSound } = useSound();

  const handleClose = () => {
    playClickSound();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-20">
      {/* Modal Box */}
      <div className="bg-[#0f0f0f] border-[#826df9] border-2 rounded-xl p-8 text-center max-w-md w-full relative shadow-2xl">
        <h2 className="text-3xl font-bold mb-4 text-[#826df9]">Coming Soon</h2>
        <p className="text-gray-300 mb-6">
          <span className="text-[#826df9] font-semibold">Royale Mode</span> is
          under development.
          <br />
          The battle for the blockchain keyboard is near.
        </p>
        <button
          className="bg-[#826df9] text-black px-5 py-2 rounded hover:opacity-90 transform hover:scale-105 transition"
          onClick={handleClose}
        >
          Back
        </button>
      </div>

      {/* Particle Background */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div key={i} className={`particle particle-${i + 1}`}></div>
        ))}
      </div>
    </div>
  );
}
