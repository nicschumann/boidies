# BOID-ies

I wanted to make a little boids demo for my ML-CSP.


## What are Boids?

What are BOIDSs, conceptually?

- Boids are little organisms that live in a grid world. They move around according to some rules:
- They want to move in the same direction as their neighbors.
    - They want to be close to their neighbors.
    - They don't want to be too close to any one neighbor.
- These rules are sufficient to generate complex swarming behavior, similar to birds or schools of fish.

How are BOIDs implemented in math?

- Each boid has a state that consists of its position `p` and velocity `v`. In 2D, these are both 2D vectors.
- On each timestep, each boid:
    - Calculates  `p_n` the average position of its neighbors, (where a boids neighborhood is defined as some small radius around it, say $r_{max}$). This is the centroid that it wants to steer towards.
    - Calculates $v_n$ the average velocity of its neighbors. This is the velocity that it wants to match.
    - Calculates the average position of boids $p_a$ that it is within a smaller radius of say $r_{min}$. This is the direction it wants to avoid.
    - Chooses a random direction $d$.
    - updates it's position and velocity as the following:
        - `v' = c_c*v + c_p*(p_n - p) + c_v*v_n - c_a * (p_a - p) + c_r * d`
        - `p' = p + v'`
- Each of the `c_` coefficients controls how much each rule contributes to the boid's overall behavior.

*(Note: I said the BOID's state was given by the position and velocity, but the coefficients could also be defined on a per-boid basis. These could then be used as levers to determine how the boid's "personality" works. Some want to be closer to others, some want to be farther away from others, etc.)*
