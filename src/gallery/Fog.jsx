import { Cloud } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useState, useRef } from 'react';

const Fog = () => {
	const cloud = './textures/cloud.png';
	const [cloudsOpacity, setCloudsOpacity] = useState([0, 0, 0]);
	const cloudsRef = useRef([]);

	useFrame((state) => {
		const camera = state.camera;
		const newOpacities = cloudsRef.current.map((cloudRef, index) => {
			if (!cloudRef) return 0;
			
			// 获取云的位置
			const cloudPosition = cloudRef.position;
			const distance = camera.position.distanceTo(cloudPosition);
			
			// 设置显示和淡出阈值
			const showThreshold = 800;
			const fadeThreshold = 1000;
			
			// 根据距离计算不透明度
			let opacity = 0;
			if (distance < showThreshold) {
				opacity = 1;
			} else if (distance < fadeThreshold) {
				opacity = 1 - (distance - showThreshold) / (fadeThreshold - showThreshold);
			}
			
			return Math.max(0, Math.min(0.6, opacity));
		});
		
		setCloudsOpacity(newOpacities);
	});

	return (
		<>
			<Cloud
				ref={(el) => (cloudsRef.current[0] = el)}
				scale={70}
				color="#B4B4B4"
				rotation={[0, 0, 0.8]}
				position={[500, 300, -1200]}
				depthTest={false}
				opacity={cloudsOpacity[0]}
				transparent
				texture={cloud}
			/>
			<Cloud
				ref={(el) => (cloudsRef.current[1] = el)}
				scale={70}
				color="#B4B4B4"
				rotation={[0, 0, 0.8]}
				position={[0, 300, -1000]}
				depthTest={false}
				opacity={cloudsOpacity[1]}
				transparent
				texture={cloud}
			/>
			<Cloud
				ref={(el) => (cloudsRef.current[2] = el)}
				scale={70}
				color="#B4B4B4"
				rotation={[0, 0, 0.8]}
				position={[-500, 300, -600]}
				depthTest={false}
				opacity={cloudsOpacity[2]}
				transparent
				texture={cloud}
			/>
		</>
	);
};

export default Fog;
