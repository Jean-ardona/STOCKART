import { useSyncExternalStore } from 'react'
import { getSyncState, subscribeSync, type SyncState } from '../lib/syncEngine'

/** Current sync status; mounting this hook starts the sync engine. */
export function useSyncStatus(): SyncState {
  return useSyncExternalStore(subscribeSync, getSyncState)
}
