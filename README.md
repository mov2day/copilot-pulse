# Copilot Pulse

Know your GitHub Copilot AI-credit burn rate before your budget runs out.

Copilot Pulse is a local-first VS Code extension for tracking manually entered or imported Copilot usage. It provides budgets, pacing, forecasts, spike detection, focus sessions, alerts, and an accessible dashboard. It never reads prompts, responses, source code, or the private UI of the GitHub Copilot extension.

## Data honesty

Every metric identifies its quality: **Exact**, **Delayed**, **Imported**, or **Estimated**. Manual snapshots are estimated between observations; daily reports cannot create minute-level spike alerts.

## Quick start

1. Run **Copilot Pulse: Enter Usage Snapshot** and enter your current cycle total and allowance.
2. Set daily, weekly, and billing-cycle targets in Settings.
3. Open **Copilot Pulse: Open Dashboard**.

Alternatively, import normalized CSV, JSON, or NDJSON reports containing `observedAt`/`timestamp` and `credits`/`cumulativeCredits` fields.

## Privacy

Usage history is stored only in VS Code global storage. Credentials, if a supported provider is configured, belong in VS Code Secret Storage. Telemetry is off by default.

## Supported providers

- Manual snapshots and local session markers (ready)
- CSV, JSON, NDJSON report import (ready)
- GitHub organization and enterprise report adapters (configurable, authenticated through VS Code GitHub auth)
- Enterprise usage records adapter (public-preview endpoint; configured only when eligible)

The extension does not claim access to a personal live quota API.
