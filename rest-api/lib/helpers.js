 
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

}

export default helpers;