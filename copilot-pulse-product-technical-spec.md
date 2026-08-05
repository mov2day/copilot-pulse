# Copilot Pulse
## Product and Technical Design Specification for a VS Code Copilot Usage Guard

**Document status:** Product concept and implementation specification  
**Version:** 1.0  
**Date:** 5 August 2026  
**Primary platform:** Visual Studio Code  
**Working names:** Copilot Pulse, Copilot Usage Guard, Copilot Budget Sentinel  

---

## 1. Executive Summary

Copilot Pulse is a Visual Studio Code extension that helps developers understand, predict, and manage their GitHub Copilot AI-credit consumption.

The extension goes beyond a conventional monthly progress bar. It converts usage into actionable signals:

- **Usage state:** Calm, Active, Elevated, Surge, or Critical.
- **Burn rate:** How quickly AI credits are currently being consumed.
- **Runway:** How long the current daily, weekly, or monthly budget is likely to last.
- **Pacing:** Whether consumption is ahead of or behind the user’s plan.
- **Spike detection:** Whether recent consumption is materially above the user’s normal behavior.
- **Session budgets:** A voluntary target for a focused Copilot work session.
- **Predictive alerts:** Warnings before a limit is reached, rather than only after a threshold has been crossed.

The product must be explicit about the reliability of every measurement. Depending on account type and permissions, usage may be:

- **Exact:** Obtained from a supported near-real-time source.
- **Delayed:** Obtained from daily organization or enterprise reports.
- **Imported:** Obtained from a billing or usage export.
- **Estimated:** Inferred from manual snapshots or local activity signals.

The extension must never claim exact live usage when the source does not provide it.

---

## 2. Product Vision

### 2.1 Vision statement

Help developers use AI coding tools intentionally by making consumption visible, understandable, predictable, and controllable without interrupting productive work.

### 2.2 Product promise

At any moment, a developer should be able to answer:

1. How much Copilot usage have I consumed?
2. How fast am I consuming it now?
3. Is this rate normal for me?
4. When am I likely to reach my chosen limit?
5. What caused the current increase?
6. What action can I take without losing context or productivity?

### 2.3 Differentiation

A standard quota display answers only:

> How much has been used?

Copilot Pulse additionally answers:

> Is the current rate healthy, what happens next, and should I change behavior now?

---

## 3. Current Platform Context

GitHub measures Copilot model usage using **GitHub AI Credits**. The cost of an interaction depends on the selected model and token consumption. Code completions and next-edit suggestions may be treated differently from model-backed chat and agent activity under the current billing model.

GitHub currently provides native usage views through GitHub billing or Copilot settings and through the Copilot control in supported IDEs. In Visual Studio Code, the native Copilot status control can show plan features, progress toward limits, and the allowance reset date.

GitHub also provides usage-report APIs for authorized organization and enterprise users. Many reports are generated daily rather than as a live personal event stream. A separate enterprise usage-record endpoint exists in public preview for eligible Enterprise Managed User environments.

### 3.1 Critical integration assumption

No supported public VS Code API is currently documented for a third-party extension to read the private live quota value displayed by the installed GitHub Copilot extension.

Therefore, Copilot Pulse must use a provider model and degrade honestly when live personal data is unavailable.

### 3.2 Product implication

The product is not merely a wrapper around the native Copilot quota display. Its primary value is:

- User-defined daily and weekly pacing.
- Burn-rate analysis.
- Forecasting and runway.
- Personal baselines.
- Session budgeting.
- Predictive and context-aware alerts.
- Clear data-quality labeling.

---

## 4. Goals and Non-Goals

### 4.1 Goals

1. Show daily, weekly, billing-cycle, and optional session-level usage.
2. Warn before a self-defined limit is likely to be exceeded.
3. Detect meaningful usage acceleration while suppressing noise.
4. Show forecasted exhaustion time and projected period-end usage.
5. Learn the user’s normal consumption pattern locally.
6. Make status understandable at a glance from the VS Code status bar.
7. Provide a detailed but compact dashboard.
8. Work with multiple data-source qualities.
9. Store user history locally by default.
10. Avoid scraping, intercepting, or modifying GitHub Copilot internals.
11. Respect VS Code accessibility, theming, and notification guidelines.

### 4.2 Non-goals

1. Bypassing GitHub billing controls.
2. Intercepting Copilot prompts or responses.
3. Reading private source code to estimate token consumption.
4. Blocking GitHub Copilot through unsupported mechanisms.
5. Modifying the GitHub Copilot extension.
6. Claiming precise per-request attribution without a supported source.
7. Uploading usage history to a third-party backend by default.
8. Replacing GitHub’s official monthly budget and billing controls.
9. Providing financial guarantees about the final GitHub bill.

---

## 5. Target Users

### 5.1 Individual developer

A developer with Copilot Pro, Pro+, Max, Student, or another individual plan who wants to avoid exhausting the monthly allowance unexpectedly.

Needs:

- Personal daily and weekly targets.
- Manual or imported synchronization where no live API exists.
- Forecasting based on periodic snapshots.
- Reminders to refresh data when it becomes stale.

### 5.2 Organization-managed developer

A developer whose Copilot license is provided by an organization or enterprise.

Needs:

- Visibility into personal usage against an organization budget.
- Daily pacing and projected exhaustion.
- Clear distinction between shared pool, personal budget, and self-selected target.

### 5.3 Engineering manager or platform administrator

An authorized user with organization or enterprise metrics permissions.

Needs:

- Supported usage-report integration.
- User filtering.
- Team-safe privacy controls.
- A reliable delayed-data indicator.

### 5.4 Heavy agent-mode user

A developer who performs long refactoring, generation, migration, or repository-level tasks.

Needs:

- Session budgets.
- Rapid spike detection.
- Runway before a task becomes unexpectedly expensive.
- A post-session summary.

---

## 6. Core Experience

## 6.1 Status bar

The status bar is the primary ambient surface.

Recommended default:

```text
◉ Copilot · Calm · 4d runway
```

Alternative compact states:

```text
◉ Copilot · 62%
◉ Copilot · Active 1.4×
⚠ Copilot · Surge 3.2×
🔥 Copilot · 38m runway
◌ Copilot · Estimate stale
```

The status bar should display no more than one icon and one concise message. It should avoid unnecessary custom coloring. Warning or error backgrounds should be reserved for genuinely urgent states.

### Status-bar modes

| Mode | Example | Best for |
|---|---|---|
| State | `◉ Calm` | Minimal distraction |
| Burn rate | `Active · 1.4×` | Spike awareness |
| Runway | `2h 10m runway` | Budget protection |
| Budget | `62 / 80` | Numeric users |
| Adaptive | Automatically chooses the most important signal | Recommended default |

### Adaptive display priority

1. Data-source error or stale-data warning.
2. Critical projected exhaustion.
3. Active spike.
4. Near-limit runway.
5. Elevated usage state.
6. Normal runway.
7. Simple consumption percentage.

Clicking the status item opens the dashboard.

---

## 6.2 Usage Pulse Ring

The dashboard uses concentric rings:

- **Inner ring:** Today.
- **Middle ring:** Current week.
- **Outer ring:** Billing cycle.

Example:

```text
               72%
            ╭────────╮
         ╭──│ Today  │──╮
         │  ╰────────╯  │
         ╰──────────────╯
```

### Ring semantics

| Visual form | Meaning |
|---|---|
| Solid ring | Exact or directly reported value |
| Dashed ring | Delayed value |
| Dotted ring | Estimated value |
| Faded segment | Data not yet synchronized |
| Gentle pulse | New usage received |
| Rapid pulse | Active surge |
| No animation | Reduced-motion preference enabled |

Color must not be the only carrier of meaning. Each state must also use text, icons, patterns, or labels.

---

## 6.3 Burn-Rate Speedometer

The burn-rate indicator shows current consumption relative to a personal baseline.

```text
CALM            ACTIVE             SURGE
──────────────●─────────────────────────
Current rate:   18 credits/hour
Typical rate:    7 credits/hour
Change:       +157%
```

### Burn-rate states

| State | Typical condition |
|---|---|
| Calm | Below 0.8× baseline |
| Normal | 0.8×–1.25× baseline |
| Active | 1.25×–1.75× baseline |
| Elevated | 1.75×–2.5× baseline |
| Surge | 2.5×–4× baseline |
| Critical | Above 4× baseline and projected budget risk |

These ranges are defaults. The final state must also consider absolute usage so that a small increase from one credit to three credits does not create a false emergency.

---

## 6.4 Budget Runway

Runway translates remaining credits into time.

```text
Daily target       1h 35m remaining
Weekly target      Until Friday 14:20
Billing cycle      Projected 6 days early
```

### Runway outputs

- Time until daily target is exhausted.
- Predicted weekday and time for weekly target exhaustion.
- Projected billing-cycle exhaustion date.
- Difference between projected exhaustion and period end.
- Confidence interval or confidence label.

### Confidence labels

| Label | Meaning |
|---|---|
| High | Exact recent data and stable rate |
| Medium | Delayed or sparse data but sufficient history |
| Low | Manual snapshot, insufficient samples, or highly volatile rate |

Example:

```text
Projected exhaustion: Friday 14:20
Confidence: Medium · last exact update 18h ago
```

---

## 6.5 Usage Weather

Usage Weather is a human-readable ambient summary.

| Weather | Meaning |
|---|---|
| `☀ Calm` | Comfortably within plan |
| `🌤 Normal` | Healthy expected usage |
| `⛅ Elevated` | Above normal but not yet dangerous |
| `🌧 Heavy` | Sustained high activity |
| `🌩 Surge` | Rapid increase relative to baseline |
| `🔥 Overheating` | Current pace will soon exceed a limit |
| `🌫 Unknown` | Data is stale or insufficient |

Example explanation:

```text
🌩 Surge
You used 24 AI credits in the last 20 minutes.
This is 3.4× your normal Wednesday-afternoon rate.
```

Weather labels are optional and may be disabled by users who prefer neutral professional terminology.

---

## 6.6 Live Usage Trail

A compact time-series trail shows consumption over the current day.

```text
08:00 ▁▁▂▁▁▃▂▁ 10:00 ▁▂▃▆█▇▅ 12:00
                         ↑
                    Usage surge
```

Selecting a peak opens details:

```text
11:32–11:47
27 AI credits
4.1× equivalent baseline
Data source: Enterprise usage records
Likely activity: Agent session
```

When attribution is inferred rather than reported:

```text
Probable activity based on timing and local session markers
```

The UI must never present inferred attribution as certain.

---

## 6.7 Pacing Track

Pacing compares the percentage of the budget consumed against the percentage of the period elapsed.

Example:

```text
Working day elapsed       28%
Daily target consumed     46%
Pacing difference        +18 percentage points
```

Interpretation:

- Negative difference: under plan.
- Near zero: on plan.
- Positive difference: ahead of plan.

A configurable grace margin prevents alerts for minor deviations.

---

## 6.8 Focus-Session Budget

A user may start a named Copilot session budget:

```text
Start Copilot Session

Purpose          Refactor authentication
Duration         45 minutes
Credit target    25
Warning at       20

[Start session]
```

During the session:

```text
Authentication refactor
18 / 25 credits · 24m remaining
State: Active · 1.6× normal
```

Post-session summary:

```text
Session complete

Consumed             29 credits
Target               25 credits
Difference          +16%
Duration              51 minutes
Largest surge         11:42–11:49
Weekly impact          6.4%
Data confidence        High
```

### Session controls

- Pause tracking.
- Extend duration.
- Raise or lower target.
- End session.
- Snooze alerts.
- Add a short note.

### Important limitation

Unless GitHub exposes a supported control for the current environment, extension session targets are advisory. They do not technically stop Copilot usage.

GitHub Copilot CLI and SDK may support their own AI-credit session limits. Copilot Pulse may provide guidance or launch helpers for supported environments, but it must not claim equivalent enforcement inside VS Code without a documented API.

---

## 6.9 Economy Mode

Economy Mode is a voluntary awareness mode, not a hidden blocker.

```text
Economy Mode · Until 17:00

✓ Show remaining runway after meaningful changes
✓ Warn before a projected limit breach
✓ Surface model-efficiency guidance
✓ Reduce duplicate informational notifications
✓ Require acknowledgement only for critical risk
```

Possible actions:

```text
[Enable for 1 hour] [Enable until end of day] [Configure]
```

Economy Mode must not intercept Copilot prompts, inspect source content, or block commands using unsupported methods.

---

## 7. Data Source Strategy

The extension uses a common `UsageProvider` interface.

```ts
export interface UsageProvider {
  readonly id: string;
  readonly quality: 'exact' | 'delayed' | 'imported' | 'estimated';
  readonly capabilities: ProviderCapabilities;

  authenticate?(): Promise<void>;
  getAllowance(): Promise<AllowanceSnapshot | undefined>;
  getUsage(range: TimeRange): Promise<UsageSample[]>;
  getFreshness(): Promise<DataFreshness>;
  dispose(): void;
}
```

## 7.1 Provider A: Enterprise usage records

Use when the user belongs to an eligible Enterprise Managed User enterprise and has the required enterprise-owner access.

Potential characteristics:

- Highest available temporal resolution.
- Session activity records across supported Copilot clients.
- Public-preview API and therefore subject to change.
- Not suitable as the default consumer path.
- Requires strict permission and schema-version handling.

Quality label:

```text
Exact or near-live · Public preview
```

## 7.2 Provider B: Enterprise user usage report

Uses daily or latest 28-day enterprise user reports.

Characteristics:

- User-level detail.
- Generated daily.
- Requires enterprise permissions.
- Good for daily, weekly, and trend analysis.
- Not suitable for immediate minute-level spike alerts.

Quality label:

```text
Reported · Updated daily
```

## 7.3 Provider C: Organization user usage report

Uses organization user reports.

Characteristics:

- User-level data for an organization.
- Requires organization-owner or delegated metrics access.
- Generated daily.
- Suitable for delayed pacing and forecasting.

Quality label:

```text
Reported · Updated daily
```

## 7.4 Provider D: Usage-report import

The user imports a supported CSV, JSON, or NDJSON billing/usage report.

Characteristics:

- Accurate for the report period.
- Not automatically current unless the user imports repeatedly.
- Useful for individual accounts and restricted environments.

Quality label:

```text
Imported · Last import 5 August, 09:10
```

## 7.5 Provider E: Manual snapshot

The user enters the current consumed amount and allowance.

Example:

```text
Consumed this cycle: 720
Allowance: 1,500
Observed at: 5 August 2026, 13:00
```

The extension calculates the delta after the next snapshot.

Quality label:

```text
Estimated between manual snapshots
```

## 7.6 Provider F: Local session markers

The extension tracks locally declared sessions and editor activity windows without reading prompts or content.

Possible local signals:

- Focus session started or ended.
- Copilot-related command invoked, where the command is public and safe to observe.
- Window focus state.
- Active coding duration.
- User-entered snapshot before and after a session.

These signals may improve attribution but do not prove actual AI-credit use.

Quality label:

```text
Locally inferred
```

## 7.7 Provider auto-selection

Priority order:

1. Supported exact provider with valid permissions.
2. Supported daily report provider.
3. Recently imported report.
4. Manual snapshot.
5. Local estimate only.

The extension should allow the user to override automatic selection.

---

## 8. Data Quality and Honesty Model

Every calculated metric must carry metadata:

```ts
interface MetricValue<T> {
  value: T;
  quality: 'exact' | 'delayed' | 'imported' | 'estimated';
  observedAt: string;
  sourceId: string;
  confidence: 'high' | 'medium' | 'low';
  explanation?: string;
}
```

### UI rules

1. Show the latest observation time.
2. Use patterns as well as color.
3. Explain estimates on hover.
4. Never merge exact and estimated values without labeling the result.
5. Suppress minute-level spike claims when the provider only updates daily.
6. Disable unsupported alert types instead of simulating precision.
7. When data becomes stale, transition to `Unknown` rather than preserving an apparently live state.

---

## 9. Budget Model

The extension supports several independent limits.

### 9.1 Personal target

A user-selected behavioral target. It does not modify GitHub billing.

Examples:

- Daily target: 80 credits.
- Weekly target: 400 credits.
- Billing-cycle target: 1,200 credits.

### 9.2 Official allowance

The allowance reported by GitHub for the user or account.

### 9.3 Official enforced budget

An organization, enterprise, or personal billing budget that GitHub may enforce.

### 9.4 Session target

A temporary target for one task or work period.

### 9.5 Display rules

Do not collapse these into one number.

Example:

```text
Personal monthly target       1,200 credits
Included allowance            1,500 credits
Official enforced budget      Not detected
Current consumption             720 credits
```

---

## 10. Alerting System

## 10.1 Alert philosophy

Alerts should be:

- Predictive rather than purely reactive.
- Explainable.
- Rate-limited.
- Actionable.
- Proportional to risk.
- Sensitive to data quality.
- Quiet when no action is needed.

## 10.2 Notification ladder

### Level 0: Silent logging

Record the condition for dashboard history only.

### Level 1: Ambient status

Change the status-bar label or icon without a popup.

```text
Copilot · Elevated 1.8×
```

### Level 2: Non-blocking information

```text
Copilot usage is rising faster than your normal rate.
```

### Level 3: Actionable warning

```text
At the current pace, today’s target is likely to be reached in 45 minutes.
```

Actions:

```text
[View usage] [Enable Economy Mode] [Snooze 1 hour]
```

### Level 4: Critical warning

Used only when a limit is near, an enforced budget is at risk, or current usage materially deviates from plan.

```text
Weekly target is projected to be exceeded by 28%.
```

Actions:

```text
[Review sessions] [Adjust target] [Dismiss]
```

---

## 10.3 Threshold alerts

Default thresholds:

| Budget | Informational | Warning | Critical |
|---|---:|---:|---:|
| Daily | 60% | 80% | 100% |
| Weekly | 60% | 80% | 100% |
| Billing cycle | 60% | 80% | 100% |
| Session | 70% | 90% | 100% |

Thresholds are configurable.

A threshold should alert once per period unless:

- The user resets the alert.
- The projected risk becomes materially worse.
- A different limit is affected.
- The data source changes from estimated to exact and reveals a significant difference.

---

## 10.4 Spike detection

### Inputs

- Recent usage in a rolling window.
- Baseline usage for equivalent windows.
- Minimum absolute usage.
- Minimum number of historical samples.
- Current budget risk.
- Data freshness and quality.

### Default windows

- 15 minutes.
- 30 minutes.
- 60 minutes.

### Basic formula

```text
recentRate = recentUsage / recentWindowHours
baselineRate = median(comparableHistoricalRates)
rateRatio = recentRate / max(baselineRate, baselineFloor)
```

Trigger when all conditions are true:

```text
rateRatio >= configuredMultiplier
recentUsage >= minimumAbsoluteCredits
sampleCount >= minimumBaselineSamples
cooldownExpired = true
```

Recommended defaults:

```text
window                    30 minutes
multiplier                2.5×
minimum absolute usage    10 credits
minimum samples           8
cooldown                  60 minutes
```

### Robust baseline

Use the median rather than the arithmetic mean because isolated large sessions can distort the mean.

Comparable samples should prefer:

1. Same day of week and time block.
2. Same time block on adjacent weekdays.
3. Same session type, where known.
4. General recent history as fallback.

### Baseline floor

A small positive floor prevents division by an extremely low baseline.

Example:

```text
baselineFloor = 2 credits/hour
```

### Spike severity

| Severity | Suggested condition |
|---|---|
| Elevated | ≥1.75× and absolute minimum met |
| Surge | ≥2.5× and projected target impact |
| Critical | ≥4× and target exhaustion is near |

### Suppression rules

Do not alert when:

- The increase is numerically trivial.
- Data is too stale for the requested window.
- The same spike was already acknowledged.
- A focus session explicitly permits the expected rate.
- Usage dropped before the alert could be shown.

---

## 10.5 Pacing alerts

### Formula

```text
periodElapsedRatio = elapsedWorkingTime / configuredWorkingPeriod
budgetConsumedRatio = consumed / target
pacingDelta = budgetConsumedRatio - periodElapsedRatio
```

Example:

```text
Day elapsed:        28%
Budget consumed:    46%
Pacing delta:      +18 percentage points
```

Default warning:

```text
pacingDelta >= 15 percentage points
AND consumed >= 25% of target
```

The user may configure calendar-day pacing or working-hours pacing.

---

## 10.6 Forecast alerts

### Simple forecast

```text
projectedPeriodUsage = currentUsage + smoothedRate × remainingPeriodHours
```

### Smoothed rate

Use an exponentially weighted moving average or a blend of:

- Last 30-minute rate.
- Current-day average.
- Equivalent historical period rate.

Example weighting:

```text
smoothedRate =
  0.50 × currentDayRate +
  0.30 × recentRate +
  0.20 × historicalEquivalentRate
```

Weights should be adjusted based on data confidence.

### Forecast warning conditions

- Projected usage exceeds target by at least 10%.
- Target exhaustion is predicted within a configured time horizon.
- Confidence is medium or high.
- The alert has not already been acknowledged.

### Example alert

```text
Weekly target likely to be exceeded
Projected: 580 credits
Target:    450 credits
Difference: +29%
Confidence: Medium
```

---

## 10.7 Stale-data alerts

Examples:

```text
Usage data has not been updated for 24 hours.
Forecasting is paused until a new report or snapshot is available.
```

Stale thresholds depend on provider:

| Provider | Suggested stale threshold |
|---|---|
| Enterprise records | 30–60 minutes |
| Daily report | 36 hours |
| Imported report | User configured, default 48 hours |
| Manual snapshot | 24 hours for daily forecasting |

---

## 11. Personal Baseline Engine

## 11.1 Purpose

A static threshold does not account for different work styles. The baseline engine learns normal consumption patterns locally.

## 11.2 Baseline dimensions

- Time of day.
- Day of week.
- Workday versus weekend.
- Session type.
- Repository or workspace, if the user opts in.
- Model or feature, only when reported by the data source.

## 11.3 Minimum history

Recommended states:

| History | Baseline state |
|---|---|
| Fewer than 3 samples | Unavailable |
| 3–7 samples | Preliminary |
| 8–20 samples | Usable |
| More than 20 samples | Established |

Do not produce strong anomaly claims with a preliminary baseline.

## 11.4 Privacy

Workspace names must not be stored unless the user explicitly enables workspace-aware tracking. Prefer a local irreversible hash or user-defined label.

No prompt content, response content, file content, or source code is required for baseline calculation.

---

## 12. Dashboard Information Architecture

Recommended single-panel layout:

```text
┌─────────────────────────────────────────────────────┐
│ COPILOT PULSE                         ☀ CALM         │
│ Exact · Updated 13:18                                │
│                                                     │
│                  ╭─────────╮                        │
│               ╭──│   62%   │──╮                     │
│               │  │  Today  │  │                     │
│               ╰──╰─────────╯──╯                     │
│                                                     │
│ Current velocity          8.4 credits/hour          │
│ Personal baseline         6.1 credits/hour          │
│ Daily runway              3h 20m                    │
│ Weekly projection         412 / 450                 │
│                                                     │
│ ▁▁▂▁▃▃▂▂▅█▆▃▂                                     │
│                 ↑ 11:40 surge                       │
│                                                     │
│ Today       Week        Cycle       Sessions        │
│                                                     │
│ [Start Focus Session] [Economy Mode] [Settings]     │
└─────────────────────────────────────────────────────┘
```

### Tabs or sections

1. **Overview** — pulse rings, burn rate, runway, forecast.
2. **Timeline** — detailed usage trail and detected events.
3. **Sessions** — focus-session history and summaries.
4. **Budgets** — personal targets, official allowance, and thresholds.
5. **Data** — provider, freshness, permissions, imports, and confidence.
6. **Insights** — baseline trends and efficiency suggestions.

---

## 13. Interaction Design

## 13.1 First-run flow

1. Explain what the extension can and cannot measure.
2. Detect available providers.
3. Offer GitHub authentication only when needed.
4. Let the user set a daily and weekly target.
5. Select preferred status-bar mode.
6. Configure notification level.
7. Show a sample dashboard with explicit placeholder data.

### First-run message

```text
Copilot Pulse can provide exact, delayed, imported, or estimated insights depending on your GitHub account and permissions. Every metric will show its source and freshness.
```

## 13.2 Quick setup

Recommended defaults can be derived from the monthly allowance:

```text
Daily target = monthly target / configured workdays
Weekly target = daily target × configured workdays per week
```

The extension should present these as suggestions, not authoritative values.

## 13.3 Command Palette commands

```text
Copilot Pulse: Open Dashboard
Copilot Pulse: Start Focus Session
Copilot Pulse: End Focus Session
Copilot Pulse: Enter Usage Snapshot
Copilot Pulse: Import Usage Report
Copilot Pulse: Refresh Usage
Copilot Pulse: Enable Economy Mode
Copilot Pulse: Snooze Alerts
Copilot Pulse: Configure Budgets
Copilot Pulse: Explain Current Alert
Copilot Pulse: Export Local History
Copilot Pulse: Delete Local History
```

## 13.4 Alert explanation

Every alert should have an explanation view:

```text
Why did I receive this alert?

- 24 credits were reported in the last 30 minutes.
- Your equivalent baseline is 7 credits.
- The increase is 3.4× normal.
- At the current rate, the daily target will be reached in 38 minutes.
- Data source: Enterprise usage records.
```

---

## 14. Settings

Example configuration:

```jsonc
{
  "copilotPulse.enabled": true,
  "copilotPulse.dataSource": "auto",

  "copilotPulse.budgets.daily": 80,
  "copilotPulse.budgets.weekly": 400,
  "copilotPulse.budgets.billingCycle": 1500,

  "copilotPulse.thresholds.informational": 60,
  "copilotPulse.thresholds.warning": 80,
  "copilotPulse.thresholds.critical": 100,

  "copilotPulse.spike.enabled": true,
  "copilotPulse.spike.windowMinutes": 30,
  "copilotPulse.spike.multiplier": 2.5,
  "copilotPulse.spike.minimumCredits": 10,
  "copilotPulse.spike.minimumSamples": 8,
  "copilotPulse.spike.cooldownMinutes": 60,

  "copilotPulse.forecast.enabled": true,
  "copilotPulse.forecast.warningPercentage": 110,
  "copilotPulse.forecast.minimumConfidence": "medium",

  "copilotPulse.statusBar.mode": "adaptive",
  "copilotPulse.statusBar.showDataQuality": true,

  "copilotPulse.notifications.level": "actionable",
  "copilotPulse.notifications.quietHours.enabled": false,
  "copilotPulse.notifications.quietHours.start": "18:00",
  "copilotPulse.notifications.quietHours.end": "08:00",

  "copilotPulse.workingSchedule.timezone": "Europe/Berlin",
  "copilotPulse.workingSchedule.days": [1, 2, 3, 4, 5],
  "copilotPulse.workingSchedule.start": "09:00",
  "copilotPulse.workingSchedule.end": "17:30",

  "copilotPulse.storage.retentionDays": 180,
  "copilotPulse.storage.workspaceAware": false,
  "copilotPulse.telemetry.enabled": false
}
```

### Configuration principles

- Defaults must be useful but conservative.
- Advanced settings should not overwhelm first-run setup.
- The dashboard should explain effective values.
- Invalid combinations should be rejected with a clear message.
- Settings should support VS Code Settings Sync only for preferences, not private usage history or tokens.

---

## 15. Technical Architecture

```text
src/
├── extension.ts
├── commands/
│   ├── open-dashboard.ts
│   ├── start-session.ts
│   ├── import-report.ts
│   └── enter-snapshot.ts
├── auth/
│   ├── github-auth.ts
│   └── credential-store.ts
├── providers/
│   ├── usage-provider.ts
│   ├── enterprise-records-provider.ts
│   ├── enterprise-report-provider.ts
│   ├── organization-report-provider.ts
│   ├── report-import-provider.ts
│   ├── manual-snapshot-provider.ts
│   └── provider-registry.ts
├── domain/
│   ├── allowance.ts
│   ├── usage-sample.ts
│   ├── budget.ts
│   ├── session.ts
│   ├── metric-value.ts
│   └── alert.ts
├── analytics/
│   ├── usage-aggregator.ts
│   ├── burn-rate.ts
│   ├── baseline-engine.ts
│   ├── spike-detector.ts
│   ├── pacing-engine.ts
│   ├── projection-engine.ts
│   └── confidence-engine.ts
├── alerts/
│   ├── alert-orchestrator.ts
│   ├── notification-policy.ts
│   ├── threshold-rule.ts
│   ├── spike-rule.ts
│   ├── pacing-rule.ts
│   ├── forecast-rule.ts
│   └── stale-data-rule.ts
├── storage/
│   ├── usage-repository.ts
│   ├── settings-repository.ts
│   ├── migration-manager.ts
│   └── retention-policy.ts
├── ui/
│   ├── status-bar-controller.ts
│   ├── dashboard-provider.ts
│   ├── dashboard-message-router.ts
│   ├── accessibility.ts
│   └── webview/
│       ├── index.html
│       ├── app.ts
│       ├── components/
│       └── styles.css
├── security/
│   ├── content-security-policy.ts
│   ├── input-validation.ts
│   └── redaction.ts
└── test/
    ├── unit/
    ├── integration/
    ├── fixtures/
    └── extension/
```

---

## 16. Core Domain Model

```ts
interface UsageSample {
  id: string;
  observedAt: string;
  periodStart?: string;
  periodEnd?: string;
  credits: number;
  cumulativeCredits?: number;
  feature?: string;
  model?: string;
  sessionId?: string;
  workspaceHash?: string;
  quality: DataQuality;
  sourceId: string;
  rawReference?: string;
}

type DataQuality = 'exact' | 'delayed' | 'imported' | 'estimated';

interface BudgetDefinition {
  id: string;
  type: 'daily' | 'weekly' | 'billing-cycle' | 'session';
  source: 'personal-target' | 'official-allowance' | 'official-budget';
  amount: number;
  timezone: string;
  resetRule: ResetRule;
}

interface UsageProjection {
  budgetId: string;
  projectedUsage: number;
  exhaustionAt?: string;
  confidence: 'high' | 'medium' | 'low';
  generatedAt: string;
  methodVersion: string;
}

interface AlertEvent {
  id: string;
  ruleId: string;
  severity: 'ambient' | 'info' | 'warning' | 'critical';
  createdAt: string;
  title: string;
  explanation: string[];
  actions: AlertAction[];
  acknowledgedAt?: string;
  snoozedUntil?: string;
  fingerprint: string;
}
```

---

## 17. Storage Strategy

### 17.1 Preferences

Use VS Code configuration for user-visible preferences.

### 17.2 Small state

Use `ExtensionContext.globalState` for:

- Onboarding completion.
- Current display mode.
- Alert acknowledgements.
- Last provider selection.
- Lightweight migration metadata.

### 17.3 Secrets

Use `ExtensionContext.secrets` for tokens or sensitive credentials. Never store tokens in settings, logs, workspace files, or webview state.

### 17.4 Usage history

Use `globalStorageUri` for a local database or structured files.

Potential implementations:

- JSON Lines for a simple MVP.
- SQLite for indexed history and aggregation.
- IndexedDB for a web-extension-compatible build.

### 17.5 Retention

Default retention: 180 days.

User controls:

- 30, 90, 180, or 365 days.
- Keep indefinitely.
- Delete all history.
- Export history.

---

## 18. Authentication and Permissions

Use the VS Code authentication API for GitHub sessions when compatible with the required scopes.

Principles:

1. Request authentication only after the user selects a provider that requires it.
2. Request the minimum scopes required.
3. Explain why each scope is needed.
4. Do not reuse a token for unrelated services.
5. Handle revoked sessions cleanly.
6. Avoid repeated authentication prompts.
7. Keep report URLs and downloaded report data local.

Where required permissions cannot be obtained through the built-in provider, guide the user through a secure supported token flow. Do not request a broad classic token when a fine-grained alternative is available and compatible.

---

## 19. Provider Refresh and Scheduling

### 19.1 Exact provider

- Refresh every 5–15 minutes by default.
- Respect GitHub API rate limits.
- Back off exponentially after errors.
- Refresh immediately when the dashboard opens, subject to cooldown.

### 19.2 Daily report provider

- Check once after the expected report publication period.
- Retry conservatively.
- Do not poll every few minutes for a daily report.

### 19.3 Import provider

- No automatic external refresh.
- Remind the user when the imported report is stale.

### 19.4 Manual provider

- Offer a status-bar reminder at a user-selected interval.
- Avoid repeated intrusive prompts.

### 19.5 Remote and web environments

A dual desktop/web extension is possible, but provider capabilities differ:

- Desktop extensions may use Node.js libraries and local storage more freely.
- Web extensions must use browser-compatible APIs and VS Code’s virtual file-system interfaces.
- Network calls from web extensions require compatible CORS behavior.

An MVP may target VS Code desktop first.

---

## 20. Webview Design and Security

A webview is justified because pulse rings, timelines, and interactive forecasting exceed native tree-view capabilities.

Requirements:

1. Strict Content Security Policy.
2. Nonce-based script loading.
3. No remote scripts.
4. No inline executable code.
5. Theme-aware colors using VS Code tokens.
6. Keyboard navigation.
7. ARIA labels for charts and controls.
8. Reduced-motion support.
9. Text alternative for every visualization.
10. Validate all messages crossing the extension/webview boundary.
11. Never pass authentication tokens into the webview.
12. Sanitize imported report labels and user notes.

---

## 21. Accessibility

### Requirements

- WCAG-aware contrast.
- Full keyboard navigation.
- Screen-reader descriptions.
- Color-independent states.
- Configurable animation.
- Reduced-motion support.
- Logical focus order.
- Minimum target sizes.
- Accessible notification wording.

### Example chart description

```text
Today’s usage is 62 of 80 credits. This is 18 percentage points ahead of the configured daily pace. Current burn rate is 1.4 times the personal baseline.
```

---

## 22. Privacy and Security

### 22.1 Default privacy posture

- Local-only storage.
- No product telemetry by default.
- No prompt collection.
- No response collection.
- No source-code collection.
- No file-content inspection.
- No remote analytics service required.

### 22.2 Logs

Logs may contain:

- Provider state.
- Refresh timestamps.
- Aggregate numeric usage.
- Error codes.
- Alert decisions.

Logs must not contain:

- Tokens.
- Signed report URLs after use.
- Prompt or response text.
- Source code.
- Raw personally identifying report fields unless essential and redacted.

### 22.3 Report handling

- Download only after explicit user configuration.
- Validate content type and size.
- Stream or parse safely.
- Delete temporary files.
- Store only fields needed for analytics.
- Provide a data-deletion command.

---

## 23. Error Handling

### Provider errors

```text
Unable to refresh organization usage report.
Last successful update: 4 August 2026, 09:15.
Forecasts are based on delayed data.
```

### Permission errors

```text
Your GitHub account does not have permission to read organization Copilot usage reports. Choose manual snapshot or report import instead.
```

### Schema changes

Public-preview APIs may change. The provider must:

- Validate schema versions.
- Fail closed on unknown required fields.
- Preserve the last valid snapshot.
- Mark data stale.
- Avoid silently mapping unknown fields.

### Corrupt imports

Return row-level validation errors where possible:

```text
Import stopped: 17 rows have an invalid timestamp and 4 rows contain a negative credit value.
```

---

## 24. Performance Requirements

- Extension activation should not require a network call.
- Status bar should appear using cached data.
- Provider refresh must run asynchronously.
- Dashboard initial render target: below 500 ms using cached data.
- Avoid continuous timers when VS Code is unfocused.
- Aggregate historical data incrementally.
- Limit webview payload size.
- Use downsampled timeline data for long ranges.

---

## 25. Testing Strategy

## 25.1 Unit tests

- Budget resets across time zones.
- Daily and weekly aggregation.
- Burn-rate calculations.
- Median baseline.
- Baseline floor behavior.
- Spike detection.
- Cooldown and deduplication.
- Pacing calculations.
- Forecasting.
- Confidence scoring.
- Stale-data transitions.
- Provider auto-selection.
- Data-quality propagation.

## 25.2 Property-based tests

Useful invariants:

- Aggregated credits cannot be negative.
- Consumed percentage cannot decrease for cumulative exact samples within one period unless the source issues a correction.
- Runway cannot be negative; exhausted state is explicit.
- A lower current rate should not produce an earlier exhaustion time when all other inputs are equal.
- A low-quality source cannot produce a high-confidence minute-level spike.

## 25.3 Provider contract tests

Each provider must pass a common contract suite:

- Authentication behavior.
- Freshness reporting.
- Empty report handling.
- Pagination.
- Rate-limit handling.
- Schema validation.
- Duplicate sample handling.
- Time-zone normalization.

## 25.4 Integration tests

- Status bar updates after refresh.
- Alert actions open the correct view.
- Snooze suppresses notifications.
- Settings changes recalculate metrics.
- Import updates the dashboard.
- Secret storage is used for credentials.
- Webview messages are validated.

## 25.5 UX tests

- Screen reader flow.
- Keyboard-only operation.
- Reduced-motion mode.
- Light, dark, and high-contrast themes.
- Narrow sidebar and editor layouts.
- Notification fatigue over simulated weeks.

## 25.6 Test fixtures

Create anonymized fixtures for:

- Low steady usage.
- One large agent session.
- Multiple small bursts.
- Sparse delayed reports.
- Corrected cumulative totals.
- Missing days.
- Billing-cycle reset.
- Daylight-saving-time transition.
- Multiple organizations.
- Public-preview schema variation.

---

## 26. Observability

Local diagnostic view:

```text
Provider: organization-report
Quality: delayed
Last refresh: 5 August 2026, 09:12
Last successful sample: 4 August 2026
Samples loaded: 2,481
Baseline state: established
Pending alerts: 0
Database size: 1.8 MB
```

Exportable diagnostics must exclude secrets and private usage details unless the user explicitly includes them.

---

## 27. MVP Scope

### 27.1 MVP capabilities

1. Manual snapshots.
2. Usage-report import.
3. Daily, weekly, and billing-cycle targets.
4. Adaptive status bar.
5. Dashboard with pulse rings.
6. Burn-rate calculation between available observations.
7. Pacing analysis.
8. Forecasted period-end usage.
9. Threshold and stale-data alerts.
10. Focus-session tracking with before/after snapshots.
11. Exact, delayed, imported, and estimated labels.
12. Local history and deletion controls.

### 27.2 MVP exclusions

- Unsupported interception of Copilot events.
- Organization-wide administrative dashboard.
- Cloud sync of usage history.
- Automatic model recommendations.
- Enforcement inside VS Code.
- Public-preview enterprise records until the provider is stable enough.

### 27.3 MVP success criteria

- A user can configure budgets in under two minutes.
- The status bar explains current risk without opening the dashboard.
- Every metric shows source quality and freshness.
- Repeated alerts are suppressed correctly.
- Forecasts pause when data is too stale.
- No prompt, response, or source content is collected.

---

## 28. Release Roadmap

## Phase 0: Technical validation

- Confirm supported GitHub endpoints and permissions.
- Obtain example reports.
- Validate report schema and update cadence.
- Test VS Code GitHub authentication scopes.
- Confirm no supported personal live usage API is available before relying on manual mode.
- Prototype status bar and local storage.

## Phase 1: Transparent tracker

- Manual snapshots.
- CSV/JSON/NDJSON import.
- Daily, weekly, monthly targets.
- Status bar.
- Basic dashboard.
- Threshold alerts.
- Data-quality labels.

## Phase 2: Predictive intelligence

- Pacing engine.
- Burn rate.
- Forecasting.
- Runway.
- Baseline learning.
- Spike detection.
- Explainable alerts.

## Phase 3: Session intelligence

- Focus-session budgets.
- Session timeline.
- Post-session summaries.
- Economy Mode.
- Session comparison.

## Phase 4: Supported API providers

- Organization daily reports.
- Enterprise daily reports.
- Enterprise public-preview records where eligible.
- Robust schema-version adapters.

## Phase 5: Advanced insight

- Feature/model breakdown when supplied by the source.
- Efficiency suggestions.
- Workspace-aware optional baselines.
- Multi-account handling.
- Exportable personal reports.

---

## 29. Product Metrics

The product should avoid collecting telemetry by default. With explicit opt-in, useful privacy-preserving metrics might include:

- Onboarding completion.
- Provider type without account identity.
- Alert acknowledgement rate.
- False-alert feedback.
- Dashboard open rate after alerts.
- Economy Mode usage.
- Percentage of forecasts with sufficient confidence.

Local-only product health metrics should remain available without remote collection.

---

## 30. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| No live personal usage API | Cannot provide exact immediate data for most users | Manual snapshots, imports, honest estimation, provider abstraction |
| Daily report delay | Minute-level spikes unavailable | Disable live spike alerts and use trend alerts |
| Preview API changes | Provider breakage | Schema validation, adapters, feature flag, graceful fallback |
| Notification fatigue | Users disable extension | Notification ladder, cooldown, deduplication, quiet hours |
| Misleading forecasts | Loss of trust | Confidence labels, stale-data rules, explanation view |
| VS Code status-bar clutter | Poor UX | One concise adaptive item |
| Privacy concerns | Low adoption | Local-only default, no prompt or code collection |
| User mistakes official versus personal limit | Wrong decisions | Clearly separate target, allowance, and enforced budget |
| Shared enterprise pool complexity | Personal values may not represent true availability | Explain pool semantics and source limitations |
| Time-zone and reset errors | Incorrect budgets | Store reset rules explicitly and test DST transitions |

---

## 31. Acceptance Criteria

### Status bar

- Shows cached state immediately after activation.
- Opens the dashboard when clicked.
- Displays data freshness when stale.
- Changes to critical styling only for actionable risk.

### Budgets

- Supports daily, weekly, billing-cycle, and session targets.
- Resets according to configured time zone and rule.
- Separates personal targets from official values.

### Alerts

- An alert includes the triggering facts.
- Duplicate alerts are suppressed.
- Snooze is respected.
- A delayed provider cannot create a live 30-minute spike alert.
- Critical alerts require meaningful absolute and relative impact.

### Forecasting

- Shows confidence.
- Stops or downgrades when data is stale.
- Includes observation time and source.
- Does not show a precise exhaustion minute when confidence is low.

### Privacy

- No prompts or source code are stored.
- Tokens are stored only in secret storage.
- The user can export and delete local history.
- Telemetry remains disabled by default.

---

## 32. Example Alert Catalogue

### Elevated usage

```text
Usage is elevated
You are consuming AI credits at 1.8× your normal rate.
No budget is currently at risk.
```

### Rapid surge

```text
Copilot usage surge detected
31 credits were consumed in 20 minutes—3.1× your normal rate.
At this pace, today’s target may be reached by 14:10.

[View usage] [Economy Mode] [Snooze]
```

### Pacing drift

```text
You are running ahead of today’s plan
46% of the target is consumed, while 28% of the configured workday has elapsed.
```

### Weekly forecast

```text
Weekly target likely to be exceeded
Projected usage: 580 credits
Target: 450 credits
Difference: +29%
Confidence: Medium
```

### Stale data

```text
Usage data is stale
The latest report covers 4 August 2026.
Live spike alerts are paused.

[Refresh] [Import report] [Enter snapshot]
```

### Session summary

```text
Focus session complete
Authentication refactor consumed 29 credits against a 25-credit target.
The largest increase occurred between 11:42 and 11:49.
```

---

## 33. Recommended Initial Product Identity

### Name

**Copilot Pulse**

### Tagline

> Know your AI burn rate before your budget runs out.

### Alternative taglines

- Use Copilot intentionally.
- See the surge before you hit the limit.
- AI-credit pacing for focused developers.
- From monthly quota to real-time awareness.

### Visual language

- Pulse rings.
- Calm-to-surge states.
- Runway and pacing metaphors.
- Minimal ambient status.
- Precise data-quality markings.

---

## 34. Recommended First Implementation Decision

Build the first release around **transparent imported and manual data**, not unsupported live integration.

The first version should prove that developers value:

1. Daily and weekly targets.
2. Pacing and runway.
3. Explainable alerts.
4. Focus-session summaries.
5. Honest data-quality labels.

After this UX is validated, add supported organization and enterprise providers behind the same interface.

---

## 35. Open Questions

1. Which GitHub plans and account types should be supported in the first public release?
2. Should the MVP accept only official GitHub exports, or also a generic normalized CSV format?
3. Should workspace-aware tracking be included in the MVP or delayed for privacy simplicity?
4. What is the minimum useful session workflow when live data is unavailable?
5. Should weather terminology be the default or an optional personality layer?
6. Should official budget-management links be shown when an alert indicates likely overage?
7. Can a fine-grained token satisfy every selected report endpoint through the VS Code authentication flow?
8. What report publication delay should be expected in practice?
9. How should corrections in cumulative GitHub billing data be represented?
10. Should Copilot CLI session-limit helpers be part of this extension or a separate companion feature?

---

## 36. Sources and Technical References

The following official documentation was used to validate the current platform context as of 5 August 2026:

1. **GitHub Docs — Monitoring your GitHub AI Credits usage**  
   https://docs.github.com/en/copilot/how-tos/manage-and-track-spending/monitor-ai-usage

2. **GitHub Docs — REST API endpoints for Copilot usage metrics**  
   https://docs.github.com/en/rest/copilot/copilot-usage-metrics?apiVersion=2026-03-10

3. **GitHub Docs — Usage-based billing for individuals**  
   https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-individuals

4. **GitHub Docs — Usage-based billing for organizations and enterprises**  
   https://docs.github.com/en/copilot/concepts/billing/usage-based-billing-for-organizations-and-enterprises

5. **GitHub Docs — Models and pricing for GitHub Copilot**  
   https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing

6. **GitHub Docs — Budgets and alerts**  
   https://docs.github.com/en/billing/concepts/budgets-and-alerts

7. **GitHub Docs — Setting an AI credit session limit in GitHub Copilot CLI**  
   https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/set-session-limit

8. **GitHub Docs — Optimizing your AI usage to maximize efficiency and reduce cost**  
   https://docs.github.com/en/enterprise-cloud@latest/copilot/tutorials/optimize-ai-usage

9. **Visual Studio Code Extension API — Status Bar UX Guidelines**  
   https://code.visualstudio.com/api/ux-guidelines/status-bar

10. **Visual Studio Code Extension API — Webviews**  
    https://code.visualstudio.com/api/ux-guidelines/webviews

11. **Visual Studio Code Extension API — VS Code API Reference**  
    https://code.visualstudio.com/api/references/vscode-api

12. **Visual Studio Code Extension API — Common Capabilities**  
    https://code.visualstudio.com/api/extension-capabilities/common-capabilities

---

## 37. Final Product Principle

Copilot Pulse should never pressure the user to optimize every interaction or create anxiety around normal development work.

Its purpose is to provide calm, trustworthy awareness:

> Show the right signal early enough to support a decision, then get out of the developer’s way.
