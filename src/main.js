require('./style/main.css');
import { create_random_nearest_buffer, DoubleFramebuffer } from './buffer.js';

let regl = require('regl')({
	extensions: ['OES_texture_float', 'OES_texture_float_linear']
});

let {vec2, vec3, mat3, mat4} = require('gl-matrix');


const BOIDS = [2, 2]; // = 16 boids


const SIM_RESOLUTION = [1024, 1024];
const FIELD_RESOLUTION = [1024, 1024];



function create_boid_geometry ()
{
	let positions = [];
	let indices = [];
	let elements = [];
	let colors = [];

	let unit = 0.015;

	let boid_face_colors = [
		[1.0, 0.0, 0.0],
		[0.0, 1.0, 0.0],
		[0.0, 0.0, 1.0],
		[1.0, 1.0, 0.0]
	];

	let boid_verts = [
		[ unit, 0.0, 0.0],
		[-unit, 0.0, 0.0],
		[0.00, 1.5 * unit, 0.0],
		[0.00, unit, 5 * unit]
	];

	for (let i = 0; i < BOIDS[0]; i++) {
		for (let j = 0; j < BOIDS[1]; j++) {

			let c = (i * BOIDS[0] + j) * 4;

			console.log(c);

			let u = i / BOIDS[0];
			let v = j / BOIDS[1];

			positions.push(boid_verts[0]);
			positions.push(boid_verts[1]);
			positions.push(boid_verts[2]);
			positions.push(boid_verts[3]);

			colors.push(boid_face_colors[0]);
			colors.push(boid_face_colors[1]);
			colors.push(boid_face_colors[2]);
			colors.push(boid_face_colors[3]);

			indices.push([u,v]);
			indices.push([u,v]);
			indices.push([u,v]);
			indices.push([u,v]);

			elements.push([c + 0, c + 1, c + 2])
			elements.push([c + 0, c + 2, c + 3])
			elements.push([c + 2, c + 1, c + 3])
			elements.push([c + 0, c + 1, c + 3])

		}
	}

	return {
		positions,
		colors,
		indices,
		elements
	};
}



// helper functions for navigating 3D space.
let get_m_model = (entity) => {
	let M = mat4.create();
	mat4.translate(M, M, entity.T.pos);
	return M;
}

let get_m_view = (camera) => {
	let V = mat4.create();
	mat4.lookAt(V, camera.T.pos, camera.T.tar, camera.T.up);
	return V;
};

let get_m_proj = (camera) => {
	let P = mat4.create();
	let aspect = window.innerWidth / window.innerHeight;
	mat4.perspective(P, 45.0 * Math.PI / 180, aspect, 0.1, 100.0);
	return P;
};

let get_m_mvp = (M, V, P) => {
	let MVP = mat4.create();
	mat4.mul(MVP, V, M);
	mat4.mul(MVP, P, MVP);
	return MVP;
};



function get_simulation_indices()
{
	let dx = 1.0 / SIM_RESOLUTION[0];
	let dy = 1.0 / SIM_RESOLUTION[1];
	let dx_2 = dx / 2.0;
	let dy_2 = dy / 2.0;

	let attributes = [];

	for ( var y = 0; y < SIM_RESOLUTION[1]; y++)
	{
		for (var x = 0; x < SIM_RESOLUTION[0]; x++)
		{
			attributes.push([x * dx + dx_2, y * dy + dy_2]);
		}
	}

	return attributes;
}

// const vert_shader = `
// 	precision mediump float;
//
// 	attribute vec3 a_position;
// 	attribute vec2 a_uv;
//
// 	varying vec2 v_uv;
//
// 	uniform mat4 u_model;
// 	uniform mat4 u_view;
// 	uniform mat4 u_projection;
// 	uniform mat4 u_mvp;
//
// 	uniform vec2 u_resolution;
//
// 	void main (void) {
// 		v_uv = a_uv;
// 		vec4 clip = u_mvp * vec4(a_position, 1.0);
//
// 		gl_Position = clip;
// 	}
// `;

let boids = create_boid_geometry();

let boid_positions = new DoubleFramebuffer(regl, BOIDS[0]);
let boid_velocities = new DoubleFramebuffer(regl, BOIDS[0]);

let render_debug_buffer = regl({
	framebuffer: null,
	vert: require('./pass-through.vs'),
	frag: require('./render-texture.fs'),
	attributes: {
		a_position: [-1, -1, -1, 1, 1, 1, 1, -1]
	},
	elements: [0, 1, 2, 0, 2, 3],
	uniforms: {
		u_texture: regl.prop('u_texture'),
	}
});

// let step_boid_velocity = regl({
// 	framebuffer: regl.prop('target'),
// 	vert: `
// 		precision mediump float;
//
// 		attribute vec2 a_position;
//
// 		varying vec2 v_uv;
//
// 		void main (void)
// 		{
// 			v_uv = a_position * 0.5 + 0.5;
// 			gl_Position = vec4(a_position, 0.0, 1.0);
// 		}
// 	`,
// 	frag: `
// 		precision mediump float;
//
// 		varying vec2 v_uv;
//
// 		uniform sampler2D u_positions;
// 		uniform sampler2D u_velocities;
// 		uniform float u_dt;
//
// 		const float min_speed = 0.1;
// 		const float max_speed = 0.2;
//
// 		const float cohesion_radius_sq = 0.25;
// 		const float alignment_radius_sq = 0.25;
// 		const float separation_radius_sq = 0.125;
//
// 		const float cohesion_coefficient = 0.01;
// 		const float alignment_coefficient = 0.125;
//
// 		const vec2 boid_counts = vec2(${BOIDS[0]}, ${BOIDS[1]});
// 		const vec2 bounds_x = vec2(-75.0, 75.0);
// 		const vec2 bounds_y = vec2(-75.0, 75.0);
// 		const vec2 bounds_z = vec2(-75.0, 75.0);
//
// 		vec3 clamp_velocity(vec3 vel)
// 		{
// 			vec3 new_vel = normalize(vel) * min(max_speed, max(length(vel), min_speed));
// 			return new_vel;
// 		}
//
// 		vec3 compute_adjustment(vec3 curr_pos, vec3 curr_vel)
// 		{
// 			float u_count_inv = 1.0 / boid_counts.x;
// 			float v_count_inv = 1.0 / boid_counts.y;
// 			float du_h = u_count_inv / 2.0;
// 			float dv_h = v_count_inv / 2.0;
//
// 			vec4 cohesion_position_avg = vec4(0.0); // w coordinate stores the count;
// 			vec4 alignment_velocity_avg = vec4(0.0); // w coordinate stores the count;
// 			vec3 separation_velocity_avg = vec3(0.0);
//
// 			for (float i = 0.0; i < boid_counts.x; i++) {
// 				for (float j = 0.0; j < boid_counts.y; j++) {
//
// 					vec2 uv = vec2(
// 						i * u_count_inv,
// 						j * v_count_inv
// 					);
//
// 					vec3 n_pos = texture2D(u_positions, uv).xyz;
// 					vec3 d_pos = n_pos - curr_pos;
// 					float dist_sq = dot(d_pos, d_pos);
//
// 					float cohesion_in_range = max(0.0, sign(cohesion_radius_sq - dist_sq));
// 					cohesion_position_avg.xyz += cohesion_in_range * n_pos;
// 					cohesion_position_avg.w += cohesion_in_range;
//
// 					float alignment_in_range = max(0.0, sign(alignment_radius_sq - dist_sq));
// 					alignment_velocity_avg.xyz += alignment_in_range * texture2D(u_velocities, uv).xyz;
// 					alignment_velocity_avg.w += alignment_in_range;
//
// 					float separation_in_range = max(0.0, sign(separation_radius_sq - dist_sq));
// 					separation_velocity_avg -= separation_in_range * d_pos;
// 				}
// 			}
//
// 			vec3 adjustment = vec3(0.0); // clamp_velocity(separation_velocity_avg);
// 			vec3 cohesion = cohesion_position_avg.xyz;
// 			vec3 alignment = alignment_velocity_avg.xyz;
//
// 			if (cohesion_position_avg.w > 0.0)
// 			{
// 				cohesion /= cohesion_position_avg.w;
// 				adjustment += clamp_velocity((cohesion - curr_pos) * cohesion_coefficient);
// 			}
//
// 			if (alignment_velocity_avg.w > 0.0)
// 			{
// 				alignment /= alignment_velocity_avg.w;
// 				adjustment = clamp_velocity((alignment - curr_vel) * alignment_coefficient);
// 			}
//
// 			return adjustment;
// 		}
//
// 		vec3 bounds(vec3 pos)
// 		{
// 			float bounds_multiplier = 0.1;
// 			vec3 v = vec3(0.0);
//
// 			if (pos.x < bounds_x.x) {
// 				v.x = -bounds_multiplier;
// 			}
// 			else if (pos.x > bounds_x.y) {
// 				v.x = bounds_multiplier;
// 			}
//
// 			else if (pos.y < bounds_y.x) {
// 				v.y = -bounds_multiplier;
// 			}
// 			else if (pos.y > bounds_y.y) {
// 				v.y = bounds_multiplier;
// 			}
//
// 			else if (pos.z < bounds_z.x) {
// 				v.z = -bounds_multiplier;
// 			}
// 			else if (pos.z > bounds_z.y) {
// 				v.z = bounds_multiplier;
// 			}
//
// 			return v;
// 		}
//
// 		void main (void)
// 		{
// 			vec3 old_vel = texture2D(u_velocities, v_uv).xyz;
// 			vec3 curr_pos = texture2D(u_positions, v_uv).xyz;
// 			vec3 curr_vel = texture2D(u_velocities, v_uv).xyz;
//
// 			vec3 adjustment = compute_adjustment(curr_pos, curr_vel);
// 			vec3 next_vel = old_vel + 0.2 * adjustment; // 0.2?
//
// 			// vec3 b = bounds(curr_pos + next_vel);
// 			// next_vel += b;
//
// 			next_vel = normalize(next_vel) * 0.01;
//
// 			next_vel = clamp_velocity(next_vel);
// 			gl_FragColor = vec4(next_vel, 1.0);
// 		}
// 	`,
// 	attributes: {
// 		a_position: [-1, -1, -1, 1, 1, 1, 1, -1]
// 	},
// 	elements: [0, 1, 2, 0, 2, 3],
// 	uniforms: {
// 		u_positions: regl.prop('u_positions'),
// 		u_velocities: regl.prop('u_velocities'),
// 		u_boid_counts: regl.prop('u_boid_counts'),
// 		u_dt: regl.prop('u_dt')
// 	}
// });

let step_boid_velocity = regl({
	framebuffer: regl.prop('target'),
	vert: require('./pass-through.vs'),


	// frag: require('./step-boid-velocity.fs'),
	frag: require('./step-boid-orbit-center.fs'),



	attributes: {
		a_position: [-1, -1, -1, 1, 1, 1, 1, -1]
	},
	elements: [0, 1, 2, 0, 2, 3],
	uniforms: {
		u_positions: regl.prop('u_positions'),
		u_velocities: regl.prop('u_velocities'),
		u_boid_counts: regl.prop('u_boid_counts'),
		u_dt: regl.prop('u_dt')
	}
});

let step_boid_position = regl({
	framebuffer: regl.prop('target'),
	vert: require('./pass-through.vs'),
	frag: require('./step-boid-position.fs'),
	attributes: {
		a_position: [-1, -1, -1, 1, 1, 1, 1, -1]
	},
	elements: [0, 1, 2, 0, 2, 3],
	uniforms: {
		u_positions: regl.prop('u_positions'),
		u_velocities: regl.prop('u_velocities'),
		u_dt: regl.prop('u_dt')
	}
});

let draw_simulated_boids = regl({
	framebuffer: null,
	vert: require('./render-boid.vs'),
	frag: require('./render-boid.fs'),
	attributes: {
		a_offset: boids.positions,
		a_index: boids.indices,
		a_color: boids.colors
	},
	elements: boids.elements,
	uniforms: {
		u_resolution: regl.prop('u_resolution'),
		u_camera_position: regl.prop('u_camera_position'),
		u_positions: regl.prop('u_positions'),
		u_velocities: regl.prop('u_velocities'),

		u_model: regl.prop('u_model'),
		u_view: regl.prop('u_view'),
		u_projection: regl.prop('u_projection'),
		u_mvp: regl.prop('u_mvp'),

		u_color: regl.prop('u_color')
	}
})

let state = {
	quad: {
		T: {
			pos: vec3.fromValues(0.0, 0.0, 0.0),
			s: 1.0
		}
	},
	camera: {
		T: {
			pos: vec3.fromValues(0.0, -6.0, -6.0),
			tar: vec3.fromValues(0.0, 0.0, 0.0),
			up: vec3.fromValues(0.0, 0.0, -1.0)
		}
	}
};

let prev_time = performance.now();

const do_frame = (info) =>
{
	let new_time = performance.now();
	let dt = new_time - prev_time;
	prev_time = new_time;
	// console.log(`frame time: ${dt}`);

	regl.clear({color: [0, 0, 0, 1]});

	let V = get_m_view(state.camera);
	let P = get_m_proj(state.camera);
	let M_target = get_m_model(state.quad)
	let M_target_mvp = get_m_mvp(M_target, V, P);

	draw_simulated_boids({
		u_positions: boid_positions.front,
		u_velocities: boid_velocities.front,


		u_resolution: [window.innerWidth, window.innerHeight],
		u_camera_position: state.camera.T.pos,

		u_projection: P,
		u_view: V,
		u_model: M_target,
		u_mvp: M_target_mvp,

		u_color: [1, 0, 0, 1]
	});

	const DT_MULTIPLIER = 0.0005;

	step_boid_velocity({
		target: boid_velocities.back,
		u_positions: boid_positions.front,
		u_velocities: boid_velocities.front,
		u_boid_counts: BOIDS,
		u_dt: dt * DT_MULTIPLIER
	});
	boid_velocities.swap()

	step_boid_position({
		target: boid_positions.back,
		u_positions: boid_positions.front,
		u_velocities: boid_velocities.front,
		u_dt: dt * DT_MULTIPLIER
	});

	boid_positions.swap();

	// render_debug_buffer({
	// 	u_texture: boid_positions.front,
	// })
}


regl.frame(do_frame);
