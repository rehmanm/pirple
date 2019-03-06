/*
    * Worker-related task
*/

import path from "path";
import fs from "fs";
import data from "./data";
import https from "https";
import http from "http";
import helpers from "./helpers";
import url from "url";
import { timingSafeEqual } from "crypto";

class workers {

    init() {

        this._helpers = new helpers();

        this._data = new data();

        this._data.list("checks", (err, files) => {
            if (!err && files){
                console.log(files);
            } else {

                console.log("Unable to get directory list", err);
            }
        });

        //Execute all the checks;
        this.gatherAllChecks()
        //Call the loop so the checks will execute later on;
        this.loop();

        console.log("workers.init called");
    }

    loop(){
        setInterval(() => {
            this.gatherAllChecks()
        }, 5000);
    }

    gatherAllChecks () {
        // Get all the checks

        this._data.list("checks", (err, checks)=>{
            if(!err && checks && checks.length > 0){
                console.log("processing check");
                checks.forEach((check) =>{
                    this._data.read("checks", check, (err, originalCheckData)=>{
                        if(!err && originalCheckData){
                            //Pass it to check validator, and let that function continue or log the error;

                            this.validateCheckData(originalCheckData);
                        } else{
                            console.log("Error reading on the check data", check, originalCheckData);
                        }
                    });
                });
            } else {

                console.log("Unable to get directory list", err);
            }
        });

        
    }
    //Sanity Check the check data
    validateCheckData(originalCheckData) {
        originalCheckData = typeof(originalCheckData) == "object" && originalCheckData !== null ? originalCheckData : {};

        originalCheckData.id = typeof(originalCheckData.id) == 'string' && originalCheckData.id.trim().length == 20 ? originalCheckData.id.trim(): false;
        originalCheckData.userPhone = typeof(originalCheckData.userPhone) == 'string' && originalCheckData.userPhone.trim().length == 10 ? originalCheckData.userPhone.trim(): false;
        originalCheckData.protocol = typeof(originalCheckData.protocol) == 'string' && ['https', 'http'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol.trim(): false;
        originalCheckData.url = typeof(originalCheckData.url) == 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim(): false;
        originalCheckData.method = typeof(originalCheckData.method) == 'string' && ['get', 'post', 'put', 'delete'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method.trim(): false;
        originalCheckData.successCodes = typeof(originalCheckData.successCodes) == 'object' &&  originalCheckData.successCodes instanceof Array  && originalCheckData.successCodes.length > -1 ? originalCheckData.successCodes : false;
        originalCheckData.timeoutSeconds = typeof(originalCheckData.timeoutSeconds) == 'number' &&  originalCheckData.timeoutSeconds %1 === 0  && originalCheckData.timeoutSeconds >=1 && originalCheckData.timeoutSeconds <=5 ? originalCheckData.timeoutSeconds: false;
    
        //Set the Keys that may not be set (if the worker never seen this check)
        originalCheckData.state = typeof(originalCheckData.state) == 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state.trim(): "down";
        originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) == 'number' &&   originalCheckData.timeoutSeconds >=0 ?  originalCheckData.timeoutSeconds : false;
    
        // if all the checks pass, pass the dat alon the next step in the process
        if (originalCheckData.protocol && originalCheckData.url && originalCheckData.method 
            && originalCheckData.successCodes && originalCheckData.timeoutSeconds
            && originalCheckData.userPhone && originalCheckData.id 
            ){
                this.performCheck(originalCheckData);
            } else {

                console.log("One of the check is not properly formatted, skipping it", originalCheckData);
            }
    }

    //Perform the check and pass the originalCheckData and the outcome of the check process to next step in the process

    performCheck(originalCheckData) {
        //Prepare the initial check outcome;

        let checkOutcome = {'error': false, 'responseCode': false};

        //Mark the outcome hasn't been sent yet

        let outcomeSent = false;

        //parse the hostname and path out the original check data

        let parseUrl = url.parse(`${originalCheckData.protocol}://${originalCheckData.url}`);

        let hostname = parseUrl.hostname;
        let path = parseUrl.path; //using path not "pathname", as we need full path


        let requestDetails = {
            'protocol' :originalCheckData.protocol + ":",
            "hostname" : hostname,
            'method' : originalCheckData.method.toUpperCase(),
            'path': path,
            'timeout': originalCheckData.timeoutSeconds * 1000

         };

         //Instantiate the request object (using http or https)
         let _moduleToUse = originalCheckData.protocol === "http" ? http : https

         let req = _moduleToUse.request(requestDetails, (res) => {
            let status = res.statusCode;
            //Update the outcome
            checkOutcome.responseCode = status;

            if(!outcomeSent){
                this.processCheckOutcome(originalCheckData, checkOutcome);
                outcomeSent = true;
            }
        });
        //Bind to erro event so it doesn;t get thrown
        req.on("error", (e) =>{
            checkOutcome.error = {
                'error': true,
                'value': e
            }
            if(!outcomeSent){
                this.processCheckOutcome(originalCheckData, checkOutcome);
                outcomeSent = true;
            }
        });

        //Bind to timeout

        req.on("timeout", (e) =>{
            checkOutcome.error = {
                'error': true,
                'value': "timeout"
            }
            if(!outcomeSent){
                this.processCheckOutcome(originalCheckData, checkOutcome);
                outcomeSent = true;
            }
        });

        //End the request
        req.end()

    }
    //Process the check outcome, update the check data as needed, trigger the user if needed
    //Special logic for a check that has never been tested before
    processCheckOutcome(originalCheckData, checkOutcome){
        //Decide if the check is considered to be up or down
        let state = !checkOutcome.error 
        && checkOutcome.responseCode  
        && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ?"up" :"down";

        
        let alertWanted  = originalCheckData.lastChecked && originalCheckData.state != state ? true: false;

        let newCheckData = originalCheckData;
        newCheckData.state = state;
        newCheckData.lastChecked = Date.now();
        console.log("checkOutcome", checkOutcome, originalCheckData.successCodes.indexOf(checkOutcome.responseCode) )
        //Save the update

        this._data.update("checks", newCheckData.id, newCheckData, (err)=>{
            if (!err){
                if(alertWanted){
                    this.alertUserToStatusChange(newCheckData);
                } else{
                    console.log("No alert need as checkoutcome not changed");
                }
            } else {
                console.log("Error: Unable to update data", newCheckData)
            }
        });
    }

    alertUserToStatusChange(newCheckData){
        let msg = `Alert Your Check for ${newCheckData.method.toUpperCase()} ${newCheckData.protocol}://${newCheckData.url} is  ${newCheckData.state}`
        this._helpers.sendTwilioSms(
            newCheckData.userPhone, msg, (err) =>{
                if(!err){
                    console.log("user alerted for status change", msg);

                } else {

                    console.log("couldn't send sms to user")
                }
            });
        
    }

}

export default workers;