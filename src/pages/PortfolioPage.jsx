import ProjectCard from '../components/ProjectCard.jsx';
import { projects } from '../data/projects.js';
import './portfolio.css';

const rows = [
  { className: 'first-row', projects: projects.slice(0, 2) },
  { className: 'second-row', projects: projects.slice(2) },
];

export default function PortfolioPage() {
  return (
    <div className="portfolio">
      <div className="container">
        <div className="row mb-4">
          <h2 className="text-center m-auto portfolio-header">A Collection of My Projects</h2>
        </div>
        {rows.map((row) => (
          <div className={`row ${row.className} mb-4`} key={row.className}>
            {row.projects.map((project) => (
              <div className="col-md" key={project.id}>
                <ProjectCard project={project} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
