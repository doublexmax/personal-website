import ProjectCard from '../components/ProjectCard.jsx';
import { projects } from '../data/projects.js';
import './portfolio.css';

export default function PortfolioPage() {
  return (
    <section className="portfolio">
      <h1 className="portfolio-header">A Collection of My Projects</h1>
      <div className="project-grid">
        {projects.map(project => (
          <ProjectCard project={project} key={project.id} />
        ))}
      </div>
    </section>
  );
}
