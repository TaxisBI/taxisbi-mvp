import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  getThemeBuilderContextForReport,
  isThemeBuilderReportId,
  ThemeBuilderReportId,
} from '../theme/navigation';
import { APP_ROUTES, getThemeBuilderPath } from './routes';
import LandingPage from './pages/LandingPage';
import PlaceholderPage from './pages/PlaceholderPage';

const ARAgingBucketPage = lazy(() => import('../reports/ar/aging-bucket/ARAgingBucketPage'));
const ThemeBuilderPage = lazy(() => import('../reports/theme-builder/ThemeBuilderPage'));

function ThemeBuilderRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const rawReportId = params.reportId;
  const state = (location.state as { fromReportPath?: string } | null) ?? null;
  const fromReportPath = typeof state?.fromReportPath === 'string' ? state.fromReportPath : null;

  const reportId: ThemeBuilderReportId =
    rawReportId && isThemeBuilderReportId(rawReportId) ? rawReportId : 'ar-aging';

  return (
    <ThemeBuilderPage
      context={getThemeBuilderContextForReport(reportId)}
      onBackToLanding={() => {
        navigate(APP_ROUTES.landing);
      }}
      canBackToReport={Boolean(fromReportPath)}
      onBackToReport={() => {
        if (fromReportPath) {
          navigate(fromReportPath);
        }
      }}
    />
  );
}

function ARAgingBucketRoute() {
  const navigate = useNavigate();
  return (
    <ARAgingBucketPage
      onOpenThemeBuilder={(reportId) => {
        navigate(getThemeBuilderPath(reportId), {
          state: { fromReportPath: APP_ROUTES.arAgingBucket },
        });
      }}
    />
  );
}

export default function App() {
  return (
    <Suspense fallback={<div>Loading report...</div>}>
      <Routes>
        <Route path={APP_ROUTES.landing} element={<LandingPage />} />
        <Route path={APP_ROUTES.themeBuilder} element={<ThemeBuilderRoute />} />
        <Route path={APP_ROUTES.themeBuilderWithReport} element={<ThemeBuilderRoute />} />

        <Route path={APP_ROUTES.arAgingBucket} element={<ARAgingBucketRoute />} />

        <Route
          path={APP_ROUTES.apPayablesOverview}
          element={<PlaceholderPage title="AP Payables Overview" subtitle="This domain route is ready for AP chart integration." />}
        />
        <Route
          path={APP_ROUTES.otherStarter}
          element={<PlaceholderPage title="Domain Starter" subtitle="This route is reserved for future domain dashboards." />}
        />

        <Route path="*" element={<Navigate to={APP_ROUTES.landing} replace />} />
      </Routes>
    </Suspense>
  );
}
