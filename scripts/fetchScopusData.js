const axios = require('axios');

// environment variables
process.env.NODE_ENV = 'development';

// uncomment below line to test this code against staging environment
// process.env.NODE_ENV = 'staging';

// config variables
const config = require('../config/config.js');

async function wait(ms){
    return new Promise((resolve, reject)=> {
      setTimeout(() => resolve(true), ms );
    });
  }

async function getNDPublications(){
    const records = await getScopusSearch(params);
    return records;
}

async function getScopusSearch(params){
    baseUrl = 'https://api.elsevier.com/content/search/scopus';
    
    const response = await axios.get(baseUrl, {
        headers: {
            'X-ELS-APIKey' : global.gConfig.els_api_key,
        },
        params: {
          query : "AF-ID(" + global.gConfig.affiliation_id + ")"
        }
      });

      return response.data;
    
}

async function go() {
    
      const response = await getScopusSearch();
      if( response ) {
        console.log(response);
      }
  }
  
  go();


