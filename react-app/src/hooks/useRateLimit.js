import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for rate limiting form submissions
 * @param {number} limit - Maximum number of attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {object} Rate limit state and functions
 */
const useRateLimit = (limit = 3, windowMs = 60000) => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(limit);
  const [blockTimeLeft, setBlockTimeLeft] = useState(0);

  const attemptsRef = useRef([]);
  const blockTimerRef = useRef(null);
  const countdownRef = useRef(null);

  /**
   * Clean up old attempts outside the time window
   */
  const cleanupOldAttempts = useCallback(() => {
    const now = Date.now();
    attemptsRef.current = attemptsRef.current.filter(
      timestamp => now - timestamp < windowMs
    );
  }, [windowMs]);

  /**
   * Start the block countdown timer
   */
  const startBlockCountdown = useCallback((duration) => {
    const endTime = Date.now() + duration;

    const updateCountdown = () => {
      const remaining = Math.max(0, endTime - Date.now());
      setBlockTimeLeft(Math.ceil(remaining / 1000));

      if (remaining > 0) {
        countdownRef.current = setTimeout(updateCountdown, 1000);
      }
    };

    updateCountdown();
  }, []);

  /**
   * Check if the action is allowed
   * @returns {boolean} Whether the action is allowed
   */
  const checkRateLimit = useCallback(() => {
    cleanupOldAttempts();

    // If already blocked, check if block time has expired
    if (isBlocked) {
      const now = Date.now();
      const oldestAttempt = attemptsRef.current[0];

      if (oldestAttempt && now - oldestAttempt >= windowMs) {
        // Block time expired, reset
        attemptsRef.current = [];
        setIsBlocked(false);
        setAttemptsLeft(limit);
        setBlockTimeLeft(0);

        if (blockTimerRef.current) {
          clearTimeout(blockTimerRef.current);
          blockTimerRef.current = null;
        }
        if (countdownRef.current) {
          clearTimeout(countdownRef.current);
          countdownRef.current = null;
        }

        return true;
      }

      return false;
    }

    // Check if limit would be exceeded
    if (attemptsRef.current.length >= limit) {
      const oldestAttempt = attemptsRef.current[0];
      const timeUntilUnblock = windowMs - (Date.now() - oldestAttempt);

      setIsBlocked(true);
      startBlockCountdown(timeUntilUnblock);

      // Set timer to automatically unblock
      blockTimerRef.current = setTimeout(() => {
        attemptsRef.current = [];
        setIsBlocked(false);
        setAttemptsLeft(limit);
        setBlockTimeLeft(0);
      }, timeUntilUnblock);

      return false;
    }

    return true;
  }, [isBlocked, limit, windowMs, cleanupOldAttempts, startBlockCountdown]);

  /**
   * Record an attempt
   */
  const recordAttempt = useCallback(() => {
    const now = Date.now();
    attemptsRef.current.push(now);
    cleanupOldAttempts();

    const remaining = Math.max(0, limit - attemptsRef.current.length);
    setAttemptsLeft(remaining);
  }, [limit, cleanupOldAttempts]);

  /**
   * Attempt to perform the rate-limited action
   * @param {Function} action - The action to perform if allowed
   * @returns {Promise<boolean>} Whether the action was performed
   */
  const attempt = useCallback(async (action) => {
    if (!checkRateLimit()) {
      return false;
    }

    recordAttempt();

    try {
      await action();
      return true;
    } catch (error) {
      console.error('Rate-limited action failed:', error);
      throw error;
    }
  }, [checkRateLimit, recordAttempt]);

  /**
   * Reset the rate limiter
   */
  const reset = useCallback(() => {
    attemptsRef.current = [];
    setIsBlocked(false);
    setAttemptsLeft(limit);
    setBlockTimeLeft(0);

    if (blockTimerRef.current) {
      clearTimeout(blockTimerRef.current);
      blockTimerRef.current = null;
    }
    if (countdownRef.current) {
      clearTimeout(countdownRef.current);
      countdownRef.current = null;
    }
  }, [limit]);

  /**
   * Get formatted time remaining message
   */
  const getBlockMessage = useCallback(() => {
    if (!isBlocked) return '';

    if (blockTimeLeft >= 60) {
      const minutes = Math.ceil(blockTimeLeft / 60);
      return `Too many attempts. Please wait ${minutes} minute${minutes > 1 ? 's' : ''}.`;
    }

    return `Too many attempts. Please wait ${blockTimeLeft} second${blockTimeLeft !== 1 ? 's' : ''}.`;
  }, [isBlocked, blockTimeLeft]);

  return {
    isBlocked,
    attemptsLeft,
    blockTimeLeft,
    attempt,
    reset,
    checkRateLimit,
    getBlockMessage
  };
};

export default useRateLimit;
