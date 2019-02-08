// Library for storing data

import fs from "fs";
import path  from "path";


// Container First Module


class data {
    constructor() {
        this.baseDir = path.join(__dirname, "/../.data/");
    }
    
    getFileName(dir, file) {
        console.log("create directory 1");
        let directory = `${this.baseDir}${dir}`;
        console.log("directory exists", fs.existsSync(directory));
        if(!fs.existsSync(directory)){
            console.log("create directory");
             fs.mkdirSync(directory);
        }

        let fileName = `${directory}/${file}.json`;

        return fileName;

    }
    
    create(dir, file, data, callback) {
        
        let fileName = this.getFileName(dir, file);
 
        fs.open(fileName,  'wx', 
            function(err, fileDescriptor){
                if(!err && fileDescriptor){
                    //Convert data to String
                    var stringData = JSON.stringify(data);

                    fs.writeFile(fileDescriptor, stringData, function(err){
                        if(!err){
                            fs.close(fileDescriptor, function(err){
                                if(!err){
                                    callback(false)
                                } else{
                                    callback("Error closing file")
                                }
                            });    
                        } else{

                            callback('Error Writing to File')
                        }
                    });
                } else {
                    console.log(err);
                    callback("Couldn't create a file, it may already exist")
                }
            }
        );    
    };

    //Read File Data
    read(dir, file, callback){

        let fileName = this.getFileName(dir, file);
        fs.readFile(fileName, 'utf8', function(err, data){
            callback(err, data);
        });
    }

    //Update File Data
    update(dir, file, data, callback){

        let fileName = this.getFileName(dir, file);
 
        fs.open(fileName,  'r+', 
            function(err, fileDescriptor){
                if(!err && fileDescriptor){
                    //Convert data to String
                    var stringData = JSON.stringify(data);

                    //Truncate the file
                    fs.truncate(fileDescriptor, function(err) {                    
                        if(!err) {
                            fs.writeFile(fileDescriptor, stringData, function(err){
                                if(!err){
                                    fs.close(fileDescriptor, function(err){
                                        if(!err){
                                            callback(false)
                                        } else{
                                            callback("Error closing file")
                                        }
                                    });    
                                } else{

                                    callback('Error Writing to existing File')
                                }
                            });
                        } else{
                            callback('Error truncating File')
                        }
                    });
                } else {
                    console.log(err);
                    callback("Couldn't update the file, it may not exist yet")
                }
            }
        );  
    }

    delete(dir, file, callback){

        let fileName = this.getFileName(dir, file);
        fs.unlink(fileName, function(err){
            if(!err) 
            {
                callback(false);
            }else
            {
                callback(err);
            }

        });
    }


    
}




export default data;