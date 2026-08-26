import React from 'react';

const shimmerBase = 'bg-gray-100 rounded-lg animate-shimmer';

const ListSkeleton = ({ rows = 4, className = '' }) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={`list-skeleton-${idx}`}
          className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
        >
          <div className={`h-10 w-10 rounded-full ${shimmerBase} shrink-0`} />
          <div className="flex-1 space-y-2.5">
            <div className={`h-4 ${shimmerBase} w-3/4`} />
            <div className={`h-3.5 ${shimmerBase} w-1/2`} />
          </div>
          <div className={`h-8 w-24 rounded-lg ${shimmerBase} shrink-0`} />
        </div>
      ))}
    </div>
  );
};

export default ListSkeleton;
