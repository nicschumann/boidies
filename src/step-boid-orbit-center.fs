precision mediump float;

#define BOID_COUNT 2

varying vec2 v_uv;

uniform sampler2D u_positions;
uniform sampler2D u_velocities;
uniform float u_dt;

const vec3 center = vec3(-1.0);
const float max_dist = 1.0;


vec3 steer_towards_target(vec3 pos, vec3 vel)
{
  const float angle = 3.14159 / 360.0;
  // this angle is an arbitrary turn factor

  float cos_angle = cos(angle);
  float sin_angle = sin(angle);

  vec3 vel_n = normalize(vel);
  vec3 d_center = center - pos;
  float dist_center = length(d_center);
  vec3 d_center_n = normalize(d_center);
  vec3 r_axis = normalize(cross(vel_n, d_center_n));

  // angle-axis rotation:
  vec3 rot = cos_angle * vel +
    sin_angle * cross(r_axis, vel) +
    (1.0 - cos_angle) * dot(r_axis, vel) * r_axis;

  vec3 adj = rot - vel;
  float adj_factor = smoothstep(0.5, 1.5, dist_center);

  return vel + adj_factor * adj;
}

void main (void)
{
  vec3 curr_pos = texture2D(u_positions, v_uv).xyz;
  vec3 curr_vel = texture2D(u_velocities, v_uv).xyz;

  vec3 update = steer_towards_target(curr_pos, curr_vel);

  gl_FragColor = vec4(update, 1.0);
}
