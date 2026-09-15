/**
 * Receipt OCR Processing
 * Uses Tesseract.js (client-side, free) with smart heuristics for data extraction
 */

// Lazy load Tesseract to avoid bundle bloat
let Tesseract: any = null;

async function getTesseract() {
  if (!Tesseract) {
    Tesseract = (await import('tesseract.js')).default;
  }
  return Tesseract;
}

export interface ExtractedReceiptData {
  amount: number; // in decimal (e.g., 25.50)
  merchantName: string;
  date: string; // ISO date format
  category?: string; // Guessed category from receipt content
  description?: string;
  items?: {
    name: string;
    amount: number;
  }[];
  confidence: 'high' | 'medium' | 'low';
  rawText: string; // Raw OCR text for reference
}

/**
 * Extract amount from text using regex patterns
 * Looks for currency symbols and numbers
 */
function extractAmount(text: string): number | null {
  // Common currency patterns: GHS, ₵, $, €, etc.
  const patterns = [
    /[\$€₵]\s*(\d+(?:[.,]\d{2})?)/gi, // Currency symbol prefix
    /(\d+(?:[.,]\d{2})?)\s*(?:GHS|cedis|₵)/gi, // Currency suffix
    /total[:\s]+[\$€₵]?\s*(\d+(?:[.,]\d{2})?)/gi, // After "total" keyword
    /amount[:\s]+[\$€₵]?\s*(\d+(?:[.,]\d{2})?)/gi, // After "amount" keyword
  ];

  let maxAmount = 0;
  let foundAmount: number | null = null;

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const numStr = match[1].replace(',', '.');
      const amount = parseFloat(numStr);

      // Look for the largest reasonable amount (likely total)
      if (amount > 0 && amount < 100000 && amount > maxAmount) {
        maxAmount = amount;
        foundAmount = amount;
      }
    }
  }

  return foundAmount;
}

/**
 * Extract date from text using various date patterns
 */
function extractDate(text: string): string {
  const today = new Date().toISOString().split('T')[0];

  // Date patterns: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, etc.
  const patterns = [
    /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
    /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY or MM/DD/YYYY
    /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
    /(\w+)\s+(\d{1,2})[,\s]+(\d{4})/, // "September 15, 2026"
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        // Try to parse and return ISO date
        let date: Date;

        if (pattern.source.includes('YYYY-MM-DD')) {
          date = new Date(`${match[1]}-${match[2]}-${match[3]}`);
        } else if (pattern.source.includes('DD/MM/YYYY')) {
          // Try DD/MM/YYYY first
          const day = parseInt(match[1]);
          const month = parseInt(match[2]);
          const year = parseInt(match[3]);
          date = new Date(year, month - 1, day);
        } else if (pattern.source.includes('word')) {
          // Month name format
          date = new Date(`${match[1]} ${match[2]}, ${match[3]}`);
        } else {
          continue;
        }

        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch (e) {
        continue;
      }
    }
  }

  return today;
}

/**
 * Guess merchant name from receipt text
 */
function extractMerchant(text: string): string {
  const lines = text.split('\n').filter(l => l.trim().length > 0);

  // Usually first few non-empty lines contain merchant info
  // Avoid lines that are clearly amounts or dates
  const amountPattern = /[\$€₵]|total|amount|paid/i;

  for (const line of lines.slice(0, 5)) {
    const cleaned = line.trim();
    if (cleaned.length > 2 && !amountPattern.test(cleaned) && cleaned.length < 50) {
      return cleaned;
    }
  }

  return 'Receipt';
}

/**
 * Guess category from receipt text
 */
function guessCategory(text: string): string {
  const textLower = text.toLowerCase();

  const categories = {
    Food: ['food', 'restaurant', 'cafe', 'grocery', 'market', 'mcdonald', 'pizza', 'burger', 'sandwich', 'drink'],
    Transport: ['fuel', 'gas', 'petrol', 'taxi', 'uber', 'parking', 'bus', 'transport', 'diesel'],
    Health: ['pharmacy', 'health', 'doctor', 'clinic', 'hospital', 'medicine', 'drug'],
    Entertainment: ['cinema', 'movie', 'bar', 'club', 'game', 'theatre', 'entertainment', 'ticket'],
    Shopping: ['shop', 'store', 'mall', 'retail', 'market', 'walmart', 'amazon'],
    Utilities: ['electric', 'water', 'internet', 'phone', 'utility', 'enel', 'vivo', 'claro'],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    for (const keyword of keywords) {
      if (textLower.includes(keyword)) {
        return category;
      }
    }
  }

  return 'Other';
}

/**
 * Process receipt image using Tesseract.js OCR
 */
export async function processReceiptImage(imageBase64: string): Promise<ExtractedReceiptData> {
  try {
    const Tess = await getTesseract();

    // Run OCR
    const result = await Tess.recognize(
      `data:image/jpeg;base64,${imageBase64}`,
      'eng',
      {
        logger: (m: any) => console.log('OCR Progress:', Math.round(m.progress * 100) + '%'),
      }
    );

    const rawText = result.data.text;

    if (!rawText || rawText.trim().length === 0) {
      throw new Error('Could not read text from receipt image');
    }

    // Extract data using heuristics
    const amount = extractAmount(rawText);
    const merchantName = extractMerchant(rawText);
    const date = extractDate(rawText);
    const category = guessCategory(rawText);

    if (!amount) {
      throw new Error('Could not find amount/total on receipt');
    }

    // Assess confidence based on text quality
    const textLength = rawText.trim().length;
    const confidence: 'high' | 'medium' | 'low' =
      textLength > 100 ? 'high' :
      textLength > 50 ? 'medium' :
      'low';

    const extracted: ExtractedReceiptData = {
      amount,
      merchantName,
      date,
      category,
      description: `${merchantName} - ${category}`,
      confidence,
      rawText,
      items: undefined, // Tesseract doesn't parse item lines well
    };

    return extracted;
  } catch (error) {
    console.error('Error processing receipt:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to process receipt image'
    );
  }
}

/**
 * Guess category type (EXPENSES, BILLS, INCOME) from merchant
 * More sophisticated category guessing can be added here
 */
export function guessCategoryType(merchantName: string, category?: string): 'EXPENSES' | 'BILLS' {
  const billKeywords = [
    'electric', 'water', 'gas', 'power', 'utility', 'internet', 'phone', 'mobile',
    'verizon', 'at&t', 'comcast', 'enel', 'eddl', 'aqua', 'rent',
  ];

  const combined = `${merchantName} ${category || ''}`.toLowerCase();

  if (billKeywords.some(keyword => combined.includes(keyword))) {
    return 'BILLS';
  }

  return 'EXPENSES';
}

/**
 * Convert data URI to base64 string
 */
export function dataUriToBase64(dataUri: string): string {
  if (dataUri.startsWith('data:')) {
    return dataUri.split(',')[1];
  }
  return dataUri;
}
