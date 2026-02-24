import { useState, useCallback } from 'react';
import { conflictsApi } from '../api/client';
import type { EventConflict } from '@stage/shared';

export function useConflictCheck() {
  const [conflicts, setConflicts] = useState<EventConflict[]>([]);
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  /**
   * Check for conflicts. Returns true if conflicts were found (submission should be paused).
   * Returns false if no conflicts (safe to proceed).
   */
  const checkConflicts = useCallback(async (
    date: string,
    location: string,
    excludeEventId?: number,
  ): Promise<boolean> => {
    if (!date || !location.trim()) return false;

    setCheckingConflicts(true);
    try {
      const result = await conflictsApi.check(date, location.trim(), excludeEventId);
      if (result.conflicts.length > 0) {
        setConflicts(result.conflicts);
        setShowConflictWarning(true);
        setCheckingConflicts(false);
        return true;
      }
    } catch {
      // If conflict check fails, proceed anyway
    }
    setCheckingConflicts(false);
    return false;
  }, []);

  const dismissConflicts = useCallback(() => {
    setShowConflictWarning(false);
    setConflicts([]);
  }, []);

  return {
    conflicts,
    showConflictWarning,
    checkingConflicts,
    checkConflicts,
    dismissConflicts,
  };
}
