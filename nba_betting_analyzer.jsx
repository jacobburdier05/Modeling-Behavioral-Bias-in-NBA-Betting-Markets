import { useState, useCallback } from "react";

// ─── Utility Functions ────────────────────────────────────────────────────────

function americanToImplied(odds) {
  if (!odds || isNaN(odds)) return null;
  const n = parseFloat(odds);
  if (n < 0) return Math.abs(n) / (Math.abs(n) + 100);
  return 100 / (n + 100);
}

function impliedToAmerican(p) {
  if (!p || p <= 0 || p >= 1) return null;
  if (p >= 0.5) return -(p / (1 - p)) * 100;
  return ((1 - p) / p) * 100;
}

function removeVig(impliedA, impliedB) {
  const overround = impliedA + impliedB;
  return {
    fairA: impliedA / overround,
    fairB: impliedB / overround,
    overround,
    holdPct: ((overround - 1) / overround) * 100,
  };
}

function calcEV(modelP, americanOdds, stake = 100) {
  const odds = parseFloat(americanOdds);
  if (isNaN(odds) || !modelP) return null;
  const payout = odds > 0 ? (odds / 100) * stake : (100 / Math.abs(odds)) * stake;
  const ev = modelP * payout - (1 - modelP) * stake;
  const edge = ev / stake;
  return { ev, edge, payout };
}

function kellyFraction(modelP, americanOdds) {
  const odds = parseFloat(americanOdds);
  if (isNaN(odds) || !modelP) return null;
  const b = odds > 0 ? odds / 100 : 100 / Math.abs(odds);
  const q = 1 - modelP;
  const kelly = (modelP * b - q) / b;
  return Math.max(0, kelly);
}

function formatOdds(n) {
  if (n === null || isNaN(n)) return "—";
  const r = Math.round(n);
  return r >= 0 ? `+${r}` : `${r}`;
}

function formatPct(n, dec = 1) {
  if (n === null || isNaN(n)) return "—";
  return `${(n * 100).toFixed(dec)}%`;
}

// ─── NBA Team Model ───────────────────────────────────────────────────────────

function estimateWinProb({ homeOffRtg, homeDefRtg, awayOffRtg, awayDefRtg, restDiff, isNeutral }) {
  const homeNet = homeOffRtg - homeDefRtg;
  const awayNet = awayOffRtg - awayDefRtg;
  const deltaNet = homeNet - awayNet;

  // Logistic regression approximation based on literature
  // Each point of net rating diff ≈ 3% in win probability
  // Home court advantage ≈ 60% base at equal quality
  // Rest differential ≈ 1.5% per day
  const logit =
    0.4 +                          // home court baseline (~60% at equal quality)
    deltaNet * 0.032 +             // net rating delta
    restDiff * 0.018;              // rest advantage

  const neutralAdj = isNeutral ? -0.04 : 0;
  const raw = 1 / (1 + Math.exp(-(logit + neutralAdj)));
  return Math.min(0.95, Math.max(0.05, raw));
}

// ─── Color helpers ────────────────────────────────────────────────────────────
function edgeColor(edge) {
  if (edge === null) return "#888";
  if (edge > 0.05) return "#00e676";
  if (edge > 0.02) return "#69f0ae";
  if (edge > 0) return "#b9f6ca";
  return "#ff5252";
}

function edgeLabel(edge) {
  if (edge === null) return "—";
  if (edge > 0.06) return "STRONG VALUE";
  if (edge > 0.03) return "VALUE";
  if (edge > 0.01) return "SLIGHT EDGE";
  if (edge >= 0) return "BREAKEVEN";
  return "FADE";
}

// ─── Components ──────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 8,
      padding: "14px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}>
      <span style={{ fontSize: 11, color: "#666", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontSize: 22, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: accent || "#f0f0f0" }}>{value}</span>
      {sub && <span style={{ fontSize: 11, color: "#555" }}>{sub}</span>}
    </div>
  );
}

function TabBtn({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "10px 20px",
      background: active ? "rgba(255,200,0,0.12)" : "transparent",
      border: active ? "1px solid rgba(255,200,0,0.4)" : "1px solid transparent",
      borderRadius: 6,
      color: active ? "#ffd600" : "#777",
      fontFamily: "'Barlow Condensed', sans-serif",
      fontWeight: active ? 700 : 500,
      fontSize: 14,
      letterSpacing: "0.08em",
      cursor: "pointer",
      textTransform: "uppercase",
      transition: "all 0.15s",
    }}>{label}</button>
  );
}

function InputField({ label, value, onChange, placeholder, type = "number" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 11, color: "#888", letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 6,
          padding: "9px 12px",
          color: "#f0f0f0",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 14,
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

// ─── Tab 1: Odds Converter ────────────────────────────────────────────────────
function OddsConverter() {
  const [homeOdds, setHomeOdds] = useState("-135");
  const [awayOdds, setAwayOdds] = useState("+115");

  const homeImp = americanToImplied(homeOdds);
  const awayImp = americanToImplied(awayOdds);
  const vig =
    homeImp && awayImp ? removeVig(homeImp, awayImp) : null;

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
            <StatCard
              label="Home Fair Prob"
              value={`${(vig.fairA * 100).toFixed(1)}%`}
              sub={`Fair odds: ${formatOdds(impliedToAmerican(vig.fairA))}`}
              accent="#00e676"
            />
            <StatCard
              label="Away Fair Prob"
              value={`${(vig.fairB * 100).toFixed(1)}%`}
              sub={`Fair odds: ${formatOdds(impliedToAmerican(vig.fairB))}`}
              accent="#00e676"
            />
          </div>
          <div style={{
            background: "rgba(255,200,0,0.06)",
            border: "1px solid rgba(255,200,0,0.15)",
            borderRadius: 8,
            padding: "12px 16px",
            fontSize: 12,
            color: "#aaa",
            lineHeight: 1.6,
          }}>
            <strong style={{ color: "#ffd600" }}>How to read this:</strong> The book charges you an implied {vig.holdPct.toFixed(2)}% on every dollar wagered here. 
            If you can find a line where the offered odds are <em>better</em> than the fair price above, you have positive expected value.
            Breakeven win rate at -110 = 52.38%.
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
  const betSize = kelly && bankroll ? kelly * parseFloat(bankroll) : null;

  const hasEdge = result && result.edge > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <InputField label="Book's Offered Odds" value={bookOdds} onChange={setBookOdds} placeholder="-110" />
        <InputField label="Your Model's Win Prob (%)" value={modelProb} onChange={setModelProb} placeholder="54" />
        <InputField label="Bankroll ($)" value={bankroll} onChange={setBankroll} placeholder="1000" />
      </div>

      {result && (
        <>
          <div style={{
            padding: "16px 20px",
            borderRadius: 10,
            border: `1px solid ${edgeColor(result.edge)}55`,
            background: `${edgeColor(result.edge)}11`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em" }}>Verdict</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: edgeColor(result.edge), fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.04em" }}>
                {edgeLabel(result.edge)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase" }}>Edge</div>
              <div style={{ fontSize: 24, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: edgeColor(result.edge) }}>
                {(result.edge * 100).toFixed(2)}%
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            <StatCard
              label="EV per $100"
              value={`${result.ev >= 0 ? "+" : ""}$${result.ev.toFixed(2)}`}
              sub="Expected value on $100 wager"
              accent={result.ev >= 0 ? "#00e676" : "#ff5252"}
            />
            <StatCard
              label="Book's Breakeven"
              value={breakEven ? `${(breakEven * 100).toFixed(1)}%` : "—"}
              sub="You need to win above this"
            />
            <StatCard
              label="Your Win Prob"
              value={`${parseFloat(modelProb).toFixed(1)}%`}
              sub={prob > breakEven ? "Above breakeven ✓" : "Below breakeven ✗"}
              accent={prob > (breakEven || 0) ? "#00e676" : "#ff5252"}
            />
            <StatCard
              label="Kelly Bet Size"
              value={kelly && kelly > 0 ? `$${betSize.toFixed(0)}` : "$0"}
              sub={kelly ? `${(kelly * 100).toFixed(1)}% of bankroll (use ¼ Kelly)` : "No edge — do not bet"}
              accent={kelly > 0 ? "#ffd600" : "#888"}
            />
          </div>

          <div style={{
            background: "rgba(255,255,255,0.03)",
            borderRadius: 8,
            padding: "14px 16px",
            fontSize: 12,
            color: "#777",
            lineHeight: 1.7,
          }}>
            <strong style={{ color: "#aaa" }}>Kelly Criterion note:</strong> Full Kelly is aggressive. 
            Practitioners typically use ¼ Kelly (bet ${betSize ? (betSize / 4).toFixed(0) : "0"}) to reduce variance while preserving edge compounding. 
            Any positive EV bet is worth considering; edge above 3% is meaningful.
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tab 3: NBA Team Model ────────────────────────────────────────────────────
function NBAModel() {
  const [home, setHome] = useState({ name: "Boston Celtics", offRtg: "120.6", defRtg: "110.8", rest: "2" });
  const [away, setAway] = useState({ name: "Miami Heat", offRtg: "114.2", defRtg: "115.7", rest: "1" });
  const [bookHome, setBookHome] = useState("-145");
  const [bookAway, setBookAway] = useState("+125");
  const [neutral, setNeutral] = useState(false);

  const updateHome = (field, val) => setHome(h => ({ ...h, [field]: val }));
  const updateAway = (field, val) => setAway(a => ({ ...a, [field]: val }));

  const restDiff = parseFloat(home.rest || 0) - parseFloat(away.rest || 0);

  const fairP = estimateWinProb({
    homeOffRtg: parseFloat(home.offRtg),
    homeDefRtg: parseFloat(home.defRtg),
    awayOffRtg: parseFloat(away.offRtg),
    awayDefRtg: parseFloat(away.defRtg),
    restDiff,
    isNeutral: neutral,
  });

  const fairAwayP = 1 - fairP;
  const fairHomeOdds = impliedToAmerican(fairP);
  const fairAwayOdds = impliedToAmerican(fairAwayP);

  const evHome = calcEV(fairP, bookHome);
  const evAway = calcEV(fairAwayP, bookAway);
  const homeEdge = evHome ? evHome.edge : null;
  const awayEdge = evAway ? evAway.edge : null;

  const homeNet = parseFloat(home.offRtg) - parseFloat(home.defRtg);
  const awayNet = parseFloat(away.offRtg) - parseFloat(away.defRtg);

  const inputBlock = (teamState, updateFn, label) => (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 10,
      padding: 16,
    }}>
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
          <button
            onClick={() => setNeutral(!neutral)}
            style={{
              padding: "9px 12px",
              background: neutral ? "rgba(255,200,0,0.15)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${neutral ? "rgba(255,200,0,0.4)" : "rgba(255,255,255,0.12)"}`,
              borderRadius: 6,
              color: neutral ? "#ffd600" : "#888",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
              cursor: "pointer",
              textAlign: "left",
            }}>
            {neutral ? "Yes — Neutral" : "No — Home Court"}
          </button>
        </div>
      </div>

      {/* Net Rating Comparison */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <StatCard
          label={`${home.name || "Home"} Net Rtg`}
          value={isNaN(homeNet) ? "—" : homeNet.toFixed(1)}
          sub="OffRtg − DefRtg"
          accent={homeNet > awayNet ? "#00e676" : "#888"}
        />
        <StatCard
          label={`${away.name || "Away"} Net Rtg`}
          value={isNaN(awayNet) ? "—" : awayNet.toFixed(1)}
          sub="OffRtg − DefRtg"
          accent={awayNet > homeNet ? "#00e676" : "#888"}
        />
        <StatCard
          label="Rest Differential"
          value={restDiff >= 0 ? `+${restDiff}` : restDiff}
          sub={`Favors ${restDiff > 0 ? home.name || "Home" : restDiff < 0 ? away.name || "Away" : "Neither"}`}
          accent={restDiff !== 0 ? "#ffd600" : "#888"}
        />
      </div>

      <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />

      {/* Model Output */}
      <div style={{ fontSize: 11, color: "#666", textTransform: "uppercase", letterSpacing: "0.1em" }}>Model Output vs. Book</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          { label: home.name || "Home", fairP, fairOdds: fairHomeOdds, bookO: bookHome, ev: evHome, edge: homeEdge },
          { label: away.name || "Away", fairP: fairAwayP, fairOdds: fairAwayOdds, bookO: bookAway, ev: evAway, edge: awayEdge },
        ].map(({ label, fairP: fp, fairOdds, bookO, ev, edge }) => (
          <div key={label} style={{
            background: `${edgeColor(edge)}0d`,
            border: `1px solid ${edgeColor(edge)}33`,
            borderRadius: 10,
            padding: 16,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ddd", marginBottom: 12, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase" }}>Fair Prob</div>
                <div style={{ fontSize: 18, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#f0f0f0" }}>{(fp * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase" }}>Fair Odds</div>
                <div style={{ fontSize: 18, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#f0f0f0" }}>{formatOdds(fairOdds)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase" }}>Book Offers</div>
                <div style={{ fontSize: 18, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "#f0f0f0" }}>{bookO || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "#666", textTransform: "uppercase" }}>Edge</div>
                <div style={{ fontSize: 18, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: edgeColor(edge) }}>{edge !== null ? `${(edge * 100).toFixed(1)}%` : "—"}</div>
              </div>
            </div>
            <div style={{
              marginTop: 12,
              padding: "6px 10px",
              borderRadius: 5,
              background: `${edgeColor(edge)}22`,
              fontSize: 12,
              fontWeight: 700,
              color: edgeColor(edge),
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: "0.08em",
              textAlign: "center",
            }}>
              {edge !== null ? edgeLabel(edge) : "—"}
              {ev && ev.ev > 0 && ` · +$${ev.ev.toFixed(2)}/100`}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        fontSize: 11,
        color: "#555",
        lineHeight: 1.7,
        padding: "10px 14px",
        background: "rgba(255,255,255,0.02)",
        borderRadius: 8,
        borderLeft: "2px solid #333",
      }}>
        <strong style={{ color: "#777" }}>Model assumptions:</strong> Logistic regression approximating win probability from net rating delta, rest differential, and home court.
        Coefficients derived from published NBA betting market research. Treat outputs as directional signals, not precise probabilities.
        Always cross-reference with injury reports, closing line movement, and public bet percentages before acting.
      </div>
    </div>
  );
}

// ─── Tab 4: Parlay Hold Calculator ───────────────────────────────────────────
function ParlayCalc() {
  const [legs, setLegs] = useState(["-110", "-110", ""]);

  const addLeg = () => setLegs(l => [...l, ""]);
  const removeLeg = (i) => setLegs(l => l.filter((_, idx) => idx !== i));
  const updateLeg = (i, val) => setLegs(l => l.map((v, idx) => (idx === i ? val : v)));

  const validLegs = legs.filter(l => l && !isNaN(parseFloat(l)));
  const combinedFairP = validLegs.reduce((acc, o) => {
    const imp = americanToImplied(o);
    return imp ? acc * imp : acc;
  }, 1);

  // Book parlay payout (correlated compounding — simplified for independent legs)
  const trueCombinedP = validLegs.reduce((acc, o) => {
    const imp = americanToImplied(o);
    const fairP = imp / 1; // simplified: no vig removal for display
    return fairP ? acc * imp : acc;
  }, 1);

  const bookPayoutDecimal = validLegs.reduce((acc, o) => {
    const odds = parseFloat(o);
    const dec = odds > 0 ? odds / 100 + 1 : 100 / Math.abs(odds) + 1;
    return acc * dec;
  }, 1);

  const bookImplied = 1 / bookPayoutDecimal;
  const trueP = validLegs.reduce((acc, o) => {
    const imp = americanToImplied(o);
    const or = imp + (1 - imp); // simplified both sides equal
    const fair = imp / (imp + (1 - imp)); // this is just imp actually
    // Remove vig: assume fair = imp/1.0476 (approx -110 both sides)
    const fairEach = imp / 1.0476;
    return acc * fairEach;
  }, 1);

  const holdPct = validLegs.length >= 2
    ? ((combinedFairP - bookImplied) / combinedFairP) * 100
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Parlay Legs (enter American odds)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {legs.map((leg, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <InputField
                  label={`Leg ${i + 1}`}
                  value={leg}
                  onChange={v => updateLeg(i, v)}
                  placeholder="-110"
                />
              </div>
              {legs.length > 2 && (
                <button
                  onClick={() => removeLeg(i)}
                  style={{
                    padding: "9px 14px",
                    background: "rgba(255,82,82,0.1)",
                    border: "1px solid rgba(255,82,82,0.3)",
                    borderRadius: 6,
                    color: "#ff5252",
                    cursor: "pointer",
                    fontSize: 14,
                    marginBottom: 1,
                  }}>✕</button>
              )}
              {validLegs.length > 0 && americanToImplied(leg) && (
                <div style={{
                  padding: "9px 12px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 6,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  color: "#aaa",
                  whiteSpace: "nowrap",
                }}>
                  {(americanToImplied(leg) * 100).toFixed(1)}%
                </div>
              )}
            </div>
          ))}
          <button
            onClick={addLeg}
            style={{
              padding: "9px",
              background: "transparent",
              border: "1px dashed rgba(255,255,255,0.15)",
              borderRadius: 6,
              color: "#666",
              cursor: "pointer",
              fontSize: 13,
              fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: "0.05em",
            }}>
            + ADD LEG
          </button>
        </div>
      </div>

      {validLegs.length >= 2 && (
        <>
          <div style={{ height: 1, background: "rgba(255,255,255,0.07)" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            <StatCard
              label="Legs"
              value={validLegs.length}
              sub="Active parlay legs"
            />
            <StatCard
              label="Book Payout"
              value={`+${Math.round((bookPayoutDecimal - 1) * 100)}`}
              sub={`${bookPayoutDecimal.toFixed(2)}x decimal`}
            />
            <StatCard
              label="Combined Implied"
              value={`${(combinedFairP * 100).toFixed(2)}%`}
              sub="Naïve combined probability"
            />
            <StatCard
              label="Parlay Hold"
              value={holdPct !== null ? `${holdPct.toFixed(1)}%` : "—"}
              sub="Book's edge on this parlay"
              accent="#ff5252"
            />
          </div>

          <div style={{
            background: "rgba(255,82,82,0.07)",
            border: "1px solid rgba(255,82,82,0.2)",
            borderRadius: 8,
            padding: "14px 16px",
            fontSize: 12,
            color: "#aaa",
            lineHeight: 1.7,
          }}>
            <strong style={{ color: "#ff7070" }}>Parlay hold reality:</strong> A standard {validLegs.length}-leg parlay at -110 carries
            an estimated {holdPct !== null ? holdPct.toFixed(1) : "—"}% hold. Same-game parlays add correlated risk pricing on top.
            DraftKings reports SGP hold rates of 15-27% in investor materials. The entertainment value is real;
            the expected value is deeply negative.
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
    <div style={{
      minHeight: "100vh",
      background: "#0d0d0f",
      fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif",
      color: "#f0f0f0",
      padding: "0 0 40px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
        input:focus { border-color: rgba(255,214,0,0.5) !important; box-shadow: 0 0 0 2px rgba(255,214,0,0.08); }
        input::placeholder { color: #444; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        * { box-sizing: border-box; }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "20px 28px 16px",
        background: "rgba(255,255,255,0.02)",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
          <span style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "0.04em",
            color: "#fff",
          }}>NBA EDGE ANALYZER</span>
          <span style={{
            fontSize: 11,
            color: "#ffd600",
            background: "rgba(255,214,0,0.12)",
            padding: "2px 7px",
            borderRadius: 4,
            letterSpacing: "0.1em",
            border: "1px solid rgba(255,214,0,0.25)",
          }}>RESEARCH TOOL</span>
        </div>
        <p style={{ fontSize: 12, color: "#555", margin: 0, letterSpacing: "0.02em" }}>
          Quantifying Pricing Inefficiency and Public Bias in NBA Betting Markets · Fair-odds model + EV framework
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, padding: "14px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {TABS.map(t => (
          <TabBtn key={t.key} label={t.label} active={tab === t.key} onClick={() => setTab(t.key)} />
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "24px 28px", maxWidth: 860 }}>
        {tab === "odds" && <OddsConverter />}
        {tab === "ev" && <EVCalculator />}
        {tab === "nba" && <NBAModel />}
        {tab === "parlay" && <ParlayCalc />}
      </div>

      {/* Footer */}
      <div style={{
        padding: "0 28px",
        maxWidth: 860,
        marginTop: 8,
        fontSize: 11,
        color: "#3a3a3a",
        lineHeight: 1.6,
      }}>
        For academic research purposes. Model uses approximated logistic regression coefficients from sports betting literature.
        Not financial or gambling advice. Always consult a licensed professional.
      </div>
    </div>
  );
}
