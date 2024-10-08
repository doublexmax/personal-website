import { useEffect, useState, useRef } from "react";

import { getPokerHand } from "./utils";

import { cards_to_num } from "./info";

import './poker.css';

export function Chart({position, visible, opener, three_better}) {
    const [gto, setGTO] = useState();

    // if (visible) {
    //     console.log('im visible', position, chartMade);
    // }

    const getGradientStyle = (call, raise) => `linear-gradient(90deg, red ${Number(raise)}%, #23a607 ${Number(raise)}% ${Number(call) + Number(raise)}%, aqua ${Number(call)+Number(raise)}% 100%)`

    useEffect(() => {
        if (gto) {
            return
        }

        var serialized;

        if (opener) {
            serialized = localStorage.getItem(`${position}_vs_${opener}`);
        }
        else {
            serialized = localStorage.getItem(position);
        }

        //console.log(`${position}_vs_${opener}`, serialized);
        if (serialized) {
            setGTO(JSON.parse(serialized));
        }
        else {
            fetch('/charts.json').then(response => response.json()).then(data => {
                //console.log('fetching chart', opener, position);
                if (opener) {
                    return [data[`${position}_vs_${opener}`], `${position}_vs_${opener}`]
                }
                else {
                    return [data[position], position]
                }
                }).then(
                    (res) => {
                        //console.log(res[0], res[1], 'received');
                        setGTO(res[0]);
                        localStorage.setItem(res[1], JSON.stringify(res[0]));
                    }
                )
                .catch((error) => console.log(error, 'error'));
        }
    }, [gto]);

    useEffect(() => {
        var chartMade = false;

        var table;

        if (opener) {
            table = document.getElementById(`${position}_vs_${opener}`);
        }
        else {
            table = document.getElementById(position);
        }
        chartMade = table && table.childElementCount;
        if (!chartMade) {

            if (table && gto) {
                for (let row = 0; row < 13; row++) {
                    const tr = document.createElement("tr");
                    for (let col = 0; col < 13; col++) {
                        const td = document.createElement("td");
                        const hand = getPokerHand(row, col);
                        
                        var response = gto[cards_to_num(hand)];

                        var call,raise_rate;

                        if (!response) {
                            call = 0;
                            raise_rate = 0;
                        }
                        else if (response.length === 2) {
                            call = response[0];
                            raise_rate = response[1];
                        }
                        else if (response.length === 3) {
                            call = response[0];
                            raise_rate = response[2];
                        }
                        else {
                            call = 0;
                            raise_rate = 100;
                        }
                        
                        td.textContent = hand;
                        td.style.background = getGradientStyle(call, raise_rate);
                        td.addEventListener("click", (event) => {
                            const call_range = Number(document.getElementById('call-range').value);
                            const raise_range = Number(document.getElementById('raise-range').value);
                            
                            event.target.style.background = getGradientStyle(call_range, raise_range);
                            gto[cards_to_num(event.target.textContent)] = [call_range,raise_range];
                            
                            if (opener) {
                                localStorage.setItem(`${position}_vs_${opener}`, JSON.stringify(gto));
                            }
                            else {
                                localStorage.setItem(position, JSON.stringify(gto));
                            }
                        });
                        tr.appendChild(td);
                    }
                    table.appendChild(tr);
                };
            }
        }

    }, [gto]);

    return (
        <div className="Chart">
            {(opener && <table id={`${position}_vs_${opener}`} style={{display:visible ? '' : 'none'}}></table>) ||  <table id={position} style={{display:visible ? '' : 'none'}}></table>}
        </div>
    )
}