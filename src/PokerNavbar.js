export function PokerNavbar({pause, setPause, invertRNG, setInvertRNG, RFIOnly, setRFIOnly, threeBetOnly, setThreeBetOnly}) {
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
                <input className="form-check-input" type="checkbox" value="" id="rfi-check" checked={RFIOnly} onChange={
                    () => {
                            setRFIOnly(RFIOnly ^ 1);
                            if (RFIOnly == 0 && threeBetOnly == 1) {
                                setThreeBetOnly(false);
                            }
                        }
                    } 
                />
                <label className="form-check-label rfi-label" htmlFor="rfi-check">
                    <p data-bs-toggle="tooltip" title="Generate only raise-first-in spots.">RFI Only</p>
                </label>
            </div>
            <div className="form-check">
                <input className="form-check-input" type="checkbox" value="" id="threebet-check" checked={threeBetOnly}  onChange={
                    () => {
                            setThreeBetOnly(threeBetOnly ^ 1);
                            if (threeBetOnly == 0 && RFIOnly == 1) {
                                setRFIOnly(false);
                            }
                        }
                    }
                />
                <label className="form-check-label threebet-label" htmlFor="threebet-check">
                    <p data-bs-toggle="tooltip" title="Generate only three-bet spots.">3B Only</p>
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