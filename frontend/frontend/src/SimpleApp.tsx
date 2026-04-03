import React from 'react';
import './App.css';

function SimpleApp() {
  const companies = [
    {
      id: 1,
      name: "TechFlow Solutions",
      industry: "Software Development",
      location: "San Francisco, CA",
      employee_count: 150,
      revenue: 5000000
    },
    {
      id: 2,
      name: "DataSync Corp", 
      industry: "Data Analytics",
      location: "Austin, TX",
      employee_count: 200,
      revenue: 8000000
    },
    {
      id: 3,
      name: "CloudVault Inc",
      industry: "Cloud Storage", 
      location: "Seattle, WA",
      employee_count: 300,
      revenue: 12000000
    }
  ];

  const analysis = [
    {
      id: 1,
      company: "TechFlow Solutions",
      market_share: 15.5,
      competitive_score: 7.2,
      strengths: "Strong AI capabilities, user-friendly interface",
      weaknesses: "Limited enterprise features, high pricing"
    },
    {
      id: 2,  
      company: "DataSync Corp",
      market_share: 22.3,
      competitive_score: 8.1,
      strengths: "Real-time processing, robust API",
      weaknesses: "Complex setup, steep learning curve"
    }
  ];

  const trends = [
    { id: 1, trend: "AI Automation Growth", impact: "High" },
    { id: 2, trend: "Remote Work Data Security", impact: "High" }, 
    { id: 3, trend: "Low-Code Platform Adoption", impact: "Medium" }
  ];

  return (
    <div className="App">
      <header className="App-header">
        <h1>🔍 LocalPulse</h1>
        <p>Competitive Intelligence Dashboard</p>
      </header>

      <main className="dashboard">
        <section className="companies-section">
          <h2>Companies ({companies.length})</h2>
          <div className="cards">
            {companies.map((company) => (
              <div key={company.id} className="card">
                <h3>{company.name}</h3>
                <p><strong>Industry:</strong> {company.industry}</p>
                <p><strong>Location:</strong> {company.location}</p>
                <p><strong>Employees:</strong> {company.employee_count}</p>
                <p><strong>Revenue:</strong> ${(company.revenue / 1000000).toFixed(1)}M</p>
              </div>
            ))}
          </div>
        </section>

        <section className="analysis-section">
          <h2>Competitive Analysis ({analysis.length})</h2>
          <div className="cards">
            {analysis.map((item) => (
              <div key={item.id} className="card">
                <h3>{item.company}</h3>
                <p><strong>Market Share:</strong> {item.market_share}%</p>
                <p><strong>Score:</strong> {item.competitive_score}/10</p>
                <p><strong>💪 Strengths:</strong> {item.strengths}</p>
                <p><strong>⚠️ Weaknesses:</strong> {item.weaknesses}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="trends-section">
          <h2>Market Trends ({trends.length})</h2>
          <div className="cards">
            {trends.map((trend) => (
              <div key={trend.id} className="card">
                <h3>📈 {trend.trend}</h3>
                <div className={`impact impact-${trend.impact.toLowerCase()}`}>
                  Impact: {trend.impact}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer style={{textAlign: 'center', padding: '2rem', color: '#64748b'}}>
        <p>LocalPulse - Competitive Intelligence Platform</p>
        <p>Successfully deployed with modern React architecture</p>
      </footer>
    </div>
  );
}

export default SimpleApp;