const _ = require('lodash');
const pify = require('pify');
const fs = require('fs');
const path = require('path');
const pMap = require('p-map');
const moment = require('moment');

const writeCsv = require('../units/writeCsv').command;
const loadCsv = require('../units/loadCsv').command;
const fuzzyMatchName = require('../units/fuzzyMatchName').command;
const nameParser = require('../units/nameParser').command;

async function mapGrantFiles (filename) {
  if(!_.endsWith(filename, '.json')) return;
  const data = await pify(fs.readFile)(path.join('./data', 'awards', filename));
  const grantId = filename.replace('.json', '');

  let jsonObj = JSON.parse(data);
  if( !_.isArray(jsonObj) )
    jsonObj = [jsonObj];

  const mappedOverObject = await pMap(jsonObj, async (pub) => {
    const title = pub.title;
    const mappedData = await pMap(pub.creators, async (creator, index) => {
      const harper = await loadCsv({
        path: './data/harper.csv',
      });

      const parsedName = await nameParser({
        name: `${creator.givenName} ${creator.familyName}`,
        reduceMethod: 'majority',
      });

      const isHarperResult = fuzzyMatchName({
        first: parsedName.first,
        last: parsedName.last,
        corpus: harper,
        keyFirst: 'firstname',
        keyLast: 'lastname',
      });

      const awards = await loadCsv({
        path: './data/awards14-18.csv',
      });

      const investigatorCorpus = await pMap(awards, async (award) => {
        const name = award['Award Investigator Full Name'];
        const nameObj = await nameParser({
          name,
          reduceMethod: 'majority',
        });
        return nameObj;
      }, {concurrency: 1});

      const isAwardInvestigatorResult = fuzzyMatchName({
        first: parsedName.first,
        last: parsedName.last,
        corpus: investigatorCorpus,
        keyFirst: 'first',
        keyLast: 'last',
      });
      
      const leadCorpus = await pMap(awards, async (award) => {
        const name = award['Award Lead Investigator Name'];
        const nameObj = await nameParser({
          name,
          reduceMethod: 'majority',
        });
        return nameObj;
      }, {concurrency: 1});

      const isLeadInvestigatorResult = fuzzyMatchName({
        first: parsedName.first,
        last: parsedName.last,
        corpus: leadCorpus,
        keyFirst: 'first',
        keyLast: 'last',
      },  {concurrency: 1});
      
      return {
        pubTitle: title,
        grantId: grantId,
        nihGivenName: creator.givenName,
        nihFamilyName: creator.familyName,
        first: parsedName.first,
        last: parsedName.last,
        fullName: `${parsedName.first} ${parsedName.last}`,
        nihAffiliation: creator.affiliation,
        authorPosition: index + 1,
        isFirstAuthor: index === 0,
        isLastAuthor: (pub.creators.length - 1) === index,
        isHarper: isHarperResult !== null,
        isInvestigator: isAwardInvestigatorResult !== null,
        isLeadInvestigator: isLeadInvestigatorResult !== null,
      };
    }, { concurrency: 1 });
    return mappedData;
  }, { concurrency: 1 });
  return _.flatten(mappedOverObject);
}

function leftOuterJoin(left, leftKey, right, rightKey) {
  const rightKeyed = _.keyBy(right, rightKey);
  return _.map(left, (leftObj) => {
    return _.merge(leftObj, rightKeyed[leftObj[leftKey]])
  });
}

async function go() {
  const awards = await loadCsv({
    path: './data/awards14-18.csv',
  });
  
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
  
  const files = await pify(fs.readdir)('./data/awards');

  const authorsByGrant = await pMap(files, mapGrantFiles, { concurrency: 1 });

  const authors = _.compact(_.flatten(authorsByGrant));

  const data = leftOuterJoin(authors, 'grantId', nih, 'grantId');

  await writeCsv({
    path: `./data/authorsByAwards.${moment().format('YYYYMMDDHHmmss')}.csv`,
    data,
  });
}

go();