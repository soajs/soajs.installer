"use strict";

const path = require("path");
const exec = require("child_process").exec;

//set the logger
const logger = require("./utils/utils.js").getLogger();

//set the process arguments and remove the first 2, they are not needed
let processArguments = process.argv;
processArguments.shift();
processArguments.shift();

//find the correct module to load
let soajsModule;
switch(processArguments[0]){
	case 'mongo':
		soajsModule = "mongo.js";
		break;
	case 'profile':
		soajsModule = "profile.js";
		break;
	case 'service':
		soajsModule = "service.js";
		break;
	case 'console':
		soajsModule = "console.js";
		break;
	case 'docker':
		soajsModule = "docker.js";
		break;
	case 'kubernetes':
		soajsModule = "kubernetes.js";
		break;
	case 'remote-installer':
		soajsModule = "remote-installer.js";
		break;
}

//requested module is not supported
if(!soajsModule){
	logger.error(`The command you have requested is not supported by the soajs installer: '${processArguments[0]}'`);
	process.exit();
}

//remove the third argument, from here on it is not needed anymore
processArguments.shift();

//calculate and append node executable to process environment variables
let NodeLocation = path.normalize(process.env.PWD + `/../include/${process.env.NODE_LOCATION}/bin/node`);
process.env.NODE_BIN = NodeLocation;

//set the soajs module directory
let soajsModulesDirectory = path.normalize(process.env.PWD + `/../libexec/lib/`);

let myModule = require(soajsModulesDirectory + soajsModule);
let commandRequested = processArguments[0];

//remove the argument that represents the command, no longer needed
processArguments.shift();

if(!Object.hasOwnProperty.call(myModule, commandRequested)){
	logger.error(`The requested command ${commandRequested} is not supported!`);
	process.exit();
}

//invoke the module requested
myModule[commandRequested](processArguments, (error, response) => {
	if (error) {
		logger.error(error);
	}
	else {
		if(response){
			if(!response.includes("SOAJS Installer")){
				logger.info(response);
			}
			else{
				console.log(response);
			}
		}
	}
	process.exit();
});
