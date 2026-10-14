import { Link } from 'react-router-dom';
import { images } from '../data/images.js';
import './site-header.css';

export default function SiteHeader() {
  return (
    <nav className="navbar nav-shell site-header">
      <Link to="/" className="link-container">
        <img src={images.logo} className="personal-logo mr-4" alt="" />
        <p className="typewriter"></p>
      </Link>
      <div className="links">
        <a href="https://www.linkedin.com/in/maxxtandon/" target="_blank" rel="noreferrer">LinkedIn</a>
        <a href="https://github.com/doublexmax/" target="_blank" rel="noreferrer">GitHub</a>
        <a href="https://medium.com/@doublexmax" target="_blank" rel="noreferrer">Blog</a>
        <a href="/Maxx_Tandon_Resume.pdf" target="_blank">Resume</a>
      </div>
    </nav>
  );
}
