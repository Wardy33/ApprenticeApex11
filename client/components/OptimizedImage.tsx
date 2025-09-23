import React, { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  style?: React.CSSProperties;
}

// Generate responsive image sources for different screen sizes
function generateResponsiveSources(src: string, width?: number) {
  const baseUrl = src.split('.').slice(0, -1).join('.');
  const extension = src.split('.').pop() || 'jpg';
  
  // Standard responsive sizes
  const sizes = [320, 640, 768, 1024, 1280, 1920];
  const targetWidth = width || 1920;
  
  // Filter sizes to only include those smaller than or equal to target width
  const relevantSizes = sizes.filter(size => size <= targetWidth);
  if (relevantSizes.length === 0 || targetWidth > Math.max(...relevantSizes)) {
    relevantSizes.push(targetWidth);
  }
  
  return relevantSizes.map(size => ({
    size,
    webp: `${baseUrl}_${size}w.webp`,
    avif: `${baseUrl}_${size}w.avif`,
    fallback: `${baseUrl}_${size}w.${extension}`
  }));
}

// Generate srcSet string for different formats
function generateSrcSet(sources: ReturnType<typeof generateResponsiveSources>, format: 'webp' | 'avif' | 'fallback') {
  return sources
    .map(source => `${source[format]} ${source.size}w`)
    .join(', ');
}

// Check if browser supports WebP
function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => resolve(webP.height === 2);
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

// Check if browser supports AVIF
function supportsAVIF(): Promise<boolean> {
  return new Promise((resolve) => {
    const avif = new Image();
    avif.onload = avif.onerror = () => resolve(avif.height === 2);
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
}

export function OptimizedImage({
  src,
  alt,
  className = '',
  width,
  height,
  sizes = '100vw',
  priority = false,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  onError,
  style,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(priority);
  const [supportedFormats, setSupportedFormats] = useState({
    webp: false,
    avif: false
  });
  
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check format support on mount
  useEffect(() => {
    const checkSupport = async () => {
      const [webpSupported, avifSupported] = await Promise.all([
        supportsWebP(),
        supportsAVIF()
      ]);
      
      setSupportedFormats({
        webp: webpSupported,
        avif: avifSupported
      });
    };
    
    checkSupport();
  }, []);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px' // Start loading 50px before the image enters viewport
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [priority]);

  // Handle image load
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // Handle image error
  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Generate responsive sources
  const responsiveSources = generateResponsiveSources(src, width);
  
  // Determine the best format to use
  const getBestFormat = () => {
    if (supportedFormats.avif) return 'avif';
    if (supportedFormats.webp) return 'webp';
    return 'fallback';
  };

  // Generate the appropriate src and srcSet
  const bestFormat = getBestFormat();
  const srcSet = generateSrcSet(responsiveSources, bestFormat);
  const fallbackSrc = responsiveSources[0]?.fallback || src;

  // Placeholder styles
  const placeholderStyle: React.CSSProperties = {
    backgroundColor: '#f3f4f6',
    backgroundImage: placeholder === 'blur' && blurDataURL ? `url(${blurDataURL})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: placeholder === 'blur' ? 'blur(20px)' : undefined,
    transform: placeholder === 'blur' ? 'scale(1.1)' : undefined,
  };

  // Container styles
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    display: 'inline-block',
    width: width ? `${width}px` : 'auto',
    height: height ? `${height}px` : 'auto',
    ...style
  };

  // Image styles
  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'opacity 0.3s ease, filter 0.3s ease, transform 0.3s ease',
    opacity: isLoaded ? 1 : 0,
    filter: isLoaded ? 'none' : undefined,
    transform: isLoaded ? 'scale(1)' : undefined,
  };

  // Don't render anything if not intersecting (for lazy loading)
  if (!isIntersecting) {
    return (
      <div
        ref={containerRef}
        className={className}
        style={containerStyle}
        role="img"
        aria-label={alt}
      >
        <div style={{...placeholderStyle, width: '100%', height: '100%'}} />
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-gray-200 dark:bg-gray-700`}
        style={containerStyle}
        role="img"
        aria-label={alt}
      >
        <div className="text-gray-500 dark:text-gray-400 text-center p-4">
          <svg
            className="w-8 h-8 mx-auto mb-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-sm">Failed to load image</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={containerStyle}
    >
      {/* Placeholder */}
      {!isLoaded && (
        <div
          style={{
            ...placeholderStyle,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1
          }}
          aria-hidden="true"
        />
      )}
      
      {/* Optimized picture element */}
      <picture>
        {/* AVIF source (best compression) */}
        {supportedFormats.avif && (
          <source
            srcSet={generateSrcSet(responsiveSources, 'avif')}
            sizes={sizes}
            type="image/avif"
          />
        )}
        
        {/* WebP source (good compression, wide support) */}
        {supportedFormats.webp && (
          <source
            srcSet={generateSrcSet(responsiveSources, 'webp')}
            sizes={sizes}
            type="image/webp"
          />
        )}
        
        {/* Fallback image */}
        <img
          ref={imgRef}
          src={fallbackSrc}
          srcSet={generateSrcSet(responsiveSources, 'fallback')}
          sizes={sizes}
          alt={alt}
          style={imageStyle}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          {...props}
        />
      </picture>
      
      {/* Loading indicator */}
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 2 }}
          aria-hidden="true"
        >
          <div className="loading-spinner opacity-50" />
        </div>
      )}
    </div>
  );
}

// Hook for preloading critical images
export function useImagePreload(src: string, priority = false) {
  useEffect(() => {
    if (!priority) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    
    document.head.appendChild(link);

    return () => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, [src, priority]);
}

// Utility for generating blur data URLs (for development)
export function generateBlurDataURL(width = 10, height = 10): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Create a simple gradient blur effect
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL('image/jpeg', 0.1);
}

export default OptimizedImage;
