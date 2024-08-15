import { useEffect, useState, useRef } from "react";
import Cookies from 'react-cookies';

import { getPokerHand } from "./utils";

import { cards_to_num } from "./info";

import './poker.css';

export function Chart({position, visible, opener, three_better}) {
    var chartMade = useRef(false);

    useEffect(() => {
        if (opener) {
            chartMade.current = (document.getElementById(`${position}_vs_${opener}`)) == true;
        }
        else {
            chartMade.current = (document.getElementById(`${position}`)) ==  true;
        }
    })

    const [gto, setGTO] = useState();

    if (visible) {
        console.log('im visible', position, chartMade);
    }

    const getGradientStyle = (call, raise, fold) => `linear-gradient(90deg, red ${Number(raise)}%, #23a607 ${Number(raise)}% ${Number(call) + Number(raise)}%, aqua ${Number(call)+Number(raise)}% 100%)`

    useEffect(() => {
        if (gto) {
            return
        }

        const serialized = JSON.parse(localStorage.getItem(position));

        if (serialized) {
            setGTO(serialized);
        }
        else {
            fetch('/charts.json').then(response => response.json()).then(data => {
                setGTO(data[position]);
                
                localStorage.setItem(position, JSON.stringify(data[position]));
                })
                .catch((error) => console.log(error, 'error'));
        }
    }, [gto]);

    useEffect(() => {
        if (!chartMade.current) {

            var table;

            if (opener) {
                table = document.getElementById(`${position}_vs_${opener}`);
            }
            else {
                table = document.getElementById(position);
            }

            if (table && gto) {
                for (let row = 0; row < 13; row++) {
                    const tr = document.createElement("tr");
                    for (let col = 0; col < 13; col++) {
                        const td = document.createElement("td");
                        const hand = getPokerHand(row, col);
                        
                        var response = gto[cards_to_num(hand)];

                        var call,raise_rate,fold_rate;

                        if (!response) {
                            call = 0;
                            fold_rate = 100;
                            raise_rate = 0;
                        }
                        else if (response.length === 2) {
                            call = response[0];
                            raise_rate = response[1];
                            fold_rate = 100 - call - raise_rate;
                        }
                        else if (response.length === 3) {
                            call = response[0];
                            fold_rate = response[1];
                            raise_rate = response[2];
                        }
                        else {
                            call = 0;
                            fold_rate = 0;
                            raise_rate = 100;
                        }
                        
                        td.textContent = hand;
                        td.style.background = getGradientStyle(call, raise_rate);
                        td.addEventListener("click", (event) => {
                            const call_range = Number(document.getElementById('call-range').value);
                            const raise_range = Number(document.getElementById('raise-range').value);
                            
                            const fold_range = 100 - call_range - raise_range;

                            event.target.style.background = getGradientStyle(call_range, raise_range);
                            gto[cards_to_num(event.target.textContent)] = [call_range,raise_range];
                            
                            localStorage.setItem(position, JSON.stringify(gto));
                        });
                        tr.appendChild(td);
                    }
                    table.appendChild(tr);
                };

                chartMade.current = true;
            }
        }

    }, [gto]);

    return (
        <div className="Chart">
            {(opener && <table id={`${position}_vs_${opener}`} style={{display:visible ? '' : 'none'}}></table>) ||  <table id={position} style={{display:visible ? '' : 'none'}}></table>}
        </div>
    )
}