
const environments = {};

environments.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'staging',

    'hashingSecret':'this is a secret'
};


environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production',
    'hashingSecret':'this is also a secret'
};

let currentEnvironment = typeof(process.env.NODE_ENV) === "string" ? process.env.NODE_ENV.toLowerCase() : '';

let enviromentToExport = typeof(environments[currentEnvironment])=== "object" ? environments[currentEnvironment] : environments.staging;

export default enviromentToExport;
