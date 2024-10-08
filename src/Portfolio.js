import './portfolio.css';
import './index.css';

function Portfolio() {
    return (
        <div className="portfolio">
            <div className="container">
                <div className="row mb-4">
                    <h2 className="text-center m-auto portfolio-header">A Collection of My Projects</h2>
                </div>
                <div className="row first-row mb-4">
                    <div className="col-md">
                        <div className="card bg-dark h-100">
                            <img className="card-img-top" src="dealer_school_banner.png" alt="Card image cap" />
                            <div className="card-body">
                                <h5 className="card-title">dealers.school</h5>
                                <p className="card-text">
                                    An LMS for an online dealer school, where students can learn table games and other casino-related areas.
                                    <br></br>
                                    Connects to our in-person training center allowing students to view their on-site progression online.
                                    </p>
                                <a href="https://dealers.school/" className="btn btn-danger" target="_blank" rel="noreferrer">Check it out <i className="bi bi-arrow-right"></i></a>
                            </div>
                        </div>
                        
                    </div>
                    <div className="col-md">
                        <div className="card bg-dark h-100">
                            <img className="card-img-top" src="fischer_random_banner.png" alt="Card image cap" />
                            <div className="card-body">
                                <h5 className="card-title">A Fischer Random Chess Engine</h5>
                                <p className="card-text">Multiple machine learning models built to evaluate and play Fischer Random Chess: a variant with randomized starting positions.</p>
                                <a href="https://github.com/willredding314/FischerRandom" className="btn btn-danger btn-fischer-random" target="_blank" rel="noreferrer">Check out the repository <i className="bi bi-arrow-right"></i></a>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row second-row mb-4">
                    <div className="col-md">
                        <div className="card bg-dark h-100">
                            <img className="card-img-top" src="gto_trainer.png" alt="Card image cap" />
                            <div className="card-body">
                                <h5 className="card-title">Game Theory Optimal Poker Trainer</h5>
                                <p className="card-text">
                                    A web-based app to intake GTO pre-flop charts and run simulations based on them.
                                    <br></br>
                                    Allow a user to train game theory optimal play with no subscription nor signup needed. All information is stored in the browser's local storage to allow changes to persist after refresh.
                                    </p>
                                <a href="/gto-trainer" className="btn btn-danger">Try it yourself <i className="bi bi-arrow-right"></i></a>
                            </div>
                        </div>
                        
                    </div>
                </div>
            </div>
        </div>
    )
}


export default Portfolio;