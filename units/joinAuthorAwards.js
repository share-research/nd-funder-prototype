const _ = require('lodash');
const pify = require('pify');
const fs = require('fs');
const path = require('path');
const pMap = require('p-map');

const loadCsv = require('./loadCsv').command;

// async function loadAwardIdPublications(awardDataDir){

//   if (awardDataDir){
//     console.log(`Reading files from directory: ${awardDataDir}`);
//     fs.readdir(awardDataDir, (err, files) => {
//       if (err) throw err;
//       const mapper = async (fileName) => {
//         const filePath = path.join(awardDataDir,`${filename}`);
//         console.log(`Reading data from file: ${filePath}`);
//         awardPubs = [];
//         const data = await getFileData(filePath);
//         if (data){
//           if (filename.includes('.')){
//             awardId = filename.split('.').slice(0,-1).join('.');
//           } else {
//             awardId = filename;
//           }
//           console.log(`Creating object for award id: ${awardId}`);
//           awardPub = createJsonObject(awardId, data);
//           awardPubs.push(awardPub);
//         }
//       };
//     }
//   } else {
//     console.log('Reading data from Directory failed: File directory undefined');
//   }
  
  
// }

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
      return _.map(pub.creators, (creator) => {
        return {
          pubTitle: title,
          grantId: grantId,
          nihGivenName: creator.givenName,
          nihFamilyName: creator.familyName,
          nihAffiliation: creator.affiliation,
        };
      });
    }));
  });
  const authors = _.compact(_.flatten(authorsByGrant));

  const nihKeyed = _.keyBy(nih, 'grandId');
  console.log(_.map(authors, (author) => {
    return _.merge(author, nihKeyed[author.grandId])
  }));
}

go();