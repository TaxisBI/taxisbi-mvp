import { Suspense, lazy } from 'react';

const ARAgingBucketPage = lazy(() => import('../reports/ar/aging-bucket/ARAgingBucketPage'));

export default function App() {
  return (
    <Suspense fallback={<div>Loading report...</div>}>
      <ARAgingBucketPage />
    </Suspense>
  );
}
