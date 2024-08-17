import { num_to_cards, all_cards, cards_to_num, nine_max_positions } from './info';

async function get_chart(position) {
    return fetch('/charts.json').then(response => response.json()).then(data => {
        const hero_chart = data[position];
        localStorage.setItem(position, JSON.stringify(hero_chart));
        
        return hero_chart;
    })
    .catch((error) => console.log(error, 'error'));
};

export async function nineMaxGenerator(rfi_only, three_bet_only) {
    let gen_running = false;

    return async function runGenOnce() {
        if (gen_running) {
            console.log('gen already running');
            return 
        }

        let hero_position_idx = Math.floor(Math.random() * 9);
        let hero_position = nine_max_positions[hero_position_idx];

        
        //hero_position = 'sb'; hardcode set to look at multi-option spots

        var action = new Map();

        
        // support additional spots
        //console.log('rfi', rfi_only,'3b', three_bet_only);

        if (!rfi_only) {
            for (let i = 0; i < hero_position_idx; i++) {
                // check prior action
                if (action.get('4b')) {
                    // if 4b, regenerate spot as we don't have charts facing 4b
                    return runGenOnce();
                }
                else if (action.get('3b')) {
                    // check against 3b spot

                    // currently not supporting
                    return runGenOnce()
                }
                else if (action.get('b')) {
                    // check against raise
                    
                    // don't currently support because if RFI exists we will always generate a 3b
                }
                else {
                    // grab from rfi
                    let villain = nine_max_positions[i];
                    let villain_data = JSON.parse(localStorage.getItem(villain));

                    let villain_cards = cards_to_num(all_cards[Math.floor(Math.random() * all_cards.length)]);
                    let villain_response = villain_data[villain_cards];

                    if (villain_response === undefined) {
                        continue
                    }

                    // don't generate limps, only raises

                    if (Math.floor(Math.random()*100) >= villain_response[0] + villain_response[1]) {
                        action['b'] = villain;
                    }
                }
            }
        }
        
        if (three_bet_only) {
            if (!action['b']) {
                return runGenOnce();
            }
        }

        // now we are at hero
        if (action.get('4b')) {
            // once again we don't have charts facing 4b, so re-run spot
            return runGenOnce();
        }

        var hero_data;
        //console.log(action, 'action');
        if (action['b']) { // hero is 3b
            let pos = `${hero_position}_vs_${action['b']}`;
            //console.log(pos, 'pos rfi');
            if (localStorage.getItem(pos) && typeof localStorage.getItem(pos) === 'string') {
                hero_data = JSON.parse(localStorage.getItem(pos)); 
            }
            else {
                hero_data = await get_chart(pos);
            }
        }
        else { // hero is RFI
            if (hero_position == 'bb') {
                hero_position = 'sb';
            }
            
            if (localStorage.getItem(hero_position) && typeof localStorage.getItem(hero_position) === 'string') {
                hero_data = JSON.parse(localStorage.getItem(hero_position)); 
            }
            else {
                hero_data = await get_chart(hero_position);
            }
        }
        

        // generate hero's cards
        //console.log(hero_data);

        let hero_cards = cards_to_num(all_cards[Math.floor(Math.random() * all_cards.length)]);
        let hero_response = hero_data[hero_cards];

        if (hero_response === undefined) {
            hero_response = [0,0];
        }

        gen_running = false;
        //console.log(num_to_cards(hero_cards), hero_response, hero_position, Object.values(action));
        return [num_to_cards(hero_cards), hero_response, hero_position, Object.values(action) || []];
    }
};