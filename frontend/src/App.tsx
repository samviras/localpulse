import React, { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

interface DashboardSummary {
  total_locations: number
  competitors_tracked: number
  active_alerts: number
  avg_rating_delta: number
}

function App() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await axios.get(`${API_BASE}/dashboard/summary`)
        setSummary(response.data)
      } catch (error) {
        console.error('Failed to fetch summary:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchSummary()
  }, [])

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '1200px', 
      margin: '0 auto' 
    }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          marginBottom: '0.5rem',
          color: '#3b82f6'
        }}>
          🔍 LocalPulse
        </h1>
        <p style={{ 
          color: '#9ca3af', 
          fontSize: '1.1rem' 
        }}>
          Competitive Intelligence Dashboard
        </p>
      </header>

      {summary && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <StatCard
            title="My Locations"
            value={summary.total_locations}
            icon="📍"
          />
          <StatCard
            title="Competitors Tracked"
            value={summary.competitors_tracked}
            icon="🏢"
          />
          <StatCard
            title="Active Alerts"
            value={summary.active_alerts}
            icon="⚠️"
          />
          <StatCard
            title="Rating Delta"
            value={`+${summary.avg_rating_delta}`}
            icon="📈"
          />
        </div>
      )}

      <div style={{
        backgroundColor: '#111827',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        border: '1px solid #374151'
      }}>
        <h2 style={{ 
          marginBottom: '1rem',
          color: 'white'
        }}>
          🚀 Welcome to LocalPulse
        </h2>
        <p style={{ 
          color: '#d1d5db',
          lineHeight: '1.6' 
        }}>
          Your competitive intelligence dashboard is ready! This demo showcases:
        </p>
        <ul style={{ 
          color: '#d1d5db',
          paddingLeft: '1.5rem',
          lineHeight: '1.6',
          marginTop: '1rem' 
        }}>
          <li>☕ Multi-location business tracking (Vancouver coffee shops)</li>
          <li>🎯 Competitor monitoring and analysis</li>
          <li>🔔 Real-time alerts for market changes</li>
          <li>📊 Weekly competitive briefs</li>
          <li>🗺️ Location-based intelligence</li>
        </ul>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: string
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div style={{
      backgroundColor: '#111827',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      border: '1px solid #374151'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <p style={{ 
            color: '#9ca3af',
            fontSize: '0.875rem',
            marginBottom: '0.5rem'
          }}>
            {title}
          </p>
          <p style={{
            color: 'white',
            fontSize: '1.875rem',
            fontWeight: 'bold',
            margin: 0
          }}>
            {value}
          </p>
        </div>
        <div style={{ fontSize: '2rem' }}>
          {icon}
        </div>
      </div>
    </div>
  )
}

export default App