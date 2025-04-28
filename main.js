// 初始化Three.js场景
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('earthContainer').appendChild(renderer.domElement);

// 添加轨道控制器
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// 设置相机位置
camera.position.z = 3.8;

// 创建地球
const earthGeometry = new THREE.SphereGeometry(2, 64, 64);
const earthMaterial = new THREE.MeshPhongMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.8,
    shininess: 100,
    specular: 0x00ffff
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

// 添加光网效果
const wireframe = new THREE.LineSegments(
    new THREE.WireframeGeometry(earthGeometry),
    new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.3 })
);
earth.add(wireframe);

// 添加光源
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(0x00ffff, 1, 100);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

// 创建数据流粒子
const particles = [];
const particleCount = 1000;
const particleGeometry = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = 2.5 + Math.random() * 0.5;

    particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    particlePositions[i * 3 + 2] = radius * Math.cos(phi);
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
const particleMaterial = new THREE.PointsMaterial({
    color: 0x00ffff,
    size: 0.05,
    transparent: true,
    opacity: 0.8
});

const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particleSystem);

// 全局旋转速度变量
let earthBaseRotationSpeed = 0.001;
let earthCurrentRotationSpeed = earthBaseRotationSpeed;

// 添加永久性帧率显示
const permanentFpsCounter = document.createElement('div');
permanentFpsCounter.id = 'fpsCounter';
permanentFpsCounter.style.position = 'fixed';
permanentFpsCounter.style.top = '10px';
permanentFpsCounter.style.right = '10px';
permanentFpsCounter.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
permanentFpsCounter.style.color = '#00ffff';
permanentFpsCounter.style.padding = '5px 10px';
permanentFpsCounter.style.borderRadius = '3px';
permanentFpsCounter.style.fontFamily = 'Arial, sans-serif';
permanentFpsCounter.style.fontSize = '14px';
permanentFpsCounter.style.zIndex = '2000';
permanentFpsCounter.textContent = 'FPS: 0';
document.body.appendChild(permanentFpsCounter);

// 全局FPS计算变量
let globalFpsUpdateTime = performance.now();
let globalFrameCount = 0;
let currentFPS = 0;

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    
    // 更新帧率计数
    globalFrameCount++;
    const now = performance.now();
    const elapsed = now - globalFpsUpdateTime;
    
    // 每500ms更新一次FPS显示
    if(elapsed > 500) {
        currentFPS = Math.min(Math.round((globalFrameCount * 1000) / elapsed), performanceSettings.maxFPS);
        if(performanceSettings.showFPS && permanentFpsCounter) {
            permanentFpsCounter.textContent = `FPS: ${currentFPS}`;
        }
        globalFpsUpdateTime = now;
        globalFrameCount = 0;
    }
    
    earth.rotation.y += earthCurrentRotationSpeed;
    particleSystem.rotation.y += 0.0005;
    
    controls.update();
    renderer.render(scene, camera);
}

animate();

// 窗口大小调整
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// 移除之前的点击事件，添加新的点击事件，确保只有点击地球才会触发特效
renderer.domElement.removeEventListener('click', createEnhancedParticleBurst);

// 添加新的点击事件
renderer.domElement.addEventListener('click', (event) => {
    // 将鼠标坐标转换为标准化设备坐标 (-1 到 +1)
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // 创建射线
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    // 检查射线是否与地球相交
    const intersects = raycaster.intersectObject(earth);
    
    // 如果射线与地球相交，则触发特效
    if (intersects.length > 0) {
        createEnhancedParticleBurst();
    }
});

// 修改createEnhancedParticleBurst函数
function createEnhancedParticleBurst() {
    createWormholeEffect();
}

// 设备性能检测
const isLowEndDevice = () => {
    if (window.navigator.hardwareConcurrency && window.navigator.hardwareConcurrency < 4) {
        return true;
    }
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// 性能自适应设置
const performanceSettings = {
    particleCount: isLowEndDevice() ? 180 : 350,  // 增加粒子数量
    backgroundParticleCount: isLowEndDevice() ? 60 : 150,  // 增加背景粒子
    skipFrames: isLowEndDevice() ? 2 : 1,
    trailEnabled: true, // 始终启用轨迹
    glowEnabled: true,  // 始终启用发光
    trailLength: isLowEndDevice() ? 3 : 5,  // 增加轨迹长度
    backgroundDrawInterval: isLowEndDevice() ? 2 : 1,  // 减少间隔，更密集
    useScreenComposite: true,  // 始终使用更亮的混合模式
    renderStep: 1,  // 渲染所有粒子
    showFPS: true,  // 显示帧率
    maxFPS: 120  // 设置最大帧率上限
};

// 创建虫洞效果
function createWormholeEffect() {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // 创建虫洞容器
    const wormhole = document.createElement('div');
    wormhole.className = 'wormhole';
    wormhole.style.position = 'fixed';
    wormhole.style.top = '50%';
    wormhole.style.left = '50%';
    wormhole.style.transform = 'translate(-50%, -50%)';
    wormhole.style.width = '300px'; // 增加虫洞尺寸
    wormhole.style.height = '300px';
    wormhole.style.borderRadius = '50%';
    wormhole.style.background = 'radial-gradient(circle, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0) 70%)';
    wormhole.style.boxShadow = '0 0 80px rgba(150,50,255,0.8)'; // 增强外发光
    wormhole.style.zIndex = '1000';
    document.body.appendChild(wormhole);

    // 获取设备像素比并自适应降低分辨率
    const devicePixelRatio = Math.min(window.devicePixelRatio, 2);
    
    // 使用canvas绘制粒子
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(window.innerWidth / devicePixelRatio) * devicePixelRatio;
    canvas.height = Math.floor(window.innerHeight / devicePixelRatio) * devicePixelRatio;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '1001';
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d', { alpha: true });
    ctx.globalCompositeOperation = performanceSettings.useScreenComposite ? 'screen' : 'lighter';
    
    // 设置更大的半径和粒子效果
    let radius = 100; // 增加虫洞半径
    let ringThickness = 25; // 增加环厚度
    
    // 使用更明亮、更饱和的色彩
    const colors = [
        'rgba(180, 50, 255, 0.95)', // 亮紫色
        'rgba(210, 100, 255, 0.95)', // 淡紫色
        'rgba(140, 0, 255, 0.95)',  // 深紫色
        'rgba(100, 180, 255, 0.95)',  // 亮蓝色
        'rgba(255, 100, 230, 0.95)'   // 粉紫色
    ];
    
    // 预计算常量
    const TWO_PI = Math.PI * 2;
    const wormholeParticles = new Array(performanceSettings.particleCount);
    
    // 批量创建粒子以减少GC
    for (let i = 0; i < performanceSettings.particleCount; i++) {
        const angle = (i / performanceSettings.particleCount) * TWO_PI;
        const size = Math.random() * 1.5 + 1.2; // 大幅增加粒子尺寸
        
        // 多维度起点分布 - 实现从各个方向汇集
        let startX, startY;
        const distributionType = Math.floor(Math.random() * 4); // 0-3 四种分布类型
        const edgeDistance = Math.max(window.innerWidth, window.innerHeight) * 0.8;
        
        // 为粒子分配不同的起始位置分布
        switch(distributionType) {
            case 0: // 圆形分布 - 从屏幕边缘
                const randomAngle = Math.random() * TWO_PI;
                startX = centerX + Math.cos(randomAngle) * edgeDistance;
                startY = centerY + Math.sin(randomAngle) * edgeDistance;
                break;
            case 1: // 网格分布 - 从整个屏幕
                startX = Math.random() * canvas.width;
                startY = Math.random() * canvas.height;
                break;
            case 2: // 螺旋分布 - 从外向内的螺旋
                const spiralAngle = Math.random() * 20;
                const spiralRadius = Math.random() * edgeDistance * 0.5 + edgeDistance * 0.5;
                startX = centerX + Math.cos(spiralAngle) * spiralRadius;
                startY = centerY + Math.sin(spiralAngle) * spiralRadius;
                break;
            case 3: // 边框分布 - 从屏幕四个边
                if (Math.random() < 0.5) {
                    // 左右边
                    startX = Math.random() < 0.5 ? 0 : canvas.width;
                    startY = Math.random() * canvas.height;
                } else {
                    // 上下边
                    startX = Math.random() * canvas.width;
                    startY = Math.random() < 0.5 ? 0 : canvas.height;
                }
                break;
        }
        
        // 较简单的目标位置计算
        const targetRadius = radius - ringThickness/2 + Math.random() * ringThickness;
        const targetX = centerX + Math.cos(angle) * targetRadius;
        const targetY = centerY + Math.sin(angle) * targetRadius;

        // 计算出现延迟和运动路径
        const delay = Math.random() * 1500; // 增加延迟变化
        const pathComplexity = Math.random() < 0.7 ? 0 : Math.floor(Math.random() * 3) + 1; // 70%简单路径，30%复杂路径
        
        // 为复杂路径生成控制点
        const controlPoints = [];
        if (pathComplexity > 0) {
            for (let j = 0; j < pathComplexity; j++) {
                // 在起点和终点之间创建控制点
                const ratio = (j + 1) / (pathComplexity + 1);
                const cpX = startX + (targetX - startX) * ratio + (Math.random() * 200 - 100);
                const cpY = startY + (targetY - startY) * ratio + (Math.random() * 200 - 100);
                controlPoints.push({ x: cpX, y: cpY });
            }
        }
        
        wormholeParticles[i] = {
            angle: angle,
            radius: targetRadius,
            speed: Math.random() * 0.015 + 0.012, // 增加旋转速度
            size: size,
            targetX: targetX,
            targetY: targetY,
            x: startX,
            y: startY,
            z: Math.random() * 0.3 - 0.15, // 增加深度变化
            color: colors[i % colors.length],
            trail: [],  // 所有粒子都有轨迹
            convergenceSpeed: 0.01 + Math.random() * 0.01, // 不同粒子不同速度
            startTime: performance.now() + delay,
            started: false,
            alpha: 0.95,  // 最大不透明度
            baseSize: size, // 保存原始大小用于动画
            controlPoints: controlPoints, // 路径控制点
            pathProgress: 0, // 路径进度
            distributionType: distributionType // 记录分布类型以便视觉差异
        };
    }
    
    // 添加背景粒子，显著减少数量
    const backgroundParticles = new Array(performanceSettings.backgroundParticleCount);
    
    for (let i = 0; i < performanceSettings.backgroundParticleCount; i++) {
        const angle = Math.random() * TWO_PI;
        const distance = Math.random() * window.innerWidth * 0.5; // 减小分布范围
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        const size = Math.random() * 0.8 + 0.3; // 减小尺寸
        
        backgroundParticles[i] = {
            x: x,
            y: y,
            size: size * 1.5, // 增大背景粒子
            color: colors[i % colors.length],
            alpha: Math.random() * 0.4 + 0.25, // 大幅增加不透明度
            speed: Math.random() * 0.15 + 0.05 // 增加速度
        };
    }
    
    // 优化的动画函数
    let formationComplete = false;
    let rotationSpeed = 0.008; // 增加初始旋转速度
    let maxRotationSpeed = 0.15; // 增加最大旋转速度
    let currentRotation = 0;
    let shrinkStarted = false;
    let explosionStarted = false;
    let lastTime = performance.now();
    let accelerationStartTime = 0;
    let accelerationFactor = 0.03; // 增加加速因子
    
    // 闪烁效果
    let flashOpacity = 0;
    let isFlashing = false;
    
    // 爆炸效果参数
    let explosionProgress = 0;
    let explosionTime = 0;
    const explosionDuration = 1500; // 延长爆炸时间
    let shockwaveRadius = 0;
    let shockwaveIntensity = 0.8; // 增加冲击波强度
    
    // 帧率控制
    let frameCounter = 0;
    
    // 请求动画帧节流实现
    let animationFrameId = null;
    let lastFrameTime = 0;
    const targetFPS = performanceSettings.maxFPS; // 使用设置的最大帧率上限
    const frameInterval = 1000 / targetFPS;
    
    // 节流的requestAnimationFrame函数
    function throttledRAF(callback) {
        const currentTime = performance.now();
        const timeElapsed = currentTime - lastFrameTime;
        
        if (timeElapsed > frameInterval) {
            lastFrameTime = currentTime - (timeElapsed % frameInterval);
            callback(currentTime);
        } else {
            animationFrameId = requestAnimationFrame(() => throttledRAF(callback));
        }
    }
    
    // 优化的绘制函数：分离更新逻辑和绘制逻辑
    function updateParticleState(p, deltaTime, currentTime) {
        // 检查粒子是否应该开始移动
        if (!p.started && currentTime >= p.startTime) {
            p.started = true;
            p.alpha = 0;
        }
        
        if (!p.started) return false;
        
        // 淡入效果
        if (p.alpha < 0.95) {
            p.alpha = Math.min(p.alpha + 0.06 * deltaTime, 0.95); // 加快淡入速度，提高最终不透明度
        }
        
        if (!formationComplete) {
            // 汇聚阶段 - 基于控制点的复杂路径
            if (p.controlPoints && p.controlPoints.length > 0) {
                // 使用贝塞尔曲线类型的路径
                p.pathProgress += p.convergenceSpeed * 0.5 * deltaTime;
                p.pathProgress = Math.min(p.pathProgress, 1);
                
                if (p.pathProgress < 1) {
                    // 计算当前位置
                    let newX, newY;
                    if (p.controlPoints.length === 1) {
                        // 二次贝塞尔曲线 (单控制点)
                        const t = p.pathProgress;
                        const cp = p.controlPoints[0];
                        newX = Math.pow(1-t, 2) * p.x + 2 * (1-t) * t * cp.x + Math.pow(t, 2) * p.targetX;
                        newY = Math.pow(1-t, 2) * p.y + 2 * (1-t) * t * cp.y + Math.pow(t, 2) * p.targetY;
                    } else if (p.controlPoints.length === 2) {
                        // 三次贝塞尔曲线 (两个控制点)
                        const t = p.pathProgress;
                        const cp1 = p.controlPoints[0];
                        const cp2 = p.controlPoints[1];
                        newX = Math.pow(1-t, 3) * p.x + 3 * Math.pow(1-t, 2) * t * cp1.x + 
                               3 * (1-t) * Math.pow(t, 2) * cp2.x + Math.pow(t, 3) * p.targetX;
                        newY = Math.pow(1-t, 3) * p.y + 3 * Math.pow(1-t, 2) * t * cp1.y + 
                               3 * (1-t) * Math.pow(t, 2) * cp2.y + Math.pow(t, 3) * p.targetY;
                    } else {
                        // 多段线性插值 (多控制点)
                        const segmentCount = p.controlPoints.length + 1;
                        const segmentProgress = p.pathProgress * segmentCount;
                        const currentSegment = Math.min(Math.floor(segmentProgress), segmentCount - 1);
                        const segmentT = segmentProgress - currentSegment;
                        
                        let startX, startY, endX, endY;
                        if (currentSegment === 0) {
                            startX = p.x;
                            startY = p.y;
                            endX = p.controlPoints[0].x;
                            endY = p.controlPoints[0].y;
                        } else if (currentSegment === segmentCount - 1) {
                            startX = p.controlPoints[currentSegment - 1].x;
                            startY = p.controlPoints[currentSegment - 1].y;
                            endX = p.targetX;
                            endY = p.targetY;
                        } else {
                            startX = p.controlPoints[currentSegment - 1].x;
                            startY = p.controlPoints[currentSegment - 1].y;
                            endX = p.controlPoints[currentSegment].x;
                            endY = p.controlPoints[currentSegment].y;
                        }
                        
                        newX = startX + (endX - startX) * segmentT;
                        newY = startY + (endY - startY) * segmentT;
                    }
                    
                    // 添加微小的随机扰动，增加有机感
                    if (Math.random() < 0.1) {
                        newX += (Math.random() - 0.5) * 2;
                        newY += (Math.random() - 0.5) * 2;
                    }
                    
                    p.x = newX;
                    p.y = newY;
                } else {
                    // 到达目标位置
                    p.x = p.targetX;
                    p.y = p.targetY;
                }
            } else {
                // 简单直线路径但有不同的速度和加速
                const dx = p.targetX - p.x;
                const dy = p.targetY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // 基于分布类型和距离调整速度
                let speedMultiplier = 1;
                if (p.distributionType === 0) { // 圆形分布
                    speedMultiplier = 1.2;
                } else if (p.distributionType === 3) { // 边框分布
                    speedMultiplier = 0.8 + 0.4 * (1 - Math.min(dist / 500, 1)); // 越近越快
                }
                
                const moveSpeed = p.convergenceSpeed * speedMultiplier * deltaTime;
                if (dist > 5) {
                    p.x += (dx / dist) * moveSpeed * Math.min(dist, 200);
                    p.y += (dy / dist) * moveSpeed * Math.min(dist, 200);
                } else {
                    p.x = p.targetX;
                    p.y = p.targetY;
                }
            }
            
            // 判断是否到达位置
            return Math.abs(p.x - p.targetX) < 8 && Math.abs(p.y - p.targetY) < 8;
        } else if (explosionStarted) {
            // 增强爆发效果
            const explosionFactor = Math.pow(explosionProgress, 0.7) * 20;
            
            if (explosionProgress < 0.3) {
                // 初始阶段 - 压缩并增亮
                p.radius *= (1 - 0.08 * deltaTime);
                p.size *= (1 + 0.05 * deltaTime);
                p.alpha = Math.min(1.0, p.alpha * (1 + 0.05 * deltaTime));
            } else {
                // 膨胀阶段
                p.radius = p.radius + explosionFactor * deltaTime * (1 + Math.random() * 0.5);
                p.alpha *= (1 - 0.03 * deltaTime * explosionProgress);
                p.size *= (1 - 0.01 * deltaTime);
            }
        } else {
            // 旋转阶段
            p.angle += (p.speed * rotationSpeed * 12) * deltaTime;
            
            // 粒子大小随旋转速度脉动
            const sizePulse = Math.sin(currentTime / 200) * 0.3 + 1;
            p.size = p.baseSize * sizePulse * (1 + rotationSpeed * 5);
            
            // 收缩虫洞
            if (shrinkStarted) {
                p.radius *= (1 - 0.015 * deltaTime);
            }
            
            // 轨迹效果 - 更明显的轨迹
            if (rotationSpeed > 0.04) {
                const trailChance = Math.min(rotationSpeed * 6, 0.8);
                if (Math.random() < trailChance) {
                    p.trail.push({
                        x: p.x,
                        y: p.y,
                        size: p.size * 0.9, // 更大的轨迹
                        opacity: p.alpha * 0.9 // 更明显的轨迹
                    });
                    
                    // 限制轨迹长度
                    if (p.trail.length > performanceSettings.trailLength) {
                        p.trail.shift();
                    }
                }
            }
        }
        
        // 更新位置
        if (explosionStarted) {
            p.x = centerX + Math.cos(p.angle) * p.radius;
            p.y = centerY + Math.sin(p.angle) * p.radius;
        } else if (formationComplete) {
            // 简化z轴波动
            const zScale = 1 + p.z;
            p.x = centerX + Math.cos(p.angle + currentRotation) * p.radius * zScale;
            p.y = centerY + Math.sin(p.angle + currentRotation) * p.radius * zScale;
            p.visualSize = p.size * zScale;
        } else {
            p.visualSize = p.size;
        }
        
        return true;
    }
    
    // 添加全局变量来控制虫洞扩散消失效果
    let wormholeFading = false;
    let wormholeFadeProgress = 0;
    let wormholeFadeStartTime = 0;
    const wormholeFadeDuration = 1000;
    
    // 优化的动画循环
    function animateParticles(currentTime) {
        // 帧率控制
        frameCounter++;
        if (frameCounter % performanceSettings.skipFrames !== 0) {
            animationFrameId = requestAnimationFrame((time) => throttledRAF(animateParticles));
            return;
        }
        
        // 计算帧间隔，限制最大值
        const deltaTime = Math.min((currentTime - lastTime) / 16.67, 2);
        lastTime = currentTime;
        
        // 清除画布 - 使用更高效的清除方式
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 处理虫洞扩散消失效果
        if (wormholeFading) {
            wormholeFadeProgress = Math.min((currentTime - wormholeFadeStartTime) / wormholeFadeDuration, 1);
            
            // 更新虫洞div的样式
            if (wormhole) {
                const scale = 1 + wormholeFadeProgress * 2; // 扩大到原来的3倍
                const opacity = 1 - wormholeFadeProgress;
                
                wormhole.style.transform = `translate(-50%, -50%) scale(${scale})`;
                wormhole.style.opacity = opacity.toString();
                
                // 同时调整虫洞的发光效果
                wormhole.style.boxShadow = `0 0 ${80 * (1 - wormholeFadeProgress)}px rgba(150,50,255,${0.8 * (1 - wormholeFadeProgress)})`;
            }
            
            // 完全消失后移除元素
            if (wormholeFadeProgress >= 1) {
                if (canvas && canvas.parentNode) canvas.remove();
                if (wormhole && wormhole.parentNode) wormhole.remove();
                if (animationFrameId) cancelAnimationFrame(animationFrameId);
                return;
            }
        }
        
        // 绘制背景粒子，大幅减少绘制频率
        const bgDrawInterval = performanceSettings.backgroundDrawInterval;
        
        for (let i = 0; i < backgroundParticles.length; i += bgDrawInterval) {
            const p = backgroundParticles[i];
            
            // 简化的移动逻辑
            if (formationComplete && !explosionStarted) {
                const dx = centerX - p.x;
                const dy = centerY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 50) { // 减小吸引范围
                    p.x += (dx / dist) * p.speed * deltaTime;
                    p.y += (dy / dist) * p.speed * deltaTime;
                }
            } else if (explosionStarted) {
                // 简化的爆炸效果
                const dx = p.x - centerX;
                const dy = p.y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const factor = Math.min(explosionProgress * 0.3, 0.2);
                
                if (dist < shockwaveRadius) {
                    p.x += (dx / Math.max(dist, 1)) * factor * 5 * deltaTime;
                    p.y += (dy / Math.max(dist, 1)) * factor * 5 * deltaTime;
                }
            }
            
            // 简化的粒子绘制
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, TWO_PI);
            const alphaIndex = p.color.lastIndexOf(',') + 1;
            const colorBase = p.color.substring(0, alphaIndex);
            ctx.fillStyle = `${colorBase}${p.alpha})`;
            ctx.fill();
        }
        
        // 绘制闪光效果
        if (isFlashing) {
            // 使用径向渐变创建更引人注目的闪光效果
            const flashGradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, canvas.width / 2
            );
            flashGradient.addColorStop(0, `rgba(255, 255, 255, ${flashOpacity * 1.2})`);
            flashGradient.addColorStop(0.2, `rgba(200, 150, 255, ${flashOpacity})`);
            flashGradient.addColorStop(0.5, `rgba(180, 70, 255, ${flashOpacity * 0.8})`);
            flashGradient.addColorStop(1, `rgba(100, 0, 180, 0)`);
            
            ctx.fillStyle = flashGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            flashOpacity -= 0.02 * deltaTime; // 进一步减慢闪光消失速度
        }
        
        // 绘制更明显的冲击波
        if (explosionStarted && shockwaveRadius > 0) {
            const intensity = (1 - explosionProgress) * shockwaveIntensity; // 提高冲击波强度
            ctx.globalAlpha = intensity;
            
            // 主冲击波
            ctx.beginPath();
            ctx.arc(centerX, centerY, shockwaveRadius, 0, TWO_PI);
            ctx.strokeStyle = 'rgba(200, 120, 255, 0.9)'; // 更亮的颜色
            ctx.lineWidth = 25 * (1 - explosionProgress); // 增加线宽
            ctx.stroke();
            
            // 第二道冲击波
            ctx.beginPath();
            ctx.arc(centerX, centerY, shockwaveRadius * 0.8, 0, TWO_PI);
            ctx.strokeStyle = 'rgba(160, 80, 255, 0.85)';
            ctx.lineWidth = 18 * (1 - explosionProgress);
            ctx.stroke();
            
            // 第三道冲击波（内环）
            ctx.beginPath();
            ctx.arc(centerX, centerY, shockwaveRadius * 0.6, 0, TWO_PI);
            ctx.strokeStyle = 'rgba(255, 180, 255, 0.8)';
            ctx.lineWidth = 12 * (1 - explosionProgress);
            ctx.stroke();
            
            // 添加第四道白色内环冲击波
            ctx.beginPath();
            ctx.arc(centerX, centerY, shockwaveRadius * 0.4, 0, TWO_PI);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 8 * (1 - explosionProgress);
            ctx.stroke();
            
            ctx.globalAlpha = 1;
            
            // 更新冲击波半径，加快传播速度
            shockwaveRadius += 500 * deltaTime * (1 - explosionProgress * 0.3);
            
            // 添加爆炸粒子效果
            if (explosionProgress < 0.4 && frameCounter % 2 === 0) {
                const particleCount = 5;
                for (let i = 0; i < particleCount; i++) {
                    const angle = Math.random() * TWO_PI;
                    const distance = shockwaveRadius * (0.2 + Math.random() * 0.7);
                    const x = centerX + Math.cos(angle) * distance;
                    const y = centerY + Math.sin(angle) * distance;
                    
                    ctx.beginPath();
                    const size = 2 + Math.random() * 6;
                    ctx.arc(x, y, size, 0, TWO_PI);
                    
                    // 随机选择明亮的颜色
                    const colorChoice = Math.floor(Math.random() * 3);
                    let particleColor;
                    switch(colorChoice) {
                        case 0:
                            particleColor = `rgba(255, 255, 255, ${0.9 * (1 - explosionProgress * 2)})`;
                            break;
                        case 1:
                            particleColor = `rgba(180, 100, 255, ${0.8 * (1 - explosionProgress * 2)})`;
                            break;
                        case 2:
                            particleColor = `rgba(100, 200, 255, ${0.8 * (1 - explosionProgress * 2)})`;
                            break;
                    }
                    
                    ctx.fillStyle = particleColor;
                    ctx.fill();
                    
                    // 添加发光效果
                    if (Math.random() > 0.5) {
                        ctx.shadowBlur = size * 3;
                        ctx.shadowColor = particleColor;
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    }
                }
            }
        }
        
        if (formationComplete && !explosionStarted) {
            // 加速旋转，使用简化的加速函数
            const timeSinceFormation = (currentTime - accelerationStartTime) / 1000;
            rotationSpeed = Math.min(0.008 + (timeSinceFormation * accelerationFactor), maxRotationSpeed);
            
            // 同步地球旋转速度，随着虫洞旋转加速而加速
            const earthSpeedFactor = Math.min(1 + timeSinceFormation * 2, 6); // 最多加速到6倍
            earthCurrentRotationSpeed = earthBaseRotationSpeed * earthSpeedFactor;
            
            // 修改爆炸开始时的代码
            if (timeSinceFormation > 2 && !shrinkStarted) {
                shrinkStarted = true;
                
                // 闪光效果
                flashOpacity = 0.7; // 增加闪光初始不透明度
                isFlashing = true;
                
                // 准备爆发
                setTimeout(() => {
                    explosionStarted = true;
                    explosionTime = performance.now();
                    
                    // 闪光
                    flashOpacity = 1.0; // 进一步增加爆炸闪光不透明度
                    isFlashing = true;
                    
                    // 初始化冲击波
                    shockwaveRadius = radius;
                    
                    // 相机动画
                    animateCamera();
                }, 200);
            }
        }
        
        currentRotation += rotationSpeed * deltaTime;
        
        // 更新爆炸进度
        if (explosionStarted) {
            explosionProgress = Math.min((currentTime - explosionTime) / explosionDuration, 1);
        }
        
        // 高效批量更新和绘制粒子
        let inPlaceParticlesCount = 0;
        let activeParticlesCount = 0;
        
        // 渲染步长
        const renderStep = explosionStarted ? 
            (explosionProgress > 0.4 ? performanceSettings.renderStep * 2 : performanceSettings.renderStep) : 
            performanceSettings.renderStep;
        
        for (let i = 0; i < wormholeParticles.length; i += renderStep) {
            const p = wormholeParticles[i];
            
            // 更新粒子状态
            const inPlace = updateParticleState(p, deltaTime, currentTime);
            
            if (p.started) {
                activeParticlesCount++;
                if (inPlace) inPlaceParticlesCount++;
                
                // 绘制轨迹 - 更明显的轨迹
                if (formationComplete && !explosionStarted && 
                    rotationSpeed > 0.04 && 
                    p.trail && 
                    p.trail.length > 0) {
                    
                    // 绘制连接线以增强流动感
                    if (p.trail.length > 1) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        
                        for (let j = p.trail.length - 1; j >= 0; j--) {
                            ctx.lineTo(p.trail[j].x, p.trail[j].y);
                        }
                        
                        ctx.strokeStyle = p.color.replace(/[^,]+(?=\))/, '0.4');
                        ctx.lineWidth = p.size * 0.4;
                        ctx.stroke();
                    }
                    
                    // 绘制轨迹点
                    for (let j = 0; j < p.trail.length; j++) {
                        const t = p.trail[j];
                        ctx.beginPath();
                        ctx.arc(t.x, t.y, t.size, 0, TWO_PI);
                        
                        // 根据位置使用不同颜色使轨迹更生动
                        const trailColorBase = p.color.substring(0, p.color.lastIndexOf(','));
                        const fadeFactor = j / p.trail.length;
                        ctx.fillStyle = `${trailColorBase}, ${t.opacity * (1 - fadeFactor * 0.5)})`;
                        ctx.fill();
                        
                        // 降低透明度但更慢
                        t.opacity -= 0.04 * deltaTime;
                        t.size -= 0.02 * t.size * deltaTime;
                    }
                    
                    // 过滤掉透明度太低的轨迹点
                    if (frameCounter % 5 === 0) {
                        p.trail = p.trail.filter(t => t.opacity > 0.1);
                    }
                }
                
                // 绘制粒子
                ctx.beginPath();
                const visualSize = p.visualSize || p.size;
                ctx.arc(p.x, p.y, visualSize, 0, TWO_PI);
                
                // 应用粒子颜色和透明度
                const alphaIndex = p.color.lastIndexOf(',') + 1;
                const colorBase = p.color.substring(0, alphaIndex);
                ctx.fillStyle = `${colorBase}${p.alpha})`;
                ctx.fill();
                
                // 增强发光效果
                if (performanceSettings.glowEnabled) {
                    // 增加发光强度
                    const glowIntensity = explosionStarted ? 
                        (1 - explosionProgress) * 25 : // 爆炸时更强的发光
                        rotationSpeed * 40 + 5; // 基础发光更强
                    
                    ctx.shadowBlur = visualSize * glowIntensity;
                    ctx.shadowColor = p.color.replace(/[^,]+(?=\))/, '0.7'); // 更强的发光
                    
                    // 添加第二个光晕层
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, visualSize * 0.7, 0, TWO_PI);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.fill();
                }
            }
        }
        
        // 当50%的粒子到达目标位置时开始旋转，降低判断门槛
        if (!formationComplete && activeParticlesCount > particleCount * 0.3 && 
            inPlaceParticlesCount >= activeParticlesCount * 0.5) {
            formationComplete = true;
            accelerationStartTime = currentTime;
            
            // 显示地球开始稍微加速转动的视觉提示
            earthCurrentRotationSpeed = earthBaseRotationSpeed * 1.5;
        }
        
        // 继续动画
        animationFrameId = requestAnimationFrame((time) => throttledRAF(animateParticles));
    }
    
    // 启动动画
    animationFrameId = requestAnimationFrame((time) => throttledRAF(animateParticles));
    
    // 极度优化的相机动画
    function animateCamera() {
        const startTime = performance.now();
        const duration = 1500;
        const startZ = camera.position.z;
        const targetZ = 0.05;
        
        const startY = camera.position.y;
        const targetY = startY - 1.5;
        
        controls.enabled = false;
        
        let lastProgress = 0;
        let cameraAnimationComplete = false;
        
        const escKeyHandler = (event) => {
            if (event.key === 'Escape' && cameraAnimationComplete) {
                resetView();
                document.removeEventListener('keydown', escKeyHandler);
            }
        };
        
        document.addEventListener('keydown', escKeyHandler);
        
        function updateCamera() {
            const currentTime = performance.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (progress - lastProgress > 0.01 || progress === 1) {
                lastProgress = progress;
                
                const easeProgress = easeOutExpo(progress);
                const easeInProgress = easeInExpo(progress);
                
                camera.position.z = startZ * (1 - easeProgress) + targetZ * easeProgress;
                camera.position.y = startY * (1 - easeProgress) + targetY * easeProgress;
                
                const scale = 1 + (easeProgress * easeProgress * 3);
                earth.scale.set(scale, scale, scale);
                
                earth.material.opacity = Math.max(0.2, 1 - easeProgress * 0.8);
                
                earthCurrentRotationSpeed = earthBaseRotationSpeed * (1 + easeInProgress * 8);
            }
            
            if (progress < 1) {
                requestAnimationFrame(updateCamera);
            } else {
                cameraAnimationComplete = true;
                controls.enabled = true;
                showEscapeHint();
                
                // 在爆炸动画结束后，启动虫洞扩散消失效果
                setTimeout(() => {
                    wormholeFading = true;
                    wormholeFadeStartTime = performance.now();
                }, explosionDuration);
            }
        }
        
        requestAnimationFrame(updateCamera);
    }
    
    // 重置到原始视角
    function resetView() {
        camera.position.z = startZ;
        camera.position.y = startY;
        
        earth.scale.set(1, 1, 1);
        earth.material.opacity = 0.8;
        
        earthCurrentRotationSpeed = earthBaseRotationSpeed;
        controls.enabled = true;
        
        // 移除粒子系统和帧率显示（如果还存在）
        if (canvas && canvas.parentNode) canvas.remove();
        if (wormhole && wormhole.parentNode) wormhole.remove();
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
    }
    
    // 显示ESC提示
    function showEscapeHint() {
        const hint = document.createElement('div');
        hint.style.position = 'fixed';
        hint.style.bottom = '20px';
        hint.style.left = '50%';
        hint.style.transform = 'translateX(-50%)';
        hint.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        hint.style.color = '#80ffff';
        hint.style.padding = '12px 25px';
        hint.style.borderRadius = '5px';
        hint.style.fontFamily = 'Arial, sans-serif';
        hint.style.fontSize = '16px';
        hint.style.fontWeight = 'bold';
        hint.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.5)';
        hint.style.zIndex = '2000';
        hint.style.pointerEvents = 'none';
        hint.style.opacity = '0';
        hint.style.transition = 'opacity 0.5s';
        hint.textContent = '按ESC键返回';
        document.body.appendChild(hint);
        
        // 淡入效果
        setTimeout(() => {
            hint.style.opacity = '1';
            // 5秒后淡出
            setTimeout(() => {
                hint.style.opacity = '0';
                setTimeout(() => hint.remove(), 500);
            }, 5000);
        }, 100);
    }
}

// 缓入函数 - 用于地球加速旋转
function easeInExpo(x) {
    return x === 0 ? 0 : Math.pow(2, 10 * x - 10);
}

// 缓出函数
function easeOutExpo(x) {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
} 