// Library for storing data

import fs from "fs";
import path  from "path";
import helpers from "./helpers"
import { timingSafeEqual } from "crypto";


// Container First Module


class data {

    constructor() {
        this.baseDir = path.join(__dirname, "/../.data/");
        this.helpers = new helpers(); 
    }

    getDirectory (dir) {
        let directory = `${this.baseDir}${dir}`; 
        return directory;
    };
    
    getFileName(dir, file) {
        let directory = this.getDirectory(dir);

        if(!fs.existsSync(directory)){
             fs.mkdirSync(directory);
        }

        let fileName = `${directory}/${file}.json`;

        return fileName;

    }
    
    create(dir, file, data, callback) {
        
        let fileName = this.getFileName(dir, file);
 
        fs.open(fileName,  'wx', 
            (err, fileDescriptor) =>{
                if(!err && fileDescriptor){
                    //Convert data to String
                    var stringData = JSON.stringify(data);

                    fs.writeFile(fileDescriptor, stringData, (err) => {
                        if(!err){
                            fs.close(fileDescriptor, (err) => {
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
        console.log("fileName", fileName);
        fs.readFile(fileName, 'utf8', (err, data) =>{
            if (!err && data){
                let parsedJSONData = this.helpers.parseJsonToObject(data);  
                callback(err, parsedJSONData);
            } else {
                callback(err, data);
            }
        });
    }

    //Update File Data
    update(dir, file, data, callback) {

        let fileName = this.getFileName(dir, file);
 
        fs.open(fileName,  'r+', 
            (err, fileDescriptor) => {
                if(!err && fileDescriptor){
                    //Convert data to String
                    var stringData = JSON.stringify(data);

                    //Truncate the file
                    fs.truncate(fileDescriptor, (err) => {                    
                        if(!err) {
                            fs.writeFile(fileDescriptor, stringData, (err) =>{
                                if(!err){
                                    fs.close(fileDescriptor, (err) => {
                                        if(!err){
                                            callback(false);
                                        } else{
                                            callback("Error closing file");
                                        }
                                    });    
                                } else{

                                    callback('Error Writing to existing File');
                                }
                            });
                        } else{
                            callback('Error truncating File')
                        }
                    });
                } else {
                    console.log(err);
                    callback("Couldn't update the file, it may not exist yet");
                }
            }
        );  
    }

    delete(dir, file, callback){

        let fileName = this.getFileName(dir, file);
        fs.unlink(fileName, (err) => {
            if(!err) 
            {
                callback(false);
            }else
            {
                callback(err);
            }

        });
    }

    //List all the items in a directory
    list(dir, callback) {
        let directory = this.getDirectory(dir);
        fs.readdir(directory, (err, data) =>{
            if(!err && data && data.length > 0){
                let trimmedPath = [];

                data.forEach((fileName) =>{
                    trimmedPath.push(fileName.replace(".json", ''));
                });
                callback(false, trimmedPath);
            } else {

                callback(false);

            }
        });
    }
}




export default data;