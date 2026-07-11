import { useState, useEffect } from 'react'
import { X, Loader2, ShieldCheck, CheckCircle } from 'lucide-react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { paymentsApi } from '../lib/api'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

function loadRazorpayScript() {
  return new Promise(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload  = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

// ─── Stripe card form (must be inside <Elements>) ─────────────────────────────

function StripeCardForm({ clientSecret, orderId, onSuccess, onError }) {
  const stripe   = useStripe()
  const elements = useElements()
  const [paying, setPaying] = useState(false)

  async function handlePay() {
    if (!stripe || !elements) return
    setPaying(true)
    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      })
      if (error) { onError(error.message); setPaying(false); return }
      await paymentsApi.confirm({ orderId, stripePaymentIntentId: paymentIntent.id })
      onSuccess()
    } catch (e) {
      onError(e.message || 'Payment failed')
      setPaying(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="border border-gray-200 rounded-xl px-4 py-3.5 bg-white">
        <CardElement
          options={{
            style: {
              base: { fontSize: '14px', color: '#111827', fontFamily: 'inherit', '::placeholder': { color: '#94a3b8' } },
              invalid: { color: '#ef4444' },
            },
          }}
        />
      </div>
      <button
        onClick={handlePay}
        disabled={paying || !stripe}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {paying && <Loader2 className="w-4 h-4 animate-spin" />}
        Pay Now
      </button>
    </div>
  )
}

// ─── Gateway options ──────────────────────────────────────────────────────────

const GATEWAYS = [
  {
    id:          'razorpay',
    name:        'Razorpay',
    description: 'UPI, Cards, Net Banking & Wallets',
    bg:          '#072654',
    abbr:        'R',
  },
  {
    id:          'stripe',
    name:        'Stripe',
    description: 'Credit & Debit Cards worldwide',
    bg:          '#635BFF',
    abbr:        'S',
  },
]

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function PaymentGatewayModal({ open, onClose, addressId, onPaymentSuccess }) {
  const [gateway,      setGateway]      = useState('razorpay')
  const [step,         setStep]         = useState('select')   // 'select' | 'stripe-form' | 'success'
  const [clientSecret, setClientSecret] = useState(null)
  const [orderId,      setOrderId]      = useState(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  useEffect(() => {
    if (!open) { setStep('select'); setError(''); setClientSecret(null); setOrderId(null) }
  }, [open])

  async function handleContinue() {
    setError('')
    setLoading(true)
    try {
      if (gateway === 'razorpay') {
        const loaded = await loadRazorpayScript()
        if (!loaded) { setError('Could not load Razorpay. Check your connection.'); setLoading(false); return }

        const data = await paymentsApi.razorpayCreate({ addressId })

        const rzp = new window.Razorpay({
          key:         data.keyId,
          amount:      data.amount,
          currency:    'INR',
          order_id:    data.razorpayOrderId,
          name:        'Groco',
          description: 'Order Payment',
          theme:       { color: '#ffcc01' },
          handler: async (response) => {
            try {
              await paymentsApi.razorpayVerify({
                orderId:              data.orderId,
                razorpay_payment_id:  response.razorpay_payment_id,
                razorpay_order_id:    response.razorpay_order_id,
                razorpay_signature:   response.razorpay_signature,
              })
              setStep('success')
              onPaymentSuccess?.()
            } catch (e) {
              setError(e.message || 'Payment verification failed')
            }
          },
          modal: { ondismiss: () => setLoading(false) },
        })
        rzp.open()
        setLoading(false)
      } else {
        const data = await paymentsApi.createIntent({ addressId })
        setClientSecret(data.clientSecret)
        setOrderId(data.orderId)
        setStep('stripe-form')
        setLoading(false)
      }
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={step !== 'success' ? onClose : undefined} />

      <div className="relative bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {step === 'stripe-form' && (
              <button onClick={() => { setStep('select'); setError('') }} className="p-1 -ml-1 text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-base font-bold text-gray-800">
              {step === 'success'     ? 'Payment successful'       :
               step === 'stripe-form' ? 'Enter card details'       :
               'Choose payment gateway'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-5">

          {/* ── Success ── */}
          {step === 'success' && (
            <div className="flex flex-col items-center py-6 gap-3 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-base font-bold text-gray-800">Order confirmed!</p>
                <p className="text-sm text-gray-500 mt-1">Your payment was processed successfully.</p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-8 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {/* ── Gateway selection ── */}
          {step === 'select' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {GATEWAYS.map(gw => (
                  <button
                    key={gw.id}
                    onClick={() => setGateway(gw.id)}
                    className={`rounded-2xl p-4 border-2 text-left transition-all ${
                      gateway === gw.id
                        ? 'border-green-500 bg-green-50/30 shadow-sm'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg mb-2.5"
                      style={{ backgroundColor: gw.bg }}
                    >
                      {gw.abbr}
                    </div>
                    <p className="text-sm font-bold text-gray-800">{gw.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-snug">{gw.description}</p>
                    {gateway === gw.id && (
                      <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-green-600">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 111.414-1.414L8.414 12.172l7.879-7.879a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Selected
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {error && <p className="text-xs text-red-500 font-medium text-center">{error}</p>}

              <div className="flex items-center gap-2 justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-green-600 shrink-0" />
                <p className="text-[11px] text-gray-400 font-medium">100% secure payments · SSL encrypted</p>
              </div>

              <button
                onClick={handleContinue}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Continue with {GATEWAYS.find(g => g.id === gateway)?.name}
              </button>
            </div>
          )}

          {/* ── Stripe card form ── */}
          {step === 'stripe-form' && clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <div className="space-y-4">
                <StripeCardForm
                  clientSecret={clientSecret}
                  orderId={orderId}
                  onSuccess={() => { setStep('success'); onPaymentSuccess?.() }}
                  onError={msg => setError(msg)}
                />
                {error && <p className="text-xs text-red-500 font-medium text-center">{error}</p>}
                <div className="flex items-center gap-2 justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <p className="text-[11px] text-gray-400 font-medium">Secured by Stripe · PCI compliant</p>
                </div>
              </div>
            </Elements>
          )}

        </div>
      </div>
    </div>
  )
}
