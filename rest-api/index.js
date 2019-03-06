// Primary File for api



//Dependencies

import server from "./lib/server";
import workers from "./lib/workers";
 



var app = {

};

app.init = () =>{
    //Start the server
    let _server = new server();
    _server.init();

    //Start the Workers
    let _workers = new workers();
    _workers.init();
}

app.init();


export default app;