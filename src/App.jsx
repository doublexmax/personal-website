import { lazy, Suspense, useLayoutEffect } from 'react';
import { Routes, Route, useLocation, useNavigationType } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import SiteLayout from './components/SiteLayout.jsx';
import HomePage from './pages/HomePage.jsx';
import PortfolioPage from './pages/PortfolioPage.jsx';

const PokerTrainerPage = lazy(() => import('./features/poker/PokerTrainerPage.jsx'));

export default function App() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useLayoutEffect(() => {
    if (navigationType !== 'POP') {
      window.scrollTo(0, 0);
    }
  }, [pathname, navigationType]);

  return (
    <>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
        </Route>
        <Route path="/gto-trainer" element={
          <Suspense fallback={<p role="status">Loading trainer...</p>}>
            <PokerTrainerPage />
          </Suspense>
        } />
      </Routes>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
