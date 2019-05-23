const _ = require('lodash');
const pify = require('pify');
const fs = require('fs');
const crypto = require('crypto');

function md5(s) {
  return crypto.createHash('md5').update(s).digest("hex");
}

const loadCsv = require('../units/loadCsv').command;

async function go() {
  const data = await loadCsv({
    path: './data/authorsByAwards.20190523000131.csv',
  });

  const people = _.uniq(_.map(data, (row) => row.fullName));
  const grants = _.uniq(_.map(data, (row) => row.grantId));
  const pubs = _.uniq(_.map(data, (row) => row.pubTitle));

  const cyto = [];
  const d3 = {
    nodes: [],
    links: [],
  };

  // elements.push({
  //   data: {id: 1},
  // });

  // elements.push({
  //   data: {id: 2},
  // });

  // elements.push({
  //   data: {
  //     id: '1-2',
  //     source: 1,
  //     target: 2,
  //   },
  // });

  _.forEach(people, (person) => {
    d3.nodes.push({
      id: md5(person),
    });

    cyto.push({
      data: {
        id: md5(person),
        type: 'person',
        label: person,
      },
    });
  });

  _.forEach(grants, (grant) => {
    d3.nodes.push({
      id: md5(grant),
    });

    cyto.push({
      data: {
        id: md5(grant),
        type: 'grant',
        label: grant,
      },
    });
  });

  _.forEach(pubs, (pub) => {
    d3.nodes.push({
      id: md5(pub),
    });

    cyto.push({
      data: {
        id: md5(pub),
        type: 'publication',
        label: pub,
      },
    });
  });

  _.forEach(data, (author, index) => {
    const pubTitle = md5(author.pubTitle);
    const fullName = md5(author.fullName);
    const grantId =  md5(author.grantId);

    d3.links.push({
      source: pubTitle,
      target: fullName,
    });
    d3.links.push({
      source: grantId,
      target: pubTitle,
    });

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

  await pify(fs.writeFile)('./viz/d3/data.json', JSON.stringify(d3));
  await pify(fs.writeFile)('./viz/cyto/data.json', JSON.stringify(cyto));
}

go();