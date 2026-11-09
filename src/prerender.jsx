import { renderToString } from 'react-dom/server';
import { Route, Routes, StaticRouter } from 'react-router-dom';
import SiteLayout from './components/SiteLayout.jsx';
import PortfolioPage from './pages/PortfolioPage.jsx';

export function renderPortfolio() {
  return renderToString(
    <StaticRouter location="/portfolio">
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/portfolio" element={<PortfolioPage />} />
        </Route>
      </Routes>
    </StaticRouter>
  );
}
