import { useEffect, useState } from "react";

function Home() {
    return (
        <div className="home">
            <div className="row mb-1">
                <div className="main col-6">
                    <h2><u>I'm Maxx.</u></h2>
                    <p>Current Computer Science and Maths student at Northeastern University.</p>
                    <p >Full Stack Developer at &nbsp;
                        <a href="https://www.youtube.com/@CasinoQuest" target="_blank" rel="noreferrer">Casino Quest</a>
                        &nbsp; / &nbsp;
                        <a href="https://cegdealers.com/" target="_blank" rel="noreferrer">CEG Dealer School</a>
                        .
                    </p>
                </div>
                <div className="extra col-3">
                    <figure className="figure">
                        <img src="1657750750531.jpg" className="me-image figure-img img-fluid"></img>
                        <figcaption className="figure-caption text-white text-left">Contact Me: <a href="mailto:maxxtandon@gmail.com">maxxtandon@gmail.com</a></figcaption>
                    </figure>
                </div>
            </div>
            <div className="row experience-container mb-4">
                <div className="col-9 experience">
                    <h3 className="experience-header">My Experience</h3>
                    <p className="about-me">
                        For the past 2 years, I've been working as a Full Stack Developer part-time during university and full-time over summers, with back-ends in Python (web.py, Flask) and MySQL, and front-ends in HTML/CSS/JS (though this site is written in React!).
                        <br className="spacer" />
                        Along with programming languages, I have experience in WordPress and Shopify CMS's, as well as their respective APIs.
                        <br className="spacer" />
                        In academics, I focus on DSA, aiming to cover all areas web-development, software development, and machine learning. 
                    </p>
                </div>
            </div>
            <div className="row why-cs-container mt-4">
                <div className="col-9 why-cs">
                    <h3 className="why-cs-header">Why Computer Science?</h3>
                    <p className="why-cs-main">
                        My love for computers started from building basic websites on a Windows XP laptop for my parents' farmers market business, where I helped out by being a cashier
                        from as early as I can remember doing the totals in my head.
                        <br className="spacer"></br>
                        From there, it evolved to making scripts for solving maths and physics equations in school and small things that'd help out on my computer (my first was a reminder to give my eyes a break!).
                        <br className="spacer"></br>
                        Now, studying computer science theoretically, the culmination of my years has shown me that computer science is not a discipline on its own; as any other subject, concepts and theories can be 
                        applied and intertwined with various ideas from other fields.
                        <br className="spacer"></br>
                        With computer science built on the foundations of math in an applied format, I enjoy using it to bridge the gap between various studies in both the humanities and STEM to allow
                        the subjects to evolve with each other, not alone -- for each discipline can only do so much on its own, as they are all but a reflection of us.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Home;