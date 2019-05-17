const _ = require('lodash');

function mapToTemplate (template, source, defaultValue) {
  return _.mapValues(template, (value) =>
    !_.isPlainObject(value)
      ? _.get(source, value, defaultValue)
      : mapToTemplate(value, source, defaultValue)
  );
}

module.exports = {
  command: (input) => {
    return mapToTemplate(input.template, input.source, input.default);
  },
};

const template = {
  a: 'b',
  b: 'c',
  c: {
    d: 'd',
  },
};

const source = {
  b: 2,
  c: 3,
  d: 4,
};

const result = mapToTemplate(template, source);

result