require('./style/main.css');
import { create_random_nearest_buffer, DoubleFramebuffer } from './buffer.js';

let regl = require('regl')({
	extensions: ['OES_texture_float', 'OES_texture_float_linear']
});

let {vec2, vec3, mat3, mat4} = require('gl-matrix');


let BOID_COUNT = 256;
let BOIDS = [BOID_COUNT, BOID_COUNT];

const DT_MULTIPLIER = 0.001;

function create_normal_colored_boid_geometry ()
{
	let positions = [];
	let indices = [];
	let colors = [];
	let normals = [];

	let elements = [];

	// if (BOIDS[0] >= 74){
	// 	console.log(`Warning: attempting to create ${BOIDS[0]}^2 = ${BOIDS[0] * BOIDS[1]} boids.`);
	// 	console.log(`Warning: max vertices in WebGL is 65k. With normal representation, each boid required 12 vertices.`);
	// 	console.log(`Warning: Therefore the maximum boid count is 73^2 = 5329 boids.`);
	// 	console.log(`Warning: Clamping your desired boid count to 73^2.`);
	// 	BOIDS = [73, 73];
	// }

	// set boid size depending on
	// how many boids we have.
	let unit = 0.0075;

	if (BOIDS[0] <= 64) {
		unit = 0.006;
	}


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

	let boid_normals = [
		vec3.normalize([], vec3.cross([], vec3.sub([], boid_verts[0], boid_verts[1]), vec3.sub([], boid_verts[0], boid_verts[2]))),
		vec3.normalize([], vec3.cross([], vec3.sub([], boid_verts[1], boid_verts[2]), vec3.sub([], boid_verts[1], boid_verts[3]))),
		vec3.normalize([], vec3.cross([], vec3.sub([], boid_verts[0], boid_verts[2]), vec3.sub([], boid_verts[0], boid_verts[3]))),
		vec3.normalize([], vec3.cross([], vec3.sub([], boid_verts[0], boid_verts[1]), vec3.sub([], boid_verts[0], boid_verts[3])))
	]


	for (let i = 0; i < BOIDS[0]; i++) {
		for (let j = 0; j < BOIDS[1]; j++) {

			let c = (i * BOIDS[0] + j) * 12;

			let u = i / BOIDS[0];
			let v = j / BOIDS[1];

			//back triangle:
			positions.push(boid_verts[0])
			positions.push(boid_verts[1])
			positions.push(boid_verts[2])

			colors.push(boid_face_colors[0]);
			colors.push(boid_face_colors[0]);
			colors.push(boid_face_colors[0]);

			indices.push([u,v]);
			indices.push([u,v]);
			indices.push([u,v]);

			normals.push(boid_normals[0]);
			normals.push(boid_normals[0]);
			normals.push(boid_normals[0]);

			elements.push([c + 0, c + 1, c + 2]);


			// left triangle:
			positions.push(boid_verts[1])
			positions.push(boid_verts[3])
			positions.push(boid_verts[2])

			colors.push(boid_face_colors[1]);
			colors.push(boid_face_colors[1]);
			colors.push(boid_face_colors[1]);

			indices.push([u,v]);
			indices.push([u,v]);
			indices.push([u,v]);

			normals.push(boid_normals[1]);
			normals.push(boid_normals[1]);
			normals.push(boid_normals[1]);

			elements.push([c + 3, c + 4, c + 5]);

			// right triangle:
			positions.push(boid_verts[0])
			positions.push(boid_verts[2])
			positions.push(boid_verts[3])

			colors.push(boid_face_colors[2]);
			colors.push(boid_face_colors[2]);
			colors.push(boid_face_colors[2]);

			indices.push([u,v]);
			indices.push([u,v]);
			indices.push([u,v]);

			normals.push(boid_normals[2]);
			normals.push(boid_normals[2]);
			normals.push(boid_normals[2]);

			elements.push([c + 6, c + 7, c + 8]);

			// bottom triangle:
			positions.push(boid_verts[0])
			positions.push(boid_verts[3])
			positions.push(boid_verts[1])

			colors.push(boid_face_colors[3]);
			colors.push(boid_face_colors[3]);
			colors.push(boid_face_colors[3]);

			indices.push([u,v]);
			indices.push([u,v]);
			indices.push([u,v]);

			normals.push(boid_normals[3]);
			normals.push(boid_normals[3]);
			normals.push(boid_normals[3]);

			elements.push([c + 9, c + 10, c + 11]);
		}
	}

	return {
		positions,
		colors,
		indices,
		elements,
		normals
	};
}

// console.log(create_normal_colored_boid_geometry());


function create_vert_colored_boid_geometry ()
{
	let positions = [];
	let indices = [];
	let elements = [];
	let colors = [];
	let normals = [];

	// set boid size depending on
	// how many boids we have.
	let unit = 0.005;

	if (BOIDS[0] <= 64) {
		unit = 0.006;
	}


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

			normals.push([0, 0, 1]);
			normals.push([0, 0, 1]);
			normals.push([0, 0, 1]);
			normals.push([0, 0, 1]);

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
		elements,
		normals
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

let boids = create_vert_colored_boid_geometry();

console.log(`created ${boids.positions.length} vertices.`)

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

let step_boid_velocity = regl({
	framebuffer: regl.prop('target'),
	vert: require('./pass-through.vs'),

	frag: require('./step-boid-velocity.fs'),

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
	frag: require('./render-boid-with-vert-colors.fs'),
	attributes: {
		a_offset: boids.positions,
		a_index: boids.indices,
		a_color: boids.colors,
		a_normal: boids.normals
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
			pos: vec3.fromValues(0.0, -4.0, -4.0),
			vel: vec3.fromValues(0.0, 0.0, 0.0),
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

	// update camera state:

	let vel = vec3.create();
	vec3.copy(vel, state.camera.T.vel);
	vec3.scale(vel, vel, dt);
	vec3.add(state.camera.T.pos, state.camera.T.pos, vel);
	vec3.add(state.camera.T.tar, state.camera.T.tar, vel);

	// slow the camera if all keys are released.
	if (
    !keys['w'] && !keys['a'] && !keys['s'] && !keys['d'] &&
		!keys['ArrowUp'] && !keys['ArrowLeft'] && !keys['ArrowDown'] && !keys['ArrowRight']
  ) {
    vec3.scale(state.camera.T.vel, state.camera.T.vel, 0.9);
    let len = vec3.length(state.camera.T.vel);
    if (len < 0.001) { state.camera.T.vel = vec3.fromValues(0.0, 0.0, 0.0);}
  }

	regl.clear({color: [0, 0, 0, 1]});

	let V = get_m_view(state.camera);
	let P = get_m_proj(state.camera);
	let M_target = get_m_model(state.quad)
	let M_target_mvp = get_m_mvp(M_target, V, P);
	//
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
}


regl.frame(do_frame);





// Event handling

let keys = {};

window.onkeydown = e => {

	keys[e.key] = true;

	let front = vec3.create();
  let right = vec3.create();
  let dir = vec3.fromValues(0.0, 0.0, 0.0);
  let walkspeed = 0.002;

	vec3.sub(front, state.camera.T.tar, state.camera.T.pos);
	vec3.normalize(front, front);

	vec3.cross(right, front, state.camera.T.up);
	vec3.normalize(right, right);

	if (keys['ArrowUp'] || keys['w']) {
    vec3.add(dir, dir, front);
  }

  if (keys['ArrowDown'] || keys['s']) {
    vec3.sub(dir, dir, front);
  }

  if (keys['ArrowLeft'] || keys['a']) {
    vec3.sub(dir, dir, right);
  }

  if (keys['ArrowRight'] || keys['d']) {
    vec3.add(dir, dir, right);
  }

  console.log(dir);
  vec3.normalize(dir, dir);
  vec3.scale(dir, dir, walkspeed);
  vec3.copy(state.camera.T.vel, dir);

};

window.onkeyup = e => {
	keys[e.key] = false;
};



// orbit controls

let front = vec3.create();
let right = vec3.create();
let up = vec3.create();
let front_prime = vec3.create();
let right_prime = vec3.create();
let up_prime = vec3.create();

window.onmousemove = e => {
	const sensitivity = 0.45;
  let theta = sensitivity * Math.sign(e.movementX) * Math.PI / 180.0;
  let phi = sensitivity * Math.sign(e.movementY) * Math.PI / 180.0;


	vec3.sub(front, state.camera.T.tar, state.camera.T.pos);
  vec3.normalize(front, front);

  vec3.cross(right, front, state.camera.T.up);
  vec3.normalize(right, right);

  vec3.cross(up, front, right);
  vec3.normalize(up, up);

  vec3.scale(front_prime, front, Math.cos(theta));
  vec3.scale(right_prime, right, Math.sin(theta));
  vec3.add(front_prime, right_prime, front_prime);
  vec3.copy(front, front_prime);
  vec3.copy(right, right_prime);

  vec3.add(state.camera.T.tar, state.camera.T.pos, front);


  // rotation around the right vector.
  vec3.sub(front, state.camera.T.tar, state.camera.T.pos);
  vec3.normalize(front, front);

  vec3.cross(right, front, state.camera.T.up);
  vec3.normalize(right, right);

  vec3.cross(up, front, right);
  vec3.normalize(up, up);

  vec3.scale(front_prime, front, Math.cos(phi));
  vec3.scale(up_prime, up, Math.sin(phi));
  vec3.add(front_prime, front_prime, up_prime);
  vec3.add(state.camera.T.tar, state.camera.T.pos, front_prime);
}
