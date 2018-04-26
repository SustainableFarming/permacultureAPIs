
// includes
const Scoring = require("./Scoring");
const _ = require('lodash');
require('lodash.combinations');

// private variables
const _possible = new WeakMap();
const _inputs = new WeakMap();
const _weights = new WeakMap();

// Optimizer class
module.exports = class Optimizer {

    get possible() {
        return _possible.get(this);
    }

    get inputs() {
        return _inputs.get(this);
    }

    get weights() {
        return _weights.get(this);
    }

    score() {
        const scored = [];

        // score all possible
        for (const possible of this.possible) {
            const scoring = new Scoring(possible, this.inputs, this.weights);
            scoring.calc();
            scored.push(scoring);
        }

        // sort
        scored.sort((a, b) => {
            return b.score - a.score;
        });

        return scored;
    }

    constructor(always, maybe, inputs, weights) {
        _inputs.set(this, inputs);
        _weights.set(this, weights);

        // build the list of possibilities
        const total = [];
        for (let count = always.length + maybe.length; count >= always.length; count--) {
            for (let combination of _.combinations(maybe, count - always.length)) {
                total.push( always.concat(combination) );
            }
        }
        _possible.set(this, total);

    }
}