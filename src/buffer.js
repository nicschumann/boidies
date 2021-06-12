export function create_nearest_buffer(regl, resolution)
{
	let color = regl.texture({
		data: new Float32Array(resolution * resolution * 4),
		shape: [resolution, resolution, 4],
		mag: 'nearest',
		min: 'nearest',
		wrapS: 'repeat',
		wrapT: 'repeat',
		type: 'float'
	});

	return regl.framebuffer({
		color,
		depth: false,
		stencil: false
	});
}


export function create_random_nearest_buffer(regl, resolution, min=-0.05, max=0.05)
{
	let data = new Float32Array(resolution * resolution * 4);

	for (var i = 0; i < resolution * resolution * 4; i += 4)
	{
		data[i + 0] = Math.random() * (max - min) + min;
		data[i + 1] = Math.random() * (max - min) + min;
		data[i + 2] = Math.random() * (max - min) + min;

		let norm = Math.sqrt(
			data[i + 0] * data[i + 0] +
			data[i + 1] * data[i + 1] +
			data[i + 2] * data[i + 2]
		);

		data[i + 0] /= (norm * 2)
		data[i + 1] /= (norm * 2)
		data[i + 2] /= (norm * 2)

		data[i + 3] = 1.0;
	}

	let color = regl.texture({
		data,
		shape: [resolution, resolution, 4],
		mag: 'nearest',
		min: 'nearest',
		wrapS: 'repeat',
		wrapT: 'repeat',
		type: 'float'
	});

	return regl.framebuffer({
		color,
		depth: false,
		stencil: false
	});
}

export class DoubleFramebuffer {
  constructor(regl, resolution) {
		this.tmp = null;
		this.front = create_random_nearest_buffer(regl, resolution);
		this.back = create_nearest_buffer(regl, resolution);
  }

  swap() {
    this.tmp = this.front;
		this.front = this.back;
		this.back = this.tmp;
  }
}
