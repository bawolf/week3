//[assignment] write your own unit test to show that your Mastermind variation circuit is working as expected
const { buildPoseidon } = require('circomlibjs');
const { assert } = require('chai');
const { ethers } = require('hardhat');

const wasm_tester = require('circom_tester').wasm;

const F1Field = require('ffjavascript').F1Field;
const Scalar = require('ffjavascript').Scalar;
exports.p = Scalar.fromString(
  '21888242871839275222246405745257275088548364400416034343698204186575808495617'
);
const Fr = new F1Field(exports.p);

const convertWord = (word) => word.split('').map(convertLetter);

const convertLetter = (letter) =>
  ethers.utils.sha256(ethers.utils.hexlify(ethers.utils.toUtf8Bytes(letter)));

const SALT = ethers.utils.hexlify(ethers.utils.toUtf8Bytes('testsalt'));
const ALLOW_LIST = convertWord('abcdefghijklmnopqrstuvwxyz');

/*
prove with ZK that a particular guess results in a particular
set of clues without revealing the word.

Green -> Letter is in the solution in correct position
Yellow -> Letter is in the solution, but in the wrong position
*/

describe('Wordle circuit test', function () {
  let poseidonAsString;
  this.timeout(100000000);
  beforeEach(async function () {
    const poseidon = await buildPoseidon();
    poseidonAsString = async (input) => {
      const result = await poseidon(input);
      return poseidon.F.toString(result);
    };
  });

  it('guessing a correct answer', async () => {
    const circuit = await wasm_tester(
      'contracts/circuits/MastermindVariation.circom'
    );

    const wordHashes = convertWord('words');
    const publicSolutionHash = await poseidonAsString([SALT, 1, ...wordHashes]);

    const INPUT = {
      publicGreen: [1, 1, 1, 1, 1],
      publicYellow: [1, 1, 1, 1, 1],
      allowList: ALLOW_LIST,
      privateGuess: wordHashes,
      privateSolution: wordHashes,
      privateSalt: SALT,
      publicSolutionHash,
    };

    const witness = await circuit.calculateWitness(INPUT, true);
    assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
    assert(Fr.eq(Fr.e(witness[1]), Fr.e(publicSolutionHash)));
  });

  it('guessing a partially correct answer', async () => {
    const circuit = await wasm_tester(
      'contracts/circuits/MastermindVariation.circom'
    );

    const privateSolution = convertWord('words');
    const publicSolutionHash = await poseidonAsString([
      SALT,
      1,
      ...privateSolution,
    ]);

    const INPUT = {
      publicGreen: [0, 0, 0, 0, 0],
      publicYellow: [1, 1, 1, 1, 1],
      allowList: ALLOW_LIST,
      privateGuess: convertWord('sword'),
      privateSolution,
      privateSalt: SALT,
      publicSolutionHash,
    };

    const witness = await circuit.calculateWitness(INPUT, true);

    assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
    assert(Fr.eq(Fr.e(witness[1]), Fr.e(publicSolutionHash)));
  });

  it('guessing an incorrect answer', async () => {
    const circuit = await wasm_tester(
      'contracts/circuits/MastermindVariation.circom'
    );

    const privateSolution = convertWord('words');
    const publicSolutionHash = await poseidonAsString([
      SALT,
      1,
      ...privateSolution,
    ]);

    const INPUT = {
      publicGreen: [0, 0, 0, 0, 0],
      publicYellow: [0, 0, 0, 0, 0],
      allowList: ALLOW_LIST,
      privateGuess: convertWord('human'),
      privateSolution,
      privateSalt: SALT,
      publicSolutionHash,
    };

    const witness = await circuit.calculateWitness(INPUT, true);

    assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
    assert(Fr.eq(Fr.e(witness[1]), Fr.e(publicSolutionHash)));
  });

  it('guessing an invalid answer', async () => {
    const circuit = await wasm_tester(
      'contracts/circuits/MastermindVariation.circom'
    );

    const privateSolution = convertWord('words');
    const publicSolutionHash = await poseidonAsString([
      SALT,
      0,
      ...privateSolution,
    ]);

    const INPUT = {
      publicGreen: [0, 0, 0, 0, 0],
      publicYellow: [0, 0, 0, 0, 0],
      allowList: ALLOW_LIST,
      privateGuess: convertWord('*&^%!'),
      privateSolution,
      privateSalt: SALT,
      publicSolutionHash,
    };

    const witness = await circuit.calculateWitness(INPUT, true);

    assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
    assert(Fr.eq(Fr.e(witness[1]), Fr.e(publicSolutionHash)));
  });
});
