import { Suspense, lazy, useState } from 'react';
import type { ThemeBuilderContext } from '../theme/types';

const ARAgingBucketPage = lazy(() => import('../reports/ar/aging-bucket/ARAgingBucketPage'));
const ThemeBuilderPage = lazy(() => import('../reports/theme-builder/ThemeBuilderPage'));

type ReportRoute = 'ar-aging';

type AppRoute =
  | { name: 'ar-aging' }
  | {
      name: 'theme-builder';
      returnTo: ReportRoute;
      context: ThemeBuilderContext;
    };

export default function App() {
  const [route, setRoute] = useState<AppRoute>({ name: 'ar-aging' });

  return (
    <Suspense fallback={<div>Loading report...</div>}>
      {route.name === 'ar-aging' ? (
        <ARAgingBucketPage
          onOpenThemeBuilder={(context) => {
            setRoute({
              name: 'theme-builder',
              returnTo: 'ar-aging',
              context,
            });
          }}
        />
      ) : (
        <ThemeBuilderPage
          context={route.context}
          onBack={() => {
            setRoute({ name: route.returnTo });
          }}
        />
      )}
    </Suspense>
  );
}
