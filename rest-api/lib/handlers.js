

//Dependenice
import userdata from "./data";
import helpers from "./helpers";
import config from "./config";

var handlers ={};

handlers.sample = (data, callback) => {
    //Callback HTTP Status Code and a payload (should be object)

    callback(406, {name: "sample header"});


}

handlers.ping = (data, callback) => {
    //Callback HTTP Status Code and a payload (should be object)

    callback(200);


}
handlers.users = (data, callback) => {
    //Callback HTTP Status Code and a payload (should be object)

    let acceptableMethods = ['get', 'post', 'put', 'delete'];
    console.log(acceptableMethods.indexOf(data.method), data.method);
    if (acceptableMethods.indexOf(data.method) != -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }


}

//container for users sub method

handlers._users = {};

//Users - Post
//Required Data firstName, lastName, phone, password, tosAgreement
handlers._users.post = (data, callback)  => {
    //check that all required fields are filled out
    let firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim(): false;
    let lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim(): false;
    let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim(): false;
    let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim(): false;
    let tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement === true ? true: false;
   console.log(firstName , lastName , phone , password , tosAgreement, data.payload)
    if(firstName && lastName && phone && password && tosAgreement){
        
        //Make Sure User does'nt exist
        const _data = new userdata();
        const _helpers = new helpers();
        let hashedPassword = _helpers.hash(password);
        if(hashedPassword) {
        _data.read('users', phone, (err, data) =>{
            if(err){
                
                let jsondata = {
                    firstName: firstName,
                    lastName: lastName,
                    phone: phone,
                    hashedPassword: hashedPassword,
                    tosAgreement: tosAgreement 

                };
                console.log("posting data", typeof(jsondata), jsondata);
                _data.create("users", phone, jsondata, (err) => {
                    if(!err){
                        callback(200);
                    } else{
                        callback(400, {'Error': err});
                    }

                });
            } else{
                callback(400, {'Error': 'User Already Exists'});
            }
  
        });
    } else{
        callback(400, {'Error': 'Unable to encrypt password'});
    }

    } else {
        callback(400, {'Error': 'Missing Required Fields'});
    }

};

//Users - get
//Required data: phone
//Optional data: none 
handlers._users.get = (data, callback) => {
    //check the phone number is valid
    let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length==10 ? data.queryStringObject.phone.trim() : false;
    
    const _data = new userdata();
    const _helpers = new helpers();
    if(phone){
    
        let id = typeof(data.headers.token) == 'string' && data.headers.token.trim().length==20 ? data.headers.token.trim() : false;
        // Verify token is valid for user
        handlers._tokens.verifyToken(id, phone, function(tokenIsValid) {
            if (tokenIsValid){
                _data.read("users", phone, (err, data) =>{
                    if(!err && data){
                        //Remove hashed password before returning data to user
                        delete data.hashedPassword;
                        callback(200, data);
                    } else{
                        callback(404, {"Error": "User Not Found"})
                    }
                });

            } else{
                callback(403, {"Error": "Missing Token in Header or token is invalid"});
            }
        });
        
    } else{
        callback(400, {"Error":"Missing Required field"})
    }
};

//Users - put
//Required Data: phone
//Optional Data: everything else i.e. firstName, lastName, password (atleast one specied)

handlers._users.put = (data, callback)  => {

    const _data = new userdata();
    const _helpers = new helpers();

    let firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim(): false;
    let lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim(): false;
    let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim(): false;
    let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim(): false;
    
    if(phone){

        if(firstName || lastName || password ){
            let id = typeof(data.headers.token) == 'string' && data.headers.token.trim().length==20 ? data.headers.token.trim() : false;
            // Verify token is valid for user
            handlers._tokens.verifyToken(id, phone, function(tokenIsValid) {
                if (tokenIsValid){
                    _data.read("users", phone, (err, userdata) =>{
                        if(!err && userdata){
                            //Remove hashed password before returning data to user
                            
                            if (firstName){
                                userdata.firstName = firstName;
                            }
        
                            if (lastName){
                                userdata.lastName = lastName;
                            }
                            
                            if (password){
                                userdata.password = _helpers.hash(password);
                            }
        
                            _data.update("users", phone, userdata, (err)=>{
        
                                if(!err){
                                    callback(200);
                                } else{
                                    console.log(err);
                                    callback(500, {"Error": "Couldn't Update the User"});
                                }
                            }); 
                        } else{
                            callback(400, {"Error": "User doesn't exist"})
                        }
                        
                    });

                    
                
                } else{
                    callback(403, {"Error": "Missing Token in Header or token is invalid"});
                }
            });
            
        } else{
            callback(400, {"Error":"Missing Update Field"})
        }
        
    } else{
        callback(400, {"Error":"Missing Required field"})
    }
   
};

//Users - delete
//Required Field: Phone
//
handlers._users.delete = (data, callback)  => {

    //Check phone is valid
    let phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length==10 ? data.queryStringObject.phone.trim() : false;
    const _data = new userdata();
    const _helpers = new helpers();
    if(phone){
        let id = typeof(data.headers.token) == 'string' && data.headers.token.trim().length==20 ? data.headers.token.trim() : false;
        // Verify token is valid for user
        handlers._tokens.verifyToken(id, phone, function(tokenIsValid) {
        if (tokenIsValid){

            _data.read("users", phone, (err, userData) =>{
                if(!err && userData){
                    //Remove hashed password before returning data to user
                    _data.delete("users", phone, (err)=>{
                        if(!err){
                            let userChecks  = typeof(userData.checks) == "object" && userData.checks instanceof Array ? userData.checks : [];
                            let checksToDelete = userChecks.length;

                            if (checksToDelete > 0) {
                                var checksDeleted = 0;
                                var deletionError = false;

                                userChecks.forEach(checkId => {
                                    _data.delete("checks", checkId, (err) =>{
                                        if (err){
                                            deletionError = true;
                                        }
                                        checksDeleted++;

                                        if (checksDeleted == checksToDelete){
                                            if(!deletionError){
                                                callback(200);
                                            } else {
                                                callback(500, {"Error": "Couldn't delete some of the checks"});
                                            }
                                        }
                                    })
                                });


                            } else {
                                callback(200);
                            }
                            
                        } else{
                            callback(500, {"Error": "Couldn't delete the data"});
                        }
                    });
                } else{
                    callback(400, {"Error": "User Not Found"})
                }
            });
                
            } else{
                callback(403, {"Error": "Missing Token in Header or token is invalid"});
            }
        });
    } else{
        callback(400, {"Error":"Missing Required field"})
    }

};

//token handlers

handlers.tokens = (data, callback) => {
    //Callback HTTP Status Code and a payload (should be object)

    let acceptableMethods = ['get', 'post', 'put', 'delete']; 
    if (acceptableMethods.indexOf(data.method) != -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }

};

handlers._tokens = {};

//Tokens Post
//Required Field: phone, password
//Optional Field: none

handlers._tokens.post = (data, callback)  => {

    let phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim(): false;
    let password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim(): false;

    if (phone && password){
        const _data = new userdata();
        const _helpers = new helpers();
        
        _data.read("users", phone, (err, userData)=>{
            if(!err && userData){
                //Hash the sent password
                let hashSentPassword = _helpers.hash(password)
                if (userData.hashedPassword === hashSentPassword){
                    //if valid create a new token with set expiration date one hour in future

                    let tokenid = _helpers.createRandomString(20);
                    var expires = Date.now() + 1000 * 60 * 60;

                    var tokenObject ={
                        'phone': phone,
                        'expires': expires,
                        'id': tokenid
                    };

                    _data.create("tokens", tokenid, tokenObject, (err)=>{
                        if(!err){
                            callback(200, tokenObject);
                        } else{
                            callback(500, {"Error": "Couldn't Create Tokens"})
                        }
                    });

                } else {
                    callback(400, {"Error": "Password didn;t match with the user's specifed password"});
                }

            } else {
                callback(400, {"Error": "User Not Found"});
            }
        });


    } else {
        callback(400, {"Error": "Missing Required Field"});
    }
};

//Tokens Get
//Required data: id
//Optional Field: none
handlers._tokens.get = (data, callback)  => {
    let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length==20 ? data.queryStringObject.id.trim() : false;
    const _data = new userdata();
    const _helpers = new helpers();
    if(id){
        _data.read("tokens", id, (err, tokenData) =>{
            if(!err && tokenData){
                //Remove hashed password before returning data to user
                callback(200, tokenData);
            } else{
                callback(404, {"Error": "Token Not Found"})
            }
        });
    } else{
        callback(400, {"Error":"Missing Required field"})
    }
};

//Tokens Update
handlers._tokens.put = (data, callback)  => {
    let id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim(): false;
    let extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true: false;
  
    if (id && extend){
        const _data = new userdata();
        _data.read("tokens", id, (err, tokenData) =>{
            if(!err && tokenData){
                //Remove hashed password before returning data to user
                if(tokenData.expires > Date.now()){
                    tokenData.expires = Date.now() + 1000 * 60 * 60;

                    _data.update("tokens", id, tokenData, (err)=>{
                        if(!err){
                            callback(200, tokenData);
                        } else {
                            
                            callback(500, {"Error": "Unable to Extend Token for now" });
                        }
                    });
                } else {
                    callback("400", {"Error": "Token has already been expired"})
                }
            } else{
                callback(404, {"Error": "Token Not Found"})
            }
        });

    } else{
        callback(400, {"Error": "Missing Required Field or Field Data is invalid"})
    }
};

//Tokens Delete
handlers._tokens.delete = (data, callback)  => {

    let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length==20 ? data.queryStringObject.id.trim() : false;
    const _data = new userdata();
    const _helpers = new helpers();
    if(id){
        _data.read("tokens", id, (err, data) =>{
            if(!err && data){
                //Remove hashed password before returning data to user
                _data.delete("tokens", id, (err)=>{
                    if(!err){
                        callback(200);
                    } else{
                        callback(500, {"Error": "Couldn't delete the token"});
                    }
                });
            } else{
                callback(400, {"Error": "Token Not Found"})
            }
        });
    } else{
        callback(400, {"Error":"Missing Required field"})
    }
};

handlers._tokens.verifyToken = (id, phone, callback) =>{

    const _data = new userdata();
    _data.read("tokens", id, (err, tokenData) =>{
        if(!err && tokenData){
            if(tokenData.phone == phone && tokenData.expires > Date.now()){
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });

};


handlers.checks = (data, callback) => {
    //Callback HTTP Status Code and a payload (should be object)

    let acceptableMethods = ['get', 'post', 'put', 'delete']; 
    if (acceptableMethods.indexOf(data.method) != -1) {
        handlers._checks[data.method](data, callback);
    } else {
        callback(405);
    }

};

handlers._checks = {};

//Checks -- Post
//REquired data: protocol, url, method, successCode, timeoutSeconds
//Optional Data : none
handlers._checks.post = (data, callback)  => {

    let protocol = typeof(data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol.trim(): false;
    let url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim(): false;
    let method = typeof(data.payload.method) == 'string' && ['get', 'post', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method.trim(): false;
    let successCodes = typeof(data.payload.successCodes) == 'object' &&  data.payload.successCodes instanceof Array  && data.payload.successCodes.length > -1 ? data.payload.successCodes : false;
    let timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' &&  data.payload.timeoutSeconds %1 ===0  && data.payload.timeoutSeconds >=1 && data.payload.timeoutSeconds <=5 ? data.payload.timeoutSeconds: false;

    if (protocol && url && method && successCodes && timeoutSeconds){
        const _data = new userdata();
        const _helpers = new helpers();
        let token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length==20 ? data.headers.token.trim() : false;
        // Verify token is valid for user
        _data.read("tokens", token, (err, tokenData) => {

            if(!err && tokenData){
                let userPhone = tokenData.phone;
                _data.read("users", userPhone, (err, userData) => {
                    if(!err && userData){
                        let userChecks  = typeof(userData.checks) == "object" && userData.checks instanceof Array ? userData.checks : [];
                        // Verify User has less than max checks

                        if(userChecks.length < config.maxChecks ){
                            
                            var checkID = _helpers.createRandomString(20);

                            //Create the check object
                            var checkObject = {
                                "id": checkID,
                                "userPhone": userPhone,
                                "protocol": protocol,
                                "url": url,
                                "successCodes": successCodes,
                                "timeoutSeconds": timeoutSeconds,
                                "method": method
                            };

                            _data.create("checks", checkID, checkObject, (err) =>{
                                if(!err){
                                    //Add the check to user objects
                                    userData.checks = userChecks;
                                    userData.checks.push(checkID);
                                    _data.update("users", userPhone, userData, (err)=>{
                                        if(!err){
                                            callback(200, checkObject);
                                        } else {
                                            callback(500, {"Error": "Couldn't update user with new check"});
                                        }
                                    });
                                } else{
                                    callback(500, {"Error": "Couldn't create new check"});
                                }
                            });

                        } else {

                            callback(400, {"Error": `User has already max numbers of check (${config.maxChecks})`}); 
                        }
                    } else {
                        callback(403, {"Error": "Unauthorized User"}) 
                    }

                });
            } else {
                callback(403, {"Error": "Unauthorized User"}) 
            }
        });


    } else{
        callback(400, {"Error": "Missing Required"})
    }

};

//Checks get
//Required Data: id
//Optional Data: none 
handlers._checks.get = (data, callback)  => {
//Check phone is valid
    let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length==20 ? data.queryStringObject.id.trim() : false;
    const _data = new userdata();
    const _helpers = new helpers();
    if(id){

        _data.read("checks", id, (err, checkData) => {
            if(!err && checkData) {
                let token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length==20 ? data.headers.token.trim() : false;
                // Verify token is valid for user
                handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
                    if (tokenIsValid){
                        callback(200, checkData);
                        
                            
                    } else{
                        callback(403);
                    }
                });

            } else{
                callback(400, {"Error":"Pleaes provide valid checkid"});
            }

        });
    } else{
        callback(400, {"Error":"Missing Required field"});
    }
};

//Checks put
//Required Data: id
//Optional Data: protocol, url, method, sucessCodes, timeoutSeconds (one must be sent)
handlers._checks.put = (data, callback)  => {

    let id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length==20 ? data.payload.id.trim() : false;
    let protocol = typeof(data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol.trim(): false;
    let url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim(): false;
    let method = typeof(data.payload.method) == 'string' && ['get', 'post', 'put', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method.trim(): false;
    let successCodes = typeof(data.payload.successCodes) == 'object' &&  data.payload.successCodes instanceof Array  && data.payload.successCodes.length > -1 ? data.payload.successCodes : false;
    let timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' &&  data.payload.timeoutSeconds %1 ===0  && data.payload.timeoutSeconds >=1 && data.payload.timeoutSeconds <=5 ? data.payload.timeoutSeconds: false;

    const _data = new userdata();
    const _helpers = new helpers();
    if (id){
        if (
            protocol || url || method || successCodes || timeoutSeconds
        ) {

            _data.read("checks", id, (err, checkData) => {
                if(!err && checkData){

                    let token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length==20 ? data.headers.token.trim() : false;
                    // Verify token is valid for user

                    handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
 
                        if (tokenIsValid){

                            checkData.protocol = protocol ? protocol : checkData.protocol;
                            checkData.url = url ? url : checkData.url;
                            checkData.method = method ? method : checkData.method;
                            checkData.successCodes = successCodes ? successCodes : checkData.successCodes;
                            checkData.timeoutSeconds = timeoutSeconds ? timeoutSeconds : checkData.timeoutSeconds;
                            console.log(checkData);
                            _data.update("checks", id, checkData, (err) =>{
                                if (!err){
                                    callback(200);
                                } else{
                                    callback(500, {"Error": "Couldn't update check data"});
                                }
                            });
                        } else {
                            callback(403);
                        }
                    });
                    

                } else{
                    callback(400, {"Error": "Check Data not found"});
                }
            });


        } else {
            callback(400, {"Error": "Missing fields tp Update"});
        }
    } else {
        callback(400, {"Error": "Missing Required Field"});
    }
};


//Checks delete
//Required Data: id
//Optional Data: none
handlers._checks.delete = (data, callback)  => {
    let id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length==20 ? data.queryStringObject.id.trim() : false;
 
    const _data = new userdata();
    const _helpers = new helpers();

    if (id){

        _data.read("checks", id, (err, checkData) => {
            if(!err && checkData){

                let token = typeof(data.headers.token) == 'string' && data.headers.token.trim().length==20 ? data.headers.token.trim() : false;
                // Verify token is valid for user

                handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {

                    if(tokenIsValid){
                        _data.delete("checks", id, (err) =>{
                            if(!err){
                                _data.read("users", checkData.userPhone, (err, userData) =>{

                                    if(!err && userData) {
                                        let userChecks  = typeof(userData.checks) == "object" && userData.checks instanceof Array ? userData.checks : [];
                                        var checkPosition = userChecks.indexOf(id);

                                        if (checkPosition > -1) {
                                            userChecks.splice(checkPosition, 1);

                                            _data.update("users", checkData.userPhone, userData, (err) => {
                                                if(!err){
                                                    callback(200);
                                                } else {
                                                    callback(500, "Couldn't update the user")
                                                }
                                            });
                                        } else {
                                            callback(500, {"Error": "Couldn't find the check on the user object, so couldn't remove the check from user"});
                                        }

                                    } else {
                                        callback(500, {"Error": "Couldn't find the user, so couldn't remove the check from user"});
                                    }
                                });
                            } else {
                                callback(500, {"Error": "Couldn't delete the data"});
                            }
                        });
                    } else{
                        callback(403);
                    }


                });
            } else{

                callback(400, {"Error": "Check Data not found"});

            }
            
        });

    } else {
        callback(400, {"Error": "Missing Required Field"});
    }
};
handlers.notFound = (data, callback) => {

    callback(404);
    
}


export default handlers;