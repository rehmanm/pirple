import fs from "fs";

const jokes = {};

jokes.allJokes = () =>{

        // Read the text file containing the jokes
        const fileContents = fs.readFileSync(__dirname+'/jokes.txt', 'utf8');

        // Turn the string into an array 
        const arrayOfJokes = fileContents.split(/\r?\n/);
    
        // Return the array
        return arrayOfJokes;


}

export default jokes;

