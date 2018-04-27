# Permaculture APIs
This repository will be used to house our artifacts for our permiculture recomendation engine and the supporting APIs.  

## Running the Optimizer

```bash
cd API-optimize
node server.js
curl http://localhost:3000/Garlic?zone=5
```

If you are sending a name with a space, use %20 for the space, ex. http://localhost:3000/American%20Elderberry?zone=5

## Performance

The optimizer is currently limited to processing plant sets of 20 or fewer at this point. More than that and the number of permutations quickly approaches infinity. We would need to redesign this system to only score a limited number of random or converging sets.

## TODO

* PlantedWith data needs to be added to graph
* Split things with commas
* Finish all the rules
* Convert to TypeScript
* Use a queue for solution processing, consider breaking up the problem
* Undefined/null data should be excluded from scoring
