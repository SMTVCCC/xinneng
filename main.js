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

// 保存初始相机位置供重置使用
const startZ = camera.position.z;
const startY = camera.position.y;

// 添加全局ESC键监听器
let cameraAnimationCompleted = false;
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && cameraAnimationCompleted) {
        resetView();
        cameraAnimationCompleted = false;
    }
});

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

// 添加点击开始提示
const clickToStartHint = document.createElement('div');
clickToStartHint.id = 'clickToStartHint';
clickToStartHint.style.position = 'fixed';
clickToStartHint.style.top = '45px';
clickToStartHint.style.right = '10px';
clickToStartHint.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
clickToStartHint.style.color = '#00ffff';
clickToStartHint.style.padding = '5px 10px';
clickToStartHint.style.borderRadius = '3px';
clickToStartHint.style.fontFamily = 'Arial, sans-serif';
clickToStartHint.style.fontSize = '13px';
clickToStartHint.style.zIndex = '2000';
clickToStartHint.style.textAlign = 'center';
clickToStartHint.style.border = '1px solid rgba(0, 255, 255, 0.3)';
clickToStartHint.style.boxShadow = '0 0 5px rgba(0, 255, 255, 0.2)';
clickToStartHint.style.cursor = 'pointer';
clickToStartHint.innerHTML = '点击一下开始<br><span style="font-size: 10px; opacity: 0.7;">Click to start</span>';
// 加入点击事件
clickToStartHint.addEventListener('mouseenter', () => {
    clickToStartHint.style.backgroundColor = 'rgba(0, 20, 40, 0.7)';
    clickToStartHint.style.boxShadow = '0 0 8px rgba(0, 255, 255, 0.4)';
});
clickToStartHint.addEventListener('mouseleave', () => {
    clickToStartHint.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    clickToStartHint.style.boxShadow = '0 0 5px rgba(0, 255, 255, 0.2)';
});
clickToStartHint.addEventListener('click', () => {
    createEnhancedParticleBurst();
});
document.body.appendChild(clickToStartHint);

// 添加全屏检查和警告
let fullscreenWarningActive = false;
let fullscreenWarningElement = null;
let fullscreenFlashInterval = null;

// 创建全屏警告元素
function createFullscreenWarning() {
    if (fullscreenWarningElement) return;
    
    // 创建警告容器
    fullscreenWarningElement = document.createElement('div');
    fullscreenWarningElement.id = 'fullscreenWarning';
    fullscreenWarningElement.style.position = 'fixed';
    fullscreenWarningElement.style.top = '0';
    fullscreenWarningElement.style.left = '0';
    fullscreenWarningElement.style.width = '100%';
    fullscreenWarningElement.style.height = '100%';
    fullscreenWarningElement.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
    fullscreenWarningElement.style.display = 'flex';
    fullscreenWarningElement.style.flexDirection = 'column';
    fullscreenWarningElement.style.justifyContent = 'center';
    fullscreenWarningElement.style.alignItems = 'center';
    fullscreenWarningElement.style.zIndex = '10000';
    fullscreenWarningElement.style.opacity = '0';
    fullscreenWarningElement.style.transition = 'opacity 0.5s';
    fullscreenWarningElement.style.backdropFilter = 'blur(5px)';
    
    // 创建警告内容
    const warningContent = document.createElement('div');
    warningContent.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    warningContent.style.borderRadius = '15px';
    warningContent.style.padding = '30px 40px';
    warningContent.style.maxWidth = '90%';
    warningContent.style.width = '500px';
    warningContent.style.textAlign = 'center';
    warningContent.style.boxShadow = '0 0 30px rgba(255, 0, 0, 0.7)';
    warningContent.style.border = '2px solid rgba(255, 50, 50, 0.8)';
    
    // 警告图标
    const warningIcon = document.createElement('div');
    warningIcon.innerHTML = `<svg width="80" height="80" viewBox="0 0 24 24" fill="none">
        <path d="M12 4L2 20H22L12 4Z" stroke="#ff3333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 16V16.01" stroke="#ff3333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 12V14" stroke="#ff3333" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    
    // 警告标题
    const warningTitle = document.createElement('h2');
    warningTitle.textContent = '请切换到全屏模式';
    warningTitle.style.color = '#ff3333';
    warningTitle.style.fontFamily = 'Arial, sans-serif';
    warningTitle.style.margin = '20px 0';
    warningTitle.style.fontSize = '24px';
    
    // 警告文本
    const warningText = document.createElement('p');
    warningText.innerHTML = '为了获得最佳体验，本程序<strong>必须</strong>在全屏模式下运行。<br>请点击下方按钮进入全屏模式。';
    warningText.style.color = '#ffffff';
    warningText.style.fontFamily = 'Arial, sans-serif';
    warningText.style.fontSize = '16px';
    warningText.style.lineHeight = '1.6';
    warningText.style.margin = '0 0 25px 0';
    
    // 全屏按钮
    const fullscreenButton = document.createElement('button');
    fullscreenButton.textContent = '进入全屏模式';
    fullscreenButton.style.backgroundColor = '#ff3333';
    fullscreenButton.style.color = 'white';
    fullscreenButton.style.border = 'none';
    fullscreenButton.style.borderRadius = '30px';
    fullscreenButton.style.padding = '12px 30px';
    fullscreenButton.style.fontSize = '16px';
    fullscreenButton.style.fontWeight = 'bold';
    fullscreenButton.style.cursor = 'pointer';
    fullscreenButton.style.transition = 'all 0.3s';
    fullscreenButton.style.boxShadow = '0 4px 15px rgba(255, 0, 0, 0.4)';
    
    // 按钮悬停效果
    fullscreenButton.addEventListener('mouseenter', () => {
        fullscreenButton.style.backgroundColor = '#ff5555';
        fullscreenButton.style.transform = 'scale(1.05)';
    });
    
    fullscreenButton.addEventListener('mouseleave', () => {
        fullscreenButton.style.backgroundColor = '#ff3333';
        fullscreenButton.style.transform = 'scale(1)';
    });
    
    // 点击进入全屏
    fullscreenButton.addEventListener('click', () => {
        requestFullscreen();
    });
    
    // 组装警告元素
    warningContent.appendChild(warningIcon);
    warningContent.appendChild(warningTitle);
    warningContent.appendChild(warningText);
    warningContent.appendChild(fullscreenButton);
    fullscreenWarningElement.appendChild(warningContent);
    
    document.body.appendChild(fullscreenWarningElement);
    
    // 淡入显示
    setTimeout(() => {
        fullscreenWarningElement.style.opacity = '1';
    }, 50);
}

// 添加刷新页面按钮
function createRefreshButton() {
    console.log('创建刷新按钮');
    const refreshBtn = document.createElement('div');
    refreshBtn.id = 'refresh-container';
    refreshBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        display: flex;
        flex-direction: column;
        align-items: center;
        z-index: 10000;
        font-family: 'Arial', sans-serif;
    `;

    const refreshButton = document.createElement('button');
    refreshButton.id = 'refresh-button';
    refreshButton.textContent = '刷新页面';
    refreshButton.style.cssText = `
        padding: 10px 20px;
        background: rgba(0, 100, 200, 0.7);
        color: white;
        border: none;
        border-radius: 5px;
        font-size: 16px;
        cursor: pointer;
        transition: all 0.3s;
        box-shadow: 0 0 10px rgba(0, 150, 255, 0.5);
    `;

    const refreshHint = document.createElement('div');
    refreshHint.id = 'refresh-hint';
    refreshHint.textContent = '出现任何问题建议刷新';
    refreshHint.style.cssText = `
        margin-top: 5px;
        color: rgba(255, 255, 255, 0.8);
        font-size: 12px;
        text-align: center;
        max-width: 150px;
    `;

    refreshButton.addEventListener('mouseover', () => {
        refreshButton.style.backgroundColor = 'rgba(0, 120, 220, 0.9)';
        refreshButton.style.boxShadow = '0 0 15px rgba(0, 150, 255, 0.7)';
    });

    refreshButton.addEventListener('mouseout', () => {
        refreshButton.style.backgroundColor = 'rgba(0, 100, 200, 0.7)';
        refreshButton.style.boxShadow = '0 0 10px rgba(0, 150, 255, 0.5)';
    });

    refreshButton.addEventListener('click', () => {
        refreshButton.style.transform = 'scale(0.95)';
        setTimeout(() => {
            refreshButton.style.transform = 'scale(1)';
            window.location.reload();
        }, 100);
    });

    refreshBtn.appendChild(refreshButton);
    refreshBtn.appendChild(refreshHint);
    document.body.appendChild(refreshBtn);
    
    console.log('刷新按钮已创建', refreshBtn);
    return refreshBtn;
}

// 开始红色闪烁效果
function startFullscreenWarningFlash() {
    if (fullscreenFlashInterval) return;
    
    let flashState = false;
    fullscreenFlashInterval = setInterval(() => {
        if (!fullscreenWarningElement) return;
        
        flashState = !flashState;
        if (flashState) {
            fullscreenWarningElement.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
        } else {
            fullscreenWarningElement.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
        }
    }, 500);
}

// 检查是否处于全屏模式
function isFullscreen() {
    return !!(
        document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.mozFullScreenElement || 
        document.msFullscreenElement
    );
}

// 请求全屏
function requestFullscreen() {
    const elem = document.documentElement;
    
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { /* Safari */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
        elem.msRequestFullscreen();
    }
}

// 退出全屏
function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { /* Safari */
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE11 */
        document.msExitFullscreen();
    }
}

// 显示全屏警告
function showFullscreenWarning() {
    if (fullscreenWarningActive) return;
    
    fullscreenWarningActive = true;
    createFullscreenWarning();
    startFullscreenWarningFlash();
    
    // 隐藏其他UI元素
    if (clickToStartHint) clickToStartHint.style.display = 'none';
    if (permanentFpsCounter) permanentFpsCounter.style.display = 'none';
    
    // 禁用地球旋转和交互
    controls.enabled = false;
    if (renderer && renderer.domElement) {
        renderer.domElement.style.pointerEvents = 'none';
    }
}

// 隐藏全屏警告
function hideFullscreenWarning() {
    if (!fullscreenWarningActive) return;
    
    fullscreenWarningActive = false;
    
    // 停止闪烁
    if (fullscreenFlashInterval) {
        clearInterval(fullscreenFlashInterval);
        fullscreenFlashInterval = null;
    }
    
    // 淡出并移除警告元素
    if (fullscreenWarningElement) {
        fullscreenWarningElement.style.opacity = '0';
        setTimeout(() => {
            if (fullscreenWarningElement && fullscreenWarningElement.parentNode) {
                fullscreenWarningElement.parentNode.removeChild(fullscreenWarningElement);
            }
            fullscreenWarningElement = null;
        }, 500);
    }
    
    // 显示其他UI元素
    if (clickToStartHint) clickToStartHint.style.display = 'block';
    if (permanentFpsCounter) permanentFpsCounter.style.display = 'block';
    
    // 启用地球旋转和交互
    controls.enabled = true;
    if (renderer && renderer.domElement) {
        renderer.domElement.style.pointerEvents = 'auto';
    }
}

// 全屏变化事件监听
document.addEventListener('fullscreenchange', checkFullscreenStatus);
document.addEventListener('webkitfullscreenchange', checkFullscreenStatus);
document.addEventListener('mozfullscreenchange', checkFullscreenStatus);
document.addEventListener('MSFullscreenChange', checkFullscreenStatus);

// 检查全屏状态并相应处理
function checkFullscreenStatus() {
    if (isFullscreen()) {
        hideFullscreenWarning();
    } else {
        showFullscreenWarning();
    }
}

// 页面加载时检查全屏状态
window.addEventListener('load', () => {
    checkFullscreenStatus();
});

// 全局FPS计算变量
let globalFpsUpdateTime = performance.now();
let globalFrameCount = 0;
let currentFPS = 0;

// 全局虫洞相关变量
let currentCanvas = null;
let currentWormhole = null;
let currentAnimationFrameId = null;

// 添加帧率监控与评分系统
const frameRateMonitor = {
    active: false,
    records: [],
    recordInterval: 1000, // 每秒记录一次
    startTime: 0,
    endTime: 0,
    totalTime: 0, // 总完成时间（毫秒）
    lastRecordTime: 0,
    averageFPS: 0,
    minFPS: 0,
    maxFPS: 0,
    stability: 0,
    // 添加标准完成时间参考值（毫秒）
    referenceCompletionTime: {
        fast: 30000,   // 30秒 - 满分
        standard: 40000, // 40秒 - 良好
        slow: 50000    // 50秒 - 及格
    },
    weightDistribution: {
        average: 0.3,     // 平均帧率权重降低
        minimum: 0.2,     // 最低帧率权重降低 
        stability: 0.2,   // 稳定性权重降低
        time: 0.3         // 新增：完成时间权重
    },
    
    // 开始记录
    start() {
        this.active = true;
        this.records = [];
        this.startTime = performance.now();
        this.lastRecordTime = this.startTime;
        console.log("帧率监控已启动");
    },
    
    // 记录帧率
    record(currentFPS) {
        if (!this.active) return;
        
        const now = performance.now();
        if (now - this.lastRecordTime >= this.recordInterval) {
            this.records.push({
                time: (now - this.startTime) / 1000, // 秒数
                fps: currentFPS
            });
            this.lastRecordTime = now;
        }
    },
    
    // 结束记录并分析
    stop() {
        if (!this.active || this.records.length === 0) return;
        
        this.active = false;
        this.endTime = performance.now();
        this.totalTime = this.endTime - this.startTime;
        
        // 计算统计数据
        const fpsValues = this.records.map(r => r.fps);
        this.averageFPS = fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length;
        this.minFPS = Math.min(...fpsValues);
        this.maxFPS = Math.max(...fpsValues);
        
        // 计算标准差（衡量稳定性）
        const variance = fpsValues.reduce((sum, fps) => {
            return sum + Math.pow(fps - this.averageFPS, 2);
        }, 0) / fpsValues.length;
        const stdDeviation = Math.sqrt(variance);
        
        // 将标准差转换为稳定性分数（越稳定越接近100）
        const stabilityPercentage = Math.max(0, 100 - (stdDeviation / this.averageFPS * 100));
        this.stability = stabilityPercentage;
        
        console.log(`帧率统计：平均=${this.averageFPS.toFixed(1)}，最低=${this.minFPS}，最高=${this.maxFPS}，稳定性=${this.stability.toFixed(1)}%，完成时间=${(this.totalTime/1000).toFixed(1)}秒`);
        
        // 计算整体得分
        const score = this.calculateScore();
        
        // 显示结果
        setTimeout(() => {
            this.showResult(score);
        }, 1000); // 虫洞散去后1秒显示
    },
    
    // 计算性能评分（0-100分）
    calculateScore() {
        // 获取目标帧率
        const targetFPS = performanceSettings.maxFPS;
        
        // 平均帧率得分（放宽要求）
        // 使用非线性映射函数，降低高帧率要求
        // 当帧率为目标帧率的60%时，即可获得90分
        const averageFpsRatio = this.averageFPS / targetFPS;
        const averageScore = averageFpsRatio >= 0.9 ? 100 : 
                            averageFpsRatio >= 0.7 ? 90 + (averageFpsRatio - 0.7) * 50 : 
                            averageFpsRatio >= 0.5 ? 75 + (averageFpsRatio - 0.5) * 75 : 
                            averageFpsRatio >= 0.3 ? 50 + (averageFpsRatio - 0.3) * 125 : 
                            averageFpsRatio * 166.67; // 更平缓的曲线
        
        // 最低帧率得分（放宽要求）
        // 只要最低帧率不低于目标帧率的40%，就能获得较高分数
        const minFpsRatio = this.minFPS / targetFPS;
        const minScore = minFpsRatio >= 0.7 ? 100 : 
                        minFpsRatio >= 0.5 ? 90 + (minFpsRatio - 0.5) * 50 : 
                        minFpsRatio >= 0.3 ? 70 + (minFpsRatio - 0.3) * 100 : 
                        minFpsRatio * 233.33; // 最低帧率曲线也更平缓
        
        // 稳定性得分（已经是0-100）
        // 稳定性得分也适当放宽，85%以上的稳定性就接近满分
        const rawStabilityScore = this.stability;
        const stabilityScore = rawStabilityScore >= 85 ? 100 : 
                              rawStabilityScore >= 70 ? 90 + (rawStabilityScore - 70) * (10/15) : 
                              rawStabilityScore >= 50 ? 75 + (rawStabilityScore - 50) * (15/20) : 
                              rawStabilityScore;
        
        // 完成时间得分（越短越好）
        let timeScore;
        if (this.totalTime <= this.referenceCompletionTime.fast) {
            // 快于参考快速时间
            timeScore = 100;
        } else if (this.totalTime <= this.referenceCompletionTime.standard) {
            // 在快速与标准之间
            const ratio = (this.referenceCompletionTime.standard - this.totalTime) / 
                          (this.referenceCompletionTime.standard - this.referenceCompletionTime.fast);
            timeScore = 80 + ratio * 20; // 80-100之间
        } else if (this.totalTime <= this.referenceCompletionTime.slow) {
            // 在标准与慢速之间
            const ratio = (this.referenceCompletionTime.slow - this.totalTime) / 
                          (this.referenceCompletionTime.slow - this.referenceCompletionTime.standard);
            timeScore = 60 + ratio * 20; // 60-80之间
        } else {
            // 慢于参考慢速时间，也放宽要求
            const ratio = Math.min(1, (this.totalTime - this.referenceCompletionTime.slow) / 
                                    this.referenceCompletionTime.slow);
            timeScore = Math.max(40, 60 - ratio * 20); // 最低40分（比原来的30分高）
        }
        
        // 加权计算总分
        const totalScore = (
            averageScore * this.weightDistribution.average +
            minScore * this.weightDistribution.minimum +
            stabilityScore * this.weightDistribution.stability +
            timeScore * this.weightDistribution.time
        );
        
        console.log(`得分明细: 平均帧率=${averageScore.toFixed(1)}, 最低帧率=${minScore.toFixed(1)}, 稳定性=${stabilityScore.toFixed(1)}, 时间=${timeScore.toFixed(1)}`);
        
        return Math.round(totalScore);
    },
    
    // 获取时间评级文本
    getTimeRating() {
        if (this.totalTime <= this.referenceCompletionTime.fast * 0.9) {
            return "极速";
        } else if (this.totalTime <= this.referenceCompletionTime.fast) {
            return "卓越";
        } else if (this.totalTime <= this.referenceCompletionTime.standard) {
            return "良好";
        } else if (this.totalTime <= this.referenceCompletionTime.slow) {
            return "合格";
        } else if (this.totalTime <= this.referenceCompletionTime.slow * 1.2) {
            return "较慢";
        } else {
            return "缓慢";
        }
    },
    
    // 获取时间评级颜色
    getTimeRatingColor() {
        if (this.totalTime <= this.referenceCompletionTime.fast * 0.9) {
            return "rgba(0, 255, 150, 0.3)"; // 极速 - 绿色
        } else if (this.totalTime <= this.referenceCompletionTime.fast) {
            return "rgba(0, 220, 255, 0.3)"; // 卓越 - 蓝绿色
        } else if (this.totalTime <= this.referenceCompletionTime.standard) {
            return "rgba(100, 200, 255, 0.3)"; // 良好 - 浅蓝色
        } else if (this.totalTime <= this.referenceCompletionTime.slow) {
            return "rgba(255, 230, 0, 0.3)"; // 合格 - 黄色
        } else if (this.totalTime <= this.referenceCompletionTime.slow * 1.2) {
            return "rgba(255, 100, 50, 0.3)"; // 较慢 - 橙色
        } else {
            return "rgba(255, 50, 50, 0.3)"; // 缓慢 - 红色
        }
    },
    
    // 显示评分结果
    showResult(score) {
        // 创建评分容器
        const resultContainer = document.createElement('div');
        resultContainer.style.position = 'fixed';
        resultContainer.style.top = '50%';
        resultContainer.style.left = '50%';
        resultContainer.style.transform = 'translate(-50%, -50%)';
        resultContainer.style.backgroundColor = 'rgba(0, 0, 15, 0.85)';
        resultContainer.style.backdropFilter = 'blur(10px)';
        resultContainer.style.borderRadius = '15px';
        
        // 根据屏幕大小调整内边距和宽度
        const sizeFactor = performanceSettings.screenSizeFactor;
        resultContainer.style.padding = `${25 * sizeFactor}px`;
        resultContainer.style.boxShadow = `0 0 ${30 * sizeFactor}px rgba(0, 150, 255, 0.4), inset 0 0 ${15 * sizeFactor}px rgba(0, 100, 255, 0.2)`;
        resultContainer.style.zIndex = '3000';
        resultContainer.style.color = '#fff';
        resultContainer.style.fontFamily = '"Segoe UI", Arial, sans-serif';
        resultContainer.style.textAlign = 'center';
        
        // 在移动设备上调整宽度
        if (isMobileDevice()) {
            resultContainer.style.minWidth = `${280 * sizeFactor}px`;
            resultContainer.style.maxWidth = '95vw';
        } else {
            resultContainer.style.minWidth = '320px';
            resultContainer.style.maxWidth = '90vw';
        }
        
        resultContainer.style.transition = 'all 0.5s ease-out';
        resultContainer.style.opacity = '0';
        resultContainer.style.transform = 'translate(-50%, -50%) scale(0.9)';
        
        // 根据得分设置边框和发光效果
        let borderColor, gradeText, gradeColor, gradientColors;
        if (score >= 90) {
            borderColor = 'rgba(0, 255, 150, 0.6)';
            gradeText = 'S';
            gradeColor = '#00ff96';
            gradientColors = ['rgba(0, 255, 150, 0.8)', 'rgba(0, 210, 255, 0.6)'];
        } else if (score >= 80) {
            borderColor = 'rgba(0, 220, 255, 0.6)';
            gradeText = 'A';
            gradeColor = '#00dfff';
            gradientColors = ['rgba(0, 220, 255, 0.8)', 'rgba(100, 180, 255, 0.6)'];
        } else if (score >= 70) {
            borderColor = 'rgba(100, 200, 255, 0.6)';
            gradeText = 'B';
            gradeColor = '#64c8ff';
            gradientColors = ['rgba(100, 200, 255, 0.8)', 'rgba(150, 150, 255, 0.6)'];
        } else if (score >= 60) {
            borderColor = 'rgba(255, 230, 0, 0.6)';
            gradeText = 'C';
            gradeColor = '#ffe600';
            gradientColors = ['rgba(255, 230, 0, 0.8)', 'rgba(255, 180, 0, 0.6)'];
        } else if (score >= 40) {
            borderColor = 'rgba(255, 50, 50, 0.6)';
            gradeText = 'D';
            gradeColor = '#ff3232';
            gradientColors = ['rgba(255, 50, 50, 0.8)', 'rgba(255, 0, 100, 0.6)'];
        } else {
            borderColor = 'rgba(180, 0, 0, 0.6)';
            gradeText = 'E';
            gradeColor = '#b00000';
            gradientColors = ['rgba(180, 0, 0, 0.8)', 'rgba(100, 0, 20, 0.6)'];
        }
        
        resultContainer.style.border = `1px solid ${borderColor}`;
        
        // 创建内部内容容器 - 根据屏幕大小调整尺寸
        const fontSizeTitle = Math.max(18, 24 * sizeFactor);
        const fontSizeGrade = Math.max(70, 100 * sizeFactor);
        const fontSizeScore = Math.max(26, 36 * sizeFactor);
        const fontSizeDetails = Math.max(12, 14 * sizeFactor);
        const fontSizeDetailsSmall = Math.max(10, 12 * sizeFactor);
        const marginBottom = Math.max(15, 30 * sizeFactor);
        const circleSize = Math.max(100, 140 * sizeFactor);
        const circleOuterSize = Math.max(120, 160 * sizeFactor);
        
        const contentHtml = `
            <div style="position: relative; overflow: hidden;">
                <!-- 标题 -->
                <div style="font-size: ${fontSizeTitle}px; margin-bottom: ${marginBottom}px; font-weight: 300; letter-spacing: 2px; text-transform: uppercase; position: relative;">
                    <span style="position: relative; z-index: 2;">性能评分</span>
                    <div style="position: absolute; height: 1px; width: 60%; bottom: -8px; left: 20%; background: linear-gradient(to right, transparent, ${borderColor}, transparent);"></div>
                </div>
                
                <!-- 装饰图形 -->
                <div style="position: absolute; width: ${150 * sizeFactor}px; height: ${150 * sizeFactor}px; border-radius: 50%; top: ${-30 * sizeFactor}px; right: ${-30 * sizeFactor}px; background: radial-gradient(circle at center, ${gradientColors[0]} 0%, transparent 70%); opacity: 0.15; pointer-events: none;"></div>
                <div style="position: absolute; width: ${100 * sizeFactor}px; height: ${100 * sizeFactor}px; border-radius: 50%; bottom: ${-20 * sizeFactor}px; left: ${-20 * sizeFactor}px; background: radial-gradient(circle at center, ${gradientColors[1]} 0%, transparent 70%); opacity: 0.1; pointer-events: none;"></div>
                
                <!-- 主评分 -->
                <div style="position: relative; display: flex; align-items: center; justify-content: center; margin: ${20 * sizeFactor}px 0 ${30 * sizeFactor}px;">
                    <div style="font-size: ${fontSizeGrade}px; font-weight: 700; text-align: center; position: relative; line-height: 1; color: ${gradeColor}; text-shadow: 0 0 15px ${gradeColor}4D;">${gradeText}</div>
                    <div style="position: absolute; width: ${circleSize}px; height: ${circleSize}px; border: 2px solid ${borderColor}; border-radius: 50%; opacity: 0.3;"></div>
                    <div style="position: absolute; width: ${circleOuterSize}px; height: ${circleOuterSize}px; border: 1px solid ${borderColor}; border-radius: 50%; opacity: 0.2;"></div>
                </div>
                
                <!-- 分数显示 -->
                <div style="font-size: ${fontSizeScore}px; font-weight: 300; margin: ${15 * sizeFactor}px 0 ${25 * sizeFactor}px; letter-spacing: 1px;">
                    ${score}<span style="font-size: ${fontSizeScore * 0.55}px; opacity: 0.7;">分</span>
                </div>
                
                <!-- 详细数据 -->
                <div style="background: rgba(0, 30, 60, 0.3); border-radius: 10px; padding: ${15 * sizeFactor}px; margin: 5px 0 ${20 * sizeFactor}px;">
                    <div style="margin: ${10 * sizeFactor}px 0; display: flex; justify-content: space-between; text-align: left; font-size: ${fontSizeDetails}px;">
                        <div style="opacity: 0.8;">平均帧率</div>
                        <div style="font-weight: 500;">${this.averageFPS.toFixed(1)} <span style="opacity: 0.7; font-size: ${fontSizeDetailsSmall}px;">FPS</span></div>
                    </div>
                    <div style="margin: ${10 * sizeFactor}px 0; display: flex; justify-content: space-between; text-align: left; font-size: ${fontSizeDetails}px;">
                        <div style="opacity: 0.8;">最低帧率</div>
                        <div style="font-weight: 500;">${this.minFPS} <span style="opacity: 0.7; font-size: ${fontSizeDetailsSmall}px;">FPS</span></div>
                    </div>
                    <div style="margin: ${10 * sizeFactor}px 0; display: flex; justify-content: space-between; text-align: left; font-size: ${fontSizeDetails}px;">
                        <div style="opacity: 0.8;">帧率稳定性</div>
                        <div style="font-weight: 500;">${this.stability.toFixed(1)}<span style="opacity: 0.7; font-size: ${fontSizeDetailsSmall}px;">%</span></div>
                    </div>
                    <div style="margin: ${10 * sizeFactor}px 0; display: flex; justify-content: space-between; text-align: left; font-size: ${fontSizeDetails}px; border-top: 1px solid rgba(100, 200, 255, 0.2); padding-top: ${10 * sizeFactor}px;">
                        <div style="opacity: 0.8;">完成时间</div>
                        <div style="font-weight: 500; display: flex; align-items: center;">
                            ${(this.totalTime/1000).toFixed(1)} <span style="opacity: 0.7; font-size: ${fontSizeDetailsSmall}px; margin-left: 2px;">秒</span>
                            <span style="margin-left: 8px; font-size: ${fontSizeDetailsSmall}px; padding: 2px 6px; border-radius: 4px; background: ${this.getTimeRatingColor()}; opacity: 0.9;">${this.getTimeRating()}</span>
                        </div>
                    </div>
                </div>
                
                <!-- 关闭按钮 -->
                <button id="closeResultBtn" style="margin-top: ${10 * sizeFactor}px; padding: ${10 * sizeFactor}px ${25 * sizeFactor}px; background: linear-gradient(to right, ${gradientColors[0]}, ${gradientColors[1]}); border: none; border-radius: 30px; color: #fff; cursor: pointer; font-weight: 500; letter-spacing: 1px; position: relative; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);">
                    <span style="position: relative; z-index: 2; font-size: ${Math.max(14, 16 * sizeFactor)}px;">关闭</span>
                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to right, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.2)); opacity: 0; transition: opacity 0.3s;" id="buttonHoverEffect"></div>
                </button>
            </div>
        `;
        
        resultContainer.innerHTML = contentHtml;
        document.body.appendChild(resultContainer);
        
        // 添加按钮悬停效果
        const buttonHoverEffect = document.getElementById('buttonHoverEffect');
        const closeButton = document.getElementById('closeResultBtn');
        
        closeButton.addEventListener('mouseenter', () => {
            if (buttonHoverEffect) buttonHoverEffect.style.opacity = '1';
        });
        
        closeButton.addEventListener('mouseleave', () => {
            if (buttonHoverEffect) buttonHoverEffect.style.opacity = '0';
        });
        
        // 添加关闭按钮事件
        closeButton.addEventListener('click', () => {
            resultContainer.style.opacity = '0';
            resultContainer.style.transform = 'translate(-50%, -50%) scale(0.9)';
            setTimeout(() => {
                if (document.body.contains(resultContainer)) {
                    resultContainer.remove();
                }
            }, 500);
        });
        
        // 添加触摸关闭事件（针对移动设备）
        if (isMobileDevice()) {
            resultContainer.addEventListener('click', (e) => {
                // 只有点击背景时才关闭，避免点击内容区域误触
                if (e.target === resultContainer) {
                    resultContainer.style.opacity = '0';
                    resultContainer.style.transform = 'translate(-50%, -50%) scale(0.9)';
                    setTimeout(() => {
                        if (document.body.contains(resultContainer)) {
                            resultContainer.remove();
                        }
                    }, 500);
                }
            });
        }
        
        // 淡入动画
        setTimeout(() => {
            resultContainer.style.opacity = '1';
            resultContainer.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 50);
        
        // 10秒后自动关闭
        setTimeout(() => {
            if (document.body.contains(resultContainer)) {
                resultContainer.style.opacity = '0';
                resultContainer.style.transform = 'translate(-50%, -50%) scale(0.9)';
                setTimeout(() => {
                    if (document.body.contains(resultContainer)) {
                        resultContainer.remove();
                    }
                }, 500);
            }
        }, 10000);
    }
};

// 动画循环
function animate() {
    // 在animate函数开始前添加代码，确保只执行一次
    if (!window.refreshButtonCreated) {
        createRefreshButton();
        window.refreshButtonCreated = true;
    }
    
    requestAnimationFrame(animate);
    
    // 更新帧率计数
    globalFrameCount++;
    const now = performance.now();
    const elapsed = now - globalFpsUpdateTime;
    
    // 每500ms更新一次FPS显示
    if(elapsed > 500) {
        currentFPS = Math.min(Math.round((globalFrameCount * 1000) / elapsed), performanceSettings.maxFPS);
        if(performanceSettings.showFPS && permanentFpsCounter) {
            // 添加max提示到FPS计数器
            permanentFpsCounter.textContent = `FPS: ${currentFPS} (${performanceSettings.displayFPSLimit} max)`;
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
    
    // 更新屏幕尺寸系数
    performanceSettings.screenSizeFactor = getScreenSizeFactor();
    
    // 根据屏幕尺寸调整UI元素
    updateUIForScreenSize();
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
    // 只有在全屏模式下才允许触发特效
    if (!isFullscreen()) {
        showFullscreenWarning();
        return;
    }
    
    createWormholeEffect();
}

// 设备性能检测
const isLowEndDevice = () => {
    if (window.navigator.hardwareConcurrency && window.navigator.hardwareConcurrency < 4) {
        return true;
    }
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// 检测是否为苹果电脑
const isMacOS = () => {
    return /Mac OS/i.test(navigator.userAgent) && !/iPhone|iPad|iPod/i.test(navigator.userAgent);
};

// 检测是否为移动设备
const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (window.innerWidth <= 768);
};

// 获取设备屏幕尺寸系数 (小屏幕设备返回较小的系数)
const getScreenSizeFactor = () => {
    const width = window.innerWidth;
    if (width <= 375) return 0.6;      // 特小屏幕 (iPhone SE等)
    else if (width <= 480) return 0.7;  // 小屏幕
    else if (width <= 768) return 0.8;  // 中屏幕平板或大手机
    else if (width <= 1024) return 0.9; // 大屏幕平板
    return 1.0;                         // 桌面设备
};

// 获取FPS显示限制：苹果电脑为60，手机设备和其他台式机为120
const getFpsLimit = () => {
    // 对于界面显示，苹果电脑显示60，其他所有设备(包括手机)显示120
    if (isMacOS()) {
        return 60;
    } else {
        return 120;
    }
};

// 用于实际性能限制：苹果电脑和移动设备为60，其他为120
const getActualFpsLimit = () => {
    if (isMacOS()) {
        return 60;
    } else if (isMobileDevice()) {
        return 60; // 移动设备实际限制为60fps
    } else {
        return 120;
    }
};

// 性能自适应设置
const performanceSettings = {
    particleCount: isLowEndDevice() ? 
        (isMobileDevice() ? 120 : 200) : 
        (isMobileDevice() ? 200 : 400),  // 移动设备进一步减少粒子数量
    backgroundParticleCount: isLowEndDevice() ? 
        (isMobileDevice() ? 40 : 80) : 
        (isMobileDevice() ? 100 : 180),  // 移动设备减少背景粒子
    skipFrames: isLowEndDevice() ? 
        (isMobileDevice() ? 3 : 2) : 
        (isMobileDevice() ? 2 : 1),      // 移动设备跳过更多帧
    trailEnabled: true, // 始终启用轨迹
    glowEnabled: !isMobileDevice() || !isLowEndDevice(), // 低端移动设备禁用发光效果
    trailLength: isLowEndDevice() ? 
        (isMobileDevice() ? 3 : 4) : 
        (isMobileDevice() ? 5 : 7),      // 减少轨迹长度
    backgroundDrawInterval: isLowEndDevice() ? 
        (isMobileDevice() ? 3 : 2) : 
        (isMobileDevice() ? 2 : 1),      // 减少背景粒子绘制频率
    useScreenComposite: true,  // 始终使用更亮的混合模式
    renderStep: isMobileDevice() ? 2 : 1, // 移动设备降低渲染密度
    showFPS: true,  // 显示帧率
    maxFPS: getActualFpsLimit(),   // 实际限制：苹果电脑和移动设备60fps，其他设备120fps
    displayFPSLimit: getFpsLimit(), // 显示限制：苹果电脑60，其他所有设备(包括手机)120
    particleSizeVariance: isMobileDevice() ? 0.6 : 0.8, // 移动设备减少粒子大小变化
    colorHarmony: true, // 启用颜色协调
    screenSizeFactor: getScreenSizeFactor() // 屏幕尺寸系数
};

// 在window.addEventListener('resize')添加以下代码
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // 更新屏幕尺寸系数
    performanceSettings.screenSizeFactor = getScreenSizeFactor();
    
    // 根据屏幕尺寸调整UI元素
    updateUIForScreenSize();
});

// 添加UI元素响应式调整函数
function updateUIForScreenSize() {
    const sizeFactor = performanceSettings.screenSizeFactor;
    
    // 调整FPS计数器位置和大小
    if (permanentFpsCounter) {
        permanentFpsCounter.style.fontSize = `${14 * sizeFactor}px`;
        permanentFpsCounter.style.padding = `${5 * sizeFactor}px ${10 * sizeFactor}px`;
        permanentFpsCounter.style.borderRadius = `${3 * sizeFactor}px`;
        
        // 在小屏幕上调整位置到左上角
        if (sizeFactor < 0.8) {
            permanentFpsCounter.style.right = 'auto';
            permanentFpsCounter.style.left = '10px';
        } else {
            permanentFpsCounter.style.right = '10px';
            permanentFpsCounter.style.left = 'auto';
        }
    }
    
    // 调整点击提示位置和大小
    if (clickToStartHint) {
        clickToStartHint.style.fontSize = `${13 * sizeFactor}px`;
        clickToStartHint.style.padding = `${5 * sizeFactor}px ${10 * sizeFactor}px`;
        clickToStartHint.style.borderRadius = `${3 * sizeFactor}px`;
        
        // 在小屏幕上调整位置到左上角下方
        if (sizeFactor < 0.8) {
            clickToStartHint.style.right = 'auto';
            clickToStartHint.style.left = '10px';
            clickToStartHint.style.top = '45px';
        } else {
            clickToStartHint.style.right = '10px';
            clickToStartHint.style.left = 'auto';
            clickToStartHint.style.top = '45px';
        }
    }
    
    // 为刷新按钮添加响应式调整
    const refreshBtn = document.getElementById('refresh-container');
    if (refreshBtn) {
        if (window.innerWidth < 768) {
            refreshBtn.style.bottom = '10px';
            refreshBtn.style.right = '10px';
        } else {
            refreshBtn.style.bottom = '20px';
            refreshBtn.style.right = '20px';
        }
    }
}

// 调用一次初始化UI
setTimeout(updateUIForScreenSize, 100);

// 修改创建虫洞效果函数
function createWormholeEffect() {
    // 启动帧率监控
    frameRateMonitor.start();
    
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // 获取屏幕大小系数
    const sizeFactor = performanceSettings.screenSizeFactor;
    
    // 创建虫洞容器 - 调整大小适应屏幕
    const wormhole = document.createElement('div');
    wormhole.className = 'wormhole';
    wormhole.style.position = 'fixed';
    wormhole.style.top = '50%';
    wormhole.style.left = '50%';
    wormhole.style.transform = 'translate(-50%, -50%)';
    // 根据屏幕大小调整虫洞尺寸
    const wormholeSize = 300 * sizeFactor;
    wormhole.style.width = `${wormholeSize}px`;
    wormhole.style.height = `${wormholeSize}px`;
    wormhole.style.borderRadius = '50%';
    // 使用更平滑的径向渐变
    wormhole.style.background = 'radial-gradient(circle, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.95) 30%, rgba(0,0,0,0.9) 40%, rgba(0,0,0,0.4) 60%, rgba(0,0,0,0) 75%)';
    wormhole.style.boxShadow = `0 0 ${80 * sizeFactor}px rgba(150,50,255,0.8), inset 0 0 ${30 * sizeFactor}px rgba(180,100,255,0.5)`; // 双重发光效果
    wormhole.style.zIndex = '1000';
    document.body.appendChild(wormhole);
    
    // 保存到全局变量
    currentWormhole = wormhole;

    // 获取设备像素比并自适应降低分辨率
    const devicePixelRatio = Math.min(window.devicePixelRatio, isMobileDevice() ? 1.5 : 2);
    
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
    
    // 保存到全局变量
    currentCanvas = canvas;
    
    const ctx = canvas.getContext('2d', { alpha: true });
    // 使用更好的混合模式提升视觉效果
    ctx.globalCompositeOperation = 'screen';
    
    // 设置更大的半径和粒子效果 - 根据屏幕大小调整
    let radius = 100 * sizeFactor;
    let ringThickness = 30 * sizeFactor; // 增加环厚度
    
    // 使用更协调的颜色组合
    const baseColors = [
        { r: 180, g: 50, b: 255 },   // 亮紫色
        { r: 210, g: 100, b: 255 },  // 淡紫色
        { r: 140, g: 0, b: 255 },    // 深紫色
        { r: 100, g: 180, b: 255 },  // 亮蓝色
        { r: 255, g: 100, b: 230 }   // 粉紫色
    ];
    
    // 生成协调的颜色变体
    const colors = [];
    for (let i = 0; i < baseColors.length; i++) {
        const base = baseColors[i];
        // 添加原始颜色
        colors.push(`rgba(${base.r}, ${base.g}, ${base.b}, 0.95)`);
        // 添加亮变体
        if (performanceSettings.colorHarmony) {
            colors.push(`rgba(${Math.min(base.r + 40, 255)}, ${Math.min(base.g + 40, 255)}, ${Math.min(base.b + 40, 255)}, 0.9)`);
            // 添加暗变体
            colors.push(`rgba(${Math.max(base.r - 40, 0)}, ${Math.max(base.g - 40, 0)}, ${Math.max(base.b - 40, 0)}, 0.95)`);
        }
    }
    
    // 预计算常量
    const TWO_PI = Math.PI * 2;
    const wormholeParticles = new Array(performanceSettings.particleCount);
    
    // 批量创建粒子以减少GC
    for (let i = 0; i < performanceSettings.particleCount; i++) {
        const angle = (i / performanceSettings.particleCount) * TWO_PI;
        // 使用协调的粒子大小分布
        const sizeVariance = performanceSettings.particleSizeVariance;
        const sizeBaseFactor = Math.random() < 0.7 ? 1 : (Math.random() < 0.5 ? 1.5 : 0.8); // 70%标准，15%大，15%小
        const size = (Math.random() * sizeVariance + 1.2) * sizeBaseFactor;
        
        // 多维度起点分布 - 实现从各个方向汇集
        let startX, startY;
        // 使用加权分布类型，更自然的分布
        let distributionWeights = [0.3, 0.25, 0.25, 0.2]; // 圆形，网格，螺旋，边框
        let weightSum = distributionWeights.reduce((a, b) => a + b, 0);
        let randomValue = Math.random() * weightSum;
        let distributionType = 0;
        let accumulatedWeight = 0;
        
        for (let j = 0; j < distributionWeights.length; j++) {
            accumulatedWeight += distributionWeights[j];
            if (randomValue <= accumulatedWeight) {
                distributionType = j;
                break;
            }
        }
        
        const edgeDistance = Math.max(window.innerWidth, window.innerHeight) * 0.8;
        
        // 为粒子分配不同的起始位置分布
        switch(distributionType) {
            case 0: // 圆形分布 - 从屏幕边缘
                const randomAngle = Math.random() * TWO_PI;
                // 使用更自然的距离分布
                const distVariance = Math.pow(Math.random(), 0.7) * 0.3 + 0.7; // 非线性分布，更多粒子聚集在远处
                startX = centerX + Math.cos(randomAngle) * edgeDistance * distVariance;
                startY = centerY + Math.sin(randomAngle) * edgeDistance * distVariance;
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
        
        // 较简单的目标位置计算，但使用不规则分布创造更自然的效果
        const ringVariance = Math.random() * 0.6 + 0.7; // 0.7-1.3倍的变化
        const targetRadius = (radius - ringThickness/2 + Math.random() * ringThickness) * ringVariance;
        const targetX = centerX + Math.cos(angle) * targetRadius;
        const targetY = centerY + Math.sin(angle) * targetRadius;

        // 计算出现延迟和运动路径
        // 使用更自然的延迟分布
        const delayFactor = Math.pow(Math.random(), 0.8); // 非线性分布
        const delay = delayFactor * 1500;
        
        // 使粒子路径更加多样化
        const pathVariance = Math.random();
        let pathComplexity = 0;
        if (pathVariance < 0.6) { // 60%简单路径
            pathComplexity = 0;
        } else if (pathVariance < 0.85) { // 25%中等复杂
            pathComplexity = 1;
        } else if (pathVariance < 0.95) { // 10%复杂
            pathComplexity = 2;
        } else { // 5%非常复杂
            pathComplexity = 3;
        }
        
        // 为复杂路径生成控制点
        const controlPoints = [];
        if (pathComplexity > 0) {
            for (let j = 0; j < pathComplexity; j++) {
                // 在起点和终点之间创建控制点，但偏移量更加多样化
                const ratio = (j + 1) / (pathComplexity + 1);
                // 使用对数分布创建更自然的弯曲
                const offsetRange = 250 - 150 * Math.log10(j+2);
                const offsetX = (Math.random() * offsetRange * 2 - offsetRange) * (1 - ratio * 0.5);
                const offsetY = (Math.random() * offsetRange * 2 - offsetRange) * (1 - ratio * 0.5);
                
                const cpX = startX + (targetX - startX) * ratio + offsetX;
                const cpY = startY + (targetY - startY) * ratio + offsetY;
                controlPoints.push({ x: cpX, y: cpY });
            }
        }
        
        // 为粒子分配动态的颜色索引
        const colorIndex = i % colors.length;
        
        wormholeParticles[i] = {
            angle: angle,
            radius: targetRadius,
            speed: Math.random() * 0.015 + 0.012, // 随机速度
            size: size,
            targetX: targetX,
            targetY: targetY,
            x: startX,
            y: startY,
            z: Math.random() * 0.3 - 0.15, // 增加深度变化
            color: colors[colorIndex],
            baseColor: colors[colorIndex], // 保存基础颜色
            trail: [],  // 所有粒子都有轨迹
            convergenceSpeed: 0.01 + Math.random() * 0.01, // 不同粒子不同速度
            startTime: performance.now() + delay,
            started: false,
            alpha: 0, // 开始时透明
            targetAlpha: 0.9 + Math.random() * 0.05, // 目标透明度略有变化
            baseSize: size, // 保存原始大小用于动画
            controlPoints: controlPoints, // 路径控制点
            pathProgress: 0, // 路径进度
            distributionType: distributionType, // 记录分布类型以便视觉差异
            pulseFactor: Math.random() * 0.5 + 0.75, // 每个粒子的脉动因子不同
            pulseSpeed: Math.random() * 0.5 + 0.75, // 每个粒子的脉动速度不同
            lifespan: Math.random() * 0.4 + 0.8 // 粒子寿命因子(0.8-1.2)，用于爆炸阶段
        };
    }
    
    // 添加背景粒子，更协调的分布
    const backgroundParticles = new Array(performanceSettings.backgroundParticleCount);
    
    for (let i = 0; i < performanceSettings.backgroundParticleCount; i++) {
        // 创建更加均匀分布的背景粒子
        let angle, distance;
        if (i % 3 === 0) { // 33%集中在中心区域
            angle = Math.random() * TWO_PI;
            distance = Math.random() * window.innerWidth * 0.25;
        } else if (i % 3 === 1) { // 33%分布在中间区域
            angle = Math.random() * TWO_PI;
            distance = window.innerWidth * 0.25 + Math.random() * window.innerWidth * 0.15;
        } else { // 33%分布在外围
            angle = Math.random() * TWO_PI;
            distance = window.innerWidth * 0.4 + Math.random() * window.innerWidth * 0.1;
        }
        
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        // 使用对数分布创建更和谐的大小变化
        const sizeVariance = Math.log(Math.random() * 8 + 2) / Math.log(10);
        const size = sizeVariance * 0.5 + 0.3;
        
        // 使用协调的颜色
        const colorIndex = i % colors.length;
        
        backgroundParticles[i] = {
            x: x,
            y: y,
            size: size * 1.5, // 增大背景粒子
            color: colors[colorIndex],
            alpha: Math.random() * 0.4 + 0.25, // 大幅增加不透明度
            speed: Math.random() * 0.15 + 0.05, // 增加速度
            angle: Math.random() * TWO_PI, // 随机角度
            distance: distance, // 记录距离用于脉动效果
            pulse: Math.random() * 0.3 + 0.85 // 脉动系数
        };
    }
    
    // 优化的动画函数
    let formationComplete = false;
    let rotationSpeed = 0.008; // 初始旋转速度
    let maxRotationSpeed = 0.15; // 最大旋转速度
    let currentRotation = 0;
    let shrinkStarted = false;
    let explosionStarted = false;
    let lastTime = performance.now();
    let accelerationStartTime = 0;
    let accelerationFactor = 0.015; // 降低加速因子，使旋转加速更缓慢
    let rotationPhase = 0; // 旋转阶段，用于控制旋转节奏
    const rotationTimings = {
        initialDuration: 5, // 初始旋转阶段持续时间(秒)，增加1秒
        accelerationDuration: 6, // 加速阶段持续时间(秒)
        pulsingDuration: 6, // 脉动阶段持续时间(秒)，增加1秒
        finalDuration: 3 // 最终加速阶段持续时间(秒)
    };
    const totalRotationDuration = rotationTimings.initialDuration + rotationTimings.accelerationDuration + 
                                  rotationTimings.pulsingDuration + rotationTimings.finalDuration;

    // 脉动效果参数
    let pulseIntensity = 0; // 脉动强度
    let pulseFrequency = 0.5; // 脉动频率
    let sizeMultiplier = 1; // 整体大小倍数

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
            // 旋转阶段 - 增强粒子大小脉动效果
            p.angle += (p.speed * rotationSpeed * 12) * deltaTime;
            
            // 根据当前旋转阶段调整粒子大小
            let timeSinceFormation = (currentTime - accelerationStartTime) / 1000;
            let sizePulse = 1;
            
            if (timeSinceFormation > rotationTimings.initialDuration + rotationTimings.accelerationDuration) {
                // 脉动阶段 - 粒子大小随时间变化更明显
                const pulseTime = timeSinceFormation - (rotationTimings.initialDuration + rotationTimings.accelerationDuration);
                const pulsePhase = Math.min(pulseTime / rotationTimings.pulsingDuration, 1); // 0到1
                
                // 增加脉动频率和强度
                pulseFrequency = 0.5 + pulsePhase * 1.5; // 0.5到2
                pulseIntensity = 0.2 + pulsePhase * 0.5; // 0.2到0.7
                
                // 计算当前脉动值
                sizePulse = 1 + Math.sin(currentTime / (1000 / pulseFrequency) + p.pulseFactor * 10) * pulseIntensity;
                
                // 根据旋转速度整体增大粒子
                sizeMultiplier = 1 + (rotationSpeed / maxRotationSpeed) * 1.5;
            } else {
                // 初始和加速阶段 - 随旋转速度增加而轻微脉动
                sizePulse = Math.sin(currentTime / 200) * 0.2 + 1;
                sizeMultiplier = 1 + (rotationSpeed / maxRotationSpeed) * 0.5;
            }
            
            // 应用最终大小
            p.size = p.baseSize * sizePulse * sizeMultiplier;
            
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
        
        // 记录当前帧率
        frameRateMonitor.record(currentFPS);
        
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
                
                // 停止帧率监控并显示结果
                frameRateMonitor.stop();
                
                return;
            }
        }
        
        // 绘制背景粒子，大幅减少绘制频率
        const bgDrawInterval = performanceSettings.backgroundDrawInterval;
        
        for (let i = 0; i < backgroundParticles.length; i += bgDrawInterval) {
            const p = backgroundParticles[i];
            
            // 简化的移动逻辑，但添加更自然的移动模式
            if (formationComplete && !explosionStarted) {
                const dx = centerX - p.x;
                const dy = centerY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // 添加缓慢的螺旋/脉动效果
                const spiralFactor = 0.05;
                p.angle += 0.002 * deltaTime * (1.5 - dist / (window.innerWidth * 0.5));
                
                // 使用更自然的吸引和排斥力
                if (dist > 60) { // 外围粒子向内移动
                    // 使用非线性吸引力
                    const attractFactor = Math.min(1, 150 / dist) * p.speed * deltaTime;
                    p.x += (dx / dist) * attractFactor;
                    p.y += (dy / dist) * attractFactor;
                    
                    // 添加轻微的切向运动形成漩涡
                    p.x += Math.cos(p.angle) * spiralFactor * deltaTime;
                    p.y += Math.sin(p.angle) * spiralFactor * deltaTime;
                } else if (dist < 40) { // 靠近中心的粒子稍微排斥
                    p.x -= (dx / dist) * p.speed * 0.2 * deltaTime;
                    p.y -= (dy / dist) * p.speed * 0.2 * deltaTime;
                }
                
                // 添加呼吸/脉动效果，使用全局脉动参数
                const timeSinceFormation = (currentTime - accelerationStartTime) / 1000;
                if (timeSinceFormation > rotationTimings.initialDuration + rotationTimings.accelerationDuration) {
                    // 同步脉动
                    const pulsingFactor = 1 + Math.sin(currentTime / (1000 / pulseFrequency) + p.pulse * 5) * pulseIntensity * 0.5;
                    p.size = (Math.sin(currentTime / 1000 * p.pulse) * 0.2 + 1) * p.pulse * 1.5 * pulsingFactor;
                } else {
                    // 正常呼吸效果
                    p.size = (Math.sin(currentTime / 1000 * p.pulse) * 0.2 + 1) * p.pulse * 1.5;
                }
                
                p.alpha = (Math.sin(currentTime / 1200 * p.pulse) * 0.1 + 0.9) * (p.alpha);
            } else if (explosionStarted) {
                // 增强的爆炸效果
                const dx = p.x - centerX;
                const dy = p.y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // 使用动态的爆炸因子
                let explosionPushFactor;
                
                if (explosionProgress < 0.3) {
                    // 初始阶段 - 粒子稍微向内聚集
                    explosionPushFactor = -0.1 * deltaTime;
                    p.size *= (1 + 0.05 * deltaTime);
                    p.alpha *= (1 + 0.05 * deltaTime);
                } else {
                    // 爆发阶段 - 粒子向外散开
                    const progress = (explosionProgress - 0.3) / 0.7; // 0-1
                    const factor = Math.min(0.5, progress * 0.5);
                    explosionPushFactor = factor * 5 * deltaTime;
                    
                    // 产生闪烁效果
                    if (Math.random() < explosionProgress * 0.1) {
                        p.alpha = Math.min(1, p.alpha * 1.5);
                    } else {
                        p.alpha *= (1 - 0.02 * deltaTime * explosionProgress);
                    }
                }
                
                if (dist < shockwaveRadius * 1.2) {
                    p.x += (dx / Math.max(dist, 1)) * explosionPushFactor * (shockwaveRadius / Math.max(dist, 1));
                    p.y += (dy / Math.max(dist, 1)) * explosionPushFactor * (shockwaveRadius / Math.max(dist, 1));
                }
            }
            
            // 改进的粒子绘制，添加发光效果
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, TWO_PI);
            
            // 提取颜色部分并插入新的透明度
            let color = p.color;
            if (typeof color === 'string') {
                const alphaIndex = color.lastIndexOf(',') + 1;
                if (alphaIndex > 0) {
                    const colorBase = color.substring(0, alphaIndex);
                    ctx.fillStyle = `${colorBase}${p.alpha})`;
                } else {
                    ctx.fillStyle = color;
                }
            } else {
                ctx.fillStyle = `rgba(150, 100, 255, ${p.alpha})`;
            }
            
            ctx.fill();
            
            // 为部分大的粒子添加发光效果
            if (p.size > 1 && performanceSettings.glowEnabled) {
                ctx.shadowBlur = p.size * 3;
                ctx.shadowColor = ctx.fillStyle;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
        
        // 绘制闪光效果
        if (isFlashing) {
            // 使用多层径向渐变创建更复杂的闪光效果
            const flashGradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, canvas.width / 2
            );
            
            // 使用更和谐的颜色过渡
            flashGradient.addColorStop(0, `rgba(255, 255, 255, ${flashOpacity * 1.2})`);
            flashGradient.addColorStop(0.1, `rgba(230, 200, 255, ${flashOpacity * 1.1})`);
            flashGradient.addColorStop(0.2, `rgba(200, 150, 255, ${flashOpacity})`);
            flashGradient.addColorStop(0.4, `rgba(180, 70, 255, ${flashOpacity * 0.8})`);
            flashGradient.addColorStop(0.7, `rgba(120, 40, 180, ${flashOpacity * 0.4})`);
            flashGradient.addColorStop(1, `rgba(80, 0, 120, 0)`);
            
            ctx.fillStyle = flashGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // 使用非线性衰减使闪光效果更自然
            const decayFactor = 0.02 * deltaTime * (1 + flashOpacity * 0.5);
            flashOpacity -= decayFactor;
        }
        
        // 增强的冲击波
        if (explosionStarted && shockwaveRadius > 0) {
            const intensity = (1 - explosionProgress) * shockwaveIntensity;
            ctx.globalAlpha = intensity;
            
            // 创建多层冲击波，使用比例因子创建更自然的分布
            const waveCount = 4;
            for (let i = 0; i < waveCount; i++) {
                const ratio = 1 - (i / waveCount * 0.6); // 0.4-1.0
                const waveOpacity = (1 - (i / waveCount) * 0.3) * 0.9; // 0.7-0.9
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, shockwaveRadius * ratio, 0, TWO_PI);
                
                // 使用比例来调整颜色
                let strokeColor;
                if (i === 0) {
                    strokeColor = `rgba(200, 120, 255, ${waveOpacity})`;
                    ctx.lineWidth = 25 * (1 - explosionProgress);
                } else if (i === 1) {
                    strokeColor = `rgba(160, 80, 255, ${waveOpacity * 0.95})`;
                    ctx.lineWidth = 18 * (1 - explosionProgress) * 0.9; 
                } else if (i === 2) {
                    strokeColor = `rgba(255, 180, 255, ${waveOpacity * 0.9})`;
                    ctx.lineWidth = 12 * (1 - explosionProgress) * 0.8;
                } else {
                    strokeColor = `rgba(255, 255, 255, ${waveOpacity * 0.85})`;
                    ctx.lineWidth = 8 * (1 - explosionProgress) * 0.7;
                }
                
                ctx.strokeStyle = strokeColor;
                ctx.stroke();
            }
            
            ctx.globalAlpha = 1;
            
            // 更新冲击波半径，使用非线性扩散以创建更自然的效果
            const propagationFactor = 500 * deltaTime * (1 - explosionProgress * 0.3);
            shockwaveRadius += propagationFactor * (1 + explosionProgress * 0.2); // 加速扩散
            
            // 添加更丰富的爆炸粒子效果
            if (explosionProgress < 0.6 && frameCounter % 2 === 0) {
                // 根据爆炸进度调整粒子数量
                const particleMultiplier = explosionProgress < 0.3 ? 1 : (1 - (explosionProgress - 0.3) / 0.3);
                const particleCount = Math.floor(5 * particleMultiplier);
                
                for (let i = 0; i < particleCount; i++) {
                    const angle = Math.random() * TWO_PI;
                    // 创建集中在冲击波前沿的粒子
                    const distanceFactor = Math.random() * 0.2 + 0.9; // 0.9-1.1
                    const distance = shockwaveRadius * distanceFactor;
                    const x = centerX + Math.cos(angle) * distance;
                    const y = centerY + Math.sin(angle) * distance;
                    
                    // 对数分布的粒子大小
                    const sizeBase = Math.log(Math.random() * 10 + 2) / Math.log(10) * 6;
                    const size = sizeBase * (1 - explosionProgress * 0.5);
                    
                    // 绘制圆形粒子
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, TWO_PI);
                    
                    // 使用协调的颜色分布
                    let particleColor;
                    const colorChoice = Math.random();
                    
                    if (colorChoice < 0.3) { // 30% 白色
                        particleColor = `rgba(255, 255, 255, ${0.9 * (1 - explosionProgress * 1.5)})`;
                    } else if (colorChoice < 0.6) { // 30% 紫色
                        particleColor = `rgba(180, 100, 255, ${0.85 * (1 - explosionProgress * 1.5)})`;
                    } else if (colorChoice < 0.85) { // 25% 蓝色
                        particleColor = `rgba(100, 200, 255, ${0.8 * (1 - explosionProgress * 1.5)})`;
                    } else { // 15% 亮紫色
                        particleColor = `rgba(220, 120, 255, ${0.9 * (1 - explosionProgress * 1.5)})`;
                    }
                    
                    ctx.fillStyle = particleColor;
                    ctx.fill();
                    
                    // 增强的发光效果
                    if (Math.random() > 0.3) { // 70%的粒子有发光效果
                        const glowSize = Math.random() * 2 + 2;
                        ctx.shadowBlur = size * glowSize;
                        ctx.shadowColor = particleColor;
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    }
                }
            }
        }
        
        if (formationComplete && !explosionStarted) {
            // 加速旋转，但使用更复杂的节奏控制
            const timeSinceFormation = (currentTime - accelerationStartTime) / 1000;
            
            if (timeSinceFormation <= rotationTimings.initialDuration) {
                // 阶段1: 初始旋转 - 保持缓慢匀速旋转
                rotationSpeed = 0.008 + (timeSinceFormation / rotationTimings.initialDuration) * 0.012; // 从0.008缓慢增加到0.02
                rotationPhase = 0;
            } 
            else if (timeSinceFormation <= rotationTimings.initialDuration + rotationTimings.accelerationDuration) {
                // 阶段2: 加速旋转
                const accelerationTime = timeSinceFormation - rotationTimings.initialDuration;
                const accelerationProgress = accelerationTime / rotationTimings.accelerationDuration;
                rotationSpeed = 0.02 + (Math.pow(accelerationProgress, 1.5) * 0.06); // 非线性加速到0.08
                rotationPhase = 1;
            }
            else if (timeSinceFormation <= rotationTimings.initialDuration + rotationTimings.accelerationDuration + rotationTimings.pulsingDuration) {
                // 阶段3: 脉动阶段 - 旋转速度忽快忽慢
                const pulseTime = timeSinceFormation - (rotationTimings.initialDuration + rotationTimings.accelerationDuration);
                const pulseProgress = pulseTime / rotationTimings.pulsingDuration;
                
                // 脉动基础值 (0.08 ~ 0.13)
                const basePulseRotation = 0.08 + pulseProgress * 0.05;
                
                // 添加正弦波变化，使旋转速度忽快忽慢
                const pulseFactor = Math.sin(pulseTime * 1.5) * 0.03; // 正弦波振幅随时间增加
                
                rotationSpeed = basePulseRotation + pulseFactor;
                rotationPhase = 2;
            }
            else if (timeSinceFormation <= totalRotationDuration) {
                // 阶段4: 最终加速 - 快速达到最大速度
                const finalTime = timeSinceFormation - (rotationTimings.initialDuration + rotationTimings.accelerationDuration + rotationTimings.pulsingDuration);
                const finalProgress = finalTime / rotationTimings.finalDuration;
                
                // 指数函数加速到最大速度
                rotationSpeed = 0.13 + (Math.pow(finalProgress, 2) * (maxRotationSpeed - 0.13));
                rotationPhase = 3;
            }
            else {
                // 最终阶段，触发爆炸效果
                rotationSpeed = maxRotationSpeed;
                
                if (!shrinkStarted) {
                    shrinkStarted = true;
                    
                    // 闪光效果
                    flashOpacity = 0.7;
                    isFlashing = true;
                    
                    // 准备爆发
                    setTimeout(() => {
                        explosionStarted = true;
                        explosionTime = performance.now();
                        
                        // 闪光
                        flashOpacity = 1.0;
                        isFlashing = true;
                        
                        // 初始化冲击波
                        shockwaveRadius = radius;
                        
                        // 相机动画
                        animateCamera();
                    }, 200);
                }
            }
            
            // 同步地球旋转速度，随着虫洞旋转加速而加速
            const earthSpeedFactor = Math.min(1 + timeSinceFormation * 0.5, 6); // 最多加速到6倍
            earthCurrentRotationSpeed = earthBaseRotationSpeed * earthSpeedFactor;
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
        // 使用当前相机位置而不是重新定义startZ和startY
        const cameraStartZ = camera.position.z;
        const cameraStartY = camera.position.y;
        const targetZ = 0.05;
        const targetY = cameraStartY - 1.5;
        
        controls.enabled = false;
        cameraAnimationCompleted = false;
        
        let lastProgress = 0;
        
        function updateCamera() {
            const currentTime = performance.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            if (progress - lastProgress > 0.01 || progress === 1) {
                lastProgress = progress;
                
                const easeProgress = easeOutExpo(progress);
                const easeInProgress = easeInExpo(progress);
                
                camera.position.z = cameraStartZ * (1 - easeProgress) + targetZ * easeProgress;
                camera.position.y = cameraStartY * (1 - easeProgress) + targetY * easeProgress;
                
                const scale = 1 + (easeProgress * easeProgress * 3);
                earth.scale.set(scale, scale, scale);
                
                earth.material.opacity = Math.max(0.2, 1 - easeProgress * 0.8);
                
                earthCurrentRotationSpeed = earthBaseRotationSpeed * (1 + easeInProgress * 8);
            }
            
            if (progress < 1) {
                requestAnimationFrame(updateCamera);
            } else {
                cameraAnimationCompleted = true;
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
        console.log("重置视图到初始状态");
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
        
        // 响应式调整大小
        const sizeFactor = performanceSettings.screenSizeFactor;
        hint.style.padding = `${12 * sizeFactor}px ${25 * sizeFactor}px`;
        hint.style.borderRadius = `${5 * sizeFactor}px`;
        hint.style.fontFamily = 'Arial, sans-serif';
        hint.style.fontSize = `${16 * sizeFactor}px`;
        hint.style.fontWeight = 'bold';
        hint.style.boxShadow = `0 0 ${15 * sizeFactor}px rgba(0, 255, 255, 0.5)`;
        hint.style.zIndex = '2000';
        hint.style.pointerEvents = 'none';
        hint.style.opacity = '0';
        hint.style.transition = 'opacity 0.5s';
        
        // 根据设备类型显示不同的提示文本
        if (isMobileDevice()) {
            hint.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center;">
                    <span style="margin-right: 10px;">点击地球返回</span>
                    <svg width="${20 * sizeFactor}" height="${20 * sizeFactor}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 12h18M3 6h18M3 18h18"></path>
                    </svg>
                </div>
            `;
            // 在移动设备上，提示应可点击
            hint.style.pointerEvents = 'auto';
            hint.style.cursor = 'pointer';
            
            // 点击提示可以返回
            hint.addEventListener('click', () => {
                resetView();
                cameraAnimationCompleted = false;
            });
        } else {
            hint.textContent = '按ESC键返回';
        }
        
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

// 确保在DOM加载完成后创建按钮
document.addEventListener('DOMContentLoaded', function() {
    if (!window.refreshButtonCreated) {
        createRefreshButton();
        window.refreshButtonCreated = true;
    }
}); 