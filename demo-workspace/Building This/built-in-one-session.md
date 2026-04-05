# Built in one session

Started with a spec. No code.

Brainstormed the interaction model. Three checkpoints? No — continuous.
Binary hover? No — gaussian field.
Pages? No — weight redistribution.

Then built it. Iteratively. Test in browser, adjust, test again.

The final system is ~500 lines of engine code:
- treemap.js: stable grid layout
- weights.js: boost/decay logic
- semanticScale.js: the universal f(S,W) function
- useHover.js: gaussian cursor field
- SpatialNode.jsx: the recursive primitive

Everything else is just wiring.
