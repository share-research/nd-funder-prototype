const _ = require('lodash');
const pify = require('pify');
const fs = require('fs');
const path = require('path');
const pMap = require('p-map');

const writeCsv = require('./writeCsv').command;
const loadCsv = require('./loadCsv').command;

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
    if(!reResult) {
      return null;
    }
    award.grantId = reResult[1];
    return award;
  }));
  
  const files = await pify(fs.readdir)('./data/awards');
  const authorsByGrant = await pMap(files, async (filename) => {
    if(!_.endsWith(filename, '.json')) return;
    const data = await pify(fs.readFile)(path.join('./data', 'awards', filename));
    const jsonObj = JSON.parse(data);
    const grantId = filename.replace('.json', '');
    return _.flatten(_.map(jsonObj, (pub) => {
      const title = pub.title;
      return _.map(pub.creators, (creator, index) => {
        return {
          pubTitle: title,
          grantId: grantId,
          nihGivenName: creator.givenName,
          nihFamilyName: creator.familyName,
          nihAffiliation: creator.affiliation,
          authorPosition: index+1,
        };
      });
    }));
  });
  const authors = _.compact(_.flatten(authorsByGrant));

  function leftOuterJoin(left, leftKey, right, rightKey) {
    const rightKeyed = _.keyBy(right, rightKey);
    return _.map(left, (leftObj) => {
      return _.merge(leftObj, rightKeyed[leftObj[leftKey]])
    });
  }

  const data = leftOuterJoin(authors, 'grantId', nih, 'grantId');
  await writeCsv({
    path: './data/authorsByAwards.csv',
    data,
  });
}

go();