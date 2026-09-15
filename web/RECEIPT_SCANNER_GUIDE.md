# Receipt Scanner Feature Guide

## Overview

The Receipt Scanner automatically extracts expense data from receipt images using **Tesseract.js** (free, open-source OCR). This allows users to quickly add transactions by scanning a receipt instead of manually entering all details.

**Key advantage:** No API keys required - everything runs client-side in the browser!

## How It Works

### 1. **User Initiates Scan**
- Click the "Scan Receipt" button in the Activity screen
- Choose to take a photo with camera or upload an image

### 2. **OCR Processing**
- Tesseract.js analyzes the receipt image (runs in browser)
- Extracts:
  - **Total amount** (uses regex patterns for currency detection)
  - **Merchant name** (from receipt header lines)
  - **Transaction date** (parses various date formats)
  - **Likely category** (guessed from keywords: Food, Transport, Health, etc.)
  - **Confidence level** (based on text quality)

### 3. **Confirmation & Review**
- User sees extracted values in an editable form
- Can modify any field before confirming
- Sees confidence level (high/medium/low)
- Preview of receipt image is shown

### 4. **Transaction Creation**
- Confirmed data is saved as a new transaction
- Category type is automatically determined:
  - **BILLS**: Utilities, internet, phone, rent
  - **EXPENSES**: Food, shopping, entertainment, etc.
- Transaction appears immediately in Activity list

## Components

### `lib/receipt-processor.ts`
**Purpose**: Handles OCR processing with Tesseract.js (client-side)

**Key Functions**:
- `processReceiptImage(imageBase64)` - Runs OCR in browser using Tesseract.js
  - Input: Base64-encoded image
  - Output: ExtractedReceiptData object
  - All processing happens client-side (no API calls!)

- `extractAmount(text)` - Smart regex patterns to find total amount
  - Looks for currency symbols (₵, $, €, GHS, cedis)
  - Finds largest reasonable amount (likely total)
  - Avoids subtotals and tax lines

- `extractDate(text)` - Parses various date formats
  - Supports: DD/MM/YYYY, YYYY-MM-DD, "September 15, 2026", etc.
  - Defaults to today if date not found

- `extractMerchant(text)` - Gets store/restaurant name
  - Looks at first few non-amount lines
  - Returns merchant name or "Receipt" if unclear

- `guessCategory(text)` - Suggests expense category
  - Searches for keywords: food, restaurant, fuel, pharmacy, etc.
  - Maps to: Food, Transport, Health, Entertainment, Shopping, Utilities, Other

- `guessCategoryType(merchantName, category)` - Determines if transaction is BILLS or EXPENSES
  - Checks for utility keywords (electric, water, internet, etc.)
  - Defaults to EXPENSES for other merchants

**Return Data Structure**:
```typescript
{
  amount: number;              // Decimal (25.50)
  merchantName: string;        // "McDonald's"
  date: string;               // "2026-09-15"
  category?: string;          // "Food"
  description?: string;       // Receipt description
  items?: [                   // Line items
    { name: string, amount: number }
  ];
  confidence: "high" | "medium" | "low";
  rawText: string;           // Full OCR text
}
```

### `components/dashboard/ReceiptScanner.tsx`
**Purpose**: UI component for capture and confirmation

**States**:
1. **Capture** - Camera/upload buttons
2. **Processing** - Loading spinner while Claude analyzes
3. **Confirm** - Review and edit extracted values

**Features**:
- Camera capture (mobile)
- File upload (desktop/mobile)
- Live preview of receipt image
- Editable fields with validation
- Confidence indicator
- Item list display (if extracted)

### `components/dashboard/ActivityScreenWithReceipt.tsx`
**Purpose**: Wrapper that adds receipt scanning to ActivityScreen

**Integration Points**:
- "Scan Receipt" button in activity header
- Error notifications
- Transaction persistence on confirmation

## Usage

### For Users
1. Navigate to Activity screen
2. Click "Scan Receipt" button (📸 icon)
3. Take photo or upload receipt image
4. Review extracted values (edit if needed)
5. Confirm and save

### For Developers

**Install dependencies**:
```bash
npm install @anthropic-ai/sdk
```

**Set API key**:
```bash
export ANTHROPIC_API_KEY=your-api-key
```

**Basic usage**:
```typescript
import { processReceiptImage } from '@/lib/receipt-processor';

const base64Image = dataUriToBase64(imageDataUri);
const extracted = await processReceiptImage(base64Image);

console.log(`Amount: ₵${extracted.amount}`);
console.log(`Store: ${extracted.merchantName}`);
```

**Integrate into a component**:
```typescript
import { ReceiptScanner } from '@/components/dashboard/ReceiptScanner';

export function MyComponent() {
  const [showScanner, setShowScanner] = useState(false);

  return (
    <>
      <button onClick={() => setShowScanner(true)}>Scan Receipt</button>
      <ReceiptScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onConfirm={(data) => {
          console.log('Confirmed transaction:', data);
          // Save transaction
        }}
        currency="GHS"
      />
    </>
  );
}
```

## Confidence Levels

- **High** ✅ - Receipt text is clear and all values confidently extracted
- **Medium** ⚠️ - Some values extracted but may need verification
- **Low** ⚠️ - Partial information extracted, review carefully

Always review extracted values regardless of confidence level.

## Supported Categories

Categories are automatically suggested based on merchant name:

| Category | Triggers |
|----------|----------|
| **Food** | Restaurant, café, grocery, market |
| **Transport** | Gas station, taxi, parking, bus |
| **Health** | Pharmacy, clinic, hospital |
| **Utilities** | Electric, water, internet, phone |
| **Shopping** | Retail, store, mall |
| **Entertainment** | Cinema, bar, club, games |
| **Other** | Default for unknown merchants |

## Technical Details

### Vision API Integration
- Uses Claude 3.5 Sonnet model for image analysis
- Sends image as base64 in vision API request
- Receives structured JSON response
- Validates extracted data before returning

### Error Handling
- Invalid image format → "Failed to read file"
- Unreadable receipt → "Could not identify..." errors
- Network errors → Proper error messages with retry
- Missing required fields → Validation errors

### Data Flow
```
Image File
    ↓
[FileReader] → Data URI
    ↓
[dataUriToBase64] → Base64 string
    ↓
[Claude Vision] → ExtractedReceiptData
    ↓
[User confirms] → Transaction saved
    ↓
[Database] → Added to Activity
```

## Future Enhancements

Potential improvements:
1. **Batch receipts** - Process multiple receipts at once
2. **Receipt storage** - Store receipt images for records
3. **Recurring transactions** - Learn patterns from receipts
4. **Expense categorization** - Machine learning to improve category guessing
5. **Split bills** - Divide expenses between multiple people
6. **Offline processing** - Local OCR as fallback
7. **Receipt tagging** - Add tags/notes for better organization

## Troubleshooting

### "Failed to process receipt"
- Ensure receipt is clearly visible
- Lighting should be good
- Try tilting to reduce glare
- Ensure all text is readable

### Incorrect amount extraction
- Make sure total is visible
- Avoid including tips or subtotals
- Check currency symbol matches (₵ for GHS)
- Manually enter correct amount in review step

### Missing merchant name
- Verify receipt header is visible
- Some digital receipts may lack clear merchant info
- Manually enter merchant name in review step

### Wrong category
- Edit category before confirming
- Merchant-based guessing isn't perfect
- Receipts from unknown stores default to EXPENSES

## Requirements

- **NO API Keys Needed!** Everything runs in the browser
- Image file size < 5MB recommended
- Supported formats: JPEG, PNG, GIF, WEBP
- Tesseract.js downloads language models on first use (~30MB)
  - Downloaded to browser cache
  - Subsequent scans are much faster

## Security & Privacy

- Receipt images are processed server-side (with Anthropic)
- Images are not stored locally after extraction
- Only extracted data is saved to database
- User data remains encrypted per standard practices
