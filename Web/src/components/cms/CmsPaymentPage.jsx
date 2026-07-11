import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Loader2, Lock, ShieldCheck } from 'lucide-react'
import { paymentsApi } from '../../lib/api'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize:        '15px',
      color:           '#1e293b',
      fontFamily:      'ui-sans-serif, system-ui, sans-serif',
      '::placeholder': { color: '#94a3b8' },
    },
    invalid: { color: '#ef4444' },
  },
}

// ─── Inner payment form (needs stripe context) ────────────────────────────────

function PaymentForm({ orderId, clientSecret }) {
  const stripe   = useStripe()
  const elements = useElements()
  const navigate = useNavigate()

  const [paying,      setPaying]      = useState(false)
  const [error,       setError]       = useState('')
  const [success,     setSuccess]     = useState(false)
  const [cardState,   setCardState]   = useState({ complete: false, empty: true, error: null })

  async function handleSubmit(e) {
    e.preventDefault()
    if (!stripe || !elements) return

    if (cardState.empty) {
      setError('Please enter your card details.')
      return
    }
    if (!cardState.complete || cardState.error) {
      setError(cardState.error?.message || 'Your card details are incomplete.')
      return
    }

    setError('')
    setPaying(true)

    const cardElement = elements.getElement(CardElement)
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      { payment_method: { card: cardElement } }
    )

    if (stripeError) {
      setError(stripeError.message || 'Payment failed. Please try again.')
      setPaying(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      try {
        await paymentsApi.confirm({
          orderId,
          stripePaymentIntentId: paymentIntent.id,
        })
        setSuccess(true)
        setTimeout(() => navigate('/account?tab=orders'), 2000)
      } catch {
        setError('Payment succeeded but we could not update your order. Please contact support.')
        setPaying(false)
      }
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <ShieldCheck className="w-8 h-8 text-green-500" />
        </div>
        <p className="text-xl font-bold text-slate-800">Payment Successful!</p>
        <p className="text-sm text-slate-500">Your order has been confirmed. Redirecting…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-500">Card Details</label>
        <div className={`border rounded-xl px-4 py-3.5 focus-within:ring-2 transition ${
          cardState.error ? 'border-red-400 focus-within:border-red-400 focus-within:ring-red-50'
            : 'border-slate-200 focus-within:border-blue-400 focus-within:ring-blue-50'
        }`}>
          <CardElement
            options={CARD_ELEMENT_OPTIONS}
            onChange={(e) => {
              setCardState({ complete: e.complete, empty: e.empty, error: e.error ?? null })
              if (e.error) setError(e.error.message)
              else setError('')
            }}
          />
        </div>
        {cardState.error && (
          <p className="text-xs text-red-500 mt-1">{cardState.error.message}</p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || paying}
        className="w-full py-3.5 rounded-xl text-sm font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
        {paying ? 'Processing…' : 'Pay Now'}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-xs text-slate-400 text-center">
        <Lock className="w-3 h-3 shrink-0" />
        Payments are encrypted and processed securely by Stripe
      </p>
    </form>
  )
}

// ─── Outer wrapper ────────────────────────────────────────────────────────────

export default function CmsPaymentPage() {
  const location = useLocation()
  const navigate  = useNavigate()
  const state     = location.state

  // If navigated here without Stripe state, go back to checkout
  if (!state?.clientSecret || !state?.orderId) {
    navigate('/checkout', { replace: true })
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col gap-1 text-center">
          <div className="flex justify-center mb-2">
            <svg viewBox="0 0 60 25" className="h-8" fill="none">
              <path d="M59.64 14.28c0-4.64-2.24-8.3-6.52-8.3-4.3 0-6.9 3.66-6.9 8.27 0 5.46 3.08 8.22 7.5 8.22 2.15 0 3.78-.49 5.01-1.18v-3.6c-1.23.62-2.64.97-4.43.97-1.75 0-3.31-.62-3.51-2.76h8.85v-1.62zm-8.95-1.72c0-2.05 1.25-2.9 2.4-2.9 1.11 0 2.29.85 2.29 2.9h-4.69zM40.96 5.98c-1.76 0-2.89.82-3.52 1.4l-.23-1.11H33.8v21.3l3.82-.81.01-5.17c.65.47 1.6 1.14 3.18 1.14 3.21 0 6.14-2.58 6.14-8.28-.01-5.21-2.97-8.47-6-8.47zm-1.05 13.04c-1.06 0-1.68-.38-2.11-.85l-.02-6.7c.46-.52 1.1-.88 2.13-.88 1.63 0 2.76 1.83 2.76 4.2 0 2.42-1.11 4.23-2.76 4.23zM28.24 4.6l3.83-.82V0l-3.83.81V4.6zM28.24 6.27h3.83V22.1h-3.83V6.27zM24.56 7.39l-.24-1.12h-3.32V22.1h3.82v-10.7c.9-1.18 2.44-.96 2.92-.79V6.27c-.5-.18-2.32-.52-3.18 1.12zM16.67 3.01l-3.73.79-.02 12.21c0 2.25 1.69 3.91 3.94 3.91 1.25 0 2.16-.23 2.66-.5v-3.1c-.49.2-2.9.9-2.9-1.35V9.58h2.9V6.27h-2.9l.05-3.26zM4.25 10.23c0-.6.49-.83 1.3-.83 1.16 0 2.63.35 3.79.97V6.8C8.16 6.24 6.99 6 5.55 6 2.22 6 0 7.74 0 10.37c0 4.06 5.59 3.41 5.59 5.16 0 .71-.62.94-1.48.94-1.28 0-2.92-.53-4.21-1.23v3.62C1.16 19.5 2.61 20 4.07 20c3.41 0 5.75-1.68 5.75-4.35-.01-4.38-5.57-3.6-5.57-5.42z" fill="#635BFF"/>
            </svg>
          </div>
          <p className="text-lg font-bold text-slate-800">Complete Payment</p>
          <p className="text-xs text-slate-400">Order #{state.orderId}</p>
        </div>

        {/* Test mode banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 text-center">
          <strong>Test mode</strong> — use card <strong>4242 4242 4242 4242</strong>, any future expiry, any CVV
        </div>

        {/* Stripe Elements */}
        <Elements
          stripe={stripePromise}
          options={{ appearance: { theme: 'stripe' } }}
        >
          <PaymentForm orderId={state.orderId} clientSecret={state.clientSecret} />
        </Elements>

      </div>
    </div>
  )
}
