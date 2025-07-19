//✅ CONTEXT FIX - src/components/UsernameInput.tsx
import { useState, useCallback, useMemo } from "react";
import { useUserData } from "../contexts/UserContext"; // ✅ Updated import
import {
  validateUsername,
  type ValidationError,
} from "../validation/userValidation";
import { AVATAR_CONFIG } from "../config/avatars";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { ErrorMessage } from "./ui/ErrorMessage";
import Footer from "./Footer";

interface UsernameInputProps {
  onSubmit: (username: string, avatarUrl: string) => void;
}

interface FormState {
  username: string;
  selectedAvatar: string;
  isSubmitting: boolean;
  error: ValidationError | null;
}

export default function UsernameInput({ onSubmit }: UsernameInputProps) {
  // ✅ FIXED: Use UserContext for both sound and data management
  const { playClickSound, updateUserData } = useUserData();

  const [formState, setFormState] = useState<FormState>({
    username: "",
    selectedAvatar: AVATAR_CONFIG.avatars[0],
    isSubmitting: false,
    error: null,
  });

  const { username, selectedAvatar, isSubmitting, error } = formState;

  // Memoized validation result
  const validationError = useMemo(() => {
    if (!username) return null;
    return validateUsername(username);
  }, [username]);

  const isFormValid = username.trim().length > 0 && !validationError;

  const updateFormState = useCallback((updates: Partial<FormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleUsernameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newUsername = e.target.value;
      updateFormState({
        username: newUsername,
        error: null, // Clear error on input change
      });
    },
    [updateFormState]
  );

  const handleAvatarSelect = useCallback(
    (avatar: string) => {
      playClickSound();
      updateFormState({ selectedAvatar: avatar });
    },
    [playClickSound, updateFormState]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!isFormValid || isSubmitting) return;

      try {
        updateFormState({ isSubmitting: true, error: null });
        playClickSound();

        const trimmedUsername = username.trim();

        // Simulate async validation (e.g., checking username availability)
        await new Promise((resolve) => setTimeout(resolve, 300));

        // ✅ FIXED: Use UserContext instead of storage utility
        updateUserData({
          initials: trimmedUsername,
          avatarUrl: selectedAvatar,
        });

        onSubmit(trimmedUsername, selectedAvatar);
      } catch (err) {
        updateFormState({
          error: {
            field: "general",
            message: "Failed to save user data. Please try again.",
          },
        });
      } finally {
        updateFormState({ isSubmitting: false });
      }
    },
    [
      isFormValid,
      isSubmitting,
      username,
      selectedAvatar,
      playClickSound,
      updateFormState,
      updateUserData, // ✅ Updated dependency
      onSubmit,
    ]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, avatar: string) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleAvatarSelect(avatar);
      }
    },
    [handleAvatarSelect]
  );

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <img
              src="/logo.png"
              alt="SYNQ TYPE ROYALE"
              className="mx-auto h-24 w-auto"
            />
          </div>
          <p
            style={{ fontFamily: "Staatliches" }}
            className="text-gray-400 text-lg"
          >
            Ready to test your typing skills?
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-700">
          {/* Avatar Preview */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <img
                src={selectedAvatar}
                alt="Selected avatar"
                className="w-20 h-20 rounded-full border-2 border-gray-600 shadow-lg object-cover"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                <span className="text-xs">✓</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Input */}
            {error?.field === "general" && (
              <ErrorMessage message={error.message} />
            )}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={handleUsernameChange}
                aria-invalid={!!validationError}
                aria-describedby={
                  validationError ? "username-error" : undefined
                }
                className={`w-full px-4 py-3 bg-gray-800 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 ${validationError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-600"
                  }`}
                maxLength={20}
                required
                disabled={isSubmitting}
              />
              {validationError && (
                <p
                  id="username-error"
                  className="text-red-400 text-sm mt-1"
                  role="alert"
                >
                  {validationError.message}
                </p>
              )}
            </div>

            {/* Avatar Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
                Choose Your Avatar
              </label>
              <div className="grid grid-cols-3 gap-3 justify-items-center mx-auto max-w-xs">
                {AVATAR_CONFIG.avatars.map((avatar, index) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => handleAvatarSelect(avatar)}
                    onKeyDown={(e) => handleKeyDown(e, avatar)}
                    className={`relative w-16 h-16 rounded-full border-2 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-900 ${selectedAvatar === avatar
                      ? "border-white shadow-lg ring-2 ring-white ring-opacity-50"
                      : "border-gray-600 hover:border-gray-400"
                      }`}
                    aria-pressed={selectedAvatar === avatar}
                    aria-label={`Avatar ${index + 1}`}
                    disabled={isSubmitting}
                  >
                    <img
                      src={avatar}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                      loading="lazy"
                    />
                    {selectedAvatar === avatar && (
                      <div
                        className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-gray-900 flex items-center justify-center"
                        aria-hidden="true"
                      >
                        <span className="text-xs">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">Select your racing avatar</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!username.trim()}
              className="w-full mt-8 px-6 py-4 bg-white hover:bg-gray-200 text-black font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:bg-gray-600 disabled:text-gray-400"
            >
              <span className="font-staatliches flex items-center justify-center gap-2">
                {isSubmitting && <LoadingSpinner size="sm" />}
                {isSubmitting
                  ? "Setting up..."
                  : isFormValid
                    ? "Continue"
                    : "Enter Username"}
              </span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p
            style={{ fontFamily: "Staatliches" }}
            className="text-sm text-gray-500"
          >
            Choose your avatar and get ready to race!
          </p>
        </div>

      </div>
      <Footer />
    </div>
  );
}