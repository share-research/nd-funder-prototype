const fs = require('fs');
const Papa = require('papaparse');
const _ = require('lodash');
const pMap = require('p-map');
const Fuse = require('fuse.js');
const elasticlunr = require('elasticlunr');

const nameParser = require('./nameParser').command;

function parseCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(
      file,
      {
        header: true,
        complete: (results) => {
          if (results.error) {
            reject(results.error);
          }
          resolve(results.data);
        },
      },
    );
  });
}

async function loadCsv(filePath, db) {
  const data = await parseCsv(fs.createReadStream(filePath));
  return data;
}

function normalizeName(name) {
  return name.toLowerCase().replace(/\W/g, ' ');
}

function nameMatchFuzzy(last, first, lastFuzzy) {
  const lastNameResults = lastFuzzy.search(last);
  const fuzzyHarperFirst = new Fuse(lastNameResults, {
    caseSensitive: false,
    shouldSort: true,
    includeScore: false,
    keys: ['firstname'],
    findAllMatches: true,
    threshold: 0.001,
  });
  const results = fuzzyHarperFirst.search(first);
  return results.length > 0 ? results[0] : null;
}

function nameMatchElasticLunr(last, first, index) {
  // const index = elasticlunr();
  // index.addField('lastname');
  // index.addField('firstname');
  // index.setRef('netid')

  // _.forEach(harper, (value) => {
  //   index.addDoc(value);
  // });

  return index.search(`${first} ${last}`);
}

async function returnNihIds() {
  const harper = await loadCsv('./data/harper.csv');

  const fuzzyHarperLast = new Fuse(harper, {
    caseSensitive: false,
    shouldSort: true,
    includeScore: false,
    keys: ['lastname'],
    findAllMatches: true,
    threshold: 0.001,
  });

  const awards = await loadCsv('./data/awards14-18.csv');
  const matchedAwardsRaw = await pMap(awards, async (award, index) => {
    const leadName = award['Award Lead Investigator Name'];
    const awardName = award['Award Investigator Full Name'];
    const parsedLeadName = await nameParser({
      name: leadName,
      reduceMethod: 'majority',
    });
    const parsedAwardName = await nameParser({
      name: awardName,
      reduceMethod: 'majority',
    });
    if(nameMatchFuzzy(parsedLeadName.last, parsedLeadName.first, fuzzyHarperLast)
      || nameMatchFuzzy(parsedLeadName.last, parsedLeadName.first, fuzzyHarperLast)) {
      if(_.startsWith(award['Prime Sponsor'], 'National Institutes of Health')) {
        const awardId = award['Sponsor Award Number/ Award ID'];
        const reResult = /\w{4}([a-z]{2}[0-9]{5})-?.{2,4}.*/i.exec(awardId);
        if(reResult) {
          return reResult[1];
        }
        return null;
      }
    }
    return null;
  });
  const matchedAwards = _.compact(matchedAwardsRaw);
  return matchedAwards;
}

module.exports = {
  command: returnNihIds,
}