import { Link } from 'react-router-dom';
import './project-card.css';

export default function ProjectCard({ project }) {
  const label = <>{project.linkLabel} <i className="bi bi-arrow-right" aria-hidden="true"></i></>;
  const className = `btn btn-danger${project.linkClass ? ` ${project.linkClass}` : ''}`;

  return (
    <article className="project-card">
      <img className="card-img-top" src={project.image} alt={project.imageAlt} />
      <div className="card-body">
        <h2 className="card-title">{project.title}</h2>
        <div className="card-text">
          {project.description.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        </div>
        {project.external ? (
          <a href={project.href} className={className} target="_blank" rel="noreferrer">{label}</a>
        ) : (
          <Link to={project.href} className={className}>{label}</Link>
        )}
      </div>
    </article>
  );
}
