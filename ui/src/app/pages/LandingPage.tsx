import { useState } from 'react';
import { Link } from 'react-router-dom';
import { APP_ROUTES, getThemeBuilderPath } from '../routes';

type DomainItem = {
  label: string;
  path: string;
  description: string;
};

type DomainSection = {
  id: string;
  label: string;
  items: DomainItem[];
};

const DOMAIN_SECTIONS: DomainSection[] = [
  {
    id: 'ar',
    label: 'AR',
    items: [
      {
        label: 'AR Aging Bucket',
        path: APP_ROUTES.arAgingBucket,
        description: 'Receivables aging analysis with bucket controls and live chart.',
      },
    ],
  },
  {
    id: 'ap',
    label: 'AP',
    items: [
      {
        label: 'AP Payables Overview',
        path: APP_ROUTES.apPayablesOverview,
        description: 'Upcoming AP overview experience.',
      },
    ],
  },
  {
    id: 'other',
    label: 'Other Domains',
    items: [
      {
        label: 'Future Domain Starter',
        path: APP_ROUTES.otherStarter,
        description: 'Placeholder route for additional domain rulebooks and dashboards.',
      },
    ],
  },
];

function OpenLinks({ path }: { path: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <Link
        to={path}
        style={{
          textDecoration: 'none',
          border: '1px solid #cbd5e1',
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: 8,
          padding: '6px 10px',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        Open
      </Link>
      <a
        href={path}
        target="_blank"
        rel="noreferrer"
        style={{
          textDecoration: 'none',
          border: '1px solid #cbd5e1',
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: 8,
          padding: '6px 10px',
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        New Tab
      </a>
    </div>
  );
}

export default function LandingPage() {
  const [expandedByDomain, setExpandedByDomain] = useState<Record<string, boolean>>({
    ar: true,
    ap: false,
    other: false,
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(1200px 550px at 10% -10%, #d9f99d 0%, rgba(217,249,157,0.35) 25%, rgba(255,255,255,0) 60%), linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        color: '#0f172a',
        padding: '22px 16px 26px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: 'min(1220px, 100%)', margin: '0 auto', display: 'grid', gap: 14 }}>
        <div
          style={{
            border: '1px solid #cbd5e1',
            borderRadius: 14,
            padding: '18px 20px',
            background: 'rgba(255,255,255,0.8)',
            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
          }}
        >
          <h1 style={{ margin: '0 0 6px', fontSize: 28, lineHeight: 1.1 }}>TaxisBI</h1>
          <p style={{ margin: 0, fontSize: 14, opacity: 0.8 }}>
            Choose a workspace to continue. Each option opens with its own URL route.
          </p>
        </div>

        <div
          style={{
            border: '1px solid #cbd5e1',
            borderRadius: 12,
            padding: 14,
            background: '#ffffff',
            display: 'grid',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <strong style={{ fontSize: 14 }}>Theme Builder</strong>
              <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.75 }}>
                Global theme customization workspace.
              </p>
            </div>
            <OpenLinks path={getThemeBuilderPath()} />
          </div>
        </div>

        <div
          style={{
            border: '1px solid #cbd5e1',
            borderRadius: 12,
            padding: 14,
            background: '#ffffff',
            display: 'grid',
            gap: 10,
          }}
        >
          <strong style={{ fontSize: 14 }}>Domains</strong>
          {DOMAIN_SECTIONS.map((section) => {
            const isExpanded = Boolean(expandedByDomain[section.id]);
            return (
              <div key={section.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10 }}>
                <button
                  type="button"
                  onClick={() =>
                    setExpandedByDomain((current) => ({
                      ...current,
                      [section.id]: !Boolean(current[section.id]),
                    }))
                  }
                  style={{
                    width: '100%',
                    border: 'none',
                    background: '#f8fafc',
                    color: '#0f172a',
                    borderRadius: 10,
                    padding: '10px 12px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{section.label}</span>
                  <span>{isExpanded ? 'v' : '>'}</span>
                </button>

                {isExpanded ? (
                  <div style={{ padding: 10, display: 'grid', gap: 8 }}>
                    {section.items.map((item) => (
                      <div
                        key={item.path}
                        style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: 8,
                          padding: '8px 10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 10,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{item.label}</div>
                          <div style={{ fontSize: 12, opacity: 0.7 }}>{item.description}</div>
                          <div style={{ fontSize: 11, opacity: 0.6 }}>{item.path}</div>
                        </div>
                        <OpenLinks path={item.path} />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

