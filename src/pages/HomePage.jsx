import { Link } from 'react-router-dom';
import { images } from '../data/images.js';
import './home.css';

function HomePage() {
    return (
        <div className="home">
            <section className="home-intro">
                <div className="main">
                    <h1>I'm Maxx.</h1>
                    <p>Software Engineer @ Microsoft inside of Azure Core's OneDeploy team.</p>
                    <p>Computer Science and Mathematics Alum from Northeastern University.</p>
                    <div>
                        <Link className="btn btn-portfolio" to="/portfolio">Portfolio <i className="bi bi-arrow-right" aria-hidden="true"></i></Link>
                    </div>
                </div>
                <div className="extra">
                    <figure>
                        <img src={images.portrait} className="me-image" alt="Maxx Tandon" />
                        <figcaption>Contact Me: <a href="mailto:maxxtandon@gmail.com">maxxtandon@gmail.com</a></figcaption>
                    </figure>
                </div>
            </section>
            <section className="home-section experience">
                <h2>My Experience</h2>
                <p>
                    I currently work on backend and platform engineering at Microsoft on Azure Core's OneDeploy team, building deployment safety systems, scaling health and change-correlation pipelines, and improving operability for service teams.
                </p>
                <p>
                    More recently, that work has expanded into internal agent tooling and MCP integrations that help teams ship more reliably at scale.
                </p>
                <p>
                    Before Microsoft, I worked as a Full Stack Developer at <a href="https://www.youtube.com/@CasinoQuest" target="_blank" rel="noreferrer">Casino Quest</a> / <a href="https://cegdealers.com/" target="_blank" rel="noreferrer">CEG Dealer School</a>, building Python, Flask, MySQL, and JavaScript tools for training products and business operations.
                </p>
            </section>
            <section className="home-section why-cs">
                <h2>Why Computer Science?</h2>
                <p>
                    My love for computers started from building basic websites on a Windows XP laptop for my parents' farmers market business, where I helped out by being a cashier
                    from as early as I can remember doing the totals in my head.
                </p>
                <p>
                    From there, it evolved to making scripts for solving maths and physics equations in school and small things that'd help out on my computer (my first was a reminder to give my eyes a break!).
                </p>
                <p>
                    Now, studying computer science theoretically, the culmination of my years has shown me that computer science is not a discipline on its own; as any other subject, concepts and theories can be
                    applied and intertwined with various ideas from other fields.
                </p>
                <p>
                    With computer science built on the foundations of math in an applied format, I enjoy using it to bridge the gap between various studies in both the humanities and STEM to allow
                    the subjects to evolve with each other, not alone -- for each discipline can only do so much on its own, as they are all but a reflection of us and how we learn together.
                </p>
            </section>
        </div>
    );
}

export default HomePage;