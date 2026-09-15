# Budget Management Implementation

## ✅ Completed: Database Layer

### Tables & Views Created
1. **categories** - Standard budget groups (INCOME, BILLS, EXPENSES, SAVINGS, DEBT)
2. **budget_items** - User editable budget amounts per period per category
3. **v_budget_item_actuals** - Actual spending with remaining calculations
4. **v_budget_group_totals** - Group-level budget vs actual with variance
5. **v_period_summary** - Headline numbers for dashboard hero card

### TypeScript API (budget-operations.ts)
```typescript
- getOrCreateBudgetItem()      // Auto-create or fetch
- getBudgetItems()              // Load all budgets for period
- updateBudgetAmount()          // User edits budget
- getBudgetGroupTotals()        // Aggregate view
- getPeriodSummary()            // Dashboard calculations
- copyBudgetsFromPreviousPeriod() // When creating new month
```

### UI Component (BudgetEditSheet.tsx)
- Modal form for editing 5 category budgets
- Currency-aware inputs
- Validation and total display
- Ready to integrate

---

## 🔧 Next Steps: Integration (TODO)

### 1. Update BudgetScreen (`app/(dashboard)/dashboard/page.tsx`)

Add imports:
```typescript
import { BudgetEditSheet } from '@/components/dashboard/BudgetEditSheet';
import {
  getOrCreateBudgetItem,
  updateBudgetAmount,
  getBudgetGroupTotals,
  getPeriodSummary,
  copyBudgetsFromPreviousPeriod,
} from '@/lib/budget-operations';
```

Add state:
```typescript
const [showBudgetEdit, setShowBudgetEdit] = useState(false);
const [budgetTotals, setBudgetTotals] = useState<Record<string, number>>({});
```

In BudgetScreen, after period loads:
```typescript
// Load budgets for this period
const budgets = await getBudgetGroupTotals(user.id, budgetPeriodId);
// Convert to totals map
```

Add "Edit Budgets" button in Budget section header.

### 2. Implement Save Handler

```typescript
async function handleSaveBudgets(budgets: Record<string, number>) {
  // For each category, update or create budget_item
  for (const [category, amount] of Object.entries(budgets)) {
    await getOrCreateBudgetItem(user.id, budgetPeriodId, category, amount);
  }
  // Reload budgets from DB
  const updated = await getBudgetGroupTotals(user.id, budgetPeriodId);
  setBudgetTotals(updated);
}
```

### 3. Use Database Values Instead of BUDGET_GROUPS

Replace the hardcoded loop in BudgetScreen with:
```typescript
{budgetGroupTotals.map((group) => {
  const actualMinor = group.actual * 100;
  const budgetMinor = group.budgeted * 100;
  // ... render with actual DB values
})}
```

### 4. Update OverviewScreen

Load period summary for hero card:
```typescript
const summary = await getPeriodSummary(user.id, budgetPeriodId);
// Use summary.income_budget, summary.expenses_budget, etc.
```

### 5. Handle New Periods

When creating a new budget period, copy budgets:
```typescript
await copyBudgetsFromPreviousPeriod(user.id, newPeriodId, previousPeriodId);
```

---

## 📊 Data Flow

```
User edits budgets
      ↓
BudgetEditSheet.onSave()
      ↓
handleSaveBudgets(budgets)
      ↓
updateBudgetAmount() for each category
      ↓
Database budget_items updated
      ↓
Views recalculate (v_budget_group_totals, v_period_summary)
      ↓
Dashboard reloads and displays updated values
```

---

## 🗄️ SQL Migration

Already created: `/web/supabase/migrations/add_budget_items.sql`

To apply locally:
```bash
supabase db push
```

To apply to production:
```bash
supabase db deploy
```

---

## 🎯 Benefits Over Hardcoded BUDGET_GROUPS

✅ User-customizable per month
✅ Persisted in database
✅ Copied to new periods automatically
✅ View-based calculations (always accurate)
✅ Matches your spreadsheet spec (§7)
✅ Foundation for future features (recurring budgets, budget alerts, etc.)

---

## Testing

Test vectors from SPREADSHEET_LOGIC.md §8:
- Budget amount ₵1,200, actual ₵1,410 → remaining -₵210 (over)
- Days left clamped to [0, period length]
- Budgets copy when duplicating period

