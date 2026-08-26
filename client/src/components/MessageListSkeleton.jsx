import React from 'react';

const MessageListSkeleton = ({ count = 6 }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={`msg-skeleton-${idx}`}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4"
        >
          <div className="h-12 w-12 rounded-full bg-gray-100 animate-shimmer shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="h-5 bg-gray-100 rounded-lg w-1/3 animate-shimmer" />
              <div className="h-4 bg-gray-100 rounded-md w-16 animate-shimmer" />
            </div>
            <div className="space-y-2">
              <div className="h-3.5 bg-gray-100 rounded-md w-full animate-shimmer" />
              <div className="h-3.5 bg-gray-100 rounded-md w-5/6 animate-shimmer" />
            </div>
            <div className="h-3 bg-gray-100 rounded-md w-1/4 animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageListSkeleton;
