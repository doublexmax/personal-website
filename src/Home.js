import { useEffect, useState } from "react";

function Home() {
    const [name, setName] = useState('test');

    const handleClick = (e) => {
        setName('update');
    };

    useEffect(() => {
        console.log('effect triggered');
    }, [name]);

    return (
        <div className="home">
            <div className="row mb-4">
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
                <div class="col-9 experience">
                    <h3 className="experience-header">My Experience</h3>
                    <p className="about-me">
                        For the past 2 years, I've been working as a Full Stack Developer part-time during university and full-time over summers, with back-ends in Python (web.py, Flask) and MySQL, and front-ends in HTML/CSS/JS (though this site is written in React!).
                        <br /><br></br>
                        Along with programming languages, I have experience in WordPress and Shopify CMS's, as well as their respective APIs.
                        <br /><br></br>
                        In academics, I focus on DSA, aiming to cover all areas web-development, software development, and machine learning. 
                    </p>
                </div>
            </div>
            <div className="row mt-4">
                <div className="col-9 why-cs">
                    <h3 className="why-cs-header">My Experience</h3>
                    <p className="why-cs-main">
                        For the past 2 years, I've been working as a Full Stack Developer part-time during university and full-time over summers, with back-ends in Python (web.py, Flask) and MySQL, and front-ends in HTML/CSS/JS (though this site is written in React!).
                        <br /><br></br>
                        Along with programming languages, I have experience in WordPress and Shopify CMS's, as well as their respective APIs.
                        <br /><br></br>
                        In academics, I focus on DSA, aiming to cover all areas web-development, software development, and machine learning. 
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Home;