precision mediump float;

attribute vec3 a_offset;
attribute vec2 a_index;
attribute vec3 a_color;

varying vec3 v_color;

uniform sampler2D u_positions;
uniform sampler2D u_velocities;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;
uniform mat4 u_mvp;

uniform vec2 u_resolution;

mat3 R(vec3 vel)
{
  vec3 up_w = vec3(0, 0, 1);
  vec3 front_b = normalize(vel);
  vec3 right_b = normalize(cross(front_b, up_w));
  vec3 up_b = normalize(cross(front_b, right_b));

  return mat3(
    right_b, up_b, front_b
  );
}

void main (void)
{
  v_color = a_color;

  vec3 vel = texture2D(u_velocities, a_index).xyz;
  vec3 a_rotated_offset = R(vel) * a_offset;
  vec3 position = texture2D(u_positions, a_index).xyz;

  gl_Position = u_mvp * vec4(position + a_rotated_offset, 1.0);
}
