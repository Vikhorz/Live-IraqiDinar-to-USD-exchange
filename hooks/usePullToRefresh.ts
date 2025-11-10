import React, { useState, useCallback } from 'react';

const PULL_THRESHOLD = 80; // Pixels to pull down before refresh is triggered
const PULL_RESISTANCE = 0.5; // Makes the pull feel heavier

export const usePullToRefresh = (onRefresh: () => void, disabled: boolean = false) => {
  const [pullStartPosition, setPullStartPosition] = useState(0);
  const [pullPosition, setPullPosition] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const touchStart = useCallback((e: React.TouchEvent<HTMLElement>) => {
    // Ignore pull-to-refresh if the touch starts on an interactive element.
    const target = e.target as HTMLElement;
    if (target.closest('button, a, select, input')) {
        setPullStartPosition(0);
        return;
    }
    
    if (disabled || window.scrollY > 0) return; // Don't activate if disabled or page is scrolled
    setPullStartPosition(e.touches[0].clientY);
  }, [disabled]);

  const touchMove = useCallback((e: React.TouchEvent<HTMLElement>) => {
    if (disabled || pullStartPosition === 0) return;
    const pullDistance = e.touches[0].clientY - pullStartPosition;
    if (pullDistance > 0 && window.scrollY === 0) {
      e.preventDefault(); // Prevent browser's default overscroll behavior
      setPullPosition(pullDistance * PULL_RESISTANCE);
    }
  }, [pullStartPosition, disabled]);

  const touchEnd = useCallback(async () => {
    if (disabled || pullStartPosition === 0) return;
    if (pullPosition > PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullPosition(PULL_THRESHOLD); // Keep indicator visible while refreshing
      try {
        await onRefresh();
      } finally {
        // Smoothly retract the indicator
        setTimeout(() => {
          setPullPosition(0);
          setIsRefreshing(false);
          setPullStartPosition(0);
        }, 300);
      }
    } else {
      setPullPosition(0); // Retract if not pulled far enough
      setPullStartPosition(0);
    }
  }, [pullPosition, onRefresh, disabled, pullStartPosition]);

  return {
    isRefreshing,
    pullPosition: Math.min(pullPosition, PULL_THRESHOLD + 20), // Cap the pull distance for visual stability
    pullToRefreshThreshold: PULL_THRESHOLD,
    touchStart,
    touchMove,
    touchEnd,
  };
};