import { Link } from 'react-router-dom';
import { images } from '../data/images.js';
import './site-header.css';

export default function SiteHeader() {
  return (
    <nav className="site-header" aria-label="Main navigation">
      <Link to="/" className="link-container" aria-label="Maxx Tandon home">
        <img src={images.logo} className="personal-logo" alt="Maxx Tandon logo" />
        <span className="site-name" aria-hidden="true">
          <span className="typewriter-command">$ whoami</span>
          <span className="typewriter-name">&gt; Maxx Tandon</span>
        </span>
      </Link>
      <div className="links">
        <a href="https://www.linkedin.com/in/maxxtandon/" target="_blank" rel="noreferrer">LinkedIn</a>
        <a href="https://github.com/doublexmax/" target="_blank" rel="noreferrer">GitHub</a>
        <a href="https://medium.com/@doublexmax" target="_blank" rel="noreferrer">Blog</a>
        <a href="/Maxx_Tandon_Resume.pdf" target="_blank" rel="noreferrer">Resume</a>
      </div>
    </nav>
  );
}
