const Fuse = require('fuse.js');

function match(
  searchFirst, serachLast,
  corpusObjects, corpusKeyFirst, corpusKeyLast
){
  const fuzzyLast = new Fuse(corpusObjects, {
    caseSensitive: false,
    shouldSort: true,
    includeScore: false,
    keys: [corpusKeyLast],
    findAllMatches: true,
    threshold: 0.001,
  });
  const lastNameResults = fuzzyLast.search(serachLast);
  const fuzzyFirst = new Fuse(lastNameResults, {
    caseSensitive: false,
    shouldSort: true,
    includeScore: false,
    keys: [corpusKeyFirst],
    findAllMatches: true,
    threshold: 0.001,
  });
  const results = fuzzyFirst.search(searchFirst);
  return results.length > 0 ? results[0] : null;
}

module.exports = {
  command: (input) => {
    return match(input.first, input.last, input.corpus, input.keyFirst, input.keyLast);
  },  
}