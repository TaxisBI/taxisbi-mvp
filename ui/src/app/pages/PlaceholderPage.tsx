import { Link } from 'react-router-dom';
import { APP_ROUTES } from '../routes';

type PlaceholderPageProps = {
  title: string;
  subtitle: string;
};

export default function PlaceholderPage({ title, subtitle }: PlaceholderPageProps) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        color: '#0f172a',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: 'min(760px, 100%)',
          background: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: 14,
          padding: '18px 20px',
          boxShadow: '0 10px 22px rgba(15,23,42,0.08)',
          display: 'grid',
          gap: 8,
        }}
      >
        <h2 style={{ margin: 0 }}>{title}</h2>
        <p style={{ margin: 0, opacity: 0.8 }}>{subtitle}</p>
        <div style={{ marginTop: 8 }}>
          <Link
            to={APP_ROUTES.landing}
            style={{
              textDecoration: 'none',
              border: '1px solid #cbd5e1',
              borderRadius: 8,
              padding: '7px 11px',
              color: '#0f172a',
              background: '#ffffff',
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            Back to Landing
          </Link>
        </div>
      </div>
    </div>
  );
}
