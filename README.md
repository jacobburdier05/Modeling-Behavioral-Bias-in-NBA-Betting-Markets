# NBA Betting Market Analysis

**Simulation-Based Analysis of Pricing Inefficiency and Behavioral Bias in NBA Sports Betting Markets**

---

## What This Project Is

This project examines how retail sportsbooks like DraftKings embed structural margins across bet types, 
and whether documented behavioral biases (favorite-longshot bias, public-side line shading) are 
reproduced in a dataset calibrated to published NBA market parameters.

It is a simulation-based methodology framework — not a primary-data empirical study — with results 
interpreted as illustrative of documented patterns from the academic literature.

---

## Live Demo

▶️ **[Click here to run the NBA Edge Analyzer](https://codesandbox.io/p/github/jacobburdier05/Modeling-Behavioral-Bias-in-NBA-Betting-Markets-Simulation-Page/main)**

Opens instantly in your browser — no installation or account required. View-only; the live environment cannot be edited by visitors.

---

## Files

| File | Description |
|---|---|
| `nba_betting_analyzer_FIXED.tsx` | Interactive React dashboard: odds converter, EV calculator, NBA fair-odds model, parlay hold analyzer |
| `nba_betting_analyzer.jsx` | Source code in Javascript |
| `Fig1 flb 3000` | Figure 1A: Implied vs. simulated win rate by probability bucket. Figure 1B: Pricing deviation (simulated minus implied) by bucket |
| `Fig2 public 3000` | Figure 2: Home team cover rate by public ticket concentration |
| `Fig3 hold 3000` | Figure 3: Sportsbook hold rate by bet type |

---

## Key Findings

This study uses a controlled simulation of 3,000 NBA game observations, calibrated to published academic parameters, to test whether two documented behavioral biases in sports betting markets reproduce reliably at a larger sample size. Both effects reproduced at conventional statistical significance.

**Favorite-longshot bias (FLB).** Heavy favorites in the 70 to 78 percent implied probability range won only 69.2 percent of games against a market-implied rate of 74.3 percent, a 5.1 percentage point deviation. Combining all chalk games (implied probability above 70 percent, n = 457) gives an actual win rate of 70.5 percent versus an implied rate of 75.0 percent (z = -2.24, p = 0.025). This rejects the null hypothesis at the 5 percent level.

**Public-side line shading.** Teams attracting more than 70 percent of public tickets covered the spread 42.7 percent of the time. Teams attracting less than 45 percent of tickets covered 52.7 percent of the time. The 10 percentage point gap is significant at the 1 percent level (t = -2.97, p = 0.003). This is consistent with the line-shading behavior documented in Levitt (2004), where sportsbooks shade prices toward public preferences rather than purely balancing their books.

**Hold rate gradient (deterministic).** Standard spread bets carry approximately 4.55 percent structural hold. Three-leg parlays carry 14.7 percent. Four-leg parlays carry 22.1 percent. Same-game parlays are estimated at 18.3 percent from DraftKings investor disclosures. The shift in DraftKings' product mix toward parlay and SGP offerings has therefore raised the effective expected loss per dollar wagered for retail bettors significantly, independent of any change in outcome prediction.

### What This Establishes

Because the data generating process was calibrated to the FLB and public-bias literature, this study does not independently discover these effects. It validates that the analytical assumptions underlying the accompanying NBA Edge Analyzer tool produce internally consistent and statistically detectable patterns at scale, making the tool a reliable educational resource for understanding sportsbook pricing mechanics.

### What This Does Not Establish

This is a simulation study, not a primary-data empirical analysis. It does not make claims about the live U.S. betting market. Replicating the methodology on real closing-line archives is the natural follow-up and the only path to confirming directional findings against actual market data.


---

## Dashboard — NBA Edge Analyzer

▶️ **[Run the live dashboard here](https://codesandbox.io/p/github/jacobburdier05/Modeling-Behavioral-Bias-in-NBA-Betting-Markets-Simulation-Page/main)**

No installation or account required. Opens directly in your browser. View-only — visitors can run it but cannot edit the code. The dashboard has four tools:

1. **Odds Converter** — American odds → implied probability → no-vig fair price
2. **EV Calculator** — Model probability + book odds → expected value + Kelly bet sizing
3. **NBA Team Model** — Input OffRtg / DefRtg / rest days → fair odds vs. book line
4. **Parlay Hold Calculator** — Any number of legs → compounding hold rate

Source code is in `nba_betting_analyzer_FIXED.tsx` for reference.

---

## ⚠️ AI Disclosure

This project was developed with the assistance of Claude Code, which was used to help structure the simulation framework and code. All research direction, topic selection, academic framing, and final editorial decisions were made by the author. The methodology, statistical tests, and findings were reviewed and understood by the author throughout the process. Use of AI assistance in the development of this project is disclosed for full transparency.

---

## Research Paper

Full paper: *"Modeling Behavioral Bias in NBA Betting Markets: Favorite-Longshot Distortion and Public Line Shading"*  
Date: May 2026

---

## References (Selected)

- Levitt, S. D. (2004). Why are gambling markets organised so differently from financial markets? *Economic Journal, 114*(495), 223–246.
- Kahneman, D., & Tversky, A. (1979). Prospect theory. *Econometrica, 47*(2), 263–291.
- Paul, R. J., & Weinbach, A. P. (2009). Sportsbook behavior in the NCAA football betting market. *Journal of Sports Economics, 10*(1), 54–73.
- Thaler, R. H., & Ziemba, W. T. (1988). Parimutuel betting markets. *Journal of Economic Perspectives, 2*(2), 161–174.
