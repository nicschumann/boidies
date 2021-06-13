precision mediump float;

varying vec3 v_position;
varying vec3 v_color;
varying vec3 v_normal;

uniform vec3 u_camera_position;

// ambient light
const vec3 light_ambient = vec3(0.35, 0.35, 0.2);

// point light
const vec3 light_position = vec3(0.0, 1.5, -1.0);
const vec3 light_diffuse = vec3(0.65, 0.65, 0.3);
const vec3 light_specular = vec3(0.85, 0.85, 0.26);
const float light_diffuse_power = 1.0;
const float light_specular_power = 1.0;
const float light_specular_hardness = 5.0;

void main(void)
{
  vec3 v_dir = v_position - u_camera_position;
  vec3 l_dir = light_position - v_position;
  vec3 l_dir_n = normalize(l_dir);
  float l_dist = length(l_dir);
  float l_dist_2 = l_dist * l_dist;

  float d_intensity = clamp(dot(v_normal, l_dir), 0.0, 1.0);

  vec3 diffuse = d_intensity * light_diffuse * light_diffuse_power / l_dist_2;

  vec3 half_vector = normalize(l_dir + v_dir);
  float s_intensity = pow(clamp(dot(v_normal, half_vector), 0.0, 1.0), light_specular_hardness);

  vec3 specular = s_intensity * light_specular * light_specular_power / l_dist_2;

  vec3 color = light_ambient + diffuse + specular;

  gl_FragColor = vec4(color, 1.0);
}
