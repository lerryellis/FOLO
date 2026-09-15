# Monthly Savings Celebration Feature

## Overview

Celebrate your monthly financial achievements! On the 1st of each month, FOLO will:
- Automatically calculate last month's savings (income - expenses)
- Show a beautiful celebration modal with confetti animation
- Record the achievement in the database
- Display your savings history and trends

## How It Works

### Automatic Recording (1st of Month)

When the user opens the app on the 1st of the month:
1. System checks if previous month's achievement is already recorded
2. If not, it calculates: `savings = income - (bills + expenses)`
3. Records the achievement in `monthly_achievements` table
4. Shows celebration modal with the results
5. Displays motivational messages based on savings amount

### Data Structure

```typescript
interface MonthlyAchievement {
  id: string;
  month: string;           // YYYY-MM-01 format
  incomeMinor: number;     // In minor units (cents)
  expensesMinor: number;   // Bills + Expenses in minor units
  savingsMinor: number;    // Income - Expenses
  isConfirmed: boolean;
  createdAt: string;
}
```

## Features

### 1. **MonthlySavingsCelebration Component**
Beautiful modal that shows:
- Month label (e.g., "September 2026")
- Income breakdown
- Expenses breakdown
- Total savings amount (highlighted)
- Savings rate (savings % of income)
- Motivational message
- Confetti animation for positive savings

**File:** `components/dashboard/MonthlySavingsCelebration.tsx`

### 2. **AchievementHistory Component**
Displays past savings records showing:
- Total savings across all months
- Number of positive saving months
- Average monthly savings
- Individual month cards with:
  - Month label
  - Income & expense breakdown
  - Savings amount with trend indicator
  - Savings percentage

**File:** `components/dashboard/AchievementHistory.tsx`

### 3. **Monthly Achievements Operations**
Utility functions for managing achievements:
- `recordMonthlyAchievement()` - Save achievement to database
- `getPreviousMonthAchievement()` - Check if prev month recorded
- `getAchievementHistory()` - Fetch past months (default: 12)
- `getMonthLabel()` - Format month for display
- `calculateSavingsRate()` - Calculate savings percentage
- `isFirstOfMonth()` - Check if today is 1st
- `getPreviousMonthFirstDay()` - Get previous month's date

**File:** `lib/monthly-achievements.ts`

## Integration Steps

### Step 1: Add to Dashboard Page

In `app/(dashboard)/dashboard/page.tsx`, add imports:

```typescript
import { MonthlySavingsCelebration } from '@/components/dashboard/MonthlySavingsCelebration';
import { AchievementHistory } from '@/components/dashboard/AchievementHistory';
import { 
  isFirstOfMonth, 
  getPreviousMonthFirstDay, 
  getMonthLabel,
  recordMonthlyAchievement,
  getPreviousMonthAchievement,
  getAchievementHistory,
} from '@/lib/monthly-achievements';
```

### Step 2: Add Component State

In the Dashboard component:

```typescript
const [showCelebration, setShowCelebration] = useState(false);
const [achievements, setAchievements] = useState<any[]>([]);
const [previousAchievement, setPreviousAchievement] = useState<any>(null);
```

### Step 3: Add Effect Logic

In the main useEffect (where data is loaded):

```typescript
// Check if today is 1st of month and record previous month's savings
if (isFirstOfMonth() && user && spreadsheetSummary) {
  const checkAndRecordAchievement = async () => {
    const prevMonthDate = getPreviousMonthFirstDay();
    const existing = await getPreviousMonthAchievement(user.id);
    
    if (!existing) {
      const totalExpenses = 
        (spreadsheetSummary.actualByGroupMinor.BILLS || 0) + 
        (spreadsheetSummary.actualByGroupMinor.EXPENSES || 0);
      
      await recordMonthlyAchievement(
        user.id,
        prevMonthDate,
        spreadsheetSummary.actualByGroupMinor.INCOME || 0,
        totalExpenses
      );
      
      const achievement = await getPreviousMonthAchievement(user.id);
      setPreviousAchievement(achievement);
      setShowCelebration(true);
    }
    
    // Load achievement history
    const history = await getAchievementHistory(user.id);
    setAchievements(history);
  };
  
  checkAndRecordAchievement();
}
```

### Step 4: Add Modal JSX

In the Dashboard return JSX (before tab content):

```typescript
{previousAchievement && (
  <MonthlySavingsCelebration
    isOpen={showCelebration}
    onClose={() => setShowCelebration(false)}
    monthLabel={getMonthLabel(previousAchievement.month)}
    savingsMinor={previousAchievement.savingsMinor}
    incomeMinor={previousAchievement.incomeMinor}
    expensesMinor={previousAchievement.expensesMinor}
    currency={currency}
  />
)}
```

### Step 5: Add Achievement History to Home Screen

In the `HomeScreen` component (before closing `</section>`):

```typescript
{achievements.length > 0 && (
  <AchievementHistory achievements={achievements} currency={currency} />
)}
```

## Behavior

### On 1st of Month (First Visit)

```
User opens app on Sept 1st
    ↓
System checks: Is Sept 1st? ✓
System checks: Previous month (Aug) recorded? No
    ↓
Calculate August's savings:
- Income: ₵9,200
- Expenses: (Bills ₵3,060 + Expenses ₵2,845) = ₵5,905
- Savings: ₵9,200 - ₵5,905 = ₵3,295
    ↓
Record in database ✓
Show celebration modal 🎉
    ↓
Confetti animation ✨
Display stats with motivational message
User clicks "Continue"
    ↓
Modal closes, user sees achievement history
```

### Savings Rate Examples

- **Savings ₵3,295 from ₵9,200 income** = 36% savings rate ✨
- **Savings ₵1,500 from ₵8,000 income** = 19% savings rate 👍
- **Savings ₵-500 (deficit)** = Shows loss message 📉

## Database Schema

### `monthly_achievements` Table

```sql
- id (UUID, PK)
- user_id (UUID, FK -> user_profiles)
- month (DATE) -- First day of month
- income_amount (DECIMAL)
- expenses_amount (DECIMAL)
- savings_amount (DECIMAL) -- Calculated field
- is_confirmed (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- UNIQUE(user_id, month)
```

### Indexes

- `idx_achievements_user_month` - For quick lookups by user and month

## Testing

### Manual Testing

1. **Test on 1st of Month:**
   - Set system date to 1st of month
   - Login to app
   - Should see celebration modal
   - Check database for recorded achievement

2. **Test Achievement History:**
   - Create test data for multiple months
   - Check that all months display correctly
   - Verify calculations are accurate

3. **Test Edge Cases:**
   - Negative savings (expenses > income)
   - Zero income
   - Zero expenses
   - Multiple visits on same day (shouldn't re-record)

### Sample Test Data

```
September 2026 (Previous Month)
- Income: ₵9,200
- Bills: ₵3,060
- Expenses: ₵2,845
- Savings: ₵3,295 (36%)

August 2026
- Income: ₵8,500
- Bills: ₵2,800
- Expenses: ₵2,200
- Savings: ₵3,500 (41%)

July 2026
- Income: ₵7,800
- Bills: ₵3,200
- Expenses: ₵3,100
- Savings: ₵1,500 (19%)
```

## Future Enhancements

1. **Email Notification** - Send monthly summary to user
2. **Goal Progress Update** - Auto-add savings to savings goals
3. **Comparison Chart** - Show month-over-month trends
4. **Budget Recommendations** - Suggest areas to reduce expenses
5. **Savings Streak** - Track consecutive positive months
6. **Export Report** - Download monthly savings summary

## Notes

- Achievements are recorded only once per month
- Calculation uses actual transactions, not budgeted amounts
- Confetti animation only shows for positive savings
- Mobile-responsive design
- Works in all timezones (uses user's local date)
