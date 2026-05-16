import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface StatCardProps { label: string; value: string | number; sub?: string; accent?: string; }
interface TabBtnProps { label: string; active: boolean; onClick: () => void; }
interface InputFieldProps { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string; }
interface TeamState { name: string; offRtg: string; defRtg: string; rest: string; }
interface WinProbParams { homeOffRtg: number; homeDefRtg: number; awayOffRtg: number; awayDefRtg: number; restDiff: number; isNeutral: boolean; }
interface EVResult { ev: number; edge: number; payout: number; }
interface VigResult { fairA: number; fairB: number; overround: number; holdPct: number; }

// ─── Utility Functions ────────────────────────────────────────────────────────
function americanToImplied(odds: string | number): number | null {
  if (!odds || isNaN(Number(odds))) return null;
  const n = parseFloat(String(odds));
  if (n < 0) return Math.abs(n) / (Math.abs(n) + 100);
  return 100 / (n + 100);
}

function impliedToAmerican(p: number | null): number | null {
  if (!p || p <= 0 || p >= 1) return null;
  if (p >= 0.5) return -(p / (1 - p)) * 100;
  return ((1 - p) / p) * 100;
}

function removeVig(impliedA: number, impliedB: number): VigResult {
  const overround = impliedA + impliedB;
  return { fairA: impliedA / overround, fairB: impliedB / overround, overround, holdPct: ((overround - 1) / overround) * 100 };
}

function calcEV(modelP: number, americanOdds: string, stake = 100): EVResult | null {
  const odds = parseFloat(americanOdds);
  if (isNaN(odds) || !modelP) return null;
  const payout = odds > 0 ? (odds / 100) * stake : (100 / Math.abs(odds)) * stake;
  const ev = modelP * payout - (1 - modelP) * stake;
  return { ev, edge: ev / stake, payout };
}

function kellyFraction(modelP: number, americanOdds: string): number | null {
  const odds = parseFloat(americanOdds);
  if (isNaN(odds) || !modelP) return null;
  const b = odds > 0 ? odds / 100 : 100 / Math.abs(odds);
  const q = 1 - modelP;
  return Math.max(0, (modelP * b - q) / b);
}

function formatOdds(n: number | null): string {
  if (n === null || isNaN(n)) return "—";
  const r = Math.round(n);
  return r >= 0 ? `+${r}` : `${r}`;
}

function estimateWinProb({ homeOffRtg, homeDefRtg, awayOffRtg, awayDefRtg, restDiff, isNeutral }: WinProbParams): number {
  const deltaNet = (homeOffRtg - homeDefRtg) - (awayOffRtg - awayDefRtg);
  const logit = 0.4 + deltaNet * 0.032 + restDiff * 0.018 + (isNeutral ? -0.04 : 0);
  const raw = 1 / (1 + Math.exp(-logit));
  return Math.min(0.95, Math.max(0.05, raw));
}

function edgeColor(edge: number | null): string {
  if (edge === null) return "#888";
  if (edge > 0.05) return "#00e676";
  if (edge > 0.02) return "#69f0ae";
  if (edge > 0) return "#b9f6ca";
  return "#ff5252";
}

function edgeLabel(edge: number | null): string {
  if (edge === null) return "—";
  if (edge > 0.06) return "STRONG VALUE";
  if (edge > 0.03) return "VALUE";
  if (edge > 0.01) return "SLIGHT EDGE";
  if (edge >= 0) return "BREAKEVEN";
  return "FADE";
}

// ─── Components ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "14px 18px", display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, color: "#666", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 22, fontFamily: "monospace", fontWeight: 700, color: accent || "#f0f0f0" }}>{value}</span>
      {sub && <span style={{ fontSize: 11, color: "#555" }}>{sub}</span>}
    </div>
  );
}

function TabBtn({ label, active, onClick }: TabBtnProps) {
  return (
    <button onClick={onClick} style={{ padding: "10px 20px", background: active ? "rgba(255,200,0,0.12)" : "transparent", border: active ? "1px solid rgba(255,200,0,0.4)" : "1px solid transparent", borderRadius: 6, color: active ? "#ffd600" : "#777", fontWeight: active ? 700 : 500, fontSize: 14, letterSpacing: "0.08em", cursor: "pointer", textTransform: "uppercase" }}>
      {label}
    </button>
  );
}

function InputField({ label, value, onChange, placeholder, type = "number" }: InputFieldProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, color: "#888", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6, padding: "9px 12px", color: "#f0f0f0", fontFamily: "monospace", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" }} />
    </div>
  );
}

// ─── Tab 1: Odds Converter ────────────────────────────────────────────────────
function OddsConverter() {
  const [homeOdds, setHomeOdds] = useState("-135");
  const [awayOdds, setAwayOdds] = useState("+115");
  const homeImp = americanToImplied(homeOdds);
  const awayImp = americanToImplied(awayOdds);
  const vig = homeImp && awayImp ? removeVig(homeImp, awayImp) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <InputField label="Home Team Odds" value={homeOdds} onChange={setHomeOdds} placeholder="-135" />
        <InputField label="Away Team Odds" value={awayOdds} onChange={setAwayOdds} placeholder="+115" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <StatCard label="Home Implied %" value={homeImp ? `${(homeImp * 100).toFixed(1)}%` : "—"} sub="Raw (with vig)" />
        <StatCard label="Away Implied %" value={awayImp ? `${(awayImp * 100).toFixed(1)}%` : "—"} sub="Raw (with vig)" />
        <StatCard label="Overround" value={vig ? `${(vig.overround * 100).toFixed(2)}%` : "—"} sub="Sum of implied probs" accent="#ffd600" />
        <StatCard label="Book Hold" value={vig ? `${vig.holdPct.toFixed(2)}%` : "—"} sub="Structural edge" accent="#ff5252" />
      </div>
      {vig && (
        <>
          <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />
          <p style={{ fontSize: 12, color: "#888", margin: 0 }}>NO-VIG FAIR PRICES</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <StatCard label="Home Fair Prob" value={`${(vig.fairA * 100).toFixed(1)}%`} sub={`Fair odds: ${formatOdds(impliedToAmerican(vig.fairA))}`} accent="#00e676" />
            <StatCard label="Away Fair Prob" value={`${(vig.fairB * 100).toFixed(1)}%`} sub={`Fair odds: ${formatOdds(impliedToAmerican(vig.fairB))}`} accent="#00e676" />
          </div>
          <div style={{ background: "rgba(255,200,0,0.06)", border: "1px solid rgba(255,200,0,0.15)", borderRadius: 8, padding: "12px 16px", fontSize: 12, color: "#aaa", lineHeight: 1.6 }}>
            <strong style={{ color: "#ffd600" }}>How to read this:</strong> The book charges {vig.holdPct.toFixed(2)}% on every dollar wagered. If offered odds are better than the fair price above, you have positive expected value. Breakeven win rate at -110 = 52.38%.
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tab 2: EV Calculator ─────────────────────────────────────────────────────
function EVCalculator() {
  const [bookOdds, setBookOdds] = useState("-110");
  const [modelProb, setModelProb] = useState("54");
  const [bankroll, setBankroll] = useState("1000");

  const prob = parseFloat(modelProb) / 100;
  const result = calcEV(prob, bookOdds);
  const kelly = kellyFraction(prob, bookOdds);
  const breakEven = americanToImplied(bookOdds);
  const betSize = kelly !== null && bankroll ? kelly * parseFloat(bankroll) : null;
  const hasEdge = result && result.edge > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <InputField label="Book's Offered Odds" value={bookOdds} onChange={setBookOdds} placeholder="-110" />
        <InputField label="Your Model Win Prob (%)" value={modelProb} onChange={setModelProb} placeholder="54" />
        <InputField label="Bankroll ($)" value={bankroll} onChange={setBankroll} placeholder="1000" />
      </div>
      {result && (
        <>
          <div style={{ padding: "16px 20px", borderRadius: 10, border: `1px solid ${edgeColor(result.edge)}55`, background: `${edgeColor(result.edge)}11`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase" }}>Verdict</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: edgeColor(result.edge) }}>{edgeLabel(result.edge)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase" }}>Edge</div>
              <div style={{ fontSize: 24, fontFamily: "monospace", fontWeight: 700, color: edgeColor(result.edge) }}>{(result.edge * 100).toFixed(2)}%</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            <StatCard label="EV per $100" value={`${result.ev >= 0 ? "+" : ""}$${result.ev.toFixed(2)}`} sub="Expected value on $100 wager" accent={result.ev >= 0 ? "#00e676" : "#ff5252"} />
            <StatCard label="Book's Breakeven" value={breakEven ? `${(breakEven * 100).toFixed(1)}%` : "—"} sub="You need to win above this" />
            <StatCard label="Your Win Prob" value={`${parseFloat(modelProb).toFixed(1)}%`} sub={prob > (breakEven ?? 0) ? "Above breakeven ✓" : "Below breakeven ✗"} accent={prob > (breakEven ?? 0) ? "#00e676" : "#ff5252"} />
            <StatCard label="Kelly Bet Size" value={kelly !== null && kelly > 0 && betSize !== null ? `$${betSize.toFixed(0)}` : "$0"} sub={kelly !== null && kelly > 0 ? `${(kelly * 100).toFixed(1)}% of bankroll (use ¼ Kelly)` : "No edge — do not bet"} accent={kelly !== null && kelly > 0 ? "#ffd600" : "#888"} />
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tab 3: NBA Model ─────────────────────────────────────────────────────────
function NBAModel() {
  const [home, setHome] = useState<TeamState>({ name: "Boston Celtics", offRtg: "120.6", defRtg: "110.8", rest: "2" });
  const [away, setAway] = useState<TeamState>({ name: "Miami Heat", offRtg: "114.2", defRtg: "115.7", rest: "1" });
  const [bookHome, setBookHome] = useState("-145");
  const [bookAway, setBookAway] = useState("+125");
  const [neutral, setNeutral] = useState(false);

  const updateHome = (field: string, val: string) => setHome(h => ({ ...h, [field]: val }));
  const updateAway = (field: string, val: string) => setAway(a => ({ ...a, [field]: val }));

  const restDiff = parseFloat(home.rest || "0") - parseFloat(away.rest || "0");
  const fairP = estimateWinProb({ homeOffRtg: parseFloat(home.offRtg), homeDefRtg: parseFloat(home.defRtg), awayOffRtg: parseFloat(away.offRtg), awayDefRtg: parseFloat(away.defRtg), restDiff, isNeutral: neutral });
  const fairAwayP = 1 - fairP;
  const evHome = calcEV(fairP, bookHome);
  const evAway = calcEV(fairAwayP, bookAway);
  const homeNet = parseFloat(home.offRtg) - parseFloat(home.defRtg);
  const awayNet = parseFloat(away.offRtg) - parseFloat(away.defRtg);

  const inputBlock = (teamState: TeamState, updateFn: (f: string, v: string) => void, label: string) => (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 16 }}>
      <div style={{ fontSize: 11, color: "#ffd600", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>{label}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <InputField label="Team Name" value={teamState.name} onChange={v => updateFn("name", v)} placeholder="Team" type="text" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <InputField label="Off Rtg" value={teamState.offRtg} onChange={v => updateFn("offRtg", v)} placeholder="115.0" />
          <InputField label="Def Rtg" value={teamState.defRtg} onChange={v => updateFn("defRtg", v)} placeholder="115.0" />
          <InputField label="Days Rest" value={teamState.rest} onChange={v => updateFn("rest", v)} placeholder="1" />
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {inputBlock(home, updateHome, "🏠 Home Team")}
        {inputBlock(away, updateAway, "✈️ Away Team")}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <InputField label="Book's Home Odds" value={bookHome} onChange={setBookHome} placeholder="-145" />
        <InputField label="Book's Away Odds" value={bookAway} onChange={setBookAway} placeholder="+125" />
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 11, color: "#888", letterSpacing: "0.08em", textTransform: "uppercase" }}>Neutral Site</label>
          <button onClick={() => setNeutral(!neutral)} style={{ padding: "9px 12px", background: neutral ? "rgba(255,200,0,0.15)" : "rgba(255,255,255,0.06)", border: `1px solid ${neutral ? "rgba(255,200,0,0.4)" : "rgba(255,255,255,0.12)"}`, borderRadius: 6, color: neutral ? "#ffd600" : "#888", fontSize: 13, cursor: "pointer", textAlign: "left" }}>
            {neutral ? "Yes — Neutral" : "No — Home Court"}
          </button>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        <StatCard label={`${home.name || "Home"} Net Rtg`} value={isNaN(homeNet) ? "—" : homeNet.toFixed(1)} sub="OffRtg − DefRtg" accent={homeNet > awayNet ? "#00e676" : "#888"} />
        <StatCard label={`${away.name || "Away"} Net Rtg`} value={isNaN(awayNet) ? "—" : awayNet.toFixed(1)} sub="OffRtg − DefRtg" accent={awayNet > homeNet ? "#00e676" : "#888"} />
        <StatCard label="Rest Differential" value={restDiff >= 0 ? `+${restDiff}` : restDiff} sub={`Favors ${restDiff > 0 ? home.name || "Home" : restDiff < 0 ? away.name || "Away" : "Neither"}`} accent={restDiff !== 0 ? "#ffd600" : "#888"} />
      </div>
      <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          { label: home.name || "Home", fp: fairP, fairOdds: impliedToAmerican(fairP), bookO: bookHome, ev: evHome, edge: evHome?.edge ?? null },
          { label: away.name || "Away", fp: fairAwayP, fairOdds: impliedToAmerican(fairAwayP), bookO: bookAway, ev: evAway, edge: evAway?.edge ?? null },
        ].map(({ label, fp, fairOdds, bookO, ev, edge }) => (
          <div key={label} style={{ background: `${edgeColor(edge)}0d`, border: `1px solid ${edgeColor(edge)}33`, borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ddd", marginBottom: 12, textTransform: "uppercase" }}>{label}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["Fair Prob", `${(fp * 100).toFixed(1)}%`], ["Fair Odds", formatOdds(fairOdds)], ["Book Offers", bookO || "—"], ["Edge", edge !== null ? `${(edge * 100).toFixed(1)}%` : "—"]].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase" }}>{k}</div>
                  <div style={{ fontSize: 18, fontFamily: "monospace", fontWeight: 700, color: k === "Edge" ? edgeColor(edge) : "#f0f0f0" }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: "6px 10px", borderRadius: 5, background: `${edgeColor(edge)}22`, fontSize: 12, fontWeight: 700, color: edgeColor(edge), textAlign: "center" }}>
              {edge !== null ? edgeLabel(edge) : "—"}{ev && ev.ev > 0 ? ` · +$${ev.ev.toFixed(2)}/100` : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab 4: Parlay Calculator ──────────────────────────────────────────────────
function ParlayCalc() {
  const [legs, setLegs] = useState(["-110", "-110", ""]);
  const addLeg = () => setLegs(l => [...l, ""]);
  const removeLeg = (i: number) => setLegs(l => l.filter((_, idx) => idx !== i));
  const updateLeg = (i: number, val: string) => setLegs(l => l.map((v, idx) => idx === i ? val : v));

  const validLegs = legs.filter(l => l && !isNaN(parseFloat(l)));
  const combinedFairP = validLegs.reduce((acc, o) => { const imp = americanToImplied(o); return imp ? acc * imp : acc; }, 1);
  const bookPayoutDecimal = validLegs.reduce((acc, o) => { const odds = parseFloat(o); const dec = odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1; return acc * dec; }, 1);
  const bookImplied = 1 / bookPayoutDecimal;
  const holdPct = validLegs.length >= 2 ? ((combinedFairP - bookImplied) / combinedFairP) * 100 : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Parlay Legs (enter American odds)</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {legs.map((leg, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{ flex: 1 }}>
              <InputField label={`Leg ${i + 1}`} value={leg} onChange={v => updateLeg(i, v)} placeholder="-110" />
            </div>
            {legs.length > 2 && (
              <button onClick={() => removeLeg(i)} style={{ padding: "9px 14px", background: "rgba(255,82,82,0.1)", border: "1px solid rgba(255,82,82,0.3)", borderRadius: 6, color: "#ff5252", cursor: "pointer", fontSize: 14 }}>✕</button>
            )}
            {leg && !isNaN(parseFloat(leg)) && (() => { const imp = americanToImplied(leg); return imp ? <div style={{ padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, fontFamily: "monospace", fontSize: 12, color: "#aaa", whiteSpace: "nowrap" }}>{(imp * 100).toFixed(1)}%</div> : null; })()}
          </div>
        ))}
        <button onClick={addLeg} style={{ padding: "9px", background: "transparent", border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 6, color: "#666", cursor: "pointer", fontSize: 13 }}>+ ADD LEG</button>
      </div>
      {validLegs.length >= 2 && (
        <>
          <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            <StatCard label="Legs" value={validLegs.length} sub="Active parlay legs" accent="#888" />
            <StatCard label="Book Payout" value={`+${Math.round((bookPayoutDecimal - 1) * 100)}`} sub={`${bookPayoutDecimal.toFixed(2)}x decimal`} accent="#888" />
            <StatCard label="Combined Implied" value={`${(combinedFairP * 100).toFixed(2)}%`} sub="Naïve combined probability" accent="#888" />
            <StatCard label="Parlay Hold" value={holdPct !== null ? `${holdPct.toFixed(1)}%` : "—"} sub="Book's edge on this parlay" accent="#ff5252" />
          </div>
          <div style={{ background: "rgba(255,82,82,0.07)", border: "1px solid rgba(255,82,82,0.2)", borderRadius: 8, padding: "14px 16px", fontSize: 12, color: "#aaa", lineHeight: 1.7 }}>
            <strong style={{ color: "#ff7070" }}>Parlay hold reality:</strong> This {validLegs.length}-leg parlay carries an estimated {holdPct?.toFixed(1) ?? "—"}% hold. DraftKings reports SGP hold rates of 15–27%. The entertainment value is real; the expected value is deeply negative.
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
const TABS = [
  { key: "odds", label: "Odds Converter" },
  { key: "ev", label: "EV Calculator" },
  { key: "nba", label: "NBA Model" },
  { key: "parlay", label: "Parlay Hold" },
];

export default function App() {
  const [tab, setTab] = useState("nba");
  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0f", color: "#f0f0f0", fontFamily: "system-ui, sans-serif", paddingBottom: 40 }}>
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "20px 28px 16px", background: "rgba(255,255,255,0.02)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>NBA EDGE ANALYZER</span>
          <span style={{ fontSize: 11, color: "#ffd600", background: "rgba(255,214,0,0.12)", padding: "2px 7px", borderRadius: 4, letterSpacing: "0.1em", border: "1px solid rgba(255,214,0,0.25)" }}>RESEARCH TOOL</span>
        </div>
        <p style={{ fontSize: 12, color: "#555", margin: 0 }}>Quantifying Pricing Inefficiency and Behavioral Bias in NBA Betting Markets · Simulation-based research framework</p>
      </div>
      <div style={{ display: "flex", gap: 6, padding: "14px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {TABS.map(t => <TabBtn key={t.key} label={t.label} active={tab === t.key} onClick={() => setTab(t.key)} />)}
      </div>
      <div style={{ padding: "24px 28px", maxWidth: 860 }}>
        {tab === "odds" && <OddsConverter />}
        {tab === "ev" && <EVCalculator />}
        {tab === "nba" && <NBAModel />}
        {tab === "parlay" && <ParlayCalc />}
      </div>
      <div style={{ padding: "0 28px", maxWidth: 860, marginTop: 8, fontSize: 11, color: "#3a3a3a" }}>
        For academic research purposes only. Developed with AI assistance (Claude, Anthropic). Not financial or gambling advice.
      </div>
    </div>
  );
}
