# FOLO — UI design decisions

Reference for building the Android (Compose) and web (Next.js) UIs. Derived from
the *Simple Budget Spreadsheet* domain model and matched to FOLO's existing tokens
in `web/app/` and `supabase_schema.sql`.

**Canvas:** https://claude.ai/code/artifact/e188d44f-eeed-412b-97a7-18fd0083ceab
**Source artboards:** `design/*.dc.html` + `design/canvas.json`

---

## 1. The governing decision

The spreadsheet has **28 charts**. The app needs **three**.

Most of those charts answer one question — *am I over or under on this category?*
That is a ratio against a limit, which is a **meter**, not a chart. A list of
meters reads faster than any grouped bar chart of the same data and costs nothing
to render on either platform.

Second governing decision: **one number leads.** The entire workbook exists to
compute

```
left = opening_balance + income − bills − expenses − savings − debt
```

That number is the hero on Home. Everything else is supporting detail.

---

## 2. Tokens

Lifted from the existing code, not invented. Occurrence counts are from
`grep` across `web/app`.

| Role | Value | Notes |
|---|---|---|
| Ink / primary text | `#0B0F17` | 61 uses — the dominant ink |
| Accent | `#10B981` | 54 uses — emerald |
| Accent (pressed / text-on-light) | `#059669` | |
| Accent (darkest ramp step) | `#047857` | charts only |
| Surface | `#FFFFFF` | cards, panels, bars |
| Page background | `#F6F7F9` | derived; app currently uses bare white |
| Border | `#E8EAED` | 1px, all cards |
| Divider (inside cards) | `#F0F2F4` | |
| Meter track | `#EDEFF2` | |
| Secondary text | `#475569` | slate |
| Muted text / labels | `#94a3b8` | slate |
| Critical | `#ef4444` | over budget, negative net |
| Zero / baseline rule | `#CBD5E1` | diverging charts |

### Contrast

All text colours pass WCAG AA on `#FFFFFF`:

| Colour | Ratio | Level |
|---|---|---|
| `#0B0F17` | 18.7:1 | AAA |
| `#475569` | 7.5:1 | AAA |
| `#94a3b8` | 2.8:1 | **decorative/label only — never body text** |
| `#059669` | 3.7:1 | large text & icons only |
| `#ef4444` | 3.8:1 | large text & icons only |

`#94a3b8` is used exclusively for 9–11px uppercase labels and secondary figures
that are always paired with a high-contrast primary value. Do not use it for
anything a user must read on its own.

---

## 3. Typography

`web/app/globals.css` declares `--font-geist-sans` / `--font-geist-mono` in
`@theme`, but the `body` rule then overrides to `Arial, Helvetica, sans-serif`
— almost certainly a leftover from the Next.js starter template. **The designs
target Geist; the Arial override should be removed.**

| Use | Face |
|---|---|
| UI, labels, body | Geist — `'Geist', system-ui, sans-serif` |
| **All monetary figures** | Geist Mono — `'Geist Mono', ui-monospace, monospace` |

Every amount is monospaced with `font-variant-numeric: tabular-nums` so digits
line up down a column. Proportional figures make a list of amounts look ragged
and defeat scanning — this is not stylistic, it is the reason ledgers have used
fixed-width figures for a century.

Scale: hero 44–52px / 600, screen title 20px / 600, card title 14px / 600,
body 13px, secondary 12px, label 9–11px / 600 with `0.07–0.09em` tracking.

---

## 4. Rules

### 4.1 Status is never colour alone

Over/under budget is the app's core signal. Roughly 1 in 12 men cannot reliably
separate red from green, and *"am I overspent"* is the wrong thing to make anyone
guess. Every status carries **sign + word + (where space allows) icon**:

```
+245 over        ⚠ 185 over budget        −60 under        0 on plan
```

Colour is reinforcement, never the message. This applies in Compose and on web
identically.

### 4.2 Meters, not charts, for budget vs actual

Track `#EDEFF2`, 6–7px tall, 3–3.5px radius. Fill `#10B981` normally, `#ef4444`
when actual > budget (clamped to 100% width — never overflow the track). Label
row above shows `actual / budget`, right-aligned, mono.

### 4.3 Money never touches floating point

`supabase_schema.sql` uses `DECIMAL(12,2)`, which is exact in Postgres — good.
The risk is client-side: **do not do arithmetic on these values in Kotlin
`Double` or JS `number`.** Read computed totals from the database (§6), and use
`BigDecimal` on Android / integer minor units or a decimal library on web for
anything you must compute locally.

### 4.4 Hit targets ≥ 44px

Every tappable element on a phone artboard is at least 44px in its smaller
dimension, including tab bar items, keypad keys, and header chevrons.

### 4.5 No fake OS chrome

No painted iOS/Android status bar, no painted system keyboard. The real ones
render on top; a painted copy looks doubled. The Add screen's keypad is the
*app's own* numeric pad — that is a real component, not fake chrome.

---

## 5. Screens

### Home (`Main.dc.html`)

| Zone | Content |
|---|---|
| Period header | `< September 2026 >` + date range, avatar right |
| Hero card | `LEFT TO SPEND` label, 44px figure, days-left, planned-vs-actual variance |
| KPI row | 3 stat tiles: Income, Spent, Saved — value + "of N" |
| By group | 4 meters: Bills, Expenses, Savings, Debt |
| Recent | 3 transactions, icon + name + category·date + amount |
| Tab bar | Home · Budget · **+** · Activity · Goals |

No chart above the fold. The `+` is a raised 48px accent square in the centre
tab slot.

### Add transaction (`Add.dc.html`)

**The make-or-break screen.** Budget apps die from logging friction, not missing
features. Target: **two taps and a number.**

1. Amount is the first and largest thing on screen (52px mono, caret shown)
2. Group — 5-segment control, `category_type`
3. Category — chips, tap one
4. Date defaults to today, collapsed to one row
5. Note optional, collapsed to one row
6. App's own numeric keypad, 3×4, 60px keys
7. Save — 54px accent button

Everything except amount and category has a sensible default.

### Budget (`Budget.dc.html`)

Summary strip (Budgeted / Actual / Variance), then the five groups as sections of
meters. Groups the user is not actively watching collapse to a single row with
its rollup. Expenses is shown expanded and over budget to exercise the status
treatment.

### Activity (`Transactions.dc.html`)

Reverse-chronological, **grouped by day** with a per-day net total in the day
header. Filter chips by `category_type`. Income shows `+` and accent colour;
outflows show `−`. Icon tile tinted `#E7F7F0` for income, `#F1F5F3` otherwise.

### Goals (`Goals.dc.html`)

Savings totals strip (Target / Saved / To go), then `SAVINGS` and `DEBT PAYOFF`
sections. One card per goal: name, target date or monthly amount, percentage,
meter, `saved / target` and `N to go`. Achieved goals show a check icon plus the
word **Achieved** / **Cleared** — again, never colour alone.

### Web dashboard (`Dashboard.dc.html`)

240px sidebar (Overview, Budget, Transactions, Goals, Reports) + main column.
This is where Next.js earns its place, and where the mobile single-column
composition is explicitly *not* reused.

---

## 6. Charts — the three that earn their place

Built with Recharts on web (already a dependency). Not mirrored on Android;
the phone gets meters.

| # | Chart | Form | Colour job |
|---|---|---|---|
| 1 | Where the money went | Horizontal bars, sorted descending | **Sequential** — one hue, darkest = largest |
| 2 | Over and under plan | Diverging bars centred on zero | **Diverging** — two hues + neutral zero rule |
| 3 | Net position by month | Single line, zero baseline | One hue; negative points marked |

Sequential ramp (chart 1 only):
`#047857` → `#059669` → `#10B981` → `#34D399` → `#6EE7B7`

Single-series charts get **no legend** — the title names the series. Markers
≥8px diameter, lines 2px, 4px rounded bar ends anchored to the baseline, grid
and axes recessive.

### Explicitly rejected

- **Pie / donut of categories.** 10–20 slices is unreadable. Chart 1 replaces it.
- **Dual-axis** budget-vs-actual over time. Two y-scales on one plot is the single
  most common charting mistake. Use two charts or index to a common base.
- **A chart per category.** That is the spreadsheet's mistake — 28 charts.
- **An empty trend chart.** Chart 3 requires ≥3 completed periods; hide it until then.

---

## 7. Cross-platform: put the arithmetic in one place

Two UI codebases (Kotlin + TypeScript) is an acceptable cost. **Two independent
implementations of the money maths is not** — that is how a budget app ends up
showing different numbers on phone and web, which is the bug users never forgive.

Push the rollups into Postgres so neither client computes a balance:

| View / RPC | Returns |
|---|---|
| `v_budget_item_actuals` | per `budget_item`, summed `transactions` within the period (the `SUMIFS` equivalent) |
| `v_budget_group_totals` | per `category_type`: budgeted, actual, variance |
| `v_period_summary` | `opening_balance + income − bills − expenses − savings − debt`, days remaining |
| `v_goal_progress` | per goal: `starting_amount + current_progress`, `target_amount`, pct, achieved flag |

Both clients read; neither calculates. This also means the "duplicate last
month's budget" action is a single `INSERT … SELECT` over `budget_items`, not a
sheet clone.

---

## 8. Reference sample data

The mockups use one internally consistent month. Reuse it for fixtures and
tests — every figure reconciles.

**September 2026** · opening balance `500.00` · currency `GH₵` / `GHS`

| Group | Budgeted | Actual |
|---|---|---|
| Income | 9,500 | 9,200 |
| Bills | 3,150 | 3,090 |
| Expenses | 2,600 | **2,845** (over 245) |
| Savings | 1,500 | 1,500 |
| Debt | 950 | 950 |

- Income: Salary 8,500/8,500 · Freelance 700/1,000
- Bills: Rent 1,800/1,800 · Electricity·ECG 385/400 · Water 118/120 ·
  Internet 350/350 · MTN Airtime 137/180 · Car Insurance 300/300
- Expenses: Food **1,410**/1,200 · Transport **640**/600 · Health 180/300 ·
  Tithe 615/500
- Savings: Emergency Fund 1,000 · Land Fund 500
- Debt: Credit Card 450 · Family Loan 500

Derived:

```
outflow      = 3,090 + 2,845 + 1,500 + 950 = 8,385
net          = 9,200 − 8,385               =   +815
left to spend=   500 + 815                 = 1,315
planned left =   500 + 9,500 − 8,200       = 1,800
spend variance = (3,090+2,845) − (3,150+2,600) = +185 over
```

Net position, last 6 periods: Apr +820 · May +1,150 · Jun **−240** · Jul +640 ·
Aug +1,310 · Sep +815

Goals (2 of 5 achieved):

| Goal | Type | Target | Saved/Paid | % |
|---|---|---|---|---|
| Emergency Fund | SAVINGS | 20,000 | 10,500 | 52 |
| Land Fund | SAVINGS | 50,000 | 12,500 | 25 |
| School Fees | SAVINGS | 6,000 | 6,000 | **achieved** |
| Credit Card | DEBT | 8,000 | 5,150 | 64 |
| Family Loan | DEBT | 5,000 | 5,000 | **cleared** |

---

## 9. Open questions

- [ ] **Add transaction**: full screen (as drawn) or bottom sheet? Sheet keeps
      context; full screen gives the keypad room.
- [ ] **Budget groups**: start expanded or collapsed?
- [ ] **Dark mode** — not designed yet. It must be *selected* from the same ramps
      against a dark surface, not an automatic inversion.
- [ ] **Empty states** — first run, no transactions, no goals, month not yet
      budgeted. None designed.
- [ ] **Offline indicator** — Room is the Android source of truth; the UI needs to
      show unsynced state somewhere.
- [ ] Remove the `font-family: Arial` override in `globals.css` (§3).
- [ ] `currency_symbol` defaults to `'$'` in the schema; set `GH₵` / `GHS`.
