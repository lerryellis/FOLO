'use client';

import { useState, useMemo } from 'react';
import { ReceiptText, Receipt } from 'lucide-react';
import type { Transaction, CurrencyCode, CategoryType } from '@/lib/folo-data';
import { formatMoney } from '@/lib/folo-data';
import { ReceiptScanner } from './ReceiptScanner';
import { saveTransaction } from '@/lib/transaction-operations';

/**
 * HOC/Wrapper for ActivityScreen that adds receipt scanning capability
 * Wraps the existing ActivityScreen component with receipt scanner modal
 */

interface ActivityScreenWithReceiptProps {
  currency: CurrencyCode;
  transactions: Transaction[];
  isBudgeted: boolean;
  period: Date;
  userId?: string;
  onReturnToSample: () => void;
  onTransactionAdded?: (transaction: Transaction) => void;
  ActivityScreenComponent: React.ComponentType<any>;
}

export function ActivityScreenWithReceipt({
  currency,
  transactions,
  isBudgeted,
  period,
  userId,
  onReturnToSample,
  onTransactionAdded,
  ActivityScreenComponent,
}: ActivityScreenWithReceiptProps) {
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);
  const [processingReceipt, setProcessingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  const handleReceiptConfirm = async (data: {
    amount: number; // in minor units
    category: string;
    categoryType: 'EXPENSES' | 'BILLS';
    date: string;
    note: string;
  }) => {
    if (!userId) {
      setReceiptError('User ID not available');
      return;
    }

    try {
      setProcessingReceipt(true);
      setReceiptError(null);

      // Receipts are always expenses/bills (negative amounts)
      const newTransaction: Transaction = {
        id: `temp-${Date.now()}`, // Will be replaced by server
        name: data.note,
        category: data.category,
        categoryType: data.categoryType,
        amountMinor: -data.amount, // Always negative for receipts
        date: data.date,
        note: data.note,
      };

      // Save to database
      const saved = await saveTransaction(userId, newTransaction);

      // Close scanner
      setShowReceiptScanner(false);

      // Call callback if provided
      if (onTransactionAdded) {
        onTransactionAdded(saved);
      }
    } catch (err) {
      setReceiptError(err instanceof Error ? err.message : 'Failed to save transaction');
    } finally {
      setProcessingReceipt(false);
    }
  };

  return (
    <>
      {/* Render the ActivityScreen component with receipt button */}
      <ActivityScreenComponent
        currency={currency}
        transactions={transactions}
        isBudgeted={isBudgeted}
        period={period}
        onReturnToSample={onReturnToSample}
        receiptScannerButton={
          <button
            onClick={() => setShowReceiptScanner(true)}
            disabled={processingReceipt}
            className="ml-auto flex items-center gap-2 min-h-11 px-4 rounded-full bg-[#10B981] font-semibold text-white transition-colors hover:bg-[#059669] disabled:opacity-50"
            title="Scan a receipt to automatically add expenses"
          >
            <Receipt className="h-4 w-4" />
            <span>Scan Receipt</span>
          </button>
        }
      />

      {/* Receipt Scanner Modal */}
      <ReceiptScanner
        isOpen={showReceiptScanner}
        onClose={() => {
          setShowReceiptScanner(false);
          setReceiptError(null);
        }}
        onConfirm={handleReceiptConfirm}
        currency={currency}
      />

      {/* Error notification */}
      {receiptError && (
        <div className="fixed bottom-4 right-4 max-w-sm rounded-lg bg-red-50 border border-red-200 p-4 shadow-lg z-40">
          <p className="text-sm font-semibold text-red-700">Error</p>
          <p className="text-sm text-red-600 mt-1">{receiptError}</p>
          <button
            onClick={() => setReceiptError(null)}
            className="mt-3 text-xs font-medium text-red-700 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}

/**
 * Creates a wrapped ActivityScreen with receipt scanning
 * Usage: const WrappedActivityScreen = createActivityScreenWithReceipt(ActivityScreen);
 */
export function createActivityScreenWithReceipt(ActivityScreenComponent: React.ComponentType<any>) {
  return function WrappedActivityScreen(props: Omit<ActivityScreenWithReceiptProps, 'ActivityScreenComponent'>) {
    return <ActivityScreenWithReceipt {...props} ActivityScreenComponent={ActivityScreenComponent} />;
  };
}
