import mathlib from "./lib/math";
import jokes from "./lib/jokes";

const app ={};

app.config = {
    'timesBetweenJokes': 1000
}

app.printAJoke = () =>{

    const allJokes = jokes.allJokes();
    const numberOfJokes = allJokes.length;

    const randomNumber = mathlib.getRandomNumber(1, numberOfJokes);

    const selectedJoke = allJokes[randomNumber -1];
    console.log(selectedJoke);
}

app.indefiniteLoop = () =>{

    setInterval(app.printAJoke, app.config.timesBetweenJokes);
}

app.indefiniteLoop();