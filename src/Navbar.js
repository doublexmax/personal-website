function Navbar() {
    return ( 
        <nav className="navbar">
            <a href="/" className="link-container">
                <img src="MT.png" className="personal-logo"></img>
                <h2 className="typewriter"></h2>
            </a>
            <div className="links">
                <a href="https://www.linkedin.com/in/maxxtandon/" target="_blank" rel="noreferrer">LinkedIn</a>
                <a href="https://github.com/doublexmax/" target="_blank" rel="noreferrer">GitHub</a>
                <a href="https://medium.com/@doublexmax" target="_blank" rel="noreferrer">Blog</a>
                <a href="Maxx_Tandon_Resume.pdf" target="_blank">Resume</a>
            </div>
        </nav>
    );
}

export default Navbar;