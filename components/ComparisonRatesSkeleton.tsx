import React from 'react';

export const ComparisonRatesSkeleton: React.FC = () => {
    const placeholderColor = 'bg-gray-200 dark:bg-gray-700';

    const SkeletonItem = () => (
        <div className={`p-3 rounded-lg ${placeholderColor}/50 text-center`}>
            <div className={`h-4 w-16 rounded ${placeholderColor} mx-auto mb-2`}></div>
            <div className={`h-6 w-24 rounded ${placeholderColor} mx-auto`}></div>
        </div>
    );

    return (
        <div className="mt-6 animate-pulse">
            <div className={`h-5 w-40 rounded ${placeholderColor} mx-auto mb-3`}></div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
               <SkeletonItem />
               <SkeletonItem />
               <SkeletonItem />
               <SkeletonItem />
            </div>
        </div>
    );
};