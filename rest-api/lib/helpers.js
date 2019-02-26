 
//Dependencies

import crypto from "crypto";
import config from "./config";
import https from "https";
import queryString from "querystring";


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

    sendTwilioSms  (phone, msg, callback) {
        phone = typeof(phone) == "string" && phone.trim().length == 10? phone : false
        msg = typeof(msg) == "string" && msg.trim().length> 0 ? msg : false
        console.log(phone, msg);
        if (phone && msg){
            // Configure the request payload
             let payload = {
                 "From": config.twilio.fromPhone,
                 "To": '+1' + phone,
                 "Body": msg
             }
             let stringPayload = queryString.stringify(payload);

             let requestDetails = {
                'protocol' :'https:',
                "hostname" : "api.twilio.com",
                'method' : 'POST',
                'path':`/2010-04-01/Accounts/${config.twilio.accountSid}/Messages.json`,
                'auth': `${config.twilio.accountSid}:${config.twilio.authToken}`,
                'headers' :{
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Lenght': Buffer.byteLength(stringPayload)
                }

             };

              //Instantiate the request object
             let req = https.request(requestDetails, (res) => {
                 let status = res.statusCode;

                 if (status==200 || status == 201){
                     callback(false);

                 } else {
                     callback(`Status Code Return was ${status}`);
                 }
             });

             req.on("error", (e) =>{
                 callback(e);
             });

             req.write(stringPayload);
             req.end();
        } else {
            callback("Given Parameters were missing")
        }
        
    }
}



export default helpers;