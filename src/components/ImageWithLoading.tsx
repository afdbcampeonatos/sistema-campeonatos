"use client";

import { useEffect, useRef, useState } from "react";
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
  const imgRef = useRef<HTMLImageElement>(null);

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

  // Verificar se a imagem já está carregada (em cache)
  useEffect(() => {
    if (!src) return;

    // Usar setTimeout para garantir que o elemento img já foi renderizado
    const checkImageLoaded = () => {
      if (imgRef.current?.complete) {
        setIsLoading(false);
        setHasError(false);
      }
    };

    // Verificar imediatamente e após um pequeno delay
    checkImageLoaded();
    const timeoutId = setTimeout(checkImageLoaded, 0);

    return () => clearTimeout(timeoutId);
  }, [src]);

  // Timeout de segurança para evitar spinner infinito
  useEffect(() => {
    if (!src || !isLoading) return;

    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 10000); // 10 segundos

    return () => clearTimeout(timeout);
  }, [src, isLoading]);

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
          ref={imgRef}
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
