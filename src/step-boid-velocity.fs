precision mediump float;

#define BOID_COUNT 2


varying vec2 v_uv;

uniform sampler2D u_positions;
uniform sampler2D u_velocities;
uniform float u_dt;



const float cohesion_radius = 0.75;
const float alignment_radius = 0.75;
const float separation_radius = 0.30;

const float cohesion_coefficient = 0.01;
const float alignment_coefficient = 0.125;

const vec2 boid_counts = vec2(BOID_COUNT, BOID_COUNT);



float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 update(vec3 curr_pos, vec3 curr_vel)
{
  vec3 alignment = vec3(0.0);
  float alignment_count = 0.0;

  vec3 cohesion = vec3(0.0);
  float cohesion_count = 0.0;

  vec3 separation = vec3(0.0);

  for (float i = 0.0; i < boid_counts.x; i++) {
    for (float j = 0.0; j < boid_counts.y; j++) {
      vec2 uv = vec2(i / boid_counts.x, j / boid_counts.y);

      vec3 n_pos = texture2D(u_positions, uv).xyz;
      vec3 n_vel = texture2D(u_velocities, uv).xyz;
      float dist = length(n_pos - curr_pos);

      float include_cohesion = max(0.0, sign(cohesion_radius - dist) - 0.5);
      cohesion += include_cohesion * n_pos;
      cohesion_count = 1.0 * include_cohesion;

      float include_alignment = max(0.0, sign(alignment_radius - dist) - 0.5);
      alignment += include_alignment * n_vel;
      alignment_count += include_alignment * 1.0;

      float include_separation = max(0.0, sign(alignment_radius - dist) - 0.5);
        separation -= include_separation * (n_pos - curr_pos);
    }
  }

  separation = separation - curr_vel;

  if (alignment_count > 0.0)
  {
    alignment /= alignment_count;
    alignment = alignment - curr_vel;
  }

  if (cohesion_count > 0.0)
  {
    cohesion /= cohesion_count;
    cohesion = (cohesion - curr_pos);
  }

  return 0.85 * alignment +
         0.025 * separation +
         0.25 * cohesion;
}

vec3 bound(vec3 pos, vec3 vel) {
  float len_v = length(vel);
  float dist = length(pos);

  vec3 vel_n = normalize(vel);
  vec3 pos_n = normalize(pos);
  vec3 ortho_n = normalize(pos_n - vel_n);

  float t = max(0.0, dot(vel_n, pos_n));
  float a = max(0.0, min(dist - 0.5, 1.0));
  a = smoothstep(0.0, 1.0, a);

  return vel + t * a * 0.5 * ortho_n;
}

void main (void)
{
  vec3 curr_vel = texture2D(u_velocities, v_uv).xyz;
  vec3 curr_pos = texture2D(u_positions, v_uv).xyz;
  vec3 adjustment = update(curr_pos, curr_vel);

  vec3 next_vel = curr_vel + adjustment;
  next_vel = normalize(next_vel) * 0.2;

  vec3 next_pos = curr_pos + next_vel * u_dt;

  // next_vel += -length(curr_pos) * 0.05 * curr_pos;

  gl_FragColor = vec4(next_vel, 1.0);
}
