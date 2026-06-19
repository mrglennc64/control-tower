"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const ROLES = ["ceo", "cto", "cmo", "cfo", "engineer", "researcher", "pm", "designer", "qa", "devops", "security", "general"];

type Company = { id: string; name: string; budgetMonthlyCents: number; spentMonthlyCents: number; status?: string };
type Agent = { id: string; name: string; role: string; status: string; runtimeConfig?: { heartbeat?: { enabled?: boolean } } };
type Issue = { id: string; identifier: string; title: string; status: string; assigneeAgentId: string | null };
type Comment = { id: string; body?: string; content?: string; authorAgentId?: string; createdAt: string };

const pc = (p: string, opts?: RequestInit) => fetch(api(`/api/paperclip/${p}`), opts);
const usd = (cents: number) => `$${((cents || 0) / 100).toFixed(0)}`;

export default function AgentsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sel, setSel] = useState<Company | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [msg, setMsg] = useState("");
  const [openIssue, setOpenIssue] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  // forms
  const [coName, setCoName] = useState("");
  const [coBudget, setCoBudget] = useState(10);
  const [agName, setAgName] = useState("");
  const [agRole, setAgRole] = useState("researcher");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskAgent, setTaskAgent] = useState("");

  async function loadCompanies() {
    const all: Company[] = await pc("companies").then((r) => r.json());
    setCompanies(all.filter((c) => c.status !== "archived"));
  }
  useEffect(() => {
    loadCompanies();
  }, []);

  async function selectCompany(c: Company) {
    setSel(c);
    setOpenIssue(null);
    setAgents(await pc(`companies/${c.id}/agents`).then((r) => r.json()));
    setIssues(await pc(`companies/${c.id}/issues`).then((r) => r.json()));
  }

  async function createCompany() {
    if (!coName.trim()) return;
    const c = await pc("companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: coName, budgetMonthlyCents: coBudget * 100 }),
    }).then((r) => r.json());
    setCoName("");
    await loadCompanies();
    selectCompany(c);
  }

  async function createAgent() {
    if (!sel || !agName.trim()) return;
    await pc(`companies/${sel.id}/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: agName, role: agRole }),
    });
    setAgName("");
    selectCompany(sel);
  }

  // Turn an agent on: enable heartbeat + give it a budget so it runs.
  async function enableAgent(a: Agent) {
    await pc(`agents/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        budgetMonthlyCents: 500,
        runtimeConfig: { heartbeat: { enabled: true, maxConcurrentRuns: 5 } },
      }),
    });
    setMsg(`${a.name} enabled — it will pick up assigned tasks on the next heartbeat.`);
    if (sel) selectCompany(sel);
  }

  async function createTask() {
    if (!sel || !taskTitle.trim()) return;
    const issue = await pc(`companies/${sel.id}/issues`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: taskTitle, description: taskDesc }),
    }).then((r) => r.json());
    if (taskAgent && issue?.id) {
      await pc(`issues/${issue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeAgentId: taskAgent, status: "todo" }),
      });
    }
    setTaskTitle("");
    setTaskDesc("");
    selectCompany(sel);
  }

  async function assign(issueId: string, agentId: string) {
    await pc(`issues/${issueId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeAgentId: agentId || null, status: agentId ? "todo" : "backlog" }),
    });
    if (sel) selectCompany(sel);
  }

  async function viewComments(issueId: string) {
    if (openIssue === issueId) {
      setOpenIssue(null);
      return;
    }
    setOpenIssue(issueId);
    setComments(await pc(`issues/${issueId}/comments`).then((r) => r.json()).catch(() => []));
  }

  return (
    <div className="max-w-6xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agents</h1>
          <p className="text-sm" style={{ color: "var(--ct-muted)" }}>
            Create AI agents (Paperclip) and assign them tasks. They run on the server.
          </p>
        </div>
        <a href="https://pam.usesmpt.com" target="_blank" rel="noreferrer" className="rounded-md border px-3 py-2 text-sm" style={{ color: "var(--ct-teal)" }}>
          Open PAM ↗
        </a>
      </header>

      {msg && <p className="mb-4 text-xs" style={{ color: "var(--ct-green)" }}>{msg}</p>}

      <div className="flex gap-4">
        {/* Companies */}
        <aside className="w-56 shrink-0">
          <div className="mb-2 text-xs font-semibold" style={{ color: "var(--ct-muted)" }}>Workspaces</div>
          <div className="mb-3 flex flex-col gap-1">
            {companies.map((c) => (
              <button
                key={c.id}
                onClick={() => selectCompany(c)}
                className="rounded px-3 py-2 text-left text-sm"
                style={{ background: sel?.id === c.id ? "var(--ct-surface-2)" : "var(--ct-surface)" }}
              >
                {c.name}
                <span className="block text-xs" style={{ color: "var(--ct-muted)" }}>{usd(c.spentMonthlyCents)} / {usd(c.budgetMonthlyCents)}</span>
              </button>
            ))}
          </div>
          <div className="rounded-lg border p-3" style={{ background: "var(--ct-surface)" }}>
            <input className="input mb-2" placeholder="New workspace name" value={coName} onChange={(e) => setCoName(e.target.value)} />
            <div className="mb-2 flex items-center gap-2 text-xs" style={{ color: "var(--ct-muted)" }}>
              Budget $<input className="input w-16" type="number" value={coBudget} onChange={(e) => setCoBudget(Number(e.target.value))} />/mo
            </div>
            <button onClick={createCompany} className="w-full rounded-md px-3 py-2 text-sm font-medium text-black" style={{ background: "var(--ct-accent)" }}>+ Create</button>
          </div>
        </aside>

        {/* Selected workspace */}
        <main className="flex-1">
          {!sel && <p style={{ color: "var(--ct-muted)" }}>Select or create a workspace.</p>}
          {sel && (
            <div className="flex flex-col gap-6">
              {/* Agents */}
              <section className="rounded-lg border p-4" style={{ background: "var(--ct-surface)" }}>
                <div className="mb-3 font-semibold">Agents</div>
                <div className="mb-3 flex flex-col gap-2">
                  {agents.length === 0 && <p className="text-xs" style={{ color: "var(--ct-muted)" }}>No agents yet.</p>}
                  {agents.map((a) => {
                    const on = a.runtimeConfig?.heartbeat?.enabled;
                    return (
                      <div key={a.id} className="flex items-center justify-between rounded px-3 py-2 text-sm" style={{ background: "var(--ct-surface-2)" }}>
                        <span>{a.name} <span style={{ color: "var(--ct-muted)" }}>· {a.role} · {a.status}</span></span>
                        {on ? (
                          <span className="text-xs" style={{ color: "var(--ct-green)" }}>● running</span>
                        ) : (
                          <button onClick={() => enableAgent(a)} className="text-xs" style={{ color: "var(--ct-teal)" }}>Enable & run</button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <input className="input max-w-xs" placeholder="Agent name" value={agName} onChange={(e) => setAgName(e.target.value)} />
                  <select className="input max-w-[8rem]" value={agRole} onChange={(e) => setAgRole(e.target.value)}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <button onClick={createAgent} className="rounded-md px-3 py-2 text-sm font-medium text-black" style={{ background: "var(--ct-accent)" }}>+ Agent</button>
                </div>
              </section>

              {/* Tasks */}
              <section className="rounded-lg border p-4" style={{ background: "var(--ct-surface)" }}>
                <div className="mb-3 font-semibold">Tasks</div>
                <div className="mb-3 flex flex-col gap-2">
                  {issues.length === 0 && <p className="text-xs" style={{ color: "var(--ct-muted)" }}>No tasks yet.</p>}
                  {issues.map((i) => (
                    <div key={i.id} className="rounded px-3 py-2 text-sm" style={{ background: "var(--ct-surface-2)" }}>
                      <div className="flex items-center justify-between">
                        <span><span style={{ color: "var(--ct-muted)" }}>{i.identifier}</span> {i.title} <span className="text-xs" style={{ color: "var(--ct-muted)" }}>· {i.status}</span></span>
                        <div className="flex items-center gap-2">
                          <select className="input py-1 text-xs" value={i.assigneeAgentId ?? ""} onChange={(e) => assign(i.id, e.target.value)}>
                            <option value="">unassigned</option>
                            {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                          </select>
                          <button onClick={() => viewComments(i.id)} className="text-xs" style={{ color: "var(--ct-teal)" }}>{openIssue === i.id ? "hide" : "output"}</button>
                        </div>
                      </div>
                      {openIssue === i.id && (
                        <div className="mt-2 border-t pt-2 text-xs" style={{ color: "var(--ct-muted)" }}>
                          {comments.length === 0 && <span>No output yet. (Agent must be enabled; output appears after a heartbeat run.)</span>}
                          {comments.map((c) => (
                            <div key={c.id} className="mb-2 whitespace-pre-wrap">{c.body || c.content}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <input className="input" placeholder="Task title" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                  <textarea className="input min-h-16" placeholder="Task details / instructions" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} />
                  <div className="flex items-center gap-2">
                    <select className="input max-w-xs" value={taskAgent} onChange={(e) => setTaskAgent(e.target.value)}>
                      <option value="">assign later</option>
                      {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                    <button onClick={createTask} className="rounded-md px-3 py-2 text-sm font-medium text-black" style={{ background: "var(--ct-accent)" }}>+ Task</button>
                  </div>
                </div>
              </section>
            </div>
          )}
        </main>
      </div>

      <style jsx>{`
        .input { border-radius: 0.375rem; border: 1px solid var(--ct-border); background: var(--ct-surface-2); padding: 0.4rem 0.6rem; font-size: 0.875rem; color: var(--ct-text); }
      `}</style>
    </div>
  );
}
