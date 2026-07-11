import { useState } from 'react'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (email) setSubmitted(true)
  }

  return (
    <section className="bg-gradient-to-r from-brand-500 to-orange-600 py-14">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <span className="text-3xl mb-4 block">📬</span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
          Get Exclusive Deals in Your Inbox
        </h2>
        <p className="text-white/80 text-sm sm:text-base mb-8">
          Subscribe to our newsletter and be the first to know about sales, new arrivals, and special offers.
        </p>

        {submitted ? (
          <div className="bg-white/20 rounded-2xl px-8 py-5 text-white font-semibold text-lg">
            Thanks for subscribing! Check your inbox soon.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
              className="flex-1 max-w-sm rounded-full px-5 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-white shadow"
            />
            <button
              type="submit"
              className="bg-white text-brand-600 font-bold px-7 py-3 rounded-full hover:bg-gray-100 transition shadow-lg whitespace-nowrap"
            >
              Subscribe Now
            </button>
          </form>
        )}

        <p className="text-white/60 text-xs mt-4">No spam, unsubscribe at any time.</p>
      </div>
    </section>
  )
}
