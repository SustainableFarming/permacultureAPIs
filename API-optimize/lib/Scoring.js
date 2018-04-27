
const lerp = require("lerp");

// private variables
const _inputs = new WeakMap();
const _weights = new WeakMap();
const _plants = new WeakMap();
const _score = new WeakMap();
const _applied = new WeakMap();

// contains
Array.prototype.contains = function(value) {
    return (this.indexOf(value) > -1);
}

// range function
//  actual: actual value
//  from: 
function range(actual, from, to, min, max, good, bad) {

    // strings to numbers if necessary
    actual = Number(actual);
    from = Number(from);
    to = Number(to);

    // calculate the midpoint
    const mid = (to - from) / 2 + from;

    // below min or above max
    if (actual < min || actual > max) {
        return bad;
    }

    // is equal
    if (actual === mid) {
        return good;
    }

    // is between
    if (from <= actual && actual <= to) {
        const i = to - mid;
        const a = Math.abs(mid - actual) / i;
        return lerp(good, 0, a);
    }

    // is less
    if (actual < from) {
        const i = from - min;
        const a = Math.abs(min - actual) / i;
        return lerp(bad, 0, a);
    }

    // is greater
    if (actual > to) {
        const i = max - to;
        const a = Math.abs(max - actual) / i;
        return lerp(bad, 0, a);
    }

}

// Optimizer class
module.exports = class Scoring {

    get inputs() {
        return _inputs.get(this);
    }

    get weights() {
        return _weights.get(this);
    }

    get plants() {
        return _plants.get(this);
    }

    get score() {
        return _score.get(this);
    }
    set score(value) {
        _score.set(this, value);
    }

    get applied() {
        return _applied.get(this);
    }
    
    calc_compatibility(plant) {
        if (plant.compatibleWith) {
            for (const compatibleWith of plant.compatibleWith) {
                const found = this.plants.find(p => p.id === compatibleWith);
                if (found) {
                    this.applied.push({
                        weight: this.weights.compatibleWith,
                        reason: `${plant.commonName} is compatible with ${found.commonName}`
                    });
                    this.score += this.weights.compatibleWith;
                }
            }
        }
    }

    calc_incompatibility(plant) {
        if (plant.incompatibleWith) {
            for (const incompatibleWith of plant.incompatibleWith) {
                const found = this.plants.find(p => p.id === incompatibleWith);
                if (found) {
                    this.applied.push({
                        weight: this.weights.incompatibleWith,
                        reason: `${plant.commonName} is incompatible with ${found.commonName}`
                    });
                    this.score += this.weights.incompatibleWith;
                }
            }
        }
    }

    calc_plantedWith(plant) {
        if (plant.plantedWith) {
            for (const plantedWith of plant.plantedWith) {
                const found = this.plants.find(p => p.id === plantedWith);
                if (found) {
                    this.applied.push({
                        weight: this.weights.plantedWith,
                        reason: `${plant.commonName} is commonly planted with ${found.commonName}`
                    });
                    this.score += this.weights.plantedWith;
                }
            }
        }
    }

    calc_usdaZone(plant) {
        if (plant.usdaZoneFrom && plant.usdaZoneTo) {
            const score = range(this.inputs.usdaZone,
                plant.usdaZoneFrom,
                plant.usdaZoneTo,
                0,
                12,
                this.weights.usdaZoneGood,
                this.weights.usdaZoneBad
            );
            if (score !== 0) {
                this.applied.push({
                    weight: score,
                    reason: `${plant.commonName} should be in USDA Zone ${plant.usdaZoneFrom}-${plant.usdaZoneTo}; the input Zone was ${this.inputs.usdaZone}`
                });
                this.score += score;
            }
        }
    }

    calc_rootDepth() {

        // get a list of plant depths
        const depths = [];
        for (const plant of this.plants) {
            if (plant.rootDepth) {
                const depth = Number(plant.rootDepth);
                const range = depth * this.weights.rootDepthRange;
                depths.push({
                    id: Number(plant.id),
                    low: depth + range,
                    high: depth - range
                });
            }
        }

        // look for collisions
        const collisions = [];
        for (const pri of depths) {
            for (const sec of depths) {
                if (pri === sec) {
                    // same; ignore
                } else if (pri.high > sec.low) {
                    //console.log(`deeper ${pri.id} ${pri.low}-${pri.high} vs. ${sec.id} ${sec.low}-${sec.high}`);
                } else if (pri.low < sec.high) {
                    //console.log(`shallower ${pri.id} ${pri.low}-${pri.high} vs. ${sec.id} ${sec.low}-${sec.high}`);
                } else if (pri.id < sec.id) {
                    //console.log(`collision ${pri.id} ${pri.low}-${pri.high} vs. ${sec.id} ${sec.low}-${sec.high}`);
                    if (!collisions.contains(`${pri.id}:${sec.id}`)) collisions.push(`${pri.id}:${sec.id}`);
                } else if (pri.id > sec.id) {
                    //console.log(`collision ${pri.id} ${pri.low}-${pri.high} vs. ${sec.id} ${sec.low}-${sec.high}`);
                    if (!collisions.contains(`${sec.id}:${pri.id}`)) collisions.push(`${sec.id}:${pri.id}`);
                }    
            }
        }

        // score collisions
        for (const collision of collisions) {
            this.applied.push({
                weight: this.weights.rootDepth,
                reason: `Root Depth collision ${collision}.`
            });
            this.score += this.weights.rootDepth;
        }

    }

    calc() {

        // reset
        this.score = 0;
        _applied.set(this, []);
        
        // step through all possible plants
        for (const plant of this.plants) {
            this.calc_compatibility(plant);
            this.calc_incompatibility(plant);
            this.calc_plantedWith(plant);
            this.calc_usdaZone(plant);
        }

        // comparisons across the whole set
        this.calc_rootDepth();

    }

    constructor(plants, inputs, weights) {
        _plants.set(this, plants);
        _inputs.set(this, inputs);
        _weights.set(this, weights);
    }
}