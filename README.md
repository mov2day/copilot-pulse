# Copilot Pulse

Know your GitHub Copilot AI-credit burn rate before your budget runs out.

Copilot Pulse is a local-first VS Code extension for tracking GitHub Copilot quota and manually entered or imported usage. It provides budgets, pacing, forecasts, spike detection, focus sessions, alerts, and an accessible dashboard. It never reads prompts, responses, source code, or the private UI of the GitHub Copilot extension.

## Data honesty

Every metric identifies its quality: **Exact**, **Delayed**, **Imported**, or **Estimated**. Manual snapshots are estimated between observations; daily reports cannot create minute-level spike alerts.

## Quick start

1. Sign in to GitHub in VS Code.
2. Run **Copilot Pulse: Refresh Usage** to load the live Copilot quota.
3. Open **Copilot Pulse: Open Dashboard**.

Alternatively, import normalized CSV, JSON, or NDJSON reports containing `observedAt`/`timestamp` and `credits`/`cumulativeCredits` fields.

## Privacy

Usage history is stored only in VS Code global storage. Credentials, if a supported provider is configured, belong in VS Code Secret Storage. Telemetry is off by default.

## Supported providers

- Live individual Copilot quota snapshots through the existing VS Code GitHub sign-in (ready)
- Manual snapshots and local session markers (ready)
- CSV, JSON, NDJSON report import (ready)
- GitHub organization and enterprise report adapters (configurable, authenticated through VS Code GitHub auth)
- Enterprise usage records adapter (public-preview endpoint; configured only when eligible)

The live quota integration uses GitHub's internal Copilot quota endpoint through the
existing VS Code GitHub OAuth session. It is not a documented public API and can change
without notice; Pulse reports that condition clearly and falls back without fabricating
quota values.

## GitHub report providers

Select `copilotPulse.dataSource` in Settings, then set either
`copilotPulse.providers.organization` or `copilotPulse.providers.enterprise`.
Copilot Pulse requests VS Code's GitHub `read:org` session only when a configured
provider is refreshed. Provider results are marked **Delayed** for daily reports
or **Exact** for the eligible enterprise-records preview path. Permission failures,
schema errors, and stale values remain visible in the dashboard diagnostics.

### Personal accounts: direct AI-credit API

For an individual plan, simply be signed in to GitHub in VS Code and use **Copilot
Pulse: Refresh Usage**. Pulse automatically reads the live included-credit snapshot
(used, remaining, plan, and reset date) from the GitHub Copilot quota service.

The **Connect Personal Usage API** command is retained as a direct-billing fallback.
For it, create a GitHub fine-grained personal access token with **Plan: Read** user
permission, then paste it into the prompt. Copilot Pulse stores it solely in VS
Code Secret Storage and uses GitHub's supported personal AI-credit endpoint to load
the current month's directly billed usage. This billing feed is separate from your
included Copilot allowance.

## Included controls

Focus sessions can be paused/resumed, extended, annotated, ended, and reviewed
in local session history. Alert notifications honor persisted cooldowns and a
one-hour snooze. Economy Mode is explicitly advisory; it never intercepts prompts,
reads source files, or blocks GitHub Copilot.
