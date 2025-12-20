"use client";

import { useEffect, useState } from "react";
import { FaImage } from "react-icons/fa";
import { LoadingSpinner } from "./LoadingSpinner";

interface ImageWithLoadingProps {
  src: string | null;
  alt: string;
  className?: string;
  fallbackIcon?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export const ImageWithLoading = ({
  src,
  alt,
  className = "",
  fallbackIcon,
  size = "md",
}: ImageWithLoadingProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Reset states when src changes
  useEffect(() => {
    if (src) {
      setIsLoading(true);
      setHasError(false);
    } else {
      setIsLoading(false);
      setHasError(true);
    }
  }, [src]);

  // Se não há src, mostrar placeholder
  if (!src) {
    const sizeClasses = {
      sm: "w-10 h-10",
      md: "w-16 h-16",
      lg: "w-20 h-20",
      xl: "w-24 h-24",
    };

    return (
      <div
        className={`${sizeClasses[size]} bg-gray-200 rounded flex items-center justify-center ${className}`}
      >
        {fallbackIcon || <FaImage className="text-gray-400" />}
      </div>
    );
  }

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className="relative inline-block">
      {/* Spinner durante loading */}
      {isLoading && (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-gray-100 rounded z-10 ${className}`}
        >
          <LoadingSpinner
            size={
              size === "sm"
                ? "sm"
                : size === "lg" || size === "xl"
                ? "lg"
                : "md"
            }
          />
        </div>
      )}

      {/* Imagem */}
      {!hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`${className} ${
            isLoading ? "opacity-0" : "opacity-100"
          } transition-opacity duration-200`}
        />
      )}

      {/* Placeholder em caso de erro */}
      {hasError && !isLoading && (
        <div
          className={`${className} bg-gray-200 rounded flex items-center justify-center`}
        >
          {fallbackIcon || <FaImage className="text-gray-400" />}
        </div>
      )}
    </div>
  );
};
