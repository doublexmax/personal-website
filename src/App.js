import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Vercel insights
import { SpeedInsights } from "@vercel/speed-insights/react"
import { Analytics } from "@vercel/analytics/react"


import Navbar from './Navbar';
import Home from './Home';
import Portfolio from './Portfolio';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar></Navbar>
        <div className="content">
          <Routes>
            <Route exact path="/" element={<Home />}>
            </Route>
            <Route exact path="/portfolio" element={<Portfolio />}>
            </Route>
          </Routes>
        </div>
        <Analytics />
        <SpeedInsights />
      </div>
    </Router>
  );
}

export default App;
