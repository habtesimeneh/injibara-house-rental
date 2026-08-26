import React from 'react';

const shimmerBase = 'bg-gray-100 rounded-lg animate-shimmer';

const CardSkeleton = ({ lines = 3, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-5 ${className}`}>
      <div className="flex items-center gap-4 mb-4">
        <div className={`h-12 w-12 rounded-full ${shimmerBase} shrink-0`} />
        <div className="flex-1 space-y-2">
          <div className={`h-4 ${shimmerBase} w-3/4`} />
          <div className={`h-3 ${shimmerBase} w-1/2`} />
        </div>
      </div>

      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, idx) => (
          <div
            key={idx}
            className={`h-3.5 ${shimmerBase} w-full`}
            style={{ maxWidth: idx === lines - 1 ? '60%' : '100%' }}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className={`h-8 w-24 rounded-lg ${shimmerBase}`} />
        <div className={`h-8 w-20 rounded-lg ${shimmerBase}`} />
      </div>
    </div>
  );
};

export default CardSkeleton;
