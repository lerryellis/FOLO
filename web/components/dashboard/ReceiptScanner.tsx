'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader } from 'lucide-react';
import { processReceiptImage, guessCategoryType, dataUriToBase64, type ExtractedReceiptData } from '@/lib/receipt-processor';
import type { CurrencyCode } from '@/lib/folo-data';
import { formatMoney } from '@/lib/folo-data';

interface ReceiptScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    amount: number; // in minor units
    category: string;
    categoryType: 'EXPENSES' | 'BILLS';
    date: string;
    note: string;
  }) => void;
  currency: CurrencyCode;
}

export function ReceiptScanner({ isOpen, onClose, onConfirm, currency }: ReceiptScannerProps) {
  const [step, setStep] = useState<'capture' | 'processing' | 'confirm'>('capture');
  const [image, setImage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state for editing extracted values
  const [editedAmount, setEditedAmount] = useState('');
  const [editedMerchant, setEditedMerchant] = useState('');
  const [editedDate, setEditedDate] = useState('');
  const [editedCategory, setEditedCategory] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageCapture = async (file: File) => {
    try {
      setError(null);
      setLoading(true);

      // Read file as data URL
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        setImage(dataUrl);

        // Process with Claude Vision
        setStep('processing');
        const base64 = dataUriToBase64(dataUrl);

        try {
          const data = await processReceiptImage(base64);
          setExtractedData(data);
          setEditedAmount(data.amount.toFixed(2));
          setEditedMerchant(data.merchantName);
          setEditedDate(data.date);
          setEditedCategory(data.category || 'Food');
          setStep('confirm');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to process receipt');
          setStep('capture');
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageCapture(file);
    }
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageCapture(file);
    }
  };

  const handleConfirm = () => {
    if (!extractedData) return;

    const amount = parseFloat(editedAmount) || extractedData.amount;
    const categoryType = guessCategoryType(editedMerchant, editedCategory);

    onConfirm({
      amount: Math.round(amount * 100), // Convert to minor units
      category: editedCategory,
      categoryType,
      date: editedDate,
      note: editedMerchant,
    });

    handleClose();
  };

  const handleClose = () => {
    setStep('capture');
    setImage(null);
    setExtractedData(null);
    setError(null);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />

      {/* Modal */}
      <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 overflow-y-auto rounded-2xl border border-[#E8EAED] bg-white p-5 shadow-2xl sm:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#0B0F17]">Scan Receipt</h2>
          <button
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-[#F6F7F9]"
          >
            <X className="h-5 w-5 text-[#64748b]" />
          </button>
        </div>

        {/* Capture Step */}
        {step === 'capture' && (
          <div className="space-y-4">
            <p className="text-sm text-[#64748b]">Take a photo or upload an image of your receipt to extract expense details.</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#E8EAED] bg-[#F6F7F9] p-6 transition-colors hover:border-[#10B981] hover:bg-[#F0FDF9]"
              >
                <Camera className="h-6 w-6 text-[#64748b]" />
                <span className="text-sm font-medium text-[#0B0F17]">Take Photo</span>
                <span className="text-xs text-[#64748b]">Use camera</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[#E8EAED] bg-[#F6F7F9] p-6 transition-colors hover:border-[#10B981] hover:bg-[#F0FDF9]"
              >
                <Upload className="h-6 w-6 text-[#64748b]" />
                <span className="text-sm font-medium text-[#0B0F17]">Upload</span>
                <span className="text-xs text-[#64748b]">From gallery</span>
              </button>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <strong>Error:</strong> {error}
              </div>
            )}

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Processing Step */}
        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            <Loader className="h-8 w-8 animate-spin text-[#10B981]" />
            <p className="text-center text-sm text-[#64748b]">
              Analyzing receipt...
              <br />
              <span className="text-xs">Using AI to extract expense details</span>
            </p>
          </div>
        )}

        {/* Confirm Step */}
        {step === 'confirm' && extractedData && (
          <div className="space-y-5">
            {/* Receipt Preview */}
            {image && (
              <div className="rounded-lg border border-[#E8EAED] overflow-hidden">
                <img src={image} alt="Receipt" className="w-full max-h-64 object-contain" />
              </div>
            )}

            {/* Confidence Badge */}
            <div className={`rounded-lg p-3 text-sm ${
              extractedData.confidence === 'high' ? 'bg-[#F0FDF9] text-[#047857]' :
              extractedData.confidence === 'medium' ? 'bg-[#FFFBEB] text-[#92400e]' :
              'bg-[#FEF2F2] text-[#991b1b]'
            }`}>
              <strong>Confidence:</strong> {extractedData.confidence === 'high' ? '✓ High' : extractedData.confidence === 'medium' ? '⚠ Medium' : '⚠ Low'} - Please review values
            </div>

            {/* Edit Fields */}
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#0B0F17]">Amount *</span>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-lg font-semibold text-[#475569]">₵</span>
                  <input
                    type="number"
                    value={editedAmount}
                    onChange={(e) => setEditedAmount(e.target.value)}
                    step="0.01"
                    min="0"
                    className="min-h-11 w-full rounded-lg border border-[#E8EAED] bg-white pl-8 pr-3 text-sm font-medium text-[#0B0F17] outline-none focus:border-[#10B981]"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#0B0F17]">Merchant *</span>
                <input
                  type="text"
                  value={editedMerchant}
                  onChange={(e) => setEditedMerchant(e.target.value)}
                  className="min-h-11 w-full rounded-lg border border-[#E8EAED] bg-white px-3 text-sm font-medium text-[#0B0F17] outline-none focus:border-[#10B981]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#0B0F17]">Date *</span>
                <input
                  type="date"
                  value={editedDate}
                  onChange={(e) => setEditedDate(e.target.value)}
                  className="min-h-11 w-full rounded-lg border border-[#E8EAED] bg-white px-3 text-sm font-medium text-[#0B0F17] outline-none focus:border-[#10B981]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-[#0B0F17]">Category</span>
                <select
                  value={editedCategory}
                  onChange={(e) => setEditedCategory(e.target.value)}
                  className="min-h-11 w-full rounded-lg border border-[#E8EAED] bg-white px-3 text-sm font-medium text-[#0B0F17] outline-none focus:border-[#10B981]"
                >
                  <option>Food</option>
                  <option>Transport</option>
                  <option>Health</option>
                  <option>Entertainment</option>
                  <option>Shopping</option>
                  <option>Utilities</option>
                  <option>Other</option>
                </select>
              </label>

              {extractedData.items && extractedData.items.length > 0 && (
                <div className="rounded-lg bg-[#F6F7F9] p-3">
                  <p className="text-xs font-semibold text-[#64748b] mb-2">Items detected:</p>
                  <ul className="text-xs text-[#475569] space-y-1">
                    {extractedData.items.map((item, i) => (
                      <li key={i} className="flex justify-between">
                        <span>{item.name}</span>
                        <span>₵{item.amount.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-[#F0FDF9] p-4 border border-[#10B981]">
              <p className="text-xs font-semibold text-[#047857] mb-2">SUMMARY</p>
              <p className="text-2xl font-semibold text-[#0B0F17]">
                ₵{parseFloat(editedAmount || '0').toFixed(2)}
              </p>
              <p className="text-sm text-[#475569] mt-1">{editedMerchant}</p>
              <p className="text-xs text-[#64748b] mt-1">
                {editedCategory} · {new Date(editedDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 min-h-12 rounded-lg border border-[#E8EAED] bg-white font-semibold text-[#0B0F17] transition-colors hover:bg-[#F6F7F9]"
          >
            {step === 'confirm' ? 'Cancel' : 'Close'}
          </button>
          {step === 'confirm' && (
            <button
              onClick={handleConfirm}
              className="flex-1 min-h-12 rounded-lg bg-[#10B981] font-semibold text-white transition-colors hover:bg-[#059669]"
            >
              Add Expense
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
