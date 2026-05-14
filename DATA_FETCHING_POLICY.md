# Kiden Hub Data Fetching & Performance Policy

This document defines the structural safeguards to prevent unnecessary refetching and remounting on tab switches or refocusing.

## 1. Centralized Visibility Management
- **Rule**: No component may subscribe to `visibilitychange` directly.
- All visibility logic must use the `VisibilityManager` provider.
- Data is only marked as stale if the user has been away for **> 5 minutes**.

## 2. Global Data Fetching Policies (TanStack Query)
- `staleTime`: **300,000ms (5 minutes)** globally.
- `refetchOnWindowFocus`: **false**.
- `refetchOnReconnect`: **false**.
- `gcTime`: **600,000ms (10 minutes)**.

### Exceptions
- Genuinely real-time data (chat, live indicators) may override `staleTime` at the hook level.
- Document reasons for any `refetchOnWindowFocus: true` override in the code comments.

## 3. Client-Side Caching (Layer 4)
- Profile, settings, workspace metadata: TTL **30 minutes**.
- Notes, assets, activity lists: TTL **5 minutes**.
- Real-time data: TTL **0**.
- Persistence: Cache is persisted to `sessionStorage` to survive refreshes.

## 4. Component Lifecycle & Routing
- Avoid using `key={location.pathname}` on high-level route components as it forces full remounts.
- Always provide a cleanup function in `useEffect` to cancel in-flight requests or timers.

## 5. WebSocket Persistence
- Do not disconnect on tab hide.
- Reconnection handlers must use cursor-based syncing (deltas only), not full refetches.

## 6. Developer Safeguards
- **Lint Rule**: Flag any `useEffect` with fetch lacking a cache check.
- **Reviews**: Check for `refetchOnWindowFocus: true` in PRs.
- **Dev Mode**: A performance observer logs warnings if > 3 API calls occur within 2s of a visibility change.
