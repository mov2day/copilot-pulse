import * as vscode from 'vscode';
import { AllowanceSnapshot, DataQuality, Freshness, UsageSample } from './domain';
export interface UsageProvider { readonly id: string; readonly quality: DataQuality; getAllowance(): Promise<AllowanceSnapshot|undefined>; getUsage(): Promise<UsageSample[]>; getFreshness(): Promise<Freshness>; dispose(): void; }
type QuotaRecord={entitlement?:unknown;remaining?:unknown;percent_remaining?:unknown;unlimited?:unknown};
type InternalCopilotResponse={token?:unknown;copilot_plan?:unknown;quota_reset_date?:unknown;quota_reset_date_utc?:unknown;quota_snapshots?:Record<string,QuotaRecord>};
export class CopilotQuotaProvider implements UsageProvider {
  readonly id='copilot-quota'; readonly quality:DataQuality='exact';
  async getAllowance():Promise<AllowanceSnapshot|undefined>{
    const session=await vscode.authentication.getSession('github',[],{createIfNone:false});
    if(!session) throw new Error('Sign in to GitHub in VS Code, then refresh Copilot Pulse.');
    const headers={Authorization:`Bearer ${session.accessToken}`,Accept:'application/json','Editor-Version':`vscode/${vscode.version}`,'Editor-Plugin-Version':'copilot-chat/0.60.0','Copilot-Integration-Id':'vscode-chat','User-Agent':'GitHubCopilotChat/0.60.0','X-GitHub-Api-Version':'2025-04-01'};
    const exchange=await fetch('https://api.github.com/copilot_internal/v2/token',{headers});
    let lastStatus=exchange.status;
    if(exchange.ok){const exchangeData=await exchange.json() as InternalCopilotResponse;const direct=quotaFrom(exchangeData);if(direct)return direct;const copilotToken=typeof exchangeData.token==='string'?exchangeData.token:undefined;
      if(copilotToken){const user=await fetch('https://api.github.com/copilot_internal/user',{headers:{...headers,Authorization:`Bearer ${copilotToken}`}});lastStatus=user.status;if(user.ok){const quota=quotaFrom(await user.json() as InternalCopilotResponse);if(quota)return quota;}}
    }
    const user=await fetch('https://api.github.com/copilot_internal/user',{headers});lastStatus=user.status;if(user.ok){const quota=quotaFrom(await user.json() as InternalCopilotResponse);if(quota)return quota;}
    throw new Error(`Copilot quota endpoint did not return a supported quota snapshot (${lastStatus}).`);
  }
  async getUsage(){return [];}
  async getFreshness(){return {observedAt:new Date().toISOString(),stale:false,explanation:'Live Copilot quota snapshot from the GitHub Copilot internal API.'};}
  dispose(){}
}
function quotaFrom(data:InternalCopilotResponse):AllowanceSnapshot|undefined {
  const snapshot=data.quota_snapshots?.premium_interactions ?? data.quota_snapshots?.premium ?? data.quota_snapshots?.chat;
  if(!snapshot)return undefined;
  const unlimited=snapshot.unlimited===true; const amount=Number(snapshot.entitlement); const remaining=Number(snapshot.remaining); const consumed=Number.isFinite(amount)&&Number.isFinite(remaining)?Math.max(0,amount-remaining):undefined;
  if(!unlimited&&(!Number.isFinite(amount)||amount<=0))return undefined;
  const reset=data.quota_reset_date_utc ?? data.quota_reset_date;
  return {amount:unlimited?0:amount,consumed,remaining:Number.isFinite(remaining)?remaining:undefined,unlimited,plan:typeof data.copilot_plan==='string'?data.copilot_plan:undefined,resetsAt:typeof reset==='string'?reset:undefined,observedAt:new Date().toISOString(),sourceId:'copilot-quota',quality:'exact'};
}
export class ImportedProvider implements UsageProvider { readonly id='import'; readonly quality: DataQuality='imported'; constructor(private readonly samples: UsageSample[]) {} async getAllowance(){ return undefined; } async getUsage(){ return this.samples; } async getFreshness(){const last=this.samples.at(-1)?.observedAt; return {observedAt:last,stale:!last || Date.now()-new Date(last).getTime()>48*3600000,explanation:'Imported report'};} dispose(){} }
export async function parseReport(uri: vscode.Uri): Promise<UsageSample[]> { const raw=Buffer.from(await vscode.workspace.fs.readFile(uri)).toString('utf8').trim(); if (uri.path.endsWith('.csv')) return csv(raw).map((x,i)=>normalize(x,i)); const parsed = uri.path.endsWith('.ndjson') ? raw.split(/\r?\n/).filter(Boolean).map(line => JSON.parse(line)) : JSON.parse(raw); const rows: unknown[] = Array.isArray(parsed) ? parsed : parsed.samples ?? []; return rows.map((x,i) => normalize(x as Record<string,unknown>,i)); }
function csv(raw:string) { const [head,...lines]=raw.split(/\r?\n/); const cols=head.split(',').map(s=>s.trim()); return lines.filter(Boolean).map(line => Object.fromEntries(cols.map((c,i)=>[c,line.split(',')[i]?.trim()]))); }
function normalize(row:Record<string,unknown>, i:number):UsageSample { const observedAt=String(row.observedAt ?? row.timestamp ?? row.date ?? ''); const credits=Number(row.credits ?? row.usage ?? row.amount ?? 0); if (!observedAt || Number.isNaN(Date.parse(observedAt)) || !Number.isFinite(credits) || credits < 0) throw new Error(`Invalid usage row ${i+1}: expected timestamp and non-negative credits`); return {id:String(row.id ?? `import-${observedAt}-${i}`),observedAt,credits,cumulativeCredits:row.cumulativeCredits === undefined ? undefined : Number(row.cumulativeCredits),quality:'imported',sourceId:'import',feature:row.feature ? String(row.feature) : undefined,model:row.model ? String(row.model) : undefined}; }
export class GitHubReportProvider implements UsageProvider {
  constructor(readonly id:string, readonly quality:DataQuality, private endpoint:string, private scopes:string[]) {}
  async getAllowance(){return undefined;}
  async getUsage(){
    const session=await vscode.authentication.getSession('github',this.scopes,{createIfNone:true});
    const response=await fetch(this.endpoint,{headers:{Authorization:`Bearer ${session.accessToken}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10'}});
    if(!response.ok) throw new Error(`GitHub usage report unavailable (${response.status})`);
    const links=(await response.json() as {download_links?:unknown}).download_links;
    if(!Array.isArray(links)||!links.every(x=>typeof x==='string')) throw new Error('GitHub returned a report response without download links.');
    const reports=await Promise.all(links.map(async link=>{const r=await fetch(link);if(!r.ok)throw new Error(`Usage report download failed (${r.status})`);return r.text();}));
    return reports.flatMap(text=>text.split(/\r?\n/).filter(Boolean).map(line=>normalize(JSON.parse(line) as Record<string,unknown>,0)));
  }
  async getFreshness(){return {stale:false,explanation:'GitHub reported daily usage data.'};} dispose(){}
}
export type ProviderKind = 'personal-api'|'manual'|'import'|'organization-report'|'enterprise-report'|'enterprise-records';
export class PersonalUsageProvider implements UsageProvider {
  readonly id='personal-api'; readonly quality:DataQuality='exact';
  constructor(private readonly token:string) {}
  async getAllowance(){ return undefined; }
  async getUsage(){
    const headers={Authorization:`Bearer ${this.token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10'};
    const me=await fetch('https://api.github.com/user',{headers}); if(!me.ok) throw new Error(me.status===401?'GitHub rejected the token. Reconnect using a GitHub fine-grained PAT with User permissions → Plan: Read (not VSCE_PAT).':`GitHub authentication failed (${me.status})`);
    const login=(await me.json() as {login?:unknown}).login; if(typeof login!=='string') throw new Error('GitHub did not return an account login.');
    const now=new Date(); const days=Math.min(now.getDate(),31); const reports=await Promise.all(Array.from({length:days},async(_,i)=>{const date=new Date(now.getFullYear(),now.getMonth(),i+1);const url=`https://api.github.com/users/${encodeURIComponent(login)}/settings/billing/ai_credit/usage?year=${date.getFullYear()}&month=${date.getMonth()+1}&day=${date.getDate()}`;const r=await fetch(url,{headers});if(!r.ok)throw new Error(`Personal usage report failed for ${date.toISOString().slice(0,10)} (${r.status})`);return {date,json:await r.json() as {usageItems?:unknown}};}));
    return reports.map(({date,json})=>{const items=Array.isArray(json.usageItems)?json.usageItems:[];const credits=items.reduce((sum,item)=>sum+(typeof item==='object'&&item!==null?Number((item as {grossQuantity?:unknown}).grossQuantity):0),0);return {id:`personal-${date.toISOString().slice(0,10)}`,observedAt:new Date(date.getFullYear(),date.getMonth(),date.getDate(),23,59,59).toISOString(),credits:Number.isFinite(credits)?credits:0,quality:'exact' as const,sourceId:'personal-api'};});
  }
  async getFreshness(){return {observedAt:new Date().toISOString(),stale:false,explanation:'Direct GitHub personal billing API — this is not the Copilot included-quota meter.'};} dispose(){}
}
export class ProviderRegistry {
  constructor(private readonly organization:string, private readonly enterprise:string) {}
  select(kind:string): UsageProvider | undefined {
    if(kind==='organization-report' && this.organization) return new GitHubReportProvider('organization-report','delayed',`https://api.github.com/orgs/${encodeURIComponent(this.organization)}/copilot/metrics/reports/organization-28-day/latest`,['read:org']);
    if(kind==='enterprise-report' && this.enterprise) return new GitHubReportProvider('enterprise-report','delayed',`https://api.github.com/enterprises/${encodeURIComponent(this.enterprise)}/copilot/metrics/reports/users-28-day/latest`,['read:enterprise']);
    // The documented metrics reports are daily/28-day reports. Do not relabel them as exact
    // minute-level records until GitHub exposes a stable records endpoint and schema.
    return undefined;
  }
}
