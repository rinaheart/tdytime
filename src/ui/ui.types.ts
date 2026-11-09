/**
 * UI Types — TdyTime v2
 * Types specific to UI layer (not domain logic).
 */

/** Changelog entry for About view */
export interface ChangeLogEntry {
    version: string;
    date: string;
    changes: string[];
}
