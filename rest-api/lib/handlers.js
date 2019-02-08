

//Dependenice
import userdata from "./data";
import helpers from "./helpers"

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
handlers._users.post = function(data, callback){
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
        _data.read('users', phone, function(err, data){
            if(err){
                
                let jsondata = JSON.stringify({
                    firstName: firstName,
                    lastName: lastName,
                    phone: phone,
                    hashedPassword: hashedPassword,
                    tosAgreement: tosAgreement 

                });
                _data.create("users", phone, jsondata, function(err){
                    if(!err){
                        callback(200);
                    } else{
                        callback(500, {'Error': err});
                    }

                });
            } else{
                callback(500, {'Error': 'User Already Exists'});
            }
  
        });
    } else{
        callback(500, {'Error': 'Unable to encrypt password'});
    }

    } else {
        callback(500, {'Error': 'Missing Required Fields'});
    }

};

//Users - get
handlers._users.get = function(data, callback){};

//Users - put
handlers._users.put = function(data, callback){};

//Users - delete
handlers._users.delete = function(data, callback){};

handlers.notFound = (data, callback) => {

    callback(404);
    
}


export default handlers;