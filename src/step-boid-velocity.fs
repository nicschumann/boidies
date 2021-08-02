precision mediump float;

#define BOID_COUNT 4.
#define PI 3.14159

varying vec2 v_uv;

uniform sampler2D u_positions;
uniform sampler2D u_velocities;
uniform float u_dt;

const vec3 center = vec3(0.0);
const float max_dist = 3.0;

const float half_angle = 160.0 * PI / 180.0;

vec3 cohesion(vec3 pos, vec3 vel)
{
  vec3 vel_n = normalize(vel);

  vec3 cohesion = vec3(0.0);
  vec3 alignment = vec3(0.0);
  vec3 separation = vec3(0.0);
  float total_ca = 0.0;
  float total_s = 0.0;

  const float zone_outer = 2.0;
  const float zone_inner = 0.5;

  for (float i = 0.0; i < BOID_COUNT; i++ ) {
    for (float j = 0.0; j < BOID_COUNT; j++ ) {
      vec2 uv = vec2(i / BOID_COUNT, j / BOID_COUNT);

      if (uv.x == v_uv.x && uv.y == v_uv.y) continue;

      vec3 n_pos = texture2D(u_positions, uv).xyz;
      vec3 n_vel = texture2D(u_positions, uv).xyz;
      vec3 d_pos = n_pos - pos;
      float n_dist = length(d_pos);

      if (n_dist <= zone_outer) {
        vec3 d_pos_n = normalize(d_pos);
        float cos_a = dot(vel_n, d_pos_n);
        float a = acos(cos_a);

        if (a >= -half_angle && a <= half_angle) {
          if (n_dist > zone_inner) {
            cohesion += n_pos;
            alignment += n_vel;
            total_ca++;
          }
          else
          {
            separation += n_pos;
            total_s++;
          }
        }
      }
    }
  }

  if (total_ca > 0.0) {
    cohesion /= total_ca;
    alignment /= total_ca;

    cohesion = normalize(cohesion - pos);
    alignment = normalize(alignment);
  }

  if (total_s > 0.0) {
    separation /= total_s;
    separation = -normalize(separation - pos);
  }


  return 0.5 * cohesion + 0.5 * alignment + 0.5 * separation;
}


vec3 steer_towards_target(vec3 pos, vec3 vel)
{
  const float angle = PI / 360.0;
  // 360 - 180 is a good range. the smaller the denominator
  // the tighter the turns.

  // this angle is an arbitrary turn factor

  float cos_angle = cos(angle);
  float sin_angle = sin(angle);

  vec3 vel_n = normalize(vel);
  vec3 d_center = center - pos;
  float dist_center = length(d_center);
  vec3 d_center_n = normalize(d_center);


  // angle-axis rotation:
  vec3 r_axis = normalize(cross(vel_n, d_center_n));

  vec3 rot = cos_angle * vel +
    sin_angle * cross(r_axis, vel) +
    (1.0 - cos_angle) * dot(r_axis, vel) * r_axis;

  vec3 adj = rot - vel;
  float adj_factor = smoothstep(0.5, 2.5, dist_center);

  return vel + adj_factor * adj;
}

void main (void)
{
  vec3 curr_pos = texture2D(u_positions, v_uv).xyz;
  vec3 curr_vel = texture2D(u_velocities, v_uv).xyz;

  vec3 adjustment = cohesion(curr_pos, curr_vel);
  adjustment = normalize(adjustment);
  vec3 proposed_vel = 0.25 * normalize(curr_vel + 0.002 * adjustment);

  vec3 final_vel = steer_towards_target(curr_pos, proposed_vel);
  // vec3 final_vel = proposed_vel;

  gl_FragColor = vec4(final_vel, 1.0);
}
