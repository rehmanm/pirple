//Server required tasks


import http, { ServerResponse } from "http";
import https from "https";
import fs from "fs";
import url from "url";
import string_decoder from "string_decoder";

import config from "./config";


import handlers from "./handlers";
import helpers from "./helpers";

import path from "path";



//@Todo Delete this

// const _helpers = new helpers();

// _helpers.sendTwilioSms("4158375309", "test", (err) =>{
//     console.log("This is error", err);
// });

//const _data = new data();
 
// _data.create('test3', 'newFile', {'foo':'bar'}, function(err){
//     console.log("this is error", err);
// });


//_data.create('test3', 'newFile', {'fizz':'buzz'}, function(err){
 //   console.log("this is error in creating file", err);
// });
// _data.update('test3', 'newFile', {'foo':'bar'}, function(err){
//     console.log("this is error in updating file", err);
// });
//_data.read('test3', 'newFile',   function(err, data){
//     console.log("this was the error in reading file", err, 'this was the data ', data);
// });
// _data.delete('test3', 'newFile',   function(err){
//     console.log("error deleting file", err);
// });


//Instantiate the Server

class server {


    constructor(){
        this.httpPort = config.httpPort;
        this.httpsPort = config.httpsPort;


        //Create HTTP Server
        this.httpServer = http.createServer((req, res)=>{
            this.unifiedServer(req, res);
        });

        //Create HTTPS Server
        this.httpsServerOption = {
            'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
            'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
        };
        this.httpsServer = https.createServer(this.httpsServerOption, (req, res)=>{
            this.unifiedServer(req, res);
        });

        this.router= {
            "sample": handlers.sample,
            "ping": handlers.ping,
            "users": handlers.users,
            "tokens": handlers.tokens,
            "checks": handlers.checks
        }

    }

    init() {

        //Start an HTTP server
        this.httpServer.listen(this.httpPort, () => {
            console.log(`Server is listening on port ${this.httpPort} now`)
        });

        
        //Start an HTTPS server 
        this.httpsServer.listen(this.httpsPort, () => {
            console.log(`Server is listening on port ${this.httpsPort} now`)
        });

    }


        




    unifiedServer(req, res)   {
        console.log(`url: ${req.url}`);

        const parsedUrl = url.parse(req.url, true);
        var path = parsedUrl.pathname;
        var trimmedPath = path.replace(/^\/+|\/+$/g, '');
        //console.log(`parsedUrl: ${parsedUrl}`);

        let decoder = new string_decoder.StringDecoder('utf8');
        
        //console.log(`Method: ${req.method.toLowerCase()}`);

        //Get the querystring
        
        //console.log(`Query String: `, parsedUrl.query);

        //Get the headers

        //console.log(`Header: `, req.headers);

        //Get the payLoad
        let buffer = '';
        req.on('data', (data)=>{
            buffer += decoder.write(data);
        }); 

        req.on('end', ()=>{
            buffer+= decoder.end();

            //Choose the handler else not found handler
            const chosenHandler = typeof(this.router[trimmedPath]) !== 'undefined' ? this.router[trimmedPath] : handlers.notFound;
            const _helpers = new helpers();
            //Construct the data object
            //console.log("buffer", buffer, _helpers.parseJsonToObject(buffer));
            let data = {
                'trimmedPath': trimmedPath,
                'queryStringObject': parsedUrl.query,
                'method': req.method.toLowerCase(),
                'headers': req.headers,
                'payload': _helpers.parseJsonToObject(buffer)
            };

            chosenHandler(data, (statusCode, payload) =>{
                //Use status code or Default
                statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

                //Use Payload or Default            
                //console.log(payload, typeof(payload));
                payload = typeof(payload) == 'object' ? payload : {};

                //Converting Object to String
                const payloadString = JSON.stringify(payload);

                //Returning Response
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(statusCode);
                res.end(payloadString);
                // console.log(trimmedPath,statusCode);

                // console.log(`Buffer (Request Payload): ${buffer}`);    
                // console.log(`path: ${parsedUrl.pathname}`);
                // console.log(`Returning Reponse:`, statusCode, payloadString);

            });


        })


    }

}

export default server;