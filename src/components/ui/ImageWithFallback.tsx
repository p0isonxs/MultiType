import { useCallback, useState } from "react";
import { ImageWithFallbackProps } from "../../../type/global";

export function ImageWithFallback({ src, alt, fallbackIcon, className = "" }: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  if (hasError) {
    return (
      <div className="text-6xl" role="img" aria-label={alt}>
        {fallbackIcon}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={handleError}
    />
  );
}