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
import Head from 'next/head'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState('basic')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    linkedinEmail: '',
    linkedinPassword: '',
    targetJobTitles: '',
    targetLocations: '',
    experienceLevel: 'mid',
    salaryExpectation: '',
    resumeSummary: '',
    coverLetterTemplate: ''
  })

  // Initialize Supabase
  const supabase = createClient(
    'https://sapcolwaecrjyiqomrnp.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhcGNvbHdhZWNyanlpcW9tcm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MDc3NTksImV4cCI6MjA3NDQ4Mzc1OX0.nafzn8TBFPr6Z4XgQAKnFW186O-NFdU7wAidG4s-dxg'
  )

  const PLANS = {
    basic: { name: 'Basic Plan', price: 29.99, priceText: '$29.99', jobs: 100, jobsText: '100+' },
    premium: { name: 'Premium Plan', price: 49.99, priceText: '$49.99', jobs: 500, jobsText: '500+' },
    enterprise: { name: 'Enterprise Plan', price: 79.99, priceText: '$79.99', jobs: 1000, jobsText: '1000+' }
  }

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(''), 5000)
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const showStep = (stepNumber) => {
    setCurrentStep(stepNumber)
  }

  // Register user with Supabase
  const registerUser = async () => {
    if (!formData.fullName || !formData.email || !formData.phone) {
      showMessage('Please fill in all required fields', 'error')
      return
    }

    setLoading(true)
    
    try {
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: 'temp123', // In production, let user set password
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone
          }
        }
      })

      if (error) throw error

      // Create profile
      const { error: profileError } = await supabase.from('user_profiles').insert({
        auth_user_id: data.user.id,
        email: formData.email,
        full_name: formData.fullName,
        phone: formData.phone,
        subscription_plan: selectedPlan
      })

      if (profileError) throw profileError

      showMessage('Registration successful!', 'success')
      showStep(2)
      
    } catch (error) {
      showMessage(`Registration failed: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }
  
  // Process payment
  const processPayment = async () => {
    setLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          source_id: 'mock_payment_token', // Replace with actual Square token
          plan: selectedPlan,
          user_email: formData.email
        }
      })

      if (error) throw error

      showMessage('Payment successful! Account activated.', 'success')
      showStep(3)
      
    } catch (error) {
      showMessage(`Payment failed: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Save profile
  const saveProfile = async () => {
    if (!formData.linkedinEmail || !formData.linkedinPassword || !formData.targetJobTitles) {
      showMessage('LinkedIn credentials and job titles are required', 'error')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.from('user_profiles')
        .update({
          linkedin_email: formData.linkedinEmail,
          linkedin_password_encrypted: formData.linkedinPassword, // In production, encrypt this
          target_job_titles: formData.targetJobTitles.split('\n').filter(t => t.trim()),
          target_locations: formData.targetLocations.split('\n').filter(l => l.trim()) || ['Remote'],
          experience_level: formData.experienceLevel,
          salary_expectation: formData.salaryExpectation,
          resume_text: formData.resumeSummary,
          cover_letter_template: formData.coverLetterTemplate
        })
        .eq('email', formData.email)

      if (error) throw error

      showMessage('Profile updated successfully!', 'success')
      showStep(4)
      
    } catch (error) {
      showMessage(`Profile update failed: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Start job applications
  const startJobApplications = async () => {
    setLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('start-job-search', {
        body: {
          user_email: formData.email
        }
      })

      if (error) throw error

      showMessage('Job applications started!', 'success')
      showStep(5)
      
    } catch (error) {
      showMessage(`Error: ${error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }
  
  const styles = {
    container: {
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      background: 'linear-gradient(180deg, #6a1b9a, #4a0d67)',
      minHeight: '100vh',
      color: '#fff'
    },
    planContainer: {
      backgroundColor: '#e3f2fd',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      color: '#333',
      marginBottom: '15px',
      cursor: 'pointer',
      border: '2px solid transparent'
    },
    planContainerSelected: {
      backgroundColor: '#e3f2fd',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      color: '#333',
      marginBottom: '15px',
      cursor: 'pointer',
      border: '2px solid #6a1b9a'
    },
    input: {
      width: '100%',
      padding: '10px',
      border: '1px solid #ccc',
      borderRadius: '5px',
      backgroundColor: '#f0f8ff',
      marginBottom: '15px',
      boxSizing: 'border-box'
    },
    button: {
      backgroundColor: '#6a1b9a',
      color: '#fff',
      padding: '10px 20px',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer',
      width: '100%',
      fontSize: '16px'
    },
    stepCircle: {
      display: 'inline-block',
      width: '30px',
      height: '30px',
      lineHeight: '30px',
      borderRadius: '50%',
      margin: '0 5px',
      textAlign: 'center',
      fontWeight: 'bold'
    }
  }

  return (
    <>
      <Head>
        <title>🚀 JobSee</title>
        <meta name="description" content="Professional Job Application Service - Apply to 500+ Jobs Automatically" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div style={styles.container}>
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
                ...styles.stepCircle,
                background: step <= currentStep ? '#6a1b9a' : '#fff',
                color: step <= currentStep ? '#fff' : '#6a1b9a'
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

        {/* Step 1: Registration & Plan Selection */}
        {currentStep === 1 && (
          <div>
            <h3>Step 1: Choose Your Plan & Register</h3>
            
            {/* Plan Selection */}
            <div>
              <h5>Select Your Plan:</h5>
              {Object.entries(PLANS).map(([key, plan]) => (
                <div
                  key={key}
                  style={selectedPlan === key ? styles.planContainerSelected : styles.planContainer}
                  onClick={() => setSelectedPlan(key)}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={key}
                    checked={selectedPlan === key}
                    onChange={() => setSelectedPlan(key)}
                    style={{ marginRight: '10px' }}
                  />
                  <label>
                    <strong>{plan.name}</strong><br />
                    {plan.priceText}<br />
                    <ul style={{ listStyleType: 'none', paddingLeft: '0' }}>
                      <li style={{ color: '#333', marginBottom: '5px' }}>
                        ✅ Apply to {plan.jobsText} jobs automatically
                      </li>
                      <li style={{ color: '#333', marginBottom: '5px' }}>
                        ✅ LinkedIn Easy Apply
                      </li>
                      <li style={{ color: '#333', marginBottom: '5px' }}>
                        ✅ Indeed job applications
                      </li>
                    </ul>
                  </label>
                </div>
              ))}
            </div>

            {/* Registration Form */}
            <div>
              <h5>Your Information:</h5>
              <input
                type="text"
                placeholder="Full Name *"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                style={styles.input}
                required
              />
              <input
                type="tel"
                placeholder="Phone Number *"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                style={styles.input}
                required
              />
              <input
                type="email"
                placeholder="Email Address *"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                style={styles.input}
                required
              />
              <button
                onClick={registerUser}
                disabled={loading}
                style={{
                  ...styles.button,
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Registering...' : 'Continue to Payment →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Payment */}
        {currentStep === 2 && (
          <div>
            <h3>Step 2: Secure Payment</h3>
            
            <div style={{ backgroundColor: '#e3f2fd', padding: '15px', borderRadius: '8px', color: '#333', marginBottom: '20px' }}>
              <p><strong>Selected Plan:</strong> {PLANS[selectedPlan].name}</p>
              <p><strong>Price:</strong> {PLANS[selectedPlan].priceText}</p>
              <p><strong>Job Applications:</strong> {PLANS[selectedPlan].jobsText}</p>
            </div>

            <div>
              <h5>Payment Information</h5>
              <div id="card-container" style={{ minHeight: '50px', backgroundColor: '#f0f8ff', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
                <p style={{ color: '#333', textAlign: 'center' }}>Square Payment Form will load here</p>
              </div>
              <input
                type="text"
                placeholder="Expiration Date"
                style={styles.input}
                required
              />
              <input
                type="text"
                placeholder="CVV"
                style={styles.input}
                required
              />
              <input
                type="text"
                placeholder="Postal Code"
                style={styles.input}
                required
              />
              <button
                onClick={processPayment}
                disabled={loading}
                style={{
                  ...styles.button,
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Processing Payment...' : '💳 Pay Securely'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Profile Setup */}
        {currentStep === 3 && (
          <div>
            <h3>Step 3: Setup Your Profile</h3>
            
            <input
              type="email"
              placeholder="LinkedIn Email *"
              value={formData.linkedinEmail}
              onChange={(e) => handleInputChange('linkedinEmail', e.target.value)}
              style={styles.input}
              required
            />
            <input
              type="password"
              placeholder="LinkedIn Password *"
              value={formData.linkedinPassword}
              onChange={(e) => handleInputChange('linkedinPassword', e.target.value)}
              style={styles.input}
              required
            />
            <textarea
              placeholder="Target Job Titles (one per line) *"
              value={formData.targetJobTitles}
              onChange={(e) => handleInputChange('targetJobTitles', e.target.value)}
              style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
              required
            />
            <textarea
              placeholder="Target Locations (one per line)"
              value={formData.targetLocations}
              onChange={(e) => handleInputChange('targetLocations', e.target.value)}
              style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
            />
            <select
              value={formData.experienceLevel}
              onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
              style={styles.input}
            >
              <option value="entry">Entry Level (0-2 years)</option>
              <option value="mid">Mid Level (2-5 years)</option>
              <option value="senior">Senior Level (5-10 years)</option>
              <option value="executive">Executive Level (10+ years)</option>
            </select>
            <input
              type="text"
              placeholder="Salary Expectation"
              value={formData.salaryExpectation}
              onChange={(e) => handleInputChange('salaryExpectation', e.target.value)}
              style={styles.input}
            />
            <textarea
              placeholder="Resume Summary"
              value={formData.resumeSummary}
              onChange={(e) => handleInputChange('resumeSummary', e.target.value)}
              style={{ ...styles.input, minHeight: '100px', resize: 'vertical' }}
            />
            <textarea
              placeholder="Cover Letter Template"
              value={formData.coverLetterTemplate}
              onChange={(e) => handleInputChange('coverLetterTemplate', e.target.value)}
              style={{ ...styles.input, minHeight: '100px', resize: 'vertical' }}
            />
            <button
              onClick={saveProfile}
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Saving Profile...' : 'Save Profile & Continue →'}
            </button>
          </div>
        )}

        {/* Step 4: Ready to Launch */}
        {currentStep === 4 && (
          <div>
            <h3>Step 4: Ready to Launch!</h3>
            
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <p style={{ fontSize: '1.2rem' }}>🎉 Your account is now active!</p>
              <p>Ready to automatically apply to <strong>{PLANS[selectedPlan].jobsText} jobs</strong>.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{PLANS[selectedPlan].jobs}</div>
                <div>Applications Available</div>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>2-4</div>
                <div>Hours (Estimated)</div>
              </div>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>24/7</div>
                <div>Background Processing</div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <p>Our system will automatically apply to jobs matching your criteria on LinkedIn, Indeed, and other major job boards. You'll receive real-time updates via email.</p>
            </div>
            
            <button
              onClick={startJobApplications}
              disabled={loading}
              style={{
                ...styles.button,
                fontSize: '18px',
                padding: '20px',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Starting Applications...' : '🚀 Start Applying to Jobs Now!'}
            </button>
          </div>
        )}

        {/* Step 5: Dashboard */}
        {currentStep === 5 && (
          <div>
            <h3>Step 5: Application Dashboard</h3>
            
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '20px' }}>
                <button style={{ ...styles.button, width: 'auto', padding: '10px 20px' }}>
                  🔄 Refresh Stats
                </button>
                <button style={{ ...styles.button, width: 'auto', padding: '10px 20px' }}>
                  📋 View Applications
                </button>
              </div>
              
              <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '8px' }}>
                <h4>Job applications are running in the background!</h4>
                <p>You'll receive email updates on progress.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
