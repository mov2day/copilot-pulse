export type DataQuality = 'exact' | 'delayed' | 'imported' | 'estimated';
export type Confidence = 'high' | 'medium' | 'low';
export type BudgetKind = 'daily' | 'weekly' | 'billingCycle' | 'session';
export interface UsageSample { id: string; observedAt: string; credits: number; cumulativeCredits?: number; quality: DataQuality; sourceId: string; feature?: string; model?: string; sessionId?: string; note?: string; }
export interface AllowanceSnapshot { amount: number; consumed?: number; observedAt: string; sourceId: string; quality: DataQuality; }
export interface Freshness { observedAt?: string; stale: boolean; explanation: string; }
export interface Budget { kind: BudgetKind; amount: number; consumed: number; periodStart: Date; periodEnd: Date; }
export interface Projection { budget: Budget; ratePerHour: number; projectedUsage: number; exhaustionAt?: Date; confidence: Confidence; }
export interface FocusSession { id: string; name: string; startedAt: string; endsAt?: string; target: number; warningAt: number; startCredits: number; pausedAt?: string; pausedMs: number; note?: string; endedAt?: string; endCredits?: number; }
export interface CompletedSession extends FocusSession { endedAt: string; endCredits: number; consumed: number; largestSurge?: { observedAt: string; credits: number }; }
export interface Alert { id: string; severity: 'ambient' | 'info' | 'warning' | 'critical'; title: string; explanation: string[]; fingerprint: string; createdAt: string; budgetKind?: BudgetKind; }
export interface AlertState { fingerprint: string; acknowledgedAt?: string; snoozedUntil?: string; lastNotifiedAt?: string; }
export interface ProviderDiagnostics { id: string; quality: DataQuality; lastRefresh?: string; lastError?: string; detail: string; }
export interface DashboardModel { quality: DataQuality; freshness: Freshness; now: string; budgets: Budget[]; ratePerHour: number; baselineRate: number; ratio: number; weather: string; projections: Projection[]; trail: UsageSample[]; session?: FocusSession; sessions: CompletedSession[]; alerts: Alert[]; pacing: { daily: number; weekly: number }; officialAllowance?: number; officialBudget?: number; provider: ProviderDiagnostics; economyUntil?: string; }
