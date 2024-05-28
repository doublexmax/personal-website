import { useEffect, useState } from "react";


function About() {
    return (
        <div className="About">
            <div className="row mb-4">
                <div className="passion">
                    <h3 className="passion-header">My Passion</h3>
                    <div className="passion-text">
                        My first experience with computers started with using my family's Windows XP desktop to print labels for our farmer's market business.
                        After experimenting with basic HTML and CSS (JavaScript was too advanced for my lowly self at the time), making websites for random things and playing with Scratch,
                        and staying after school to make Lego EV3 Mindstorm robots (also my first time with sensors and the classic black-line maze task), my focus into software and apps as a whole
                        came from using Python to make programs to solve my maths and physics problems.
                    </div>
                </div>
            </div>
        </div>  
    );
}

export default About;