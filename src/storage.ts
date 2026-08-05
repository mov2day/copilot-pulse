import * as vscode from 'vscode';
import { FocusSession, UsageSample } from './domain';
const SAMPLES = 'usage.samples', SESSION = 'focus.session', ALERTS = 'alert.fingerprints';
export class Store {
  constructor(private readonly context: vscode.ExtensionContext) {}
  samples(): UsageSample[] { return this.context.globalState.get<UsageSample[]>(SAMPLES, []); }
  async add(samples: UsageSample[]) { const all = [...this.samples(), ...samples].filter(s => s.credits >= 0); const seen = new Set<string>(); const unique = all.filter(s => !seen.has(s.id) && !!seen.add(s.id)); const days = vscode.workspace.getConfiguration('copilotPulse').get<number>('storage.retentionDays',180); const cutoff = days ? Date.now()-days*86400000 : 0; await this.context.globalState.update(SAMPLES, unique.filter(s => new Date(s.observedAt).getTime() >= cutoff)); }
  session() { return this.context.globalState.get<FocusSession | undefined>(SESSION); }
  saveSession(s?: FocusSession) { return this.context.globalState.update(SESSION,s); }
  async clear() { await Promise.all([this.context.globalState.update(SAMPLES,undefined),this.context.globalState.update(SESSION,undefined),this.context.globalState.update(ALERTS,undefined)]); }
  fingerprints() { return new Set(this.context.globalState.get<string[]>(ALERTS,[])); }
  remember(fingerprint: string) { const set=this.fingerprints(); set.add(fingerprint); return this.context.globalState.update(ALERTS,[...set]); }
  async export(uri: vscode.Uri) { await vscode.workspace.fs.writeFile(uri,Buffer.from(JSON.stringify({ exportedAt:new Date().toISOString(), samples:this.samples(), session:this.session() },null,2))); }
}
