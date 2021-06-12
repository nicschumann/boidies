precision mediump float;

varying vec2 v_uv;

uniform sampler2D u_positions;
uniform sampler2D u_velocities;
uniform float u_dt;

void main (void)
{
  vec3 pos = texture2D(u_positions, v_uv).xyz;
  vec3 vel = texture2D(u_velocities, v_uv).xyz;

  gl_FragColor = vec4(pos + vel * u_dt, 0.0);
}
