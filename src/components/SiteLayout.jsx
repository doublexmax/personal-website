import { Outlet } from 'react-router-dom';
import SiteHeader from './SiteHeader.jsx';
import './site-layout.css';

export default function SiteLayout() {
  return (
    <div className="site-layout">
      <SiteHeader />
      <main className="site-content">
        <Outlet />
      </main>
    </div>
  );
}
