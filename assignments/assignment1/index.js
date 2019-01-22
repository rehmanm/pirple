import http from "http";
import https from "https";
import fs from "fs";
import url from "url";
import string_decoder from "string_decoder";

import config from "./config";


const httpPort = config.httpPort;
const httpsPort = config.httpsPort;


//Create HTTP Server
const httpServer = http.createServer((req, res)=>{
    unifiedServer(req, res);
});


//Start an HTTP server
httpServer.listen(httpPort, () => {
    console.log(`Server is listening on port ${httpPort} now`)
});

//Create HTTPS Server
const httpsServerOption = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};
const httpsServer = https.createServer(httpsServerOption, (req, res)=>{

    unifiedServer(req, res);

});



//Start an HTTPS server 
httpsServer.listen( httpsPort, () => {
    console.log(`Server is listening on port ${httpsPort} now`)
});


const unifiedServer = (req, res) => {
    console.log(`url: ${req.url}`);

    const parsedUrl = url.parse(req.url, true);
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');
    //console.log(`parsedUrl: ${parsedUrl}`);

    let decoder = new string_decoder.StringDecoder('utf8');
    
    console.log(`Method: ${req.method}`);

    //Get the querystring
    
    console.log(`Query String: `, parsedUrl.query);

    //Get the headers

    console.log(`Header: `, req.headers);

    //Get the payLoad
    let buffer = '';
    req.on('data', (data)=>{
        buffer += decoder.write(data);
    }); 

    req.on('end', ()=>{
        buffer+= decoder.end();

        //Choose the handler else not found handler
        const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        //Construct the data object
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': parsedUrl.query,
            'method': req.method,
            'headers': req.headers,
            'payload': buffer
        };

        chosenHandler(data, (statusCode, payload) =>{
            //Use status code or Default
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            //Use Payload or Default            
            payload = typeof(payload) == 'object' ? payload : {};

            //Converting Object to String
            const payloadString = JSON.stringify(payload);

            //Returning Response
            res.writeHead(statusCode);
            res.end(payloadString);

            console.log(`Buffer (Request Payload): ${buffer}`);    
            console.log(`path: ${parsedUrl.pathname}`);
            console.log(`Returning Reponse:`, statusCode, payloadString);

        });


    })


}


var handlers ={};

handlers.ping = (data, callback) => {
    //Callback HTTP Status Code and a payload (should be object)
    callback(200);
}
handlers.hello = (data, callback) => {
    //Callback HTTP Status Code and a payload (should be object)

    callback(200, {
        'date': new Date(),
        'message': 'Hello World!!!'
    });
}

handlers.notFound = (data, callback) => {

    callback(404);
    
}

var router= {
    "hello": handlers.hello,
    "ping": handlers.ping
}