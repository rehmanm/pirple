 
//Dependencies

import crypto from "crypto";
import config from "./config";


class helpers{

    //Create SHA256 hash
    hash(str){
        if(typeof(str)=='string' && str.length >0){
            let hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
            return hash;
        } else{
            return false;
        }
    }


    //Parse a JSON string to an object in all cases
    parseJsonToObject(str){

        try {
            let obj = JSON.parse(str); 
            return obj;
        } catch(e){
            return {};
        }
    }

    //Create a random alpha numeric string
    createRandomString(strLength) {
        strLength = typeof(strLength) == "number" && strLength > 0? strLength : false;
        if(strLength){
            let possibleCharacters = "abcdefghijklmnopqrstuvwxyz0123456789";
            let str = "";

            for (let i =0;i<strLength; i++){

                //Get a random Character and append it in the string
                let randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));

                str += randomCharacter;

            }

            return str;

        } else{
            return strLength;
        }
    }

}

export default helpers;