# Spreadsheet logic — extracted spec

Every rule in `docs/Copy of Simple Budget Spreadsheet.xlsx`, written out so FOLO
can implement it without the workbook open. Cell references are to the `Budget`
sheet unless stated.

Companion: [`../design/DESIGN.md`](../design/DESIGN.md) (UI decisions).

---

## 1. Sheets

| Sheet | Role |
|---|---|
| `READ ME- SETUP` | Instructions only. No logic. |
| `Budget` | The template. One budget period. **Duplicated per month.** |
| `September` | A duplicate of `Budget` with real data — proves the copy model |
| `Goal Tracker` | 10 savings + 10 debt goals, with their own shared log |
| `Full Collection` | Vendor cross-sell. Ignore. |

The "new month" gesture is **duplicate the tab**. In FOLO this becomes a new
`budget_periods` row plus `INSERT … SELECT` of last period's `budget_items`.

---

## 2. Budget sheet — layout

### Period header

| Cell | Content |
|---|---|
| `M3` / `O3` | Period start / end date (date-validated) |
| `M4` | Currency **symbol** — dropdown of ~70 glyphs (`$ € £ ₦ ₵ …`) |
| `M5` | Display name |
| `N6` | Opening balance ("Start Balance") |
| `Q2` | Toggle: `LEFT TO SPEND` \| `LEFT TO BUDGET` |

### The five category blocks

All on rows 21–51, side by side. Fixed slot counts — this is a hard ceiling in
the spreadsheet and should **not** be reproduced in the app.

| Group | Name col | Due | Budget | Actual | Rows | Slots |
|---|---|---|---|---|---|---|
| Income | `B` | — | `E` | `G` | 22–33 | 12 |
| Bills | `J` | `K` | `M` | `O` | 22–50 | 29 |
| Expenses | `Q` | — | `S` | `U` | 22–50 | 29 |
| Debt | `Z` | `AA` | `AC` | `AE` | 22–50 | 29 |
| Savings | `C` | — | `E` | `G` | 39–50 | 12 |

Totals sit on the last row of each block: `E34`/`G34` (income),
`M51`/`O51` (bills), `S51`/`U51` (expenses), `AC51`/`AE51` (debt),
`E51`/`G51` (savings).

### Transaction log

Rows 56–1058, headers on row 55.

| Col | Field | Validation |
|---|---|---|
| `B` | Date | must be a date |
| `E` | Amount | — |
| `H` | Category | **dropdown limited to `Q22:Q50` — expense categories only** |
| `K` | Notes | free text |

---

## 3. ⚠ The critical finding

**Only Expense actuals are derived. Everything else is typed by hand.**

Column `U` (expense actual) is the sole `SUMIFS` over the log. Income `G`,
Bills `O`, Savings `G39:G50` and Debt `AE` are empty input cells the user keys
manually, and the log's category dropdown cannot even reference them.

That means the workbook's headline number can silently disagree with its own
transaction history. **FOLO must derive all five groups from `transactions`.**
This is the single largest improvement the app makes over the spreadsheet, and
the reason `§7` pushes every rollup into SQL.

---

## 4. Formulas

### 4.1 Expense actual — the core aggregation

```excel
U22 = IF(ISBLANK($Q22), "",
        IF(SUMIFS($E$56:$E1059, $H$56:$H1059, $Q22,
                  $B$56:$B1059, ">="&$M$3,
                  $B$56:$B1059, "<="&$O$3) = 0, "",
           SUMIFS(...same...)))
```

**Sum log amounts where category = this row's category AND date falls within the
period (inclusive both ends).** Blank category → blank cell; zero → blank rather
than `0`.

### 4.2 Left, per expense category

```excel
W22 = IF(ISBLANK(Q22), , S22 - U22)      // budget − actual
```

Positive = under budget. Negative = over. Expenses is the **only** group with a
per-row "left" column.

### 4.3 Cash flow

```excel
E17 = SUM(E11:E12) - SUM(E13:E16)        // budgeted
G17 = SUM(G11:G12) - SUM(G13:G16)        // actual
```

where rows 11–16 are Start Balance, Income, Bills, Expenses, Savings, Debt. Fully
expanded:

```
left = opening_balance + income − bills − expenses − savings − debt
```

Savings and debt payments are treated as **outflows**, not as retained value.
Sending money to savings reduces "left to spend". Keep this — it is the
envelope-budgeting convention and users rely on it.

### 4.4 The headline toggle

```excel
Q3 = IF(Q2 = "L E F T  T O  S P E N D", format(G17), format(E17))
```

One control switches the hero figure between **actual** (`G17`) and **planned**
(`E17`). Worth keeping as a segmented control on the Home hero.

### 4.5 Days left

```excel
Y3 = IF(ISDATE(O3), MIN(O3 - M3 + 1, MAX(O3 - TODAY() + 1, 0)), "")
```

Days remaining **inclusive of today**, clamped: never more than the period length
(before the period starts) and never below 0 (after it ends).

### 4.6 Expense breakdown

```excel
Y67  = QUERY(Q22:W50, "select Q,T,U where (U>0) order by U desc")
AC67 = IF(ISBLANK($Y67), "", SUMIF($H$56:$H1059, $Y67, $E$56:$E1059))
AD67 = IFERROR($AC67 / $U$51, "")        // share of total expense
```

Expense categories with spend > 0, sorted descending, each with its share of the
expense total. This is the data behind the "Where the money went" chart.

### 4.7 Month name

`P2 = MONTH(M3)` → `B4` maps 1–12 to a display name. Derive from the period
start date; never store it.

---

## 5. Goal Tracker

Two identical halves — Savings (rows 13–51) and Debt (rows 55–93) — each with
10 fixed slots laid out 5 across × 2 down.

### Per goal

| Field | Formula | Meaning |
|---|---|---|
| Goal | input (`D32`) | target amount |
| Start | input (`D33`) | already accumulated before using the tool |
| Saved | `SUMIFS($H$100:$H$663, $C$100:$C$663, "Savings", $E$100:$E$663, B23)` | contributions from the goal log |
| Left to Save | `IF(D32="", , D32 - D33 - D34)` | target − start − saved |

Derived flags:

```excel
E32 = IF(D32 = "", 0, 1)                 // slot is in use
E33 = D33 + D34                          // total accumulated
E35 = IF(D35 <= 0, 1, 0) * E32           // achieved (and slot in use)
```

`Left to Save <= 0` means achieved — **overshooting still counts**.

### Roll-ups

```excel
B20 = Σ achieved flags                   // "3"
D20 = Σ in-use flags                     // "10"
B17 = B20 & " / " & D20                  // "3 / 10"
F20 = Σ goal amounts      (total target)
J20 = Σ start amounts
N20 = Σ saved
R20 = Σ left to save
```

The debt half is identical with the log filtered on `"Debt"`, and the labels
renamed: Debt / Start Debt / Paid Off / Left to Pay.

### Goal log

Rows 100–663. `B` Date · `C` Category (`Savings`\|`Debt`) · `E` Sub-category ·
`G` Amount · `I` Notes.

Sub-category is a dropdown fed by `U100:AD100`, which is itself
`=IF(C="Savings", TRANSPOSE(savings goal names), TRANSPOSE(debt goal names))` —
i.e. **a dependent dropdown**: pick Savings, get savings goal names. Reproduce
this behaviour in the Add-transaction flow.

**Note:** the goal log is entirely separate from the Budget sheet's expense log.
A savings contribution recorded on the Budget sheet does *not* advance a goal.
FOLO should use one `transactions` table and link goal contributions to both.

---

## 6. Currency, dates, formatting

- **Currency is a symbol only** (`M4`, `Goal Tracker!D3`) — no ISO code, no rates,
  no conversion anywhere. FOLO's schema improves on this with
  `currency_symbol` + `currency_code`. There is no multi-currency logic to port.
- **Number format:** `#,###.00` when there are decimal places, `#,###` when whole
  (`IF(x - INT(x) > 0, …)`). Negatives render as `-<symbol><abs>`, not
  parentheses.
- **Zero renders blank**, not `0`, in per-row actual cells.
- **Period bounds are inclusive** on both ends in every `SUMIFS`.

---

## 7. Implementation in FOLO

Map to `supabase_schema.sql`. Both clients read these; neither recomputes.

```sql
-- 4.1  actual per budget item, period-scoped
create or replace view v_budget_item_actuals as
select bi.id            as budget_item_id,
       bi.budget_period_id,
       bi.user_id,
       bi.category_id,
       bi.subcategory_name,
       bi.budgeted_amount,
       coalesce(sum(t.amount), 0)                       as actual_amount,
       bi.budgeted_amount - coalesce(sum(t.amount), 0)  as remaining_amount
from budget_items bi
left join budget_periods p on p.id = bi.budget_period_id
left join transactions t
       on t.budget_item_id = bi.id
      and t.transaction_date between p.start_date and p.end_date   -- inclusive
group by bi.id, bi.budget_period_id, bi.user_id, bi.category_id,
         bi.subcategory_name, bi.budgeted_amount;

-- 4.3  group rollups — ALL FIVE derived (fixes §3)
create or replace view v_budget_group_totals as
select bi.budget_period_id,
       bi.user_id,
       c.category_type,
       sum(bi.budgeted_amount)                          as budgeted,
       coalesce(sum(a.actual_amount), 0)                as actual,
       coalesce(sum(a.actual_amount), 0)
         - sum(bi.budgeted_amount)                      as variance
from budget_items bi
join categories c on c.id = bi.category_id
left join v_budget_item_actuals a on a.budget_item_id = bi.id
group by bi.budget_period_id, bi.user_id, c.category_type;

-- 4.3 + 4.5  the headline
create or replace view v_period_summary as
select p.id as budget_period_id,
       p.user_id,
       p.starting_balance,
       coalesce(g.income,   0) as income,
       coalesce(g.bills,    0) as bills,
       coalesce(g.expenses, 0) as expenses,
       coalesce(g.savings,  0) as savings,
       coalesce(g.debt,     0) as debt,
       p.starting_balance
         + coalesce(g.income, 0)
         - coalesce(g.bills, 0)     - coalesce(g.expenses, 0)
         - coalesce(g.savings, 0)   - coalesce(g.debt, 0)   as left_to_spend,
       greatest(least(p.end_date - p.start_date + 1,
                      p.end_date - current_date + 1), 0)    as days_left
from budget_periods p
left join lateral (
  select
    sum(actual) filter (where category_type = 'INCOME')   as income,
    sum(actual) filter (where category_type = 'BILLS')    as bills,
    sum(actual) filter (where category_type = 'EXPENSES') as expenses,
    sum(actual) filter (where category_type = 'SAVINGS')  as savings,
    sum(actual) filter (where category_type = 'DEBT')     as debt
  from v_budget_group_totals gt where gt.budget_period_id = p.id
) g on true;

-- 5  goal progress
create or replace view v_goal_progress as
select fg.id as goal_id,
       fg.user_id,
       fg.goal_type,
       fg.name,
       fg.target_amount,
       fg.starting_amount,
       coalesce(fg.starting_amount, 0)
         + coalesce(fg.current_progress, 0)              as accumulated,
       fg.target_amount
         - coalesce(fg.starting_amount, 0)
         - coalesce(fg.current_progress, 0)              as remaining,
       (fg.target_amount
          - coalesce(fg.starting_amount, 0)
          - coalesce(fg.current_progress, 0)) <= 0       as achieved
from financial_goals fg;
```

### Deliberate departures from the spreadsheet

| Spreadsheet | FOLO | Why |
|---|---|---|
| Only expense actuals derived | All five groups derived | §3 — the workbook can contradict itself |
| Fixed 12/29 category slots | Unbounded rows | Arbitrary ceiling |
| Fixed 10 savings + 10 debt goals | Unbounded | Same |
| Two separate logs | One `transactions` table | A savings contribution should move the goal |
| `"LEFT TO BUDGET"` a cell toggle | Segmented control on the hero | Same two values, `E17` / `G17` |
| Duplicate the tab | New period + `INSERT … SELECT` items | |
| Blank instead of `0` | Render `0`; blank only when no budget line exists | Blank reads as "missing", not "nothing spent" |

### Worth keeping

- Savings and debt as **outflows** in the cash-flow identity (§4.3)
- **Inclusive** period bounds
- `Left <= 0` ⇒ achieved, overshoot included (§5)
- Days-left clamped to `[0, period length]` (§4.5)
- The **dependent** sub-category dropdown (§5)

---

## 8. Test vectors

From `design/DESIGN.md` §8 — September 2026, opening balance `500.00`.

| Rule | Input | Expected |
|---|---|---|
| §4.1 expense actual | Food txns in period | `1,410.00` |
| §4.1 date bound | txn on `end_date` | **included** |
| §4.2 left | Food `1,200 − 1,410` | `−210.00` (over) |
| §4.3 budgeted left | `500 + 9,500 − 8,200` | `1,800.00` |
| §4.3 actual left | `500 + 9,200 − 8,385` | `1,315.00` |
| §4.5 days left | 15 Sep, period ends 30 Sep | `16` |
| §4.5 clamp | period ended last month | `0` |
| §4.6 share | Rent `1,800 / 5,935` | `30.3%` |
| §5 achieved | School Fees `6,000 − 0 − 6,000 = 0` | `true` |
| §5 overshoot | saved `6,500` of `6,000` | `true` |
| §5 roll-up | 2 of 5 goals complete | `"2 / 5"` |
