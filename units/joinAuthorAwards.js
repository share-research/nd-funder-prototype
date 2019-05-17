const _ = require('lodash');

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

    award.id = reResult[1];
    return award;
  }));

  nih
}

go();