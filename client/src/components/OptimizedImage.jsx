import React, { useState, useEffect, useRef } from 'react';

const generateSrcset = (src, widths = [400, 800, 1200, 1600]) => {
  if (!src) return '';
  
  if (src.includes('unsplash.com')) {
    return widths
      .map(w => {
        const base = src.includes('&w=') ? src.replace(/&w=\d+/, '') : src;
        return `${base}&w=${w}&q=80 ${w}w`;
      })
      .join(', ');
  }
  
  if (src.includes('cloudinary.com')) {
    return widths
      .map(w => {
        const base = src.replace(/c_fill,w_\d+/, '').replace(/\/\d+$/, '');
        return `${base}/c_fill,w_${w}/q_auto:good/${w}w`;
      })
      .join(', ');
  }
  
  return '';
};

const getOptimizedSrc = (src, width = 800) => {
  if (!src) return '';
  
  if (src.includes('unsplash.com')) {
    return src.includes('&w=') ? src : `${src}&w=${width}&q=80`;
  }
  
  if (src.includes('cloudinary.com')) {
    return src.replace(/c_fill,w_\d+/, `c_fill,w_${width}`).replace(/\/\d+$/, '') + `/q_auto:good/${width}`;
  }
  
  return src;
};

const getWebPSrc = (src, width = 800) => {
  if (!src) return '';
  
  if (src.includes('unsplash.com')) {
    const base = src.includes('&w=') ? src.replace(/&w=\d+/, '') : src;
    return `${base}&w=${width}&q=80&fm=webp`;
  }
  
  if (src.includes('cloudinary.com')) {
    const base = src.replace(/c_fill,w_\d+/, '').replace(/\/\d+$/, '');
    return `${base}/c_fill,w_${width}/q_auto:good/f_webp/${width}`;
  }
  
  return src;
};

const OptimizedImage = ({
  src,
  alt = '',
  className = '',
  imgClassName = '',
  width,
  height,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [optimizedSrc, setOptimizedSrc] = useState('');
  const imgRef = useRef(null);

  const aspectRatio = width && height ? `${width}/${height}` : undefined;

  useEffect(() => {
    if (!src) return;
    
    const targetWidth = width || 800;
    setOptimizedSrc(getOptimizedSrc(src, targetWidth));
  }, [src, width]);

  const srcset = generateSrcset(src);
  const webpSrc = getWebPSrc(src, width || 800);
  const fallbackSrc = getOptimizedSrc(src, width || 800);

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const handleLoad = () => {
    setIsLoaded(true);
  };

  if (hasError || !src) {
    return (
      <div 
        className={`relative overflow-hidden bg-slate-200 flex items-center justify-center ${className}`}
        style={aspectRatio ? { aspectRatio } : undefined}
      >
        <div className="text-slate-400 text-xs">No Image</div>
      </div>
    );
  }

  return (
    <div 
      className={`relative overflow-hidden bg-slate-100 ${className}`}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse z-10" />
      )}
      
      <picture>
        {webpSrc && (
          <source srcSet={webpSrc} type="image/webp" />
        )}
        <img
          ref={imgRef}
          src={fallbackSrc}
          srcSet={srcset || undefined}
          sizes={srcset ? sizes : undefined}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover transition-all duration-500 ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          } ${imgClassName}`}
          {...props}
        />
      </picture>
    </div>
  );
};

export default OptimizedImage;
