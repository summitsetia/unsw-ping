import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useForm } from 'react-hook-form'

type PhoneFormData = { phone: string }
type CodeFormData = { code: string }

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const phoneForm = useForm<PhoneFormData>({
    defaultValues: { phone: '' },
  })

  const codeForm = useForm<CodeFormData>({
    defaultValues: { code: '' },
  })

  const onSendCode = async (data: PhoneFormData) => {
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      phone: data.phone,
      options: { shouldCreateUser: false },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setPhone(data.phone)
    setStep('code')
  }

  const onVerifyCode = async (data: CodeFormData) => {
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: data.code,
      type: 'sms',
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setShowModal(false)
    window.location.href = '/dashboard'
  }

  const openModal = () => {
    setShowModal(true)
    setStep('phone')
    setError(null)
    phoneForm.reset()
    codeForm.reset()
  }

  const closeModal = () => {
    setShowModal(false)
    setStep('phone')
    setError(null)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <span className="text-xl font-semibold tracking-tight">ping</span>
        <button
          onClick={openModal}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign in
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 -mt-20">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-center max-w-2xl">
          Never miss a UNSW event again
        </h1>
        <p className="mt-6 text-lg text-muted-foreground text-center max-w-md">
          Discover society events that match your interests. Get reminders. Stay connected.
        </p>

        <div className="mt-10">
          <button
            className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:opacity-90 transition-opacity"
          >
            Get started
          </button>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground">
        Built for UNSW students
      </footer>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
          />
          <div className="relative bg-background rounded-2xl p-8 w-full max-w-sm mx-4 shadow-xl">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h2 className="text-xl font-semibold mb-2">
              {step === 'phone' ? 'Sign in' : 'Enter code'}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {step === 'phone'
                ? 'Enter your phone number to receive a verification code.'
                : `We sent a code to ${phone}`}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
                {error}
              </div>
            )}

            {step === 'phone' ? (
              <form onSubmit={phoneForm.handleSubmit(onSendCode)} className="space-y-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-1.5">
                    Phone number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+61412345678"
                    {...phoneForm.register('phone', {
                      required: 'Phone number is required',
                      pattern: {
                        value: /^\+\d{10,15}$/,
                        message: 'Enter a valid phone number (e.g. +61412345678)',
                      },
                    })}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  {phoneForm.formState.errors.phone && (
                    <p className="mt-1.5 text-sm text-destructive">
                      {phoneForm.formState.errors.phone.message}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send code'}
                </button>
              </form>
            ) : (
              <form onSubmit={codeForm.handleSubmit(onVerifyCode)} className="space-y-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium mb-1.5">
                    Verification code
                  </label>
                  <input
                    id="code"
                    type="text"
                    inputMode="numeric"
                    placeholder="123456"
                    maxLength={6}
                    {...codeForm.register('code', {
                      required: 'Code is required',
                      minLength: { value: 6, message: 'Code must be 6 digits' },
                      maxLength: { value: 6, message: 'Code must be 6 digits' },
                    })}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring tracking-widest text-center text-lg"
                  />
                  {codeForm.formState.errors.code && (
                    <p className="mt-1.5 text-sm text-destructive">
                      {codeForm.formState.errors.code.message}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Use a different number
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

