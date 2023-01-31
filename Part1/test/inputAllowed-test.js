//[assignment] write your own unit test to show that your Mastermind variation circuit is working as expected

const { expect, assert } = require('chai');
const { ethers } = require('hardhat');
const { groth16 } = require('snarkjs');

const wasm_tester = require('circom_tester').wasm;

const F1Field = require('ffjavascript').F1Field;
const Scalar = require('ffjavascript').Scalar;
exports.p = Scalar.fromString(
  '21888242871839275222246405745257275088548364400416034343698204186575808495617'
);
const Fr = new F1Field(exports.p);

const convertLetter = (letter) =>
  ethers.utils.sha256(ethers.utils.hexlify(ethers.utils.toUtf8Bytes(letter)));

const ALLOW_LIST = ['w', 'o', 'r', 'd', 's'].map(convertLetter);

describe('InputAllowed circuit test', function () {
  this.timeout(100000000);

  it('submitting valid letters', async () => {
    const circuit = await wasm_tester(
      'lib/contracts/circuits/TestInputAllowed.circom'
    );

    const submit = ['s', 'w', 'o', 'r', 'd'].map(convertLetter);
    const INPUT = {
      submission: submit,
      allowList: ALLOW_LIST,
    };

    const witness = await circuit.calculateWitness(INPUT, true);

    assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
    assert(Fr.eq(Fr.e(witness[1]), Fr.e(1)));
  });

  it('submitting invalid characters', async () => {
    const circuit = await wasm_tester(
      'lib/contracts/circuits/TestInputAllowed.circom'
    );

    const submit = ['1', 'o', '&', 'd', 's'].map(convertLetter);
    const INPUT = {
      submission: submit,
      allowList: ALLOW_LIST,
    };

    const witness = await circuit.calculateWitness(INPUT, true);

    assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
    assert(Fr.eq(Fr.e(witness[1]), Fr.e(0)));
  });
});
