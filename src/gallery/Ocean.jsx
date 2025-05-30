import * as THREE from 'three';
import React, { useRef, useMemo } from 'react';
import { extend, useThree, useLoader, useFrame } from '@react-three/fiber';
import { Water } from 'three-stdlib';

extend({ Water });

function Ocean() {
	const ref = useRef();
	const overlayRef = useRef();
	const gl = useThree((state) => state.gl);
	const waterNormals = useLoader(
		THREE.TextureLoader,
		'./textures/waternormals.jpeg'
	);
	waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;
	waterNormals.repeat.set(4, 4); // 减少重复次数

	// 减小几何体的细分数
	const geom = useMemo(() => new THREE.PlaneGeometry(2000, 3000, 50, 50), []);
	const config = useMemo(
		() => ({
			textureWidth: 64, // 降低纹理分辨率
			textureHeight: 64,
			waterNormals,
			sunDirection: new THREE.Vector3(),
			sunColor: 0x5E3600,
			waterColor: 0x291800,
			distortionScale: 8.0,
			fog: true,
			format: gl.encoding,
			alpha: 0.8,
		}),
		[waterNormals]
	);

	useFrame((state, delta) => {
		const camera = state.camera;
		const waterPosition = ref.current.position;
		
		// 计算相机到水面的距离
		const distance = camera.position.distanceTo(waterPosition);
		
		// 根据距离动态调整更新频率
		if (distance < 500) {
			ref.current.material.uniforms.time.value += delta * 0.15;
			
			const time = state.clock.getElapsedTime();
			waterNormals.offset.set(
				Math.sin(time * 0.03) * 0.05,
				Math.cos(time * 0.03) * 0.05
			);
		} else {
			// 远处水面减少更新频率
			ref.current.material.uniforms.time.value += delta * 0.05;
		}
	});

	return (
		<group position={[0, -2, 0]} rotation={[0, 0, 0]}>
			<water
				ref={ref}
				args={[geom, config]}
				rotation-x={-Math.PI / 2}
				position-y={0}
				frustumCulled={true} // 启用视锥体剔除
			/>
			<mesh
				ref={overlayRef}
				rotation-x={-Math.PI / 2}
				position-y={0.1}
			>
				<planeGeometry args={[2000, 3000]} />
				<meshBasicMaterial
					color="#7E6134"
					transparent
					opacity={0.3}
					side={THREE.DoubleSide}
				/>
			</mesh>
		</group>
	);
}

export default Ocean;