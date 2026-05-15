# Modeling-Behavioral-Bias-in-NBA-Betting-Markets
Simulation-based analysis of pricing inefficiency and behavioral bias in NBA sports betting markets. 

---

## What This Project Is

This project examines how retail sportsbooks like DraftKings embed structural margins across bet types, 

and whether documented behavioral biases (favorite-longshot bias, public-side line shading) are 

reproduced in a dataset calibrated to published NBA market parameters.

It is a simulation-based methodology framework, not a primary-data empirical study, with results 

interpreted as illustrative of documented patterns from the academic literature.

---

## Files

| File | Description |

|---|---|

| `nba_betting_analyzer.jsx` | Interactive React dashboard: odds converter, EV calculator, NBA fair-odds model, parlay hold analyzer |

| `fig1a_flb.png` | Figure 1A: Implied vs. simulated win rate by probability bucket |

| `fig1b_deviation.png` | Figure 1B: Pricing deviation (simulated minus implied) by bucket |

| `fig2_public_bias.png` | Figure 2: Home team cover rate by public ticket concentration |

| `fig3_hold_rates.png` | Figure 3: Sportsbook hold rate by bet type |

---

## Key Findings (Simulated)

- **Favorite-longshot bias reproduced:** Big underdogs (implied < 45%) outperform market price by +12.0pp; 

  chalk (> 78%) underperforms by 12.0pp across all six probability buckets

- **Public bias reproduced:** 11.4pp gap in cover rates between low-public and high-public games, 

  consistent with line-shading documented in Levitt (2004)

- **Hold rate gradient:** Standard spreads carry ~4.55% hold; 4-leg parlays carry ~22.1%; 

  same-game parlays estimated at ~18.3% (DraftKings investor disclosures)

- Both effects are directionally significant but statistically inconclusive at n=574; 

  results are consistent with published literature, not novel empirical discoveries

---

## Dashboard — NBA Edge Analyzer

The `nba_betting_analyzer.jsx` file is a React component with four tools:

1. **Odds Converter** — American odds → implied probability → no-vig fair price

2. **EV Calculator** — Model probability + book odds → expected value + Kelly bet sizing

3. **NBA Team Model** — Input OffRtg / DefRtg / rest days → fair odds vs. book line

4. **Parlay Hold Calculator** — Any number of legs → compounding hold rate

**To run it locally:**

1. Make sure you have [Node.js](https://nodejs.org) installed

2. Open your terminal and run:

```bash

npx create-react-app nba-edge-analyzer

cd nba-edge-analyzer

npm install lucide-react recharts

Replace the contents of src/App.js with everything in nba_betting_analyzer.jsx
Run npm start — it will open automatically at http://localhost:3000

To run it without any setup:

Go to codesandbox.io and click "Create Sandbox" → "React"
Replace App.js with the contents of nba_betting_analyzer.jsx
It runs instantly in the browser — no installation needed
You can share the CodeSandbox link as a live demo


⚠️ AI Disclosure
This project was developed with the assistance of Claude Code (Anthropic), an AI tool, which was used to help structure the simulation framework, generate the dashboard code, and conduct research. All research direction, topic selection, academic framing, and final editorial decisions were made by the author. The methodology, statistical tests, and findings were reviewed and understood by the author throughout the process. Use of AI assistance in the development of this project is disclosed in the spirit of academic transparency.


Research Paper
Full paper: "Modeling Behavioral Bias in NBA Betting Markets: Favorite-Longshot Distortion and Public Line Shading"
Date: May 2026


References (Selected)
Levitt, S. D. (2004). Why are gambling markets organised so differently from financial markets? Economic Journal, 114(495), 223–246.
Kahneman, D., & Tversky, A. (1979). Prospect theory. Econometrica, 47(2), 263–291.
Paul, R. J., & Weinbach, A. P. (2009). Sportsbook behavior in the NCAA football betting market. Journal of Sports Economics, 10(1), 54–73.
Thaler, R. H., & Ziemba, W. T. (1988). Parimutuel betting markets. Journal of Economic Perspectives, 2(2), 161–174.
