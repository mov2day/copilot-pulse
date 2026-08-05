import * as vscode from 'vscode';
import { AlertState, CompletedSession, FocusSession, ProviderDiagnostics, UsageSample } from './domain';
const SAMPLES = 'usage.samples', SESSION = 'focus.session', SESSIONS = 'focus.sessions', ALERTS = 'alert.states', DIAGNOSTICS = 'provider.diagnostics';
export class Store {
  constructor(private readonly context: vscode.ExtensionContext) {}
  samples(): UsageSample[] { return this.context.globalState.get<UsageSample[]>(SAMPLES, []); }
  async add(samples: UsageSample[]) { const byId=new Map(this.samples().filter(s=>s.credits>=0).map(s=>[s.id,s])); for(const sample of samples){if(sample.credits>=0)byId.set(sample.id,sample);} const days = vscode.workspace.getConfiguration('copilotPulse').get<number>('storage.retentionDays',180); const cutoff = days ? Date.now()-days*86400000 : 0; await this.context.globalState.update(SAMPLES,[...byId.values()].filter(s => new Date(s.observedAt).getTime() >= cutoff).sort((a,b)=>a.observedAt.localeCompare(b.observedAt))); }
  session() { return this.context.globalState.get<FocusSession | undefined>(SESSION); }
  saveSession(s?: FocusSession) { return this.context.globalState.update(SESSION,s); }
  completedSessions() { return this.context.globalState.get<CompletedSession[]>(SESSIONS, []); }
  async completeSession(session: CompletedSession) { await this.context.globalState.update(SESSIONS,[...this.completedSessions(),session].slice(-200)); await this.saveSession(undefined); }
  async clear() { await Promise.all([this.context.globalState.update(SAMPLES,undefined),this.context.globalState.update(SESSION,undefined),this.context.globalState.update(SESSIONS,undefined),this.context.globalState.update(ALERTS,undefined),this.context.globalState.update(DIAGNOSTICS,undefined)]); }
  alertState(fingerprint:string) { return this.context.globalState.get<AlertState>(`${ALERTS}.${fingerprint}`); }
  saveAlertState(state:AlertState) { return this.context.globalState.update(`${ALERTS}.${state.fingerprint}`,state); }
  diagnostics() { return this.context.globalState.get<ProviderDiagnostics>(DIAGNOSTICS); }
  saveDiagnostics(d:ProviderDiagnostics) { return this.context.globalState.update(DIAGNOSTICS,d); }
  economyUntil() { return this.context.globalState.get<string>('economy.until'); }
  setEconomyUntil(value?:string) { return this.context.globalState.update('economy.until',value); }
  snoozeUntil() { return this.context.globalState.get<number>('snooze.until',0); }
  setSnoozeUntil(value:number) { return this.context.globalState.update('snooze.until',value); }
  async export(uri: vscode.Uri) { await vscode.workspace.fs.writeFile(uri,Buffer.from(JSON.stringify({ exportedAt:new Date().toISOString(), samples:this.samples(), session:this.session(), sessions:this.completedSessions() },null,2))); }
}
