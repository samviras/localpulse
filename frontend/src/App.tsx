import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'https://localpulse-production.up.railway.app'

function App() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/dashboard/summary`)
        setData(response.data)
      } catch (error) {
        console.error('API Error:', error)
        // Fallback data
        setData({
          total_locations: 3,
          competitors_tracked: 15,
          active_alerts: 2,
          avg_rating_delta: 0.15
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '3rem', 
          margin: '0 0 1rem 0',
          background: 'linear-gradient(45deg, #3b82f6, #06b6d4)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🔍 LocalPulse
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '1.2rem', margin: 0 }}>
          Competitive Intelligence Dashboard for Multi-Location Businesses
        </p>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '2rem',
        marginBottom: '3rem'
      }}>
        <MetricCard 
          title="My Locations" 
          value={data.total_locations} 
          icon="📍"
          description="Coffee shops tracked"
        />
        <MetricCard 
          title="Competitors" 
          value={data.competitors_tracked} 
          icon="🏢"
          description="Nearby businesses monitored"
        />
        <MetricCard 
          title="Active Alerts" 
          value={data.active_alerts} 
          icon="🚨"
          description="Requiring attention"
        />
        <MetricCard 
          title="Rating Advantage" 
          value={`+${data.avg_rating_delta}`} 
          icon="⭐"
          description="vs competitors"
        />
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
        borderRadius: '1rem',
        padding: '2rem',
        border: '1px solid #374151'
      }}>
        <h2 style={{ color: '#f3f4f6', marginBottom: '1rem', fontSize: '1.5rem' }}>
          🚀 Welcome to LocalPulse
        </h2>
        <p style={{ color: '#d1d5db', marginBottom: '1.5rem' }}>
          Your competitive intelligence dashboard is live! Track competitors, monitor ratings, 
          and get actionable insights for your multi-location business.
        </p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginTop: '2rem'
        }}>
          <FeatureCard 
            icon="☕" 
            title="Multi-Location Tracking"
            description="Monitor all your Vancouver coffee shop locations from one dashboard"
          />
          <FeatureCard 
            icon="🎯" 
            title="Competitor Analysis" 
            description="Track nearby competitors' ratings, reviews, and market changes"
          />
          <FeatureCard 
            icon="📊" 
            title="Weekly Intelligence"
            description="Automated competitive reports with actionable insights"
          />
          <FeatureCard 
            icon="🔔" 
            title="Smart Alerts"
            description="Get notified of rating drops, new competitors, and opportunities"
          />
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon, description }: any) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
      borderRadius: '1rem',
      padding: '2rem',
      border: '1px solid #4b5563',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{icon}</div>
      <h3 style={{ color: '#f9fafb', fontSize: '2rem', margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
        {value}
      </h3>
      <p style={{ color: '#e5e7eb', margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600' }}>
        {title}
      </p>
      <p style={{ color: '#9ca3af', margin: 0, fontSize: '0.9rem' }}>
        {description}
      </p>
    </div>
  )
}

function FeatureCard({ icon, title, description }: any) {
  return (
    <div style={{
      background: 'rgba(55, 65, 81, 0.5)',
      borderRadius: '0.75rem',
      padding: '1.5rem',
      border: '1px solid #4b5563'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{icon}</div>
      <h4 style={{ color: '#f3f4f6', margin: '0 0 0.5rem 0' }}>{title}</h4>
      <p style={{ color: '#d1d5db', margin: 0, fontSize: '0.9rem' }}>{description}</p>
    </div>
  )
}

export default App