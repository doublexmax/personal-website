export function PokerNavbar({pause, setPause, invertRNG, setInvertRNG}) {
    function togglePopup() {
        if (document.getElementById("popupBackground").style.display === "flex") {
            hidePopup();
        }
        else {
            showPopup();
        }
    }

    function hidePopup() {
        document.getElementById("popupBackground").style.display = "none";
    };

    function showPopup() {
        document.getElementById("popupBackground").style.display = "flex";
    };

    return (
        <div className="PokerNavbar">
            <nav className="navbar sticky-top poker-nav ">
            <a className="navbar-brand home-btn" href="/"><img src="MT.png" className="home-btn-img"></img></a>
            <div className="form-check">
                <input className="form-check-input" type="checkbox" value="" id="pause-check" checked={pause} onChange={() => setPause(pause ^ 1)} />
                <label className="form-check-label pause-label" htmlFor="pause-check">
                    <p data-bs-toggle="tooltip" title="Fold through until hero's action with pauses.">Slow Mode</p>
                </label>
            </div>
            <div className="form-check">
                <input className="form-check-input" type="checkbox" value="" id="rng-check" checked={invertRNG} onChange={() => setInvertRNG(invertRNG ^ 1)} />
                <label className="form-check-label rng-label" htmlFor="rng-check">
                    <p data-bs-toggle="tooltip" title="Instead of using low RNG numbers for low frequency actions, use high RNG numbers instead.">Invert RNG</p>
                </label>
            </div>
            <div id="navbarNav">
                <ul className="navbar-nav">
                <li className="nav-item active">
                    <a className="nav-link" href="#"><button onClick={() => togglePopup()} className="charts-btn btn"> Manage Charts <i className="bi bi-gear"></i></button></a>
                </li>
                </ul>
            </div>

            </nav>
        </div>
    )
}