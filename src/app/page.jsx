import { useEffect } from 'react';
import { useNavigate } from 'react-router';

export default function Page() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      // Redirect based on user type
      if (user.userType === 'owner') {
        navigate('/owner/dashboard');
      } else {
        navigate('/tenant/dashboard');
      }
    }
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#0f1419'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px', padding: '2rem' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem', color: '#f7fafc' }}>🏢 Nivasi</h1>
        <p style={{ color: '#cbd5e0', fontSize: '1.2rem', marginBottom: '2rem' }}>
          Property Management System
        </p>
        <p style={{ color: '#a0aec0', fontSize: '1rem', marginBottom: '3rem', lineHeight: '1.6' }}>
          Manage your properties, tenants, and payments all in one place. 
          Perfect for property owners and tenants to stay connected.
        </p>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '1rem',
          marginBottom: '3rem'
        }}>
          <FeatureCard icon="🏢" text="Property Management" />
          <FeatureCard icon="👥" text="Tenant Portal" />
          <FeatureCard icon="💰" text="Rent Tracking" />
          <FeatureCard icon="🔧" text="Maintenance" />
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a 
            href="/account/signup" 
            style={{
              padding: '0.875rem 2rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              display: 'inline-block',
              fontWeight: '600',
              fontSize: '1rem',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
          >
            Get Started
          </a>
          <a 
            href="/account/signin" 
            style={{
              padding: '0.875rem 2rem',
              backgroundColor: '#1a1f2e',
              color: '#63b3ed',
              textDecoration: 'none',
              borderRadius: '8px',
              display: 'inline-block',
              fontWeight: '600',
              fontSize: '1rem',
              border: '2px solid #3b82f6',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#2d3748'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#1a1f2e'}
          >
            Sign In
          </a>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, text }) {
  return (
    <div style={{
      backgroundColor: '#1a1f2e',
      border: '1px solid #2d3748',
      borderRadius: '8px',
      padding: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    }}>
      <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      <span style={{ color: '#cbd5e0', fontSize: '0.875rem' }}>{text}</span>
    </div>
  );
}
