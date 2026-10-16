import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import './project-card.css';

export default function ProjectCard({ project }) {
  const label = <>{project.linkLabel} <i className="bi bi-arrow-right"></i></>;
  const className = `btn btn-danger${project.linkClass ? ` ${project.linkClass}` : ''}`;

  return (
    <div className="card bg-dark h-100 project-card">
      <img className="card-img-top" src={project.image} alt={project.imageAlt} />
      <div className="card-body">
        <h5 className="card-title">{project.title}</h5>
        <p className="card-text">
          {project.description.map((paragraph, index) => (
            <Fragment key={paragraph}>
              {index > 0 && <br />}
              {paragraph}
            </Fragment>
          ))}
        </p>
        {project.external ? (
          <a href={project.href} className={className} target="_blank" rel="noreferrer">{label}</a>
        ) : (
          <Link to={project.href} className={className}>{label}</Link>
        )}
      </div>
    </div>
  );
}
