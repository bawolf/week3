pragma circom 2.0.0;
include "../../../node_modules/circomlib/circuits/gates.circom";
include "../../../node_modules/circomlib/circuits/comparators.circom";

template MultiOR(n) {
    signal input in[n];
    signal output out;
    component or1;
    component or2;
    component ors[2];
    if (n==1) {
        out <== in[0];
    } else if (n==2) {
        or1 = OR();
        or1.a <== in[0];
        or1.b <== in[1];
        out <== or1.out;
    } else {
        or2 = OR();
        var n1 = n\2;
        var n2 = n-n\2;
        ors[0] = MultiOR(n1);
        ors[1] = MultiOR(n2);
        var i;
        for (i=0; i<n1; i++) ors[0].in[i] <== in[i];
        for (i=0; i<n2; i++) ors[1].in[i] <== in[n1+i];
        or2.a <== ors[0].out;
        or2.b <== ors[1].out;
        out <== or2.out;
    }
}


template InputAllowed(n,m) {
    signal input submission[n];
    signal input allowList[m];
    signal output out;

    component ors[n];
    component isEquals[n][m];

    // go through each letter. If a disallowed letter is found, mark it as bad
    // move on to the next one.
    
    // log("about to start looping through the submission...");
    for(var i = 0; i < n; i ++) {
        // log("submission[", i, "] is ", submission[i]);
        ors[i] = MultiOR(m);
        for(var j = 0; j < m; j++) {
            // log("allowList[", j, "]=", allowList[j]);
            isEquals[i][j] = IsEqual();
            isEquals[i][j].in[0] <== submission[i];
            isEquals[i][j].in[1] <== allowList[j];
            // log("isEquals[", i, "][", j, "].out = ", isEquals[i][j].out);
            ors[i].in[j] <== isEquals[i][j].out;
        }
        // log("ors[", i, "].out = ", ors[i].out, "\n");
    }

    component multiAND = MultiAND(n);
    for(var k= 0; k < n; k ++) {
        multiAND.in[k] <== ors[k].out;
    }
    
    // log("multiAND.out = ", multiAND.out);
    out <== multiAND.out;
}