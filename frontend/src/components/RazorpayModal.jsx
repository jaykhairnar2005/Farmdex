import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Lock,
  RefreshCw,
  ExternalLink,
  Sprout,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  createPaymentOrderApi,
  verifyPaymentApi,
  generateTestPaymentSignatureApi,
} from '../services/api';
import { formatCurrency } from '../utils/formatters';

/**
 * Loads the official Razorpay checkout script dynamically
 */
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RazorpayModal({ isOpen, onClose, order, onSuccess }) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState('INIT'); // 'INIT', 'ORDER_CREATED', 'PROCESSING', 'SUCCESS', 'ERROR'
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedScenario, setSelectedScenario] = useState('SUCCESS'); // 'SUCCESS', 'TAMPERED_SIG', 'GATEWAY_ERROR'
  const [activeStep, setActiveStep] = useState(1);

  // Initialize or reset state when modal opens
  useEffect(() => {
    if (isOpen && order) {
      setStage('INIT');
      setPaymentDetails(null);
      setErrorMessage('');
      setSelectedScenario('SUCCESS');
      setActiveStep(1);
      // Preload script in background
      loadRazorpayScript();
    }
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const item = order.orderItems?.[0];
  const listing = item?.listing;
  const totalAmount = Number(order.totalAmount || 0);

  /**
   * Handle checkout execution based on selected scenario
   */
  const handleExecutePayment = async () => {
    setLoading(true);
    setErrorMessage('');
    setStage('PROCESSING');
    setActiveStep(1);

    try {
      // Step 1: Secure backend order creation
      const orderRes = await createPaymentOrderApi({ orderId: order.id });
      if (!orderRes.success || !orderRes.data) {
        throw new Error(orderRes.message || 'Failed to initialize Razorpay payment order');
      }

      const { razorpayOrderId } = orderRes.data;
      setPaymentDetails(orderRes.data);
      setActiveStep(2);

      // Scenario: Simulate Gateway Decline / Network Error
      if (selectedScenario === 'GATEWAY_ERROR') {
        await new Promise((r) => setTimeout(r, 800));
        throw new Error('Payment declined by simulated bank gateway. Test payment was not authorized.');
      }

      // Step 2: Acquire test payment authorization & signature
      setActiveStep(3);
      await new Promise((r) => setTimeout(r, 600));

      let verificationPayload;

      if (selectedScenario === 'TAMPERED_SIG') {
        // Deliberately forged signature to test server-side cryptographic protection
        verificationPayload = {
          orderId: order.id,
          razorpayOrderId,
          razorpayPaymentId: `pay_test_${Date.now()}_forged`,
          razorpaySignature: 'forged_invalid_signature_88a9e01b4c3d2e',
        };
      } else {
        // Request server-generated HMAC signature for test credentials
        const sigRes = await generateTestPaymentSignatureApi({
          orderId: order.id,
          razorpayOrderId,
        });

        if (!sigRes.success || !sigRes.data) {
          throw new Error('Failed to generate secure test payment signature');
        }

        verificationPayload = {
          orderId: order.id,
          razorpayOrderId: sigRes.data.razorpayOrderId,
          razorpayPaymentId: sigRes.data.razorpayPaymentId,
          razorpaySignature: sigRes.data.razorpaySignature,
        };
      }

      // Step 3: Server-side cryptographic signature verification
      setActiveStep(4);
      const verifyRes = await verifyPaymentApi(verificationPayload);

      if (!verifyRes.success) {
        throw new Error(verifyRes.message || 'Cryptographic signature verification failed');
      }

      setStage('SUCCESS');
      if (onSuccess) {
        onSuccess(verifyRes.data || order);
      }
    } catch (err) {
      setStage('ERROR');
      setErrorMessage(
        err.response?.data?.message || err.message || 'Payment processing failed'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Optional: Attempt opening official Razorpay standard checkout popup
   */
  const handleOpenOfficialRazorpay = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        throw new Error('Official Razorpay SDK failed to load. Use the Test Mode Simulator.');
      }

      const orderRes = await createPaymentOrderApi({ orderId: order.id });
      if (!orderRes.success || !orderRes.data) {
        throw new Error(orderRes.message || 'Failed to create payment order');
      }

      const { razorpayOrderId, amount, currency, keyId } = orderRes.data;

      const options = {
        key: keyId,
        amount,
        currency: currency || 'INR',
        name: 'FarmDex Marketplace',
        description: `Settlement for ${listing?.cropName || 'Farm Produce'}`,
        order_id: razorpayOrderId,
        handler: async function (response) {
          try {
            setLoading(true);
            setStage('PROCESSING');
            // Strict server-side verification
            const verifyRes = await verifyPaymentApi({
              orderId: order.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (verifyRes.success) {
              setStage('SUCCESS');
              if (onSuccess) onSuccess(verifyRes.data || order);
            } else {
              throw new Error(verifyRes.message || 'Verification failed');
            }
          } catch (e) {
            setStage('ERROR');
            setErrorMessage(e.response?.data?.message || e.message || 'Verification failed');
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
        theme: {
          color: '#14532D', // FarmDex Forest Green
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setStage('ERROR');
        setErrorMessage(response.error.description || 'Payment authorization failed');
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      setStage('ERROR');
      setErrorMessage(
        err.message || 'Official Razorpay Checkout could not be opened with mock key. Use Test Simulator.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs fade-in">
      <div className="relative w-full max-w-lg bg-surface border border-line rounded-2xl shadow-modal overflow-hidden flex flex-col max-h-[92vh] text-ink">
        {/* Razorpay Brand Header */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 p-5 border-b border-line flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight">
                  Razorpay <span className="text-sky-300 font-semibold text-xs tracking-normal">PAY</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning-soft0/20 text-amber-300 border border-amber-400/30">
                  TEST MODE
                </span>
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-400" />
                256-bit Encrypted Server Settlement
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-surface/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 font-sans">
          {/* Order Snapshot */}
          <div className="p-4 rounded-xl bg-surface-muted border border-line flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] text-ink-muted font-mono block">Order Reference</span>
              <span className="text-xs font-mono font-bold text-brand-800">
                #{order.id.slice(0, 13).toUpperCase()}
              </span>
              <p className="text-xs text-ink flex items-center gap-1 font-medium mt-0.5">
                <Sprout className="w-3.5 h-3.5 text-brand-800" />
                {listing?.cropName || 'Agricultural Produce'}
              </p>
            </div>

            <div className="text-right space-y-0.5">
              <span className="text-[10px] text-ink-muted font-mono block">{t('modals.razorpay.amountToPay')}</span>
              <span className="text-xl font-bold text-ink font-mono">
                {formatCurrency(totalAmount, i18n.language)}
              </span>
              <span className="text-[10px] text-ink-subtle font-mono block">INR (Paise: {totalAmount * 100})</span>
            </div>
          </div>

          {/* Simulation Disclaimer Banner */}
          <div className="p-3 rounded-xl bg-warning-soft border border-warning-edge text-amber-800 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
            <span>{t('modals.razorpay.secureNotice')}</span>
          </div>
          {stage === 'SUCCESS' && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-success-soft border border-success-edge flex items-center justify-center text-success">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-ink">{t('modals.razorpay.successTitle')}</h3>
                <p className="text-xs text-ink-muted max-w-sm mx-auto">
                  {t('modals.razorpay.successDesc')}
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-brand-800 hover:bg-brand-900 text-white text-xs font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
                >
                  {t('orders.card.actions.viewReceipt')}
                </button>
              </div>
            </div>
          )}

          {/* PROCESSING State View */}
          {stage === 'PROCESSING' && (
            <div className="py-8 space-y-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-ink">{t('modals.razorpay.processing')}</h4>
                <p className="text-xs text-ink-muted font-mono">
                  {activeStep === 1 && '1/4 Initializing Razorpay order on backend...'}
                  {activeStep === 2 && '2/4 Order created. Requesting authorization...'}
                  {activeStep === 3 && '3/4 Generating cryptographic HMAC payload...'}
                  {activeStep === 4 && '4/4 Verifying signature with constant-time equality...'}
                </p>
              </div>
            </div>
          )}

          {/* INIT or ERROR State View */}
          {(stage === 'INIT' || stage === 'ERROR') && (
            <>
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-danger-soft border border-danger-edge text-danger text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold">Payment Action Failed</p>
                    <p className="text-[11px] text-danger leading-relaxed">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Simulation Mode Selection */}
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                  Select Test Gateway Scenario
                </label>

                {/* Scenario 1: Successful Payment */}
                <div
                  onClick={() => setSelectedScenario('SUCCESS')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    selectedScenario === 'SUCCESS'
                      ? 'bg-success-soft/70 border-brand-500 shadow-card'
                      : 'bg-surface border-line hover:border-line-strong'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg mt-0.5 ${
                      selectedScenario === 'SUCCESS'
                        ? 'bg-brand-100 text-brand-800'
                        : 'bg-surface-sunken text-ink-muted'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink">
                        Standard Razorpay Test Payment (Success)
                      </span>
                      <span className="text-[10px] font-mono text-brand-800 bg-brand-50 px-1.5 py-0.2 rounded border border-brand-200">
                        Valid HMAC
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-muted leading-relaxed">
                      Creates test order, executes payment, and submits valid cryptographic HMAC SHA-256 signature for server verification.
                    </p>
                  </div>
                </div>

                {/* Scenario 2: Tampered / Invalid Signature */}
                <div
                  onClick={() => setSelectedScenario('TAMPERED_SIG')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    selectedScenario === 'TAMPERED_SIG'
                      ? 'bg-warning-soft/70 border-amber-500 shadow-card'
                      : 'bg-surface border-line hover:border-line-strong'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg mt-0.5 ${
                      selectedScenario === 'TAMPERED_SIG'
                        ? 'bg-warning-soft text-warning'
                        : 'bg-surface-sunken text-ink-muted'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink">
                        Simulate Tampered Signature (Security Test)
                      </span>
                      <span className="text-[10px] font-mono text-warning bg-warning-soft px-1.5 py-0.2 rounded border border-warning-edge">
                        Server Rejection
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-muted leading-relaxed">
                      Sends an unauthorized forged signature to confirm that the server strictly rejects fraudulent confirmation with HTTP 400.
                    </p>
                  </div>
                </div>

                {/* Scenario 3: Bank Decline / Network Timeout */}
                <div
                  onClick={() => setSelectedScenario('GATEWAY_ERROR')}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                    selectedScenario === 'GATEWAY_ERROR'
                      ? 'bg-danger-soft/70 border-red-500 shadow-card'
                      : 'bg-surface border-line hover:border-line-strong'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg mt-0.5 ${
                      selectedScenario === 'GATEWAY_ERROR'
                        ? 'bg-red-100 text-danger'
                        : 'bg-surface-sunken text-ink-muted'
                    }`}
                  >
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink">
                        Simulate Payment Decline (Failure Handling)
                      </span>
                      <span className="text-[10px] font-mono text-danger bg-danger-soft px-1.5 py-0.2 rounded border border-danger-edge">
                        Error State
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-muted leading-relaxed">
                      Simulates a failed card/UPI authorization to ensure the order is kept safe and payment state reflects failure.
                    </p>
                  </div>
                </div>
              </div>

              {/* Informational Security Notice */}
              <div className="p-3 bg-surface-muted border border-line rounded-xl flex items-center gap-2.5 text-xs text-ink-muted">
                <ShieldCheck className="w-4 h-4 text-brand-800 shrink-0" />
                <span>
                  Rule: Server uses constant-time HMAC comparison before marking orders PAID.
                </span>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        {stage !== 'SUCCESS' && (
          <div className="p-4 border-t border-line bg-surface-muted flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleOpenOfficialRazorpay}
              disabled={loading}
              className="text-xs text-ink-muted hover:text-brand-800 font-medium flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
              title="Open Razorpay popup if you have official test keys configured"
            >
              <span>Try Official Razorpay Popup</span>
              <ExternalLink className="w-3 h-3" />
            </button>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 bg-surface hover:bg-surface-sunken text-ink border border-line rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>

              <button
                type="button"
                onClick={handleExecutePayment}
                disabled={loading}
                className="px-5 py-2.5 bg-brand-800 hover:bg-brand-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('modals.razorpay.processing')}</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>
                      {selectedScenario === 'TAMPERED_SIG'
                        ? 'Execute Tampered Signature'
                        : selectedScenario === 'GATEWAY_ERROR'
                        ? 'Execute Simulated Failure'
                        : t('modals.razorpay.paySimulated')}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


