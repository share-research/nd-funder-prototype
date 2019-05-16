const axios = require('axios');
const _ = require('lodash');
const xmlToJson = require('xml-js');
const pMap = require('p-map');
const schema = require('schm');
const translate = require('schm-translate');

const dataFolderPath = "data";
const urlGetUids = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
const urlGetRecords = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';


//const getText = constraints => prevSchema => prevSchema.merge({
//  validate(values) {
//    const parsed = prevSchema.parse(values);
//    return parsed._text;
//  }
//});

const creatorSchema = schema({
  affiliation: {type: String, default: null},
  givenName: {type: String, default: null},
  familyName: {type: String, default: null},
  initials: {type: String, default: null},
}, translate({
  affiliation: 'AffiliationInfo.Affiliation._text',
  givenName: 'ForeName._text',
  familyName: 'LastName._text',
  initials: 'Initials._text'
}));

const resourceIdentifierSchema = schema({
  resourceIdentifierType: {type: String, default: null},
  resourceIdentifier: {type: String, default: null},
}, translate({
  resourceIdentifierType: '_attributes.IdType',
  resourceIdentifier: '_text'
}));

const funderIdentifierSchema = schema({
  funder: {type: String, default: null},
  country: {type: String, default: null},
  funderIdentifier: {type: String, default: null},
}, translate ({
  funder: 'Agency._text',
  country: 'Country._text',
  funderIdentifier: 'GrantID._text',
}));

const shareWorkSchema = schema({
  title: {type: String, default: null},
  description: {type: String, default: null},
  creators: [creatorSchema],
  resourceIdentifiers: [resourceIdentifierSchema],
  funderIdentifiers: [funderIdentifierSchema],
}, translate({
  title: 'MedlineCitation.Article.ArticleTitle._text',
  description: 'MedlineCitation.Article.Abstract.AbstractText._text',
  creators: 'MedlineCitation.Article.AuthorList.Author',
  resourceIdentifiers: 'PubmedData.ArticleIdList.ArticleId',
  funderIdentifiers: 'MedlineCitation.Article.GrantList.Grant'
}));
 
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
  await wait(1000);
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
  await wait(1000);
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

  //console.log(response.data);
  return xmlToJson.xml2js(response.data, {compact:true});
}

function extractMetadata(rawJson){

  //return rawJson;
  console.log(rawJson);
  return _.map(rawJson.PubmedArticleSet.PubmedArticle, (value,key)=> {
    return shareWorkSchema.parse(value);
    //return _.get(value.MedlineCitation.Article,'GrantList.Grant.GrantID', null);

  });
  

}

async function go() {

  const awardIds = ['GM067079','GM096767', 'CA158066'];

  const mapper = async (awardId) => {
    const response = await getAwardPublications(awardId);
    console.log(response);
  };

  //actually run the method above to getAwardPublications against each awardId in the awardsIds array, timeout enabled to avoid exceeded request limit to PMC
  const result = await pMap(awardIds, mapper, {concurrency: 2});  
}

go();

