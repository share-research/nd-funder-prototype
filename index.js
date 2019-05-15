const axios = require('axios');
const _ = require('lodash');
const xmlToJson = require('xml-js');

const urlGetUids = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const urlGetRecords = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';

async function getESearch(term){
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

  const ids = await getESearch('GM067079');
  const records = await getEFetch(ids);
  console.log(extractMetadata(records));
}

go();

