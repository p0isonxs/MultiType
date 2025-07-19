// src/components/ui/ErrorMessage.tsx
interface ErrorMessageProps {
  message: string;
  className?: string;
}

export function ErrorMessage({ message, className = '' }: ErrorMessageProps) {
  return (
    <div 
      className={`bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg ${className}`}
      role="alert"
    >
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}
