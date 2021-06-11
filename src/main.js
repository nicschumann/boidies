require('./style/main.css');
import { create_random_nearest_buffer, DoubleFramebuffer } from './buffer.js';

let regl = require('regl')({
	extensions: ['OES_texture_float', 'OES_texture_float_linear']
});

let {vec2, vec3, mat3, mat4} = require('gl-matrix');


const BOIDS = [8, 8]; // = 64 boids


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

			let c = i * BOIDS[0] + BOIDS[1];

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
let boid_positions = create_random_nearest_buffer(regl, BOIDS[0]);
let boid_velocities = create_random_nearest_buffer(regl, BOIDS[0]);
let draw_simulated_boids = regl({
	framebuffer: null,
	vert: `
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
	`,

	frag: `
		precision mediump float;

		varying vec3 v_color;

		void main(void)
		{
			gl_FragColor = vec4(v_color, 1.0);
		}
	`,
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


// let draw_simulated_quad = regl({
// 	framebuffer: null,
// 	vert: vert_shader,
// 	frag: `
// 		precision mediump float;
//
// 		varying vec2 v_uv;
//
// 		uniform vec4 u_color;
//
// 		void main (void) {
// 			gl_FragColor = vec4(v_uv, 0, 1);
// 		}
// 	`,
// 	attributes: {
// 		a_position: [
// 			[-0.5, 0, 0.5],
// 			[0.5, 0, 0.5],
// 			[0.5, 0, -0.5],
// 			[-0.5, 0, -0.5]
// 		],
// 		a_uv: [
// 			[0, 1],
// 			[1, 1],
// 			[1, 0],
// 			[0, 0],
// 		]
// 	},
// 	elements: [[0, 1, 3], [3, 1, 2]],
// 	uniforms: {
// 		u_resolution: regl.prop('u_resolution'),
// 		u_camera_position: regl.prop('u_camera_position'),
//
// 		u_model: regl.prop('u_model'),
// 		u_view: regl.prop('u_view'),
// 		u_projection: regl.prop('u_projection'),
// 		u_mvp: regl.prop('u_mvp'),
//
// 		u_color: regl.prop('u_color')
// 	}
// });

let state = {
	quad: {
		T: {
			pos: vec3.fromValues(0.0, 0.0, 0.0),
			s: 1.0
		}
	},
	camera: {
		T: {
			pos: vec3.fromValues(0.0, -2.0, -2.0),
			tar: vec3.fromValues(0.0, 0.0, 0.0),
			up: vec3.fromValues(0.0, 0.0, -1.0)
		}
	}
};


const do_frame = () =>
{
	regl.clear({color: [0, 0, 0, 1]});

	let V = get_m_view(state.camera);
	let P = get_m_proj(state.camera);
	let M_target = get_m_model(state.quad)
	let M_target_mvp = get_m_mvp(M_target, V, P);

	draw_simulated_boids({
		u_positions: boid_positions,
		u_velocities: boid_velocities,


		u_resolution: [window.innerWidth, window.innerHeight],
		u_camera_position: state.camera.T.pos,

		u_projection: P,
		u_view: V,
		u_model: M_target,
		u_mvp: M_target_mvp,

		u_color: [1, 0, 0, 1]
	});
}


regl.frame(do_frame);

// do_frame()
