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
                        <div class="card bg-dark h-100">
                            <img class="card-img-top" src="dealer_school_banner.png" alt="Card image cap" />
                            <div class="card-body">
                                <h5 class="card-title">dealers.school</h5>
                                <p class="card-text">
                                    An LMS for an online dealer school, where students can learn table games and other casino-related areas.
                                    <br></br>
                                    Connects to our in-person training center allowing students to view their on-site progression online.
                                    </p>
                                <a href="https://dealers.school/" class="btn btn-danger" target="_blank" rel="noreferrer">Check it out <i className="bi bi-arrow-right"></i></a>
                            </div>
                        </div>
                        
                    </div>
                    <div className="col-md">
                        <div class="card bg-dark h-100">
                            <img class="card-img-top" src="fischer_random_banner.png" alt="Card image cap" />
                            <div class="card-body">
                                <h5 class="card-title">A Fischer Random Chess Engine</h5>
                                <p class="card-text">Multiple machine learning models built to evaluate and play Fischer Random Chess: a variant with randomized starting positions.</p>
                                <a href="https://github.com/willredding314/FischerRandom" class="btn btn-danger btn-fischer-random" target="_blank" rel="noreferrer">Check out the repository <i className="bi bi-arrow-right"></i></a>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row second-row mb-4">
                    <div className="col-md">
                        <div class="card bg-dark h-100">
                            <img class="card-img-top" src="gto_trainer.png" alt="Card image cap" />
                            <div class="card-body">
                                <h5 class="card-title">Game Theory Optimal Poker Trainer</h5>
                                <p class="card-text">
                                    A web-based app to intake GTO pre-flop charts and run simulations based on them.
                                    <br></br>
                                    Allow a user to train game theory optimal play without need for an account, with information all stored in cookies.
                                    <br></br>
                                    Note: currently only supports desktop mode. Mobile visual support coming soon.
                                    </p>
                                <a href="/gto-trainer" class="btn btn-danger">Try it yourself <i className="bi bi-arrow-right"></i></a>
                            </div>
                        </div>
                        
                    </div>
                </div>
            </div>
        </div>
    )
}


export default Portfolio;