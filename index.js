const axios = require('axios');
const _ = require('lodash');
const xmlToJson = require('xml-js');
const pMap = require('p-map');

const dataFolderPath = "data";
const urlGetUids = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const urlGetRecords = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';

async function wait(ms){
  return new Promise((resolve, reject)=> {
    setTimeout(() => {
      resolve(true);
    },
    ms 
    );
  });
}

async function getAwardPublications(awardId){
  const ids = await getESearch(awardId);
  const records = await getEFetch(ids);
  return extractMetadata(records);
}

async function getESearch(term){
  await wait(334);
  const url = `${urlGetUids}`;
  const response = await axios.get(url, {
    params: {
      db: 'pubmed',
      retmode: 'json',
      retmax: '100',
      term,
    }
  });
  return response.data.esearchresult.idlist;
}

async function getEFetch(ids){
  await wait(334);
  const url = `${urlGetRecords}`;
  const commaSeparatedIds = _.join(ids, ',');
  const response = await axios.get(url, {
    responseType: 'text',
    params: {
      db: 'pubmed',
      retmode: 'xml',
      retmax: '100',
      id: commaSeparatedIds,
    }
  });

  return xmlToJson.xml2js(response.data, {compact:true});
}

function extractMetadata(rawJson){

  return _.map(rawJson.PubmedArticleSet.PubmedArticle, (value,key)=> {
    return _.get(value.MedlineCitation.Article,'GrantList.Grant.GrantID', null);
  });
  

}

async function go() {

  const awardIds = ['GM067079','GM096767', 'CA158066'];

  const mapper = async (awardId) => {
    const response = await getAwardPublications(awardId);
    console.log(response);
  };

  const result = await pMap(awardIds, mapper, {concurrency: 2});
  
//  _.forEach(AwardIds, async function(awardId){
//    console.log(getAwardPublications(awardId));
//  });
  //console.log(await getAwardPublications('GM067079'));
}

go();

