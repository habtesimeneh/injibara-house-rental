import React from 'react';

const shimmerBase =
  'bg-gray-100 rounded-lg animate-shimmer';

const PropertyCardSkeleton = ({ columns = 3 }) => {
  const getGridColsClass = () => {
    if (columns === 1) return 'grid-cols-1';
    if (columns === 2) return 'grid-cols-1 md:grid-cols-2';
    if (columns === 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  };

  return (
    <div id="property-card-skeleton" className={`grid ${getGridColsClass()} gap-6`}>
      {[1, 2, 3, 4, 5, 6].map((_, idx) => (
        <div
          key={`property-skeleton-${idx}`}
          className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm flex flex-col relative transition-all duration-300 min-h-[420px]"
        >
          {/* Image area */}
          <div className="relative h-60 w-full bg-gray-100 overflow-hidden">
            <div className="absolute inset-0 animate-shimmer" />

            {/* Badge placeholder */}
            <div className="absolute top-4 right-4 w-24 h-7 bg-white/60 rounded-md animate-pulse" />

            {/* Icon placeholder */}
            <div className="absolute top-4 left-4 w-16 h-8 bg-white/60 rounded-full animate-pulse" />

            {/* Bottom label placeholder */}
            <div className="absolute bottom-4 left-4 w-28 h-6 bg-white/60 rounded-md animate-pulse" />
          </div>

          {/* Content area */}
          <div className="p-5 flex-1 flex flex-col gap-3">
            <div className={`h-6 ${shimmerBase} w-3/4`} />
            <div className={`h-4 ${shimmerBase} w-1/2`} />

            <div className="flex items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg my-1">
              <div className={`h-4 ${shimmerBase} w-1/4`} />
              <div className={`h-4 ${shimmerBase} w-1/4`} />
              <div className={`h-4 ${shimmerBase} w-1/4`} />
            </div>

            <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
              <div className={`h-5 ${shimmerBase} rounded-md w-20`} />
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 ${shimmerBase} rounded-lg`} />
                <div className={`h-8 w-20 ${shimmerBase} rounded-lg`} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PropertyCardSkeleton;
