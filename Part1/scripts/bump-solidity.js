const fs = require('fs');
const solidityRegex = /pragma solidity \^\d+\.\d+\.\d+/;

['./lib/contracts', './contracts'].map((path) => {
  let content = fs.readFileSync(path + '/verifier.sol', { encoding: 'utf-8' });
  let bumped = content.replace(solidityRegex, 'pragma solidity ^0.8.0');

  fs.writeFileSync(path + '/verifier.sol', bumped);
});
