pragma circom 2.0.0;

// [assignment] implement a variation of mastermind from https://en.wikipedia.org/wiki/Mastermind_(board_game)#Variation as a circuit
include "../../lib/contracts/circuits/InputAllowed.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib/circuits/poseidon.circom";

template MastermindVariation() {
    /*
    prove with ZK that a particular guess results in a particular
    set of clues without revealing the word.

    Green -> Letter is in the solution in correct position
    Yellow -> Letter is in the solution, but in the wrong position
    */

    signal input privateGuess[5];
    signal input publicGreen[5];
    signal input publicYellow[5];
    signal input publicSolutionHash;
    signal input allowList[26];

    signal input privateSolution[5];
    signal input privateSalt;

    signal output solutionHashOutput;

    component isEquals[5][5];
    component multiORs[5];

    component inputAllowed = InputAllowed(5, 26);
    inputAllowed.submission <== privateGuess;
    inputAllowed.allowList <== allowList;

    for(var i = 0; i < 5; i ++ ) {
        multiORs[i] = MultiOR(5);

        for(var j = 0; j < 5; j ++) {
            isEquals[i][j] = IsEqual();
            isEquals[i][j].in[0] <== privateGuess[i];
            isEquals[i][j].in[1] <== privateSolution[j];
            // log("isEquals[", i, "][", j, "].out = ", isEquals[i][j].out);
            multiORs[i].in[j] <== isEquals[i][j].out;
        }

        publicGreen[i] === isEquals[i][i].out;
        // log("publicGreen[", i, "] =", publicGreen[i]);
        publicYellow[i] === multiORs[i].out;
        // log("publicYellow[", i, "] =", publicYellow[i]);
    }

    component poseidon = Poseidon(7);
    poseidon.inputs[0] <== privateSalt;
    poseidon.inputs[1] <== inputAllowed.out;
    for (var i = 0; i < 5; i ++ ) {
        poseidon.inputs[i + 2] <== privateSolution[i];
    }

    
    solutionHashOutput <== poseidon.out;
    // log("solutionHashOutput (", solutionHashOutput, ") == poseidon.out (", poseidon.out,")");
    // log("solutionHashOutput (", solutionHashOutput, ") == publicSolutionHash (", publicSolutionHash,")");
    publicSolutionHash === solutionHashOutput;
}

component main = MastermindVariation();