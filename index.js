import Head from 'next/head'
import { useState, useEffect } from 'react'

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState('basic')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: ''
  })

  const SUPABASE_URL = 'https://sapcolwaecrjyiqomrnp.supabase.co'
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const PLANS = {
    basic: { name: 'Basic Plan', price: '$29.99', jobs: '100+' },
    premium: { name: 'Premium Plan', price: '$49.99', jobs: '500+' },
    enterprise: { name: 'Enterprise Plan', price: '$79.99', jobs: '1000+' }
  }

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(''), 5000)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const registerUser = async () => {
    if (!formData.fullName || !formData.email || !formData.phone) {
      showMessage('Please fill in all required fields', 'error')
      return
    }

    setLoading(true)
    
    try {
      // Mock registration for now
      showMessage('Registration successful!', 'success')
      setCurrentStep(2)
    } catch (error) {
      showMessage(`Registration failed: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>JobSee - Professional Job Application Service</title>
        <meta name="description" content="Apply to 500+ jobs automatically" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div style={{ 
        fontFamily: 'Arial, sans-serif',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        background: 'linear-gradient(180deg, #6a1b9a, #4a0d67)',
        minHeight: '100vh',
        color: '#fff'
      }}>
        <h1 style={{ textAlign: 'center', color: '#fff' }}>🚀 JobSee</h1>
        <h2 style={{ textAlign: 'center', color: '#fff' }}>
          Professional Job Application Service - Apply to 500+ Jobs Automatically
        </h2>

        {/* Step Indicators */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              style={{
                display: 'inline-block',
                width: '30px',
                height: '30px',
                lineHeight: '30px',
                borderRadius: '50%',
                background: step <= currentStep ? '#6a1b9a' : '#fff',
                color: step <= currentStep ? '#fff' : '#6a1b9a',
                margin: '0 5px',
                textAlign: 'center'
              }}
            >
              {step}
            </div>
          ))}
        </div>

        {/* Message Display */}
        {message && (
          <div
            style={{
              padding: '10px',
              margin: '10px 0',
              borderRadius: '5px',
              backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
              color: message.type === 'success' ? '#155724' : '#721c24'
            }}
          >
            {message.text}
          </div>
        )}

        {/* Step 1: Registration */}
        {currentStep === 1 && (
          <div>
            <h3>Step 1: Choose Your Plan & Register</h3>
            
            {/* Plan Selection */}
            <div>
              <h5>Select Your Plan:</h5>
              {Object.entries(PLANS).map(([key, plan]) => (
                <div
                  key={key}
                  style={{
                    backgroundColor: '#e3f2fd',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    color: '#333',
                    cursor: 'pointer',
                    border: selectedPlan === key ? '2px solid #6a1b9a' : '2px solid transparent'
                  }}
                  onClick={() => setSelectedPlan(key)}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={key}
                    checked={selectedPlan === key}
                    onChange={() => setSelectedPlan(key)}
                  />
                  <label>
                    <strong>{plan.name}</strong><br />
                    {plan.price}<br />
                    {plan.jobs} Job Applications
                  </label>
                </div>
              ))}
            </div>

            {/* Registration Form */}
            <div>
              <h5>Your Information:</h5>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    backgroundColor: '#f0f8ff'
                  }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    backgroundColor: '#f0f8ff'
                  }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="email"
                  placeholder="Email Address *"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    backgroundColor: '#f0f8ff'
                  }}
                />
              </div>
              <button
                onClick={registerUser}
                disabled={loading}
                style={{
                  backgroundColor: '#6a1b9a',
                  color: '#fff',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  width: '100%',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Registering...' : 'Continue to Payment →'}
              </button>
            </div>
          </div>
        )}

        {/* Additional steps would go here */}
        {currentStep > 1 && (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h3>Step {currentStep} - Coming Soon</h3>
            <p>Your registration was successful! Next steps will be implemented.</p>
          </div>
        )}
      </div>
    </>
  )
}