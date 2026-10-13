import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Vercel insights
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/react"


import Navbar from './Navbar.jsx';
import Home from './Home.jsx';
import Portfolio from './Portfolio.jsx';
import Poker from './Poker.jsx';


function App() {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={
            <Layout>
              <Home />
            </Layout>
          }
        />
        <Route exact path="/portfolio" element={
            <Layout>
              <Portfolio />
            </Layout>
          }
        />
        <Route exact path="/gto-trainer" element={<Poker />} />
      </Routes>
      <Analytics />
      <SpeedInsights />
    </Router>
  );
}

function Layout({ children }) {
  return (
    <div className="App">
      <Navbar />
      <div className="content">
        {children}
      </div>
    </div>
  );
}

export default App;
