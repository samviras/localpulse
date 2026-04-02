// Mock API endpoints for Vercel deployment
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { path } = req.query;

  if (path && path[0] === 'health') {
    res.status(200).json({ status: 'healthy', demo_mode: true });
  } else if (path && path[0] === 'companies') {
    res.status(200).json([
      {
        id: 1,
        name: "TechFlow Solutions",
        industry: "Software Development",
        website: "https://techflow.example.com",
        description: "AI-powered workflow automation platform",
        employee_count: 150,
        revenue: 5000000.0,
        location: "San Francisco, CA",
        created_at: "2024-01-01T00:00:00"
      },
      {
        id: 2,
        name: "DataSync Corp",
        industry: "Data Analytics",
        website: "https://datasync.example.com",
        description: "Real-time data integration and analytics",
        employee_count: 200,
        revenue: 8000000.0,
        location: "Austin, TX",
        created_at: "2024-01-01T00:00:00"
      },
      {
        id: 3,
        name: "CloudVault Inc",
        industry: "Cloud Storage",
        website: "https://cloudvault.example.com",
        description: "Enterprise cloud storage and backup solutions",
        employee_count: 300,
        revenue: 12000000.0,
        location: "Seattle, WA",
        created_at: "2024-01-01T00:00:00"
      }
    ]);
  } else if (path && path[0] === 'analysis') {
    res.status(200).json([
      {
        id: 1,
        company_id: 1,
        strengths: "Strong AI capabilities, user-friendly interface",
        weaknesses: "Limited enterprise features, high pricing",
        opportunities: "Growing automation market, enterprise expansion",
        threats: "Major tech companies entering space",
        market_share: 15.5,
        competitive_score: 7.2,
        analysis_date: "2024-01-01T00:00:00",
        company: {
          id: 1,
          name: "TechFlow Solutions",
          industry: "Software Development",
          location: "San Francisco, CA"
        }
      },
      {
        id: 2,
        company_id: 2,
        strengths: "Real-time processing, robust API",
        weaknesses: "Complex setup, steep learning curve",
        opportunities: "IoT data boom, edge computing trend",
        threats: "Open source alternatives, privacy regulations",
        market_share: 22.3,
        competitive_score: 8.1,
        analysis_date: "2024-01-01T00:00:00",
        company: {
          id: 2,
          name: "DataSync Corp",
          industry: "Data Analytics",
          location: "Austin, TX"
        }
      }
    ]);
  } else if (path && path[0] === 'trends') {
    res.status(200).json([
      {
        id: 1,
        trend: "AI Automation Growth",
        impact: "High",
        date: "2024-01-01T00:00:00"
      },
      {
        id: 2,
        trend: "Remote Work Data Security",
        impact: "High",
        date: "2024-01-01T00:00:00"
      },
      {
        id: 3,
        trend: "Low-Code Platform Adoption",
        impact: "Medium",
        date: "2024-01-01T00:00:00"
      }
    ]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
}