import { useEffect, useState } from 'react';

import { PokerNavbar } from './PokerNavbar';
import { Chart } from './Chart';

import { nineMaxGenerator } from './generator';

import { nine_max_positions, suit_colors } from './info';
import { sleep } from './utils';

import './poker.css';

export default function Poker() {
  const [selectedPosition, setSelectedPosition] = useState('utg');
  const [selected3BPosition, setSelected3BPosition] = useState('empty');

  const [raiseValue, setRaiseValue] = useState(100);
  const [callValue, setCallValue] = useState(0);
  
  const [pause, setPause] = useState(true);
  const [invertRNG, setInvertRNG] = useState(false);
  const [RFIOnly, setRFIOnly] = useState(false);
  const [threeBetOnly, setThreeBetOnly] = useState(false);
  
  const [simResponse, setSimResponse] = useState();
  const [simAnswer, setSimAnswer] = useState();
  const [simHand, setSimHand] = useState();
  const [simRNG, setSimRNG] = useState();
  const [isSimulating, setIsSimulating] = useState(false); // Track simulation status

  const [numCorrect, setNumCorrect] = useState(0);
  const [totalSims, setTotalSims] = useState(0);

  useEffect(() => {
    if (totalSims === 0) {
      return
    }

  }, [totalSims]);

  useEffect(() => {
    nine_max_positions.forEach((position) => {
      const table = document.getElementById(position);
      if (table) {
        if (selected3BPosition === 'empty') {
          table.style.display = position === selectedPosition ? 'table' : 'none';
        } else {
          table.style.display = 'none';
        }
      }
    });
  }, [selectedPosition]);

  useEffect(() => {
    nine_max_positions.forEach((position, idx) => {
      if (idx < nine_max_positions[selected3BPosition]) {

        const table = document.getElementById(`${position}_vs_${selected3BPosition}`);
        if (table) {
          if (selected3BPosition === 'empty') {
            table.style.display = 'none';
          } else {
            table.style.display = position === selected3BPosition ? 'table' : 'none';
          }
        }
      }
    });
  }, [selected3BPosition]);


  useEffect(() => {
    if (simHand) {
      const card1_ele = document.getElementById('card1');
      const card2_ele = document.getElementById('card2');

      card1_ele.innerText = simHand[0];
      card2_ele.innerText = simHand[1];

      var card1_suit, card2_suit;

      if (simHand[2] === 'o' || (simHand[0] === simHand[1])) { //if offsuit or pocket pair
        card1_suit = suit_colors[Math.floor(Math.random() * suit_colors.length)];

        do {
          card2_suit = suit_colors[Math.floor(Math.random() * suit_colors.length)];
        } while (card1_suit === card2_suit);
      }
      else {
        card1_suit = card2_suit = suit_colors[Math.floor(Math.random() * suit_colors.length)];
      }

      card1_ele.style.backgroundColor = card1_suit;
      card2_ele.style.backgroundColor = card2_suit;
      
      document.getElementsByClassName('simulation')[0].style.display = "inline-flex";
    }
  }, [simHand]);

  useEffect(() => {
    if (!isSimulating) {
      return
    }

    
    var answer;
    const sim_details = document.getElementsByClassName('sim-details')[0];


    if (invertRNG) {
      if (simRNG <= simAnswer[1]) {
        answer = 'raise';
      }
      else if (simRNG <= simAnswer[0] + simAnswer[1]) {
        answer = 'call';
      }
      else {
        answer = 'fold';
      }
    }
    else {
      if (simRNG <= 100 - simAnswer[0] - simAnswer[1]) {
        answer = 'fold';
      }
      else if (simRNG <= 100 - simAnswer[1]) {
        answer = 'call';
      }
      else {
        answer = 'raise';
      }
    }


    if (answer === simResponse) {
      sim_details.innerText = 'Correct!';
      sim_details.style.color = 'green';

      setNumCorrect(numCorrect + 1);
    }
    else {
      sim_details.innerText = `Incorrect. Correct answer was to ${answer}! Call ${simAnswer[0]}%. Raise ${simAnswer[1]}% `;
      sim_details.style.color = 'red';
    }

    setTotalSims(totalSims + 1);

    setSimResponse(null);    

    setIsSimulating(false); // Mark simulation as completed
  }, [simResponse])

  const handleRaiseChange = (event) => {
    if (Number(event.target.value) + callValue > 100) {
      setCallValue(100 - Number(event.target.value));
    }
    setRaiseValue(Number(event.target.value));
  }

  const handleCallChange = (event) => {
    if (Number(event.target.value) + raiseValue > 100) {
      setRaiseValue(100 - Number(event.target.value));
    }
    setCallValue(Number(event.target.value));
  }

  const handleSelectChange = (event) => {
    const newPosition = event.target.value;
    setSelectedPosition(newPosition);
    setSelected3BPosition('empty'); // Reset 3B position when RFI changes
  };

  const handleSelect3BChange = (event) => {
    const newPosition = event.target.value;
    setSelected3BPosition(newPosition);
  };

  const handleAction = (actionType) => {
    if (isSimulating) {
      
      setSimResponse(actionType);
    } else {
      console.log(`no sim running`);
    }
  }

  const submitCallAction = () => handleAction('call');
  const submitFoldAction = () => handleAction('fold');
  const submitRaiseAction = () => handleAction('raise');

  function hidePopup() {
    document.getElementById("popupBackground").style.display = "none";
  }

  async function run() {
    if (isSimulating) {
      console.log('Simulation already running or in progress');
      return 'Simulation in progress';
    }

    setIsSimulating(true); // Mark simulation as in progress
    const runGenerator = await nineMaxGenerator(RFIOnly, threeBetOnly);
    await runGenerator().then((data) => simulateHand(data[3], data[2], data[1], data[0]));


    return 'Simulation completed';
  }

  function clearRun() {
    //console.log('clearing run');

    const sim_details = document.getElementsByClassName('sim-details')[0];

    sim_details.innerText = `Run the next sim.`
    sim_details.style.color = "white";
    document.getElementsByClassName('simulation')[0].style.display = "none";
    document.getElementsByClassName('sim-buttons')[0].style.display = "none";
    
    for (let cur_position of nine_max_positions) {
      const seat_ele = document.getElementsByClassName(`seat ${cur_position}`)[0];
      const chips_ele = document.getElementsByClassName(`chips ${cur_position}`)[0];

      seat_ele.className = seat_ele.className.replace('folded', '');
      chips_ele.innerText = "";
    }
  }

  async function simulateHand(history, position, answer, hand) {
    //console.log(history, position, answer, hand);
    const hero_idx = nine_max_positions.indexOf(position);

    clearRun();
    await sleep(250);

    const sim_details = document.getElementsByClassName('sim-details')[0];

    sim_details.innerText = 'Running sim.';

    if (!position || !hand || !answer) {
      setIsSimulating(false);
      return;
    }
  
    setSimAnswer(answer);

    for (let i = 0; i < nine_max_positions.length; i++) {
      if (history.includes(nine_max_positions[i])) { // someone raised
        document.getElementsByClassName(`chips ${nine_max_positions[i]}`)[0].innerText = "OPEN";
      }
      else if (i == hero_idx) {
        document.getElementsByClassName(`chips ${position}`)[0].innerText = "RAISE";
        break;
      } else {
        document.getElementsByClassName(`seat ${nine_max_positions[i]}`)[0].className += ' folded';
      }
      if (pause) await sleep(800);
    }

    const rng = Math.floor(Math.random()*100)

    setSimRNG(rng);
    setSimHand(hand);
    sim_details.innerText = history.length ? `You are the ${position.toUpperCase()} with ${hand} facing an open from the ${history[0].toUpperCase()}. RNG: ` + rng :  `You are the ${position.toUpperCase()} with ${hand}. RNG: ` + rng;
    document.getElementsByClassName('sim-buttons')[0].style.display = "inline-flex";
  }

  return (
    <div className="Poker">
      <PokerNavbar 
        pause={pause} setPause={setPause} 
        invertRNG={invertRNG} setInvertRNG={setInvertRNG} 
        RFIOnly={RFIOnly} setRFIOnly={setRFIOnly}
        threeBetOnly={threeBetOnly} setThreeBetOnly={setThreeBetOnly} 
      />
      <div id="popupBackground">
        <div id="popup">
          <h2>Chart - {(selected3BPosition !== 'empty' && `${selected3BPosition.toUpperCase()} Against ${selectedPosition.toUpperCase()}`) || selectedPosition.toUpperCase()}</h2>
          <div className="container mt-3" id="select-position">
            <label htmlFor="positionRFISelect" className="form-label mr-2">Select RFI:</label>
            <select
              id="positionRFISelect"
              className="form-select"
              value={selectedPosition}
              onChange={handleSelectChange}
            >
              {nine_max_positions.map((position) => (
                <option key={position} value={position}>
                  {position.toUpperCase()}
                </option>
              ))}
            </select>
            {selectedPosition && 
                <div>
                  <label htmlFor="position3bSelect" className="form-label mr-2">Select 3B:</label>
                  <select
                  id="positionRFISelect"
                  className="form-select"
                  value={selected3BPosition}
                  onChange={handleSelect3BChange}
                >
                  <option key='empty' value='empty'>
                    -----
                  </option>
                  {nine_max_positions.map((position, idx) => (
                    idx > nine_max_positions.indexOf(selectedPosition) &&
                    <option key={position} value={position}>
                      {position.toUpperCase()}
                    </option>
                  ))}
                </select>
                </div>
              }
            <div className="mt-3">
            </div>
            <div className="slide-container">
              <input type="range" min="0" max="100" className="slider" id="call-range" value={callValue} onChange={handleCallChange} />
              <input type="range" min="0" max="100" className="slider" id="raise-range" value={raiseValue} onChange={handleRaiseChange} />
            </div>
            <br />
            <div className="slide-container-result">
              <p className="slide-result">Call Percent: {callValue}</p>
              <p className="slide-result">Raise Percent: {raiseValue}</p>
            </div>
          </div>
          {nine_max_positions.map((position) => (
            <Chart key={position} position={position} visible={selected3BPosition === 'empty' && selectedPosition === position} />
          ))}

          {nine_max_positions.map((position, idx) => (
            idx > nine_max_positions.indexOf(selectedPosition) &&
            <Chart key={`${position}_vs_${selectedPosition}`} position={position} opener={selectedPosition} visible={selected3BPosition === position}></Chart>
          ))}
          <button id="closeBtn" onClick={hidePopup}>Close</button>
        </div>
      </div>
      <div className="sim-results">
        <span className="mr-4">
          Num Correct: {numCorrect}
        </span>
        <span>
          Total Sims: {totalSims}
        </span>
      </div>
      <div className="table-container">
        <div className="table">
          {nine_max_positions.map((position) => (
            <div key={position} className={`seat ${position}`}>
              {position.toUpperCase()}
              <div className={`chips ${position}`}></div>
            </div>
          ))}

          <div className="sim-details">Set your ranges by using the cog wheel on the top right or run the sim with default ranges.</div>
          <div className="simulation">
            <div className="card-display">
              <div className="poker-card" id="card1"></div>
              <div className="poker-card" id="card2"></div>
            </div>
          </div>
          <div className="sim-buttons">
            <button className="sim-button btn btn-info mr-2" onClick={submitFoldAction}>Fold</button>
            <button className="sim-button btn btn-success" onClick={submitCallAction}>Call</button>
            <button className="sim-button btn btn-danger ml-2" onClick={submitRaiseAction}>Raise</button>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <button
          onClick={() => {
            if (!isSimulating) {
              console.log(run().then((res) => console.log(res)));
            } else {
              console.log('Please complete the current simulation before starting a new one.');
            }
          }}
          className="btn btn-primary btn-run-simulation"
        >
          Simulate
        </button>
      </div>
    </div>
  );
}

