/**
 * Receipt OCR Processing
 * Uses Claude Vision API to extract expense data from receipt images
 */

import Anthropic from '@anthropic-ai/sdk';

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

export async function processReceiptImage(imageBase64: string): Promise<ExtractedReceiptData> {
  const client = new Anthropic();

  const prompt = `You are a receipt OCR processor. Extract the following information from this receipt image:

1. Total amount (find the final total, not subtotals)
2. Merchant/Store name
3. Transaction date
4. Best guess for expense category based on merchant (e.g., "Food", "Transport", "Health", "Retail")
5. List any individual items if visible
6. Confidence level (high/medium/low) based on receipt clarity

Format your response as JSON with this structure:
{
  "amount": <number>,
  "merchantName": "<string>",
  "date": "<YYYY-MM-DD>",
  "category": "<string>",
  "description": "<string describing the transaction>",
  "items": [
    { "name": "<item name>", "amount": <number> }
  ],
  "confidence": "high|medium|low",
  "rawText": "<full OCR text of receipt>"
}

Important rules:
- Amount should be the TOTAL (final amount charged), not subtotals
- Extract only the date from the receipt (not current date)
- Category should be one of: Food, Transport, Health, Entertainment, Shopping, Utilities, Other
- If date is not visible, use today's date: ${new Date().toISOString().split('T')[0]}
- Be conservative with confidence: only "high" if text is very clear
- rawText should include everything visible on the receipt`;

  try {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    // Extract JSON from response
    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

    // Try to parse JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from Claude response');
    }

    const extracted = JSON.parse(jsonMatch[0]) as ExtractedReceiptData;

    // Validate extracted data
    if (!extracted.amount || extracted.amount <= 0) {
      throw new Error('Invalid amount extracted from receipt');
    }

    if (!extracted.merchantName) {
      throw new Error('Could not identify merchant name');
    }

    if (!extracted.date) {
      throw new Error('Could not extract date from receipt');
    }

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
