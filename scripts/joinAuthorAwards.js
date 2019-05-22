const _ = require('lodash');
const pify = require('pify');
const fs = require('fs');
const path = require('path');
const pMap = require('p-map');
const moment = require('moment');

const writeCsv = require('../units/writeCsv').command;
const loadCsv = require('../units/loadCsv').command;
const fuzzyMatchName = require('../units/fuzzyMatchName').command;

async function mapAuthorData (creator, index) {
  const isHarper = false;
  const harper = await loadCsv({
    path: './data/harper.csv',
  });
  const isHarperResult = fuzzyMatchName({
    first: creator.givenName,
    last: creator.familyName,
    corpus: harper,
    keyFirst: 'firstname',
    keyLast: 'lastname',
  });
  console.log(isHarperResult);

  const isInvestigator = false;
  const isLeadInvestigator = false;
  return {
    pubTitle: title,
    grantId: grantId,
    nihGivenName: creator.givenName,
    nihFamilyName: creator.familyName,
    fullName: `${creator.givenName} ${creator.familyName}`,
    nihAffiliation: creator.affiliation,
    authorPosition: index + 1,
    isFirstAuthor: index === 0,
    isLastAuthor: (pub.creators.length - 1) === index,
    isHarper: isHarperResult !== null,
    isInvestigator,
    isLeadInvestigator,
  };
}

async function mapGrantData (pub) {
  const title = pub.title;
  const mappedData = await pMap(pub.creators, mapAuthorData);
  return mappedData;
}

async function mapGrantFiles (filename) {
  if(!_.endsWith(filename, '.json')) return;

  const data = await pify(fs.readFile)(path.join('./data', 'awards', filename));
  const jsonObj = JSON.parse(data);
  const grantId = filename.replace('.json', '');
  const mappedOverObject = await pMap(jsonObj, mapGrantData);
  return _.flatten(mappedOverObject);
}

function leftOuterJoin(left, leftKey, right, rightKey) {
  const rightKeyed = _.keyBy(right, rightKey);
  return _.map(left, (leftObj) => {
    return _.merge(leftObj, rightKeyed[leftObj[leftKey]])
  });
}

async function go() {
  try {
    const awards = await loadCsv({
      path: './data/awards14-18.csv',
    });
  } catch (err) {
    throw Error('Loading CSV', err);
  }

  const nih = _.compact(_.map(awards, (award) => {
    if(!_.startsWith(award['Prime Sponsor'], 'National Institutes of Health')) {
      return null;
    }
    const awardId = award['Sponsor Award Number/ Award ID'];
    const reResult = /\w{4}([a-z]{2}[0-9]{6})-?.{2,4}.*/i.exec(awardId);
    if(!reResult) return null;
    award.grantId = reResult[1];
    return award;
  }));
  
  try {
    const files = await pify(fs.readdir)('./data/awards');
  } catch (err) {
    throw Error('Reading award data', err);
  }

  try {
    const authorsByGrant = await pMap(files, mapGrantFiles);
  } catch (err) {
    throw Error(err);
  }
  const authors = _.compact(_.flatten(authorsByGrant));

  const data = leftOuterJoin(authors, 'grantId', nih, 'grantId');
  await writeCsv({
    path: `./data/authorsByAwards.${moment().format('YYYYMMDDHHmmss')}.csv`,
    data,
  });
}

go();