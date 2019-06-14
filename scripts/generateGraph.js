const _ = require('lodash');
const pify = require('pify');
const fs = require('fs');
const crypto = require('crypto');

function md5(s) {
  return crypto.createHash('md5').update(s).digest("hex");
}

const loadCsv = require('../units/loadCsv').command;

function pickFieldsFromUniqueRows(rows, fields, uniqueValue) {
  return _.uniqWith(
    _.map(rows, row => _.pick(row, fields))
  , uniqueValue);
}

async function go() {
  const data = await loadCsv({
    path: './data/authorsByAwards.20190523000131.csv',
  });

  // Second argument can be one of the following, unless we edit joinAuthorAward.js:
  //
  // pubTitle,grantId,nihGivenName,nihFamilyName,first,last,fullName,
  // nihAffiliation,authorPosition,isFirstAuthor,isLastAuthor,isHarper,
  // isInvestigator,isLeadInvestigator,Date Awarded - Fiscal Year (Nbr),
  // Date Awarded,Award Lead Research Division,Award Lead Research Dept,
  // Award Lead Investigator Name,Award Investigator Full Name,
  // Award Research Department,Award Investigator Role,Award Title,
  // Notre Dame Sponsor Name,Sponsor Award Number/ Award ID,Prime Sponsor,
  // Award Total Amount,Award Start Date,Award End Date,Cayuse Award Number
  const people = pickFieldsFromUniqueRows(data, ['fullName', 'isHarper'], 'fullName');
  const grants = pickFieldsFromUniqueRows(data, ['grantId'], 'grantId');
  const pubs = pickFieldsFromUniqueRows(data, ['pubTitle'], 'pubTitle');

  const cyto = [];

  _.forEach(people, (person) => {
    cyto.push({
      data: {
        id: md5(person.fullName),
        type: 'person',
        label: person.fullName,
        isHarper: person.isHarper,
      },
    });
  });

  _.forEach(grants, (grant) => {
    cyto.push({
      data: {
        id: md5(grant.grantId),
        type: 'grant',
        label: grant.grantId,
      },
    });
  });

  _.forEach(pubs, (pub) => {
    cyto.push({
      data: {
        id: md5(pub.pubTitle),
        type: 'publication',
      },
    });
  });

  _.forEach(data, (author, index) => {
    const pubTitle = md5(author.pubTitle);
    const fullName = md5(author.fullName);
    const grantId =  md5(author.grantId);

    cyto.push({
      data: { 
        id: `${pubTitle}-${fullName}`,
        source: pubTitle,
        target: fullName,
      },
    });
    cyto.push({
      data: { 
        id: `${grantId}-${pubTitle}`,
        source: grantId,
        target: pubTitle,
      },
    });
  });

  await pify(fs.writeFile)('./data/cyto.data.json', JSON.stringify(cyto));
}

go();