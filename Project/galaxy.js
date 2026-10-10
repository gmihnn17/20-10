/**
 * ===================================================================
 * OUR LITTLE HOUSE — 11A2: GALAXY 3D ENGINE (Three.js)
 * Tối ưu hóa hiệu năng 60 FPS cho cả iPhone Safari & Samsung Chrome
 * Nâng cấp đặc sắc:
 *  - Cấu trúc Ngân hà chuẩn 100% TAT Coder:
 *      + Quả Cầu Tinh Vân (Nebula Sphere) ở tâm R ~ 65 - 82 (13.500 hạt sao tím/hồng/trắng phát quang đan đặc)
 *      + Vành Đai Ngân Hà (Saturn-like Accretion Ring) mỏng sắc nét nghiêng ~27° cắt chéo (14.500 hạt)
 *      + Bụi sao không gian sâu thẳm #060714 (2.000 hạt sao xa)
 *      + Tổng mật độ 30.000 hạt sao Float32Array, kích thước size 0.85 siêu mịn kim tuyến, không vỡ nhòe
 *  - XÓA BỎ HOÀN TOÀN khối trái tim 3D khỏi cảnh Ngân hà / Vũ trụ (Ngân hà là Ngân hà!)
 *  - Lời chúc 3D trôi trong vũ trụ chuẩn Dr.Gifter Falling Text 3D:
 *      + Chữ phát sáng 3D đa sắc (vàng kim, hồng neon, trắng tuyết) trôi bồng bềnh êm ái
 *      + Kèm icon và ngôi sao li ti (⭐, 💖, 🌷, 🌸, 🎁)
 *      + 100% trong suốt, TUYỆT ĐỐI KHÔNG CÓ HỘP ĐEN 2D hay khung viền ảnh chữ nhật che màn hình
 *  - Đại cảnh Ending: Cú máy Zoom Out ngắm trọn dải ngân hà, 25 đèn trời, chòm sao Trái Tim ⇄ 20/10, Pháo hoa 3D
 * ===================================================================
 */

const GalaxyEngine = (function () {
  'use strict';

  // --- Biến trạng thái & Core Three.js ---
  let scene, camera, renderer;
  let canvasEl;
  let animationFrameId = null;
  let isEngineRunning = false;

  // Trạng thái hiển thị cảnh: 'LOGIN', 'INTRO', 'ROOM', 'ENDING'
  let currentStage = 'LOGIN';

  // Ánh sáng động
  let ambientLight, pointLightPink, pointLightCyan;

  // 1. Hệ thống hạt ngân hà & Tinh vân bụi kim tuyến TAT Coder
  let galaxyParticles, galaxyGeo, galaxyMat;
  const PARTICLE_COUNT = 30000;
  let particleBasePositions = new Float32Array(PARTICLE_COUNT * 3);
  let particleBaseColors = new Float32Array(PARTICLE_COUNT * 3);
  let particleTargetPositions = new Float32Array(PARTICLE_COUNT * 3);
  let particleCurrentPositions = new Float32Array(PARTICLE_COUNT * 3);
  let isMorphing = false;
  let morphProgress = 0;

  // Dữ liệu xoáy 360° Đĩa Ngân Hà (15.000 hạt) & Nhấp nháy Bụi Sao Trái Tim 3D (15.000 hạt)
  let pedestalUntiltedX = new Float32Array(15000);
  let pedestalUntiltedY = new Float32Array(15000);
  let pedestalUntiltedZ = new Float32Array(15000);
  let pedestalVortexSpeed = new Float32Array(15000);
  let vortexRotation = 0;
  let heartTwinklePhases = new Float32Array(15000);
  let heartTwinkleFreqs = new Float32Array(15000);
  let cinematicDimPlane = null;

  // Bầu trời sao sâu thẳm lung linh (Deep Space Stars)
  let deepSpaceStars = null;

  // Dải lụa hạt sao (Cosmic Wind) & Sao băng vạch sáng rực rỡ (Meteors)
  let cosmicWindGroup = null;
  let cosmicWindParticles = null;
  let cosmicWindPositions = null;
  let cosmicWindVelocities = [];
  let meteors = [];

  // Cánh hoa lơ lửng trong gió ngân hà (Cosmic Petals)
  let cosmicPetalsMesh = null;
  let cosmicPetalPositions = null;
  let cosmicPetalVelocities = [];

  // 2. Căn phòng 3D cá nhân (Màn 4)
  let roomGroup;
  let orbitCardGroup;
  let orbitingCards = [];
  const ORBIT_RADIUS_X = 54;
  const ORBIT_RADIUS_Z = 38;
  let orbitAngle = 0;
  let raycaster, mouseVector;
  let cardSelectCallback = null;

  // Biến điều khiển Cinematic 3D Zoom cho ảnh kỷ niệm (bay 0.6s sát mắt người xem)
  let activeZoomedCard = null;
  let isCardZooming = false;
  let isZoomReturning = false;
  let zoomAnimStartTime = 0;
  const ZOOM_DURATION = 600; // 0.6s
  let zoomStartPos = new THREE.Vector3();
  let zoomTargetPos = new THREE.Vector3();
  let zoomStartScale = new THREE.Vector3(1, 1, 1);
  let zoomTargetScale = new THREE.Vector3(2.5, 2.5, 1);

  // 3. Hệ thống Lời Chúc 3D Bay Bồng Bềnh (Dr.Gifter Falling/Floating Text 3D)
  let floatingWishGroup;
  let floatingWishItems = [];
  let floatingSparkleMesh = null;
  let wishDataList = [];
  let wishTextureList = [];
  let nextWishIndex = 0;

  // 4. Đại cảnh Ending (Màn 5 & 6)
  let endingGroup;
  let skyLanterns = [];
  let fireworkBursts = [];
  let microShakeCallback = null;

  // Hệ thống chòm sao 25 vì sao (Trái Tim ⇄ 20/10)
  let constellationStarsMesh = null;
  let constellationHeartPositions = new Float32Array(25 * 3);
  let constellationDatePositions = new Float32Array(25 * 3);
  let constellationCurrentPositions = new Float32Array(25 * 3);
  let constellationTargetPositions = new Float32Array(25 * 3);
  let constellationMode = 'HEART';
  let heartLinesMesh = null;
  let dateLinesMesh = null;
  let constellationMorphTimer = null;
  let heartIndices = [];
  let dateIndices = [];

  // 5. Hệ thống Lời Chúc 3D Bay Bồng Bềnh Đại Cảnh Ending (Màn 5 & 6)
  let endingFloatingWishGroup = null;
  let endingFloatingWishes = [];

  // 6. Bộ điều khiển xoay & ngắm nhìn đa chiều Orbital Drag Controller
  let isPointerDragging = false;
  let dragLastX = 0, dragLastY = 0;
  let dragAccumDist = 0;
  let curTheta = 0, targetTheta = 0;
  let curPhi = Math.PI / 2 - 0.28, targetPhi = Math.PI / 2 - 0.28;
  let curRadius = 520, targetRadius = 520;
  let centerLookAt = new THREE.Vector3(0, 0, 0);
  let targetCenterLookAt = new THREE.Vector3(0, 0, 0);
  let pinchStartDistance = 0;
  let radiusOnPinchStart = 520;
  let isPinchingOnCanvas = false;

  // Quản lý timer Intro chống rò rỉ khi skip
  let introTimeouts = [];
  let currentCameraTweenId = 0;
  let isCameraTweening = false;
  let mouseParallaxX = 0, mouseParallaxY = 0;
  let targetParallaxX = 0, targetParallaxY = 0;

  function cancelCameraTween() {
    currentCameraTweenId++;
    isCameraTweening = false;
  }

  // Dữ liệu bạn nữ đang chọn
  let currentGirlData = null;
  let allGirlsList = [];

  // ===================================================================
  // TẠO TEXTURE HẠT SAO KIM TUYẾN PHÁT QUANG RỰC RỠ (TAT CODER STYLE)
  // RadialGradient phủ đầy canvas (bán kính 31px trên khung 64x64):
  // Tâm trắng sáng rực rỡ ra viền hồng neon / tím hoàng gia / cyan với độ trong suốt mềm mại.
  // ===================================================================
  function createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    if (typeof ctx.clearRect === 'function') {
      ctx.clearRect(0, 0, 64, 64);
    }

    if (typeof ctx.createRadialGradient === 'function') {
      // 1. Quầng sáng phát quang phủ đầy canvas (bán kính 0 đến 31px)
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 31);
      grad.addColorStop(0.00, 'rgba(255, 255, 255, 1.00)');
      grad.addColorStop(0.18, 'rgba(255, 255, 255, 0.98)');
      grad.addColorStop(0.42, 'rgba(255, 175, 245, 0.85)');
      grad.addColorStop(0.68, 'rgba(175, 85, 255, 0.48)');
      grad.addColorStop(0.88, 'rgba(0, 240, 255, 0.18)');
      grad.addColorStop(1.00, 'rgba(0, 0, 0, 0.00)');

      ctx.fillStyle = grad;
      if (typeof ctx.beginPath === 'function' && typeof ctx.arc === 'function' && typeof ctx.fill === 'function') {
        ctx.beginPath();
        ctx.arc(32, 32, 31, 0, Math.PI * 2);
        ctx.fill();
      } else if (typeof ctx.fillRect === 'function') {
        ctx.fillRect(0, 0, 64, 64);
      }
    }

    // 2. Tia sáng kim cương anamorphic mượt mà (chống răng cưa nét cứng)
    if (typeof ctx.createLinearGradient === 'function' && typeof ctx.fillRect === 'function') {
      // Tia ngang
      const hGrad = ctx.createLinearGradient(4, 32, 60, 32);
      hGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
      hGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.85)');
      hGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
      ctx.fillStyle = hGrad;
      ctx.fillRect(4, 31, 56, 2);

      // Tia dọc
      const vGrad = ctx.createLinearGradient(32, 4, 32, 60);
      vGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
      vGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.85)');
      vGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
      ctx.fillStyle = vGrad;
      ctx.fillRect(31, 4, 2, 56);
    }

    const TextureClass = THREE.CanvasTexture || THREE.Texture;
    const texture = new TextureClass(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }

  // Khởi tạo Engine Three.js
  function init(canvasId, options = {}) {
    canvasEl = document.getElementById(canvasId);
    if (!canvasEl) {
      console.error('Không tìm thấy canvas:', canvasId);
      return false;
    }

    cardSelectCallback = options.onCardSelect || null;
    microShakeCallback = options.onMicroShake || null;

    // 1. Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060714, 0.0006);

    // 2. Camera (Góc nhìn toàn cảnh bao quát dải ngân hà)
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 3200);
    camera.position.set(0, 180, 520);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({
      canvas: canvasEl,
      antialias: window.devicePixelRatio < 2,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x060714, 1);

    // 4. Ánh sáng
    ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    scene.add(ambientLight);

    pointLightPink = new THREE.PointLight(0xff9ebb, 2.8, 480);
    pointLightPink.position.set(0, 38, 20);
    scene.add(pointLightPink);

    pointLightCyan = new THREE.PointLight(0xffeaa7, 2.0, 450);
    pointLightCyan.position.set(80, 50, -40);
    scene.add(pointLightCyan);

    // 5. Khởi tạo Raycaster & Mouse
    raycaster = new THREE.Raycaster();
    mouseVector = new THREE.Vector2();

    // 6. Xây dựng các phân hệ Three.js
    buildDeepSpaceStars();
    buildCosmicWindAndMeteors();
    buildGalaxyParticles();
    buildPersonalRoom();
    buildEndingScene();

    // Thiết lập trạng thái hiển thị ban đầu sạch sẽ (LOGIN)
    applySceneStage('LOGIN');

    // 7. Sự kiện Resize & Touch/Click
    window.addEventListener('resize', onWindowResize, false);
    setupInteractionEvents();

    // 8. Start Animation Loop
    isEngineRunning = true;
    animate();

    return true;
  }

  // ===================================================================
  // 1A. BẦU TRỜI SAO SÂU THẲM LUNG LINH (DEEP SPACE TWINKLING STARS)
  // Hiển thị xuyên suốt cả ở Màn 1 (Login) tạo chiều sâu vũ trụ vô tận
  // ===================================================================
  function buildDeepSpaceStars() {
    const STAR_COUNT = 2500;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(STAR_COUNT * 3);
    const starColors = new Float32Array(STAR_COUNT * 3);

    for (let i = 0; i < STAR_COUNT; i++) {
      const dist = 700 + Math.random() * 950;
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);

      starPos[i * 3] = dist * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = dist * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = dist * Math.cos(phi);

      if (i % 3 === 0) {
        starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.918; starColors[i * 3 + 2] = 0.655; // Vàng Champagne #ffeaa7
      } else if (i % 3 === 1) {
        starColors[i * 3] = 0.65; starColors[i * 3 + 1] = 0.82; starColors[i * 3 + 2] = 1.0;   // Xanh băng lam ngọc
      } else {
        starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.98; starColors[i * 3 + 2] = 1.0;   // Trắng tuyết Snow White
      }
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 2.2,
      map: createParticleTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    deepSpaceStars = new THREE.Points(starGeo, starMat);
    scene.add(deepSpaceStars);
  }

  // ===================================================================
  // 1B. DẢI LỤA HẠT SAO (COSMIC WIND), SAO BĂNG VẠCH SÁNG RỰC RỠ (METEORS) & CÁNH HOA BAY
  // Xanh Băng Lam Ngọc #70a1ff xen Bụi Vàng Kim #ffeaa7 uốn lượn bay lướt
  // Sao băng: 1 đường vạch sáng rực rỡ (continuous laser streak line) xé ngang bầu trời
  // Cánh hoa rơi (Cosmic Petals): 75 cánh hoa mềm mại chao liệng trong gió vũ trụ
  // ===================================================================
  function buildCosmicWindAndMeteors() {
    cosmicWindGroup = new THREE.Group();
    scene.add(cosmicWindGroup);

    // 1. Dải lụa hạt sao Cosmic Wind (1.600 hạt)
    const WIND_COUNT = 1600;
    const windGeo = new THREE.BufferGeometry();
    cosmicWindPositions = new Float32Array(WIND_COUNT * 3);
    const windColors = new Float32Array(WIND_COUNT * 3);
    cosmicWindVelocities = [];

    const colCyan = new THREE.Color(0x70a1ff); // Xanh Băng Lam Ngọc
    const colGold = new THREE.Color(0xffeaa7); // Bụi Vàng Kim

    for (let i = 0; i < WIND_COUNT; i++) {
      const t = i / WIND_COUNT;
      const x = -320 + t * 640 + (Math.random() - 0.5) * 55;
      const y = 85 - t * 130 + Math.sin(t * Math.PI * 4) * 48 + (Math.random() - 0.5) * 28;
      const z = 90 + Math.cos(t * Math.PI * 3) * 110 + (Math.random() - 0.5) * 45;

      cosmicWindPositions[i * 3] = x;
      cosmicWindPositions[i * 3 + 1] = y;
      cosmicWindPositions[i * 3 + 2] = z;

      cosmicWindVelocities.push({
        vx: 0.38 + Math.random() * 0.45,
        vy: -0.07 - Math.random() * 0.12,
        vz: (Math.random() - 0.5) * 0.22,
        phase: Math.random() * Math.PI * 2,
        freq: 0.02 + Math.random() * 0.02
      });

      const isCyan = (i % 2 === 0);
      const c = isCyan ? colCyan : colGold;
      windColors[i * 3] = c.r;
      windColors[i * 3 + 1] = c.g;
      windColors[i * 3 + 2] = c.b;
    }

    windGeo.setAttribute('position', new THREE.BufferAttribute(cosmicWindPositions, 3));
    windGeo.setAttribute('color', new THREE.BufferAttribute(windColors, 3));

    const windMat = new THREE.PointsMaterial({
      size: 2.3,
      map: createParticleTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    cosmicWindParticles = new THREE.Points(windGeo, windMat);
    cosmicWindGroup.add(cosmicWindParticles);

    // 2. Hệ thống Sao Băng thành 1 ĐƯỜNG VẠCH BAY QUA LUÔN (Continuous Glowing Streak Line)
    meteors = [];
    const METEOR_COUNT = 4;
    for (let m = 0; m < METEOR_COUNT; m++) {
      const SEGMENTS = 24;
      const mGeo = new THREE.BufferGeometry();
      const mPositions = new Float32Array(SEGMENTS * 3);
      const mColors = new Float32Array(SEGMENTS * 3);

      const isGold = (m % 2 === 0);
      for (let k = 0; k < SEGMENTS; k++) {
        const falloff = Math.pow(1.0 - k / (SEGMENTS - 1), 1.6);
        if (isGold) {
          mColors[k * 3]     = 1.0 * falloff;
          mColors[k * 3 + 1] = (0.92 + 0.08 * (1 - k / SEGMENTS)) * falloff;
          mColors[k * 3 + 2] = 0.55 * falloff;
        } else {
          mColors[k * 3]     = (0.75 + 0.25 * (1 - k / SEGMENTS)) * falloff;
          mColors[k * 3 + 1] = 0.95 * falloff;
          mColors[k * 3 + 2] = 1.0 * falloff;
        }
      }

      mGeo.setAttribute('position', new THREE.BufferAttribute(mPositions, 3));
      mGeo.setAttribute('color', new THREE.BufferAttribute(mColors, 3));

      const mLineMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        linewidth: 2.5
      });

      const mLine = new THREE.Line(mGeo, mLineMat);
      cosmicWindGroup.add(mLine);

      // Đầu mũi sao băng phát sáng chói lọi (Head Starburst Particle)
      const mHeadGeo = new THREE.BufferGeometry();
      const mHeadPos = new Float32Array(3);
      mHeadGeo.setAttribute('position', new THREE.BufferAttribute(mHeadPos, 3));
      const mHeadMat = new THREE.PointsMaterial({
        size: 5.6,
        map: createParticleTexture(),
        color: isGold ? 0xfffae6 : 0xffffff,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const mHeadPoint = new THREE.Points(mHeadGeo, mHeadMat);
      cosmicWindGroup.add(mHeadPoint);

      meteors.push({
        line: mLine,
        lineGeo: mGeo,
        lineMat: mLineMat,
        headPoint: mHeadPoint,
        headGeo: mHeadGeo,
        headMat: mHeadMat,
        segmentCount: SEGMENTS,
        active: false,
        delay: m * 2.2 + Math.random() * 1.5,
        elapsed: 0,
        startX: 0, startY: 0, startZ: 0,
        dirX: 0, dirY: 0, dirZ: 0,
        speed: 0,
        progress: 0
      });
    }

    // 3. Cánh hoa lơ lửng chao liệng trong gió ngân hà (Cosmic Petals: 75 cánh hoa)
    const PETAL_COUNT = 75;
    const pGeo = new THREE.BufferGeometry();
    cosmicPetalPositions = new Float32Array(PETAL_COUNT * 3);
    const pColors = new Float32Array(PETAL_COUNT * 3);
    cosmicPetalVelocities = [];

    for (let p = 0; p < PETAL_COUNT; p++) {
      const px = -260 + Math.random() * 520;
      const py = -60 + Math.random() * 160;
      const pz = -60 + Math.random() * 140;

      cosmicPetalPositions[p * 3]     = px;
      cosmicPetalPositions[p * 3 + 1] = py;
      cosmicPetalPositions[p * 3 + 2] = pz;

      cosmicPetalVelocities.push({
        vx: 0.22 + Math.random() * 0.28,
        vy: -0.15 - Math.random() * 0.20,
        vz: (Math.random() - 0.5) * 0.22,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        freq: 0.018 + Math.random() * 0.025
      });

      const rPick = Math.random();
      if (rPick > 0.60) {
        pColors[p * 3] = 1.0; pColors[p * 3 + 1] = 0.66; pColors[p * 3 + 2] = 0.78; // Hồng đào #ffa8c5
      } else if (rPick > 0.25) {
        pColors[p * 3] = 1.0; pColors[p * 3 + 1] = 0.46; pColors[p * 3 + 2] = 0.56; // Hồng san hô #ff758c
      } else {
        pColors[p * 3] = 1.0; pColors[p * 3 + 1] = 0.92; pColors[p * 3 + 2] = 0.65; // Vàng kem #ffeaa7
      }
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(cosmicPetalPositions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({
      size: 4.2,
      map: createParticleTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    cosmicPetalsMesh = new THREE.Points(pGeo, pMat);
    cosmicWindGroup.add(cosmicPetalsMesh);
  }

  // ===================================================================
  // 1C. TRÁI TIM BỤI SAO MA THUẬT 3D & ĐĨA NGÂN HÀ XOẮN ỐC XOAY VÒNG VÒNG
  // - TRÁI TIM 3D (TikTok Video 2 - "Magical Heart"):
  //     + Đường viền nét căng 100% hình trái tim, từ 2 vòm tai uốn lượn đến chóp nhọn phía dưới
  //     + Phồng căng mọng 3D đa chiều: 75% hạt đan dày bề mặt vỏ ngoài, 25% hạt ở lõi phát quang
  //     + Hạt sao nhấp nháy đa sắc: Lõi trắng vàng phát quang #fff8e7, thân hồng đào #ff3385 /
  //       hồng san hô #ff6b81, vỏ ngoài hồng phấn baby #ffa8c5 kèm bụi sao kim tuyến #ffffff
  // - CÁI ĐẾ (TikTok Video 1 - "Universe Of Love"):
  //     + Đĩa Ngân Hà Xoắn Ốc Xoay Vòng Vòng (Spiral Galaxy Vortex):
  //       Tâm có vòng tròn rỗng huyền bí (tâm hố đen thiên hà r < 32)
  //       Vành chân trời sự kiện (Photon Ring r = 34..50)
  //       Vầng hào quang kết nối thẳng từ chóp tim xuống tâm đĩa xoáy ngân hà
  //       4 Nhánh xoắn ốc (Spiral arms r = 48..240) gồm hàng vạn hạt bụi sao xoay 360°
  // ===================================================================
  function buildGalaxyParticles() {
    galaxyGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    particleBasePositions = new Float32Array(PARTICLE_COUNT * 3);
    particleBaseColors = new Float32Array(PARTICLE_COUNT * 3);
    particleTargetPositions = new Float32Array(PARTICLE_COUNT * 3);
    particleCurrentPositions = new Float32Array(PARTICLE_COUNT * 3);

    const HEART_COUNT = 15000;
    const PEDESTAL_COUNT = 15000;

    // Góc nghiêng 25.5° hoàn mỹ cho Đĩa Ngân Hà Xoắn Ốc (nhìn rõ chiều sâu 3D và các nhánh xoáy ngân hà)
    // Góc nghiêng 24.5° hoàn mỹ cho Đĩa Ngân Hà Xoắn Ốc (nhìn rõ chiều sâu 3D và các tầng xoáy ngân hà)
    const tiltPedestal = (24.5 * Math.PI) / 180;
    const cosTP = Math.cos(tiltPedestal);
    const sinTP = Math.sin(tiltPedestal);

    // --- A. TRÁI TIM BỤI SAO MA THUẬT 3D (TRUE 3D VOLUMETRIC STARDUST HEART - 15.000 HẠT) ---
    // Phương trình mặt cong 3D Taubin thực thụ: (x^2 + 2.25*z^2 + y^2 - 1)^3 - x^2*y^3 - 0.1125*z^2*y^3 <= 0
    // Tròn trịa 360° từ mọi góc nhìn (kể cả nhìn nghiêng/nhìn hông như quả đào/quả dâu tây căng mọng, không bị dẹt/hộp)
    const S_heart = 38.0;
    const Y_HEART_CENTER = 30.0;

    let heartCount = 0;
    while (heartCount < HEART_COUNT) {
      const x = (Math.random() * 2 - 1) * 1.25;
      const y = -1.15 + Math.random() * 2.45;
      const z = (Math.random() * 2 - 1) * 0.85;
      const x2 = x * x;
      const y2 = y * y;
      const z2 = z * z;
      const term1 = x2 + 2.25 * z2 + y2 - 1;
      const f = Math.pow(term1, 3) - x2 * y2 * y - 0.1125 * z2 * y2 * y;
      if (f <= 0) {
        // 80% hạt bao quanh lớp vỏ cong 3D căng mọng, 20% ở lõi phát quang
        if (f >= -0.26 || Math.random() < 0.20) {
          const posX = x * S_heart;
          const posY = Y_HEART_CENTER + y * S_heart;
          const posZ = z * S_heart;

          // Phối màu Ombre phát quang 3D mềm mại, không có bất kỳ vệt trắng chia đôi nào ở giữa!
          const dist = Math.sqrt(x * x + (y - 0.25) * (y - 0.25) + 1.2 * z * z) / 1.15;
          let rColor, gColor, bColor;

          if (dist < 0.38) {
            // Lõi Vàng Trắng Ánh Kim & Champagne Starlight (ấm áp, phát quang tự nhiên)
            if (Math.random() > 0.40) {
              rColor = 1.0; gColor = 0.94; bColor = 0.88; // Champagne starlight #fff0e0
            } else {
              rColor = 1.0; gColor = 0.42; bColor = 0.60; // Hồng ấm dịu
            }
          } else if (dist < 0.82) {
            // Thân Trái Tim: Hồng Phấn Baby Satin (#ffa8c5) & Hồng San Hô (#ff4d80)
            if (Math.random() > 0.45) {
              rColor = 1.0; gColor = 0.64; bColor = 0.78; // Hồng Phấn Baby #ffa8c5
            } else {
              rColor = 1.0; gColor = 0.30; bColor = 0.50; // Hồng San Hô #ff4d80
            }
          } else {
            // Viền Ngoài: Cánh Hoa Hồng Mềm Mại & Bụi Kim Cương Lấp Lánh
            if (Math.random() < 0.20) {
              rColor = 1.0; gColor = 0.98; bColor = 1.0; // Điểm xuyết hạt kim cương lấp lánh #ffffff
            } else {
              rColor = 1.0; gColor = 0.70; bColor = 0.82; // Hồng dịu dàng #ffb3d1
            }
          }

          positions[heartCount * 3]     = posX;
          positions[heartCount * 3 + 1] = posY;
          positions[heartCount * 3 + 2] = posZ;

          colors[heartCount * 3]     = rColor;
          colors[heartCount * 3 + 1] = gColor;
          colors[heartCount * 3 + 2] = bColor;

          heartTwinklePhases[heartCount] = Math.random() * Math.PI * 2;
          heartTwinkleFreqs[heartCount] = 1.2 + Math.random() * 3.6;

          heartCount++;
        }
      }
    }

    // --- B. ĐĨA NGÂN HÀ XOẮN ỐC ĐA TẦNG (MULTI-LAYERED SPIRAL GALAXY VORTEX - 15.000 HẠT) ---
    // --- B. ĐĨA NGÂN HÀ XOẮN ỐC BẢN RỘNG ĐA TẦNG (MAJESTIC 3D SPIRAL GALAXY VORTEX - 15.000 HẠT) ---
    // Khởi đầu ngay sát đáy chóp tim (y ~ -8.5), 4 nhánh xoáy bản rộng dày dặn lộng lẫy,
    // phát sáng rực rỡ chuẩn phong cách ban đầu, không bị mảnh như sợi chỉ hay tối tăm!
    for (let j = 0; j < PEDESTAL_COUNT; j++) {
      const idx = HEART_COUNT + j;
      let x0, y0, z0, rColor, gColor, bColor;

      if (j < 2500) {
        // 1. ĐÀI VÀNG BỒI TỤ ÔM SÁT CHÓP TIM (Core Accretion Ring: 2.500 hạt)
        // Bán kính r = 12..36 ôm trọn chân chóp tim (y ~ -8.5..-10.5)
        const prog = j / 2500;
        const rRing = 12.0 + Math.pow(prog, 0.75) * 24.0;
        const ang = Math.random() * Math.PI * 2;
        const yRing = -8.5 - (prog * 2.2) + (Math.random() - 0.5) * 1.5;

        x0 = Math.cos(ang) * rRing;
        y0 = yRing;
        z0 = Math.sin(ang) * rRing;

        const rndC = Math.random();
        if (rndC > 0.55) {
          rColor = 1.0; gColor = 0.98; bColor = 0.92; // Trắng Kim Cương
        } else if (rndC > 0.25) {
          rColor = 1.0; gColor = 0.88; bColor = 0.48; // Vàng Hoàng Gia #ffd166
        } else {
          rColor = 1.0; gColor = 0.60; bColor = 0.78; // Hồng Phấn Baby #ffa8c5
        }
      } else if (j < 13500) {
        // 2. 4 NHÁNH XOẮN ỐC LOGARITHMIC BẢN RỘNG DÀY DẶN (4 Sweeping Galaxy Arms: 11.000 hạt)
        // Quét liên tục từ r = 32 ra r = 265, dải lụa phát sáng đầy đặn, rực rỡ
        const armIdx = (j - 2500) % 4;
        const armBase = armIdx * (Math.PI / 2);
        const distRatio = Math.pow((j - 2500) / 11000, 0.86);
        const rArm = 32.0 + distRatio * 233.0;
        const spiralAngle = armBase + 3.3 * Math.pow((rArm - 32) / 233, 0.74);
        // Độ dày dải xoắn mềm mại bản rộng (Gaussian width)
        const spread = (Math.random() - Math.random()) * (0.16 + (rArm / 265) * 0.14);
        const ang = spiralAngle + spread;
        const yArm = -10.5 - (distRatio * 10.5) + (Math.random() - 0.5) * (1.6 + (rArm / 265) * 2.8);

        x0 = Math.cos(ang) * rArm;
        y0 = yArm;
        z0 = Math.sin(ang) * rArm;

        // Bảng màu rực rỡ phát quang (Magenta Neon, Lavender Tím, Cyber Violet, Gold Starlight)
        const colPick = Math.random();
        if (colPick < 0.42) {
          rColor = 1.0; gColor = 0.20; bColor = 0.60; // Magenta Neon #ff3399
        } else if (colPick < 0.72) {
          rColor = 0.85; gColor = 0.48; bColor = 1.0;  // Tím Lavender #d97bff
        } else if (colPick < 0.88) {
          rColor = 1.0; gColor = 0.88; bColor = 0.50;  // Vàng Kim Hoàng Gia #ffd680
        } else {
          rColor = 1.0; gColor = 0.98; bColor = 1.0;  // Trắng Kim Cương #ffffff
        }
      } else {
        // 3. BỤI SAO THIÊN HÀ KHÔNG GIAN BỒNG BỀNH (Inter-Arm Ambient Dust: 1.500 hạt)
        const rDust = 28.0 + Math.pow(Math.random(), 0.80) * 235.0;
        const angDust = Math.random() * Math.PI * 2;
        const yDust = -10.0 - ((rDust - 28) / 235) * 11.0 + (Math.random() - 0.5) * 3.5;

        x0 = Math.cos(angDust) * rDust;
        y0 = yDust;
        z0 = Math.sin(angDust) * rDust;

        if (Math.random() > 0.50) {
          rColor = 0.75; gColor = 0.35; bColor = 1.0; // Tím huyền ảo
        } else {
          rColor = 1.0; gColor = 0.55; bColor = 0.80; // Hồng phấn dịu
        }
      }

      pedestalUntiltedX[j] = x0;
      pedestalUntiltedY[j] = y0;
      pedestalUntiltedZ[j] = z0;
      pedestalVortexSpeed[j] = 1.0;

      // Nghiêng 24.5° tạo chiều sâu phối cảnh 3D
      const x = x0;
      const y = y0 * cosTP - z0 * sinTP;
      const z = y0 * sinTP + z0 * cosTP;

      positions[idx * 3]     = x;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = z;

      colors[idx * 3]     = rColor;
      colors[idx * 3 + 1] = gColor;
      colors[idx * 3 + 2] = bColor;
    }

    for (let k = 0; k < PARTICLE_COUNT * 3; k++) {
      particleBasePositions[k] = positions[k];
      particleCurrentPositions[k] = positions[k];
      particleTargetPositions[k] = positions[k];
      particleBaseColors[k] = colors[k];
    }

    galaxyGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    galaxyGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    galaxyMat = new THREE.PointsMaterial({
      size: 1.65,
      map: createParticleTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.96,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false
    });

    galaxyParticles = new THREE.Points(galaxyGeo, galaxyMat);
    scene.add(galaxyParticles);
  }

  function sampleTextCoordinates(text, maxPoints = 16000, scale = 1.0) {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = 1200;
    offCanvas.height = 360;
    const ctx = offCanvas.getContext('2d');

    if (!ctx || typeof ctx.getImageData !== 'function') {
      const fallbackPoints = [];
      const count = Math.min(maxPoints, 800);
      for (let i = 0; i < count; i++) {
        fallbackPoints.push({
          x: (Math.random() - 0.5) * 160 * scale,
          y: (Math.random() - 0.5) * 60 * scale,
          z: (Math.random() - 0.5) * 16
        });
      }
      return fallbackPoints;
    }

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, offCanvas.width, offCanvas.height);

    let fontSize = 84;
    if (text.length <= 2) fontSize = 160;
    else if (text.length > 18) fontSize = 64;
    else if (text.length > 28) fontSize = 48;

    ctx.font = `900 ${fontSize}px "Montserrat", "Be Vietnam Pro", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, offCanvas.width / 2, offCanvas.height / 2);

    const imgData = ctx.getImageData(0, 0, offCanvas.width, offCanvas.height);
    const data = imgData.data;
    const points = [];

    // Bước quét mịn 2px giúp các nét chữ đan đặc, sắc bén, không bị đứt đoạn
    const step = 2;
    for (let y = 0; y < offCanvas.height; y += step) {
      for (let x = 0; x < offCanvas.width; x += step) {
        const idx = (y * offCanvas.width + x) * 4;
        if (data[idx + 3] > 60 || data[idx] > 60 || data[idx + 1] > 60 || data[idx + 2] > 60) {
          points.push({
            x: (x - offCanvas.width / 2) * 0.38 * scale,
            y: (offCanvas.height / 2 - y) * 0.38 * scale,
            z: (Math.random() - 0.5) * 8
          });
        }
      }
    }

    // Xáo trộn ngẫu nhiên để các hạt bay tới tự nhiên
    for (let i = points.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = points[i];
      points[i] = points[j];
      points[j] = temp;
    }

    if (points.length === 0) {
      const fallbackCount = Math.min(maxPoints, 1200);
      for (let i = 0; i < fallbackCount; i++) {
        points.push({
          x: (Math.random() - 0.5) * 160 * scale,
          y: (Math.random() - 0.5) * 60 * scale,
          z: (Math.random() - 0.5) * 12
        });
      }
    }

    return points.slice(0, maxPoints);
  }

  function disperseParticlesToDeepSpace() {
    if (!galaxyGeo || !galaxyGeo.attributes.position) return;
    const pos = galaxyGeo.attributes.position.array;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const dist = 420 + Math.random() * 260;
      pos[i * 3] = dist * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = dist * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = dist * Math.cos(phi);
      particleCurrentPositions[i * 3] = pos[i * 3];
      particleCurrentPositions[i * 3 + 1] = pos[i * 3 + 1];
      particleCurrentPositions[i * 3 + 2] = pos[i * 3 + 2];
    }
    galaxyGeo.attributes.position.needsUpdate = true;
  }

  function morphParticlesToText(text, scale = 1.0, colorHex = null, secondaryColorHex = null) {
    if (!galaxyGeo || !galaxyGeo.attributes.position) return;
    const pts = sampleTextCoordinates(text, 16000, scale);
    if (!pts || pts.length === 0) return;

    const ptCount = pts.length;
    let col1 = null, col2 = null;
    if (colorHex !== null) {
      col1 = new THREE.Color(colorHex);
      col2 = secondaryColorHex ? new THREE.Color(secondaryColorHex) : col1;
    }

    const colors = (galaxyGeo.attributes.color && galaxyGeo.attributes.color.array) ? galaxyGeo.attributes.color.array : null;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      if (i < ptCount) {
        // Hạt tạo hình thân chữ: Tập trung chuẩn xác, nổi bật ngay trước mắt camera
        particleTargetPositions[i * 3] = pts[i].x;
        particleTargetPositions[i * 3 + 1] = pts[i].y;
        particleTargetPositions[i * 3 + 2] = pts[i].z + 65;

        if (colors && col1) {
          const mix = (i % 2 === 0) ? col1 : col2;
          colors[i * 3] = mix.r;
          colors[i * 3 + 1] = mix.g;
          colors[i * 3 + 2] = mix.b;
        }
      } else {
        // CÁC HẠT DƯ KHÔNG TẠO CHỮ: Đẩy lùi sâu vào nền vũ trụ xa xăm
        // TUYỆT ĐỐI KHÔNG quấn thành vành đai đặc che lấp chữ!
        const u = ((i - ptCount) / (PARTICLE_COUNT - ptCount));
        const theta = u * Math.PI * 2 * 3.5;
        const phi = Math.acos(2.0 * ((i % 100) / 100) - 1.0);
        const dist = 520 + (i % 260);
        particleTargetPositions[i * 3] = Math.sin(phi) * Math.cos(theta) * dist;
        particleTargetPositions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * dist * 0.65;
        particleTargetPositions[i * 3 + 2] = -220 - Math.abs(Math.cos(phi)) * 340;

        if (colors) {
          colors[i * 3] = 0.32;
          colors[i * 3 + 1] = 0.22;
          colors[i * 3 + 2] = 0.42;
        }
      }
    }

    if (colors && galaxyGeo.attributes.color) {
      galaxyGeo.attributes.color.needsUpdate = true;
    }
    isMorphing = true;
  }

  function resetParticlesToGalaxy() {
    if (!particleBasePositions || particleBasePositions.length === 0) return;
    for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
      particleTargetPositions[i] = particleBasePositions[i];
    }
    if (galaxyGeo && galaxyGeo.attributes.color && particleBaseColors && particleBaseColors.length > 0) {
      const cols = galaxyGeo.attributes.color.array;
      for (let j = 0; j < PARTICLE_COUNT * 3; j++) {
        cols[j] = particleBaseColors[j];
      }
      galaxyGeo.attributes.color.needsUpdate = true;
    }
    isMorphing = true;
  }

  // ===================================================================
  // 2. CĂN PHÒNG RIÊNG 3D: DẢI NGÂN HÀ & LỜI CHÚC BAY 3D
  // Tuyệt đối KHÔNG có khối trái tim 3D che dải ngân hà!
  // Tuyệt đối KHÔNG có các khung viền ảnh chữ nhật to đùng choán hết màn hình!
  // ===================================================================
  function buildPersonalRoom() {
    roomGroup = new THREE.Group();
    roomGroup.position.set(0, 0, 0);
    roomGroup.visible = false;
    scene.add(roomGroup);

    // Màn che làm mờ/dịu vũ trụ 3D Three.js khi Cinematic Zoom kích hoạt (đặt sau thẻ ảnh, không che mờ thẻ ảnh)
    const dimGeo = new THREE.PlaneGeometry(380, 280);
    const dimMat = new THREE.MeshBasicMaterial({
      color: 0x060714,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    cinematicDimPlane = new THREE.Mesh(dimGeo, dimMat);
    cinematicDimPlane.visible = false;
    scene.add(cinematicDimPlane);

    // Group thẻ ảnh sạch sẽ (không render khung hộp choán màn hình)
    orbitCardGroup = new THREE.Group();
    roomGroup.add(orbitCardGroup);

    // Group Lời Chúc 3D Bay Bồng Bềnh (Dr.Gifter Falling Text 3D)
    floatingWishGroup = new THREE.Group();
    roomGroup.add(floatingWishGroup);
  }

  // ===================================================================
  // LỜI CHÚC 3D TRÔI TRONG VŨ TRỤ (CHUẨN DR.GIFTER FALLING/FLOATING TEXT 3D)
  // - Phát sáng 3D đa sắc: Vàng kim (#ffd166), Hồng neon (#ff2a85), Trắng sáng / Xanh băng (#00f0ff)
  // - Trôi bồng bềnh trong không gian vũ trụ, kèm ngôi sao & icon nhỏ (⭐, 💖, 🌷, 🌸, 🎁)
  // - Canvas 1024x136 chuẩn tỷ lệ ~7.5:1 sắc nét tuyệt đối, chữ to, rõ ràng, dễ đọc
  // - 100% TRONG SUỐT — TUYỆT ĐỐI KHÔNG CÓ HỘP ĐEN 2D HAY KHUNG VIỀN NÀO!
  // ===================================================================
  function createTextSpriteTexture(text, styleType = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');

    if (typeof ctx.clearRect === 'function') {
      ctx.clearRect(0, 0, 1024, 140);
    }

    const displayText = text;
    const strLen = displayText.length;

    let fontSize = 48;
    if (strLen > 55) fontSize = 34;
    else if (strLen > 40) fontSize = 38;
    else if (strLen > 25) fontSize = 44;

    ctx.font = `700 ${fontSize}px "Be Vietnam Pro", sans-serif`;

    if (typeof ctx.measureText === 'function') {
      while (ctx.measureText(displayText).width > 900 && fontSize > 24) {
        fontSize -= 2;
        ctx.font = `700 ${fontSize}px "Be Vietnam Pro", sans-serif`;
      }
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const centerY = 70;
    const centerX = 512;

    // Nền kính mờ trong suốt thanh lịch
    const textWidth = (ctx.measureText ? ctx.measureText(displayText).width : 600);
    const pillW = Math.min(960, Math.max(380, textWidth + 70));
    const pillH = 82;
    const pillX = (1024 - pillW) / 2;
    const pillY = (140 - pillH) / 2;
    const pillR = 41;

    if (typeof ctx.beginPath === 'function') {
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(pillX, pillY, pillW, pillH, pillR);
      } else if (typeof ctx.arc === 'function') {
        ctx.arc(pillX + pillR, pillY + pillR, pillR, Math.PI * 0.5, Math.PI * 1.5);
        ctx.arc(pillX + pillW - pillR, pillY + pillR, pillR, Math.PI * 1.5, Math.PI * 0.5);
        if (typeof ctx.closePath === 'function') ctx.closePath();
      }
      ctx.fillStyle = 'rgba(12, 8, 24, 0.76)';
      if (typeof ctx.fill === 'function') ctx.fill();
      ctx.strokeStyle = 'rgba(255, 209, 102, 0.65)';
      ctx.lineWidth = 2.5;
      if (typeof ctx.stroke === 'function') ctx.stroke();
    }

    // Màu chữ: Trắng Ngọc Trai #ffffff kết hợp bóng hào quang Vàng Ánh Kim #ffd166
    // Pass 1: Hào quang Vàng Ánh Kim tỏa rộng
    if (ctx.shadowColor !== undefined) {
      ctx.shadowColor = 'rgba(255, 209, 102, 0.95)';
      ctx.shadowBlur = 22;
    }
    ctx.fillStyle = '#ffd166';
    if (typeof ctx.fillText === 'function') ctx.fillText(displayText, centerX, centerY);

    // Pass 2: Hào quang thứ hai
    if (ctx.shadowColor !== undefined) {
      ctx.shadowColor = 'rgba(255, 209, 102, 0.65)';
      ctx.shadowBlur = 8;
    }
    ctx.fillStyle = '#ffffff';
    if (typeof ctx.fillText === 'function') ctx.fillText(displayText, centerX, centerY);

    // Pass 3: Thân chữ Trắng Ngọc Trai #ffffff sắc nét, to rõ, dễ đọc
    if (ctx.shadowBlur !== undefined) {
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = '#ffffff';
    if (typeof ctx.fillText === 'function') ctx.fillText(displayText, centerX, centerY);

    const TextureClass = THREE.CanvasTexture || THREE.Texture;
    const texture = new TextureClass(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  }

  function populateFloatingWishes(wishText, girl) {
    if (!floatingWishGroup) return;

    while (floatingWishGroup.children.length > 0) {
      const obj = floatingWishGroup.children[0];
      if (obj.geometry && typeof obj.geometry.dispose === 'function') {
        obj.geometry.dispose();
      }
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => {
            if (m.map && typeof m.map.dispose === 'function') m.map.dispose();
            if (typeof m.dispose === 'function') m.dispose();
          });
        } else {
          if (obj.material.map && typeof obj.material.map.dispose === 'function') obj.material.map.dispose();
          if (typeof obj.material.dispose === 'function') obj.material.dispose();
        }
      }
      floatingWishGroup.remove(obj);
    }
    floatingWishItems = [];

    if (wishTextureList && wishTextureList.length > 0) {
      wishTextureList.forEach(t => {
        if (t && typeof t.dispose === 'function') t.dispose();
      });
    }
    wishTextureList = [];
    wishDataList = [];
    nextWishIndex = 0;

    const girlData = girl || { name: 'Thiên Thần 11A2', giftTitle: 'Hoa Khôi 11A2' };

    // Danh sách 20 câu chúc riêng biệt của bạn nữ:
    const rawWishLines = (wishText || '').split('\n').map(l => l.trim()).filter(Boolean);
    if (rawWishLines.length > 0) {
      rawWishLines.forEach((l, idx) => {
        wishDataList.push({
          text: l,
          type: idx % 2
        });
      });
    } else {
      const defaultWishes = [
        `Chúc ${girlData.name} một ngày 20/10 ngập tràn niềm vui và hạnh phúc! 🌷`,
        'Hôm nay nhất định phải cười thật nhiều và vui hơn mọi ngày nhé!',
        'Chúc cậu luôn xinh đẹp, rạng rỡ và tự tin như vì tinh tú ✨',
        'Mong mọi điều ước ngọt ngào của cậu hôm nay đều trở thành hiện thực!',
        'Quà thì chắc chắn phải thật nhiều và bất ngờ rồi :))',
        'Có người chúc đầu tiên thì nhớ mỉm cười thật tươi nha!',
        'Những khoảnh khắc đẹp nhất của thanh xuân 11A2 luôn có cậu',
        'Mong nụ cười tỏa nắng luôn nở trên môi người đẹp 🌸',
        '20/10 năm nay sẽ là kỷ niệm thật ngọt ngào và đáng nhớ',
        'Đừng để bất kỳ âu lo nào làm mờ đi nụ cười của cậu hôm nay nhé',
        'Tập thể 11A2 luôn dành cho cậu những tình cảm chân thành nhất 💖',
        'Chúc cậu luôn gặp thật nhiều may mắn trong học tập và cuộc sống',
        'Mong mỗi ngày thức dậy đều là một ngày tràn đầy năng lượng tích cực',
        'Cậu xứng đáng nhận được tất cả những điều dịu dàng nhất của thế giới này',
        'Hãy luôn là cô gái tự tin, yêu đời và đáng yêu như bây giờ nha',
        'Mong cậu luôn được yêu thương và chở che thật nhiều!',
        'Hôm nay cứ thoải mái tận hưởng ngày đặc biệt dành riêng cho cậu',
        'Hy vọng món quà nhỏ này sẽ làm cậu mỉm cười ấm áp 🥰',
        'Chúc cho thanh xuân của chúng ta dưới mái nhà 11A2 mãi rực rỡ',
        `Chúc ${girlData.name} 20/10 thật tuyệt vời và hạnh phúc trọn vẹn! 🎀💐`
      ];
      defaultWishes.forEach((w, idx) => {
        wishDataList.push({ text: w, type: idx % 2 });
      });
    }

    wishTextureList = wishDataList.map(item => {
      return createTextSpriteTexture(item.text, item.type);
    });

    // 4 CÂU CHÚC BAY TỪ DƯỚI LÊN -> MỜ DẦN RỒI TẮT -> LẶP VÔ TẬN 20 CÂU (INFINITE LOOP)
    // 10 CÂU CHÚC BAY LIÊN TỤC TỪ DƯỚI LÊN -> MỜ DẦN RỒI TẮT -> LẶP VÔ TẬN 20 CÂU (INFINITE STREAM)
    // Tọa độ 2 hành lang song song (|x| ≈ 112..120), so le soắn ốc bay liên tục như dòng sông thơ ca
    const ACTIVE_SLOTS = 10;
    const laneConfigs = [
      { x: -118, z: 38, startY: -72 },
      { x:  118, z: 36, startY: -56 },
      { x: -114, z: 44, startY: -40 },
      { x:  114, z: 42, startY: -24 },
      { x: -120, z: 36, startY:  -8 },
      { x:  120, z: 34, startY:   8 },
      { x: -112, z: 42, startY:  24 },
      { x:  112, z: 40, startY:  40 },
      { x: -116, z: 38, startY:  56 },
      { x:  116, z: 36, startY:  72 }
    ];

    const planeGeo = new THREE.PlaneGeometry(94, 13.0);

    for (let i = 0; i < ACTIVE_SLOTS; i++) {
      const dataIdx = i % wishDataList.length;
      const texture = wishTextureList[dataIdx];
      const cfg = laneConfigs[i % laneConfigs.length];

      let initOpacity = 1.0;
      if (cfg.startY < -35) {
        initOpacity = Math.max(0, Math.min(1.0, (cfg.startY - (-75)) / 40));
      } else if (cfg.startY > 45) {
        initOpacity = Math.max(0, Math.min(1.0, 1.0 - (cfg.startY - 45) / 40));
      }

      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: initOpacity * 0.96,
        depthWrite: false,
        blending: THREE.NormalBlending
      });

      const mesh = new THREE.Mesh(planeGeo, mat);
      mesh.position.set(cfg.x, cfg.startY, cfg.z);

      floatingWishGroup.add(mesh);
      floatingWishItems.push({
        mesh: mesh,
        baseX: cfg.x,
        baseZ: cfg.z,
        y: cfg.startY,
        riseSpeed: 0.45,
        swayPhase: i * 1.25,
        swaySpeed: 0.022,
        textIndex: dataIdx
      });
    }

    nextWishIndex = ACTIVE_SLOTS % wishDataList.length;

    // 150 hạt sao lấp lánh (sparkles) bay lượn cùng chữ
    const starCount = 150;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let s = 0; s < starCount; s++) {
      starPos[s * 3] = (Math.random() - 0.5) * 140;
      starPos[s * 3 + 1] = (Math.random() - 0.5) * 120;
      starPos[s * 3 + 2] = 40 + Math.random() * 140;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      size: 2.2,
      map: createParticleTexture(),
      color: 0xffeaa7,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    floatingSparkleMesh = new THREE.Points(starGeo, starMat);
    floatingWishGroup.add(floatingSparkleMesh);
  }

  function createPhotoCardTexture(photoUrl, title, icon = '🌷') {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 960;
    const ctx = canvas.getContext('2d');

    if (typeof ctx.clearRect === 'function') {
      ctx.clearRect(0, 0, 800, 960);
    }

    // 1. Khung ảnh Polaroid trắng tinh khôi (#ffffff) sang trọng
    if (typeof ctx.roundRect === 'function') {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(16, 16, 768, 928, 36);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 234, 167, 0.65)';
      ctx.lineWidth = 5;
      ctx.stroke();
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(16, 16, 768, 928);
    }

    // 2. Vùng ảnh kỷ niệm
    const imgX = 48, imgY = 76, imgW = 704, imgH = 640;

    // Nền hoa tươi đa sắc bừng sáng có hào quang tự phát sáng (soft bloom glow)
    const grad = ctx.createLinearGradient(imgX, imgY, imgX + imgW, imgY + imgH);
    grad.addColorStop(0.0, '#fff5f8');
    grad.addColorStop(0.5, '#ffedf2');
    grad.addColorStop(1.0, '#fff9e6');
    ctx.fillStyle = grad;
    ctx.fillRect(imgX, imgY, imgW, imgH);

    // Hào quang soft bloom glow phát sáng dịu dàng
    if (typeof ctx.createRadialGradient === 'function') {
      const bloom = ctx.createRadialGradient(400, 396, 20, 400, 396, 240);
      bloom.addColorStop(0, 'rgba(255, 158, 187, 0.45)');
      bloom.addColorStop(0.5, 'rgba(255, 211, 42, 0.22)');
      bloom.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = bloom;
      ctx.fillRect(imgX, imgY, imgW, imgH);
    }

    // Minh họa chùm hoa tươi đa sắc rạng rỡ (Hoa hồng đỏ nhung #ff2a5f, tulip cam đào #ff8447, hướng dương #ffd32a, lá xanh ngọc #05c46b)
    function drawFlowerBouquet() {
      ctx.save();
      // Vẽ cánh lá xanh ngọc #05c46b
      ctx.fillStyle = '#05c46b';
      if (typeof ctx.beginPath === 'function' && typeof ctx.arc === 'function') {
        ctx.beginPath();
        ctx.ellipse ? ctx.ellipse(340, 430, 36, 16, -Math.PI / 4, 0, Math.PI * 2) : ctx.arc(340, 430, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse ? ctx.ellipse(460, 430, 36, 16, Math.PI / 4, 0, Math.PI * 2) : ctx.arc(460, 430, 24, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hoa hướng dương vàng nắng #ffd32a
      ctx.fillStyle = '#ffd32a';
      if (typeof ctx.beginPath === 'function' && typeof ctx.arc === 'function') {
        ctx.beginPath();
        ctx.arc(330, 360, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff9f43';
        ctx.beginPath();
        ctx.arc(330, 360, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      // Hoa hồng đỏ nhung #ff2a5f
      ctx.fillStyle = '#ff2a5f';
      if (typeof ctx.beginPath === 'function' && typeof ctx.arc === 'function') {
        ctx.beginPath();
        ctx.arc(465, 360, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff6b81';
        ctx.beginPath();
        ctx.arc(465, 360, 18, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tulip cam đào #ff8447 ở giữa trung tâm
      ctx.font = '130px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icon || '🌷', 400, 380);
      ctx.restore();
    }

    drawFlowerBouquet();

    // 3. Dán dải băng dính washi tape họa tiết hoa rực rỡ & ghim nơ xinh (🎀)
    const tapeX = 270, tapeY = 32, tapeW = 260, tapeH = 44;
    function drawWashiAndRibbon() {
      ctx.save();
      // Washi tape vàng champagne rạng rỡ
      ctx.fillStyle = 'rgba(255, 234, 167, 0.96)';
      ctx.fillRect(tapeX, tapeY, tapeW, tapeH);
      // Họa tiết hoa đa sắc trên tape: hoa hồng đỏ nhung #ff2a5f, tulip cam đào #ff8447, hướng dương #ffd32a, lá xanh #05c46b
      const flowerDots = ['#ff2a5f', '#ff8447', '#ffd32a', '#05c46b'];
      for (let k = 0; k < 6; k++) {
        if (typeof ctx.beginPath === 'function' && typeof ctx.arc === 'function') {
          ctx.beginPath();
          ctx.arc(tapeX + 25 + k * 42, tapeY + 22, 9, 0, Math.PI * 2);
          ctx.fillStyle = flowerDots[k % flowerDots.length];
          ctx.fill();
        }
      }
      ctx.restore();

      // Ghim nơ xinh (🎀) ở góc trên bên trái
      ctx.font = '54px "Segoe UI Emoji", "Apple Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎀', 92, 68);
    }

    drawWashiAndRibbon();

    // 4. Chú thích kỷ niệm Polaroid ở chân ảnh (tương phản cao, rõ nét)
    ctx.fillStyle = '#1e1e24';
    ctx.font = 'bold 36px "Be Vietnam Pro", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title || 'Kỷ Niệm 11A2', 400, 786);

    ctx.fillStyle = '#ff2a85';
    ctx.font = '700 24px "Be Vietnam Pro", sans-serif';
    ctx.fillText('✨ 20/10/2026 • Tap để Zoom 3D 📸', 400, 846);

    const TextureClass = THREE.CanvasTexture || THREE.Texture;
    const tex = new TextureClass(canvas);
    tex.needsUpdate = true;

    // Nạp ảnh thật nếu có (hỗ trợ ảnh minh_hang.jpg và ảnh kỷ niệm)
    if (typeof Image !== 'undefined' && photoUrl) {
      const resolvedPhotoUrl = (typeof window !== 'undefined' && window.PHOTOS_CACHE && window.PHOTOS_CACHE[photoUrl])
        ? window.PHOTOS_CACHE[photoUrl]
        : photoUrl;

      const img = new Image();
      if (typeof resolvedPhotoUrl === 'string' && (resolvedPhotoUrl.startsWith('http://') || resolvedPhotoUrl.startsWith('https://'))) {
        img.crossOrigin = 'anonymous';
      }

      img.onload = () => {
        if (typeof ctx.drawImage === 'function') {
          // Tính toán tỷ lệ cắt ảnh object-fit cover thông minh chống méo ảnh
          const imgAspect = img.width / (img.height || 1);
          const targetAspect = imgW / imgH;
          let sx = 0, sy = 0, sw = img.width, sh = img.height;
          if (imgAspect > targetAspect) {
            sw = img.height * targetAspect;
            sx = (img.width - sw) / 2;
          } else {
            sh = img.width / targetAspect;
            sy = (img.height - sh) / 2;
          }
          ctx.drawImage(img, sx, sy, sw, sh, imgX, imgY, imgW, imgH);
          drawWashiAndRibbon();
          tex.needsUpdate = true;
        }
      };
      img.src = resolvedPhotoUrl;
    }

    return tex;
  }

  // Khởi tạo vòng xoay các bức ảnh bay lướt theo các nhánh xoáy của dải ngân hà quanh chân trái tim
  function populateRoomCards(girl) {
    while (orbitCardGroup.children.length > 0) {
      const obj = orbitCardGroup.children[0];
      if (obj.geometry && typeof obj.geometry.dispose === 'function') obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => {
            if (m.map && typeof m.map.dispose === 'function') m.map.dispose();
            if (typeof m.dispose === 'function') m.dispose();
          });
        } else {
          if (obj.material.map && typeof obj.material.map.dispose === 'function') obj.material.map.dispose();
          if (typeof obj.material.dispose === 'function') obj.material.dispose();
        }
      }
      orbitCardGroup.remove(obj);
    }
    orbitingCards = [];

    const photos = (girl && girl.photos && girl.photos.length > 0)
      ? girl.photos
      : [
          'assets/photos/demo_1.png',
          'assets/photos/demo_2.png',
          'assets/photos/demo_3.png',
          'assets/photos/demo_4.png',
          'assets/photos/demo_5.png',
          'assets/photos/demo_6.png'
        ];

    const cardTitles = [
      'Thanh Xuân 11A2 🌷',
      'Nụ Cười Tỏa Nắng ✨',
      'Mùa Thu Yêu Thương 🍂',
      'Những Bông Hoa 11A2 🌸',
      'Vì Tinh Tú 11A2 💖',
      '20/10 Rực Rỡ 💐'
    ];
    const cardIcons = ['🌷', '✨', '🍂', '🌸', '💖', '💐'];

    const cardGeo = new THREE.PlaneGeometry(42, 50);
    const cardCount = Math.min(photos.length, 6);

    const tiltRad = (24.0 * Math.PI) / 180;
    const cosT = Math.cos(tiltRad);
    const sinT = Math.sin(tiltRad);

    for (let i = 0; i < cardCount; i++) {
      const photoUrl = photos[i];
      const title = cardTitles[i % cardTitles.length];
      const icon = cardIcons[i % cardIcons.length];
      const tex = createPhotoCardTexture(photoUrl, title, icon);

      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.96
      });

      const mesh = new THREE.Mesh(cardGeo, mat);
      mesh.userData = {
        isCustomPhoto: true,
        photoUrl: photoUrl,
        title: title,
        icon: icon,
        index: i
      };

      // 6 Làn trôi riêng biệt thoáng đãng, so le cả chiều ngang (X), độ cao (Y), và chiều sâu (Z)
      // Các ảnh bay lơ lửng như những phi thuyền kỷ niệm bồng bềnh trên dòng sông ngân hà
      const cardLanes = [
        { x: -160, z:  35, startY: -65, speed: 0.22, swayPhase: 0.0 }, // Trái xa
        { x:  145, z:  70, startY: -35, speed: 0.20, swayPhase: 1.5 }, // Phải gần
        { x: -135, z:  80, startY:  -5, speed: 0.23, swayPhase: 3.0 }, // Trái gần
        { x:  175, z:  30, startY:  25, speed: 0.21, swayPhase: 4.5 }, // Phải xa
        { x: -185, z:   5, startY:  55, speed: 0.24, swayPhase: 2.2 }, // Trái sâu
        { x:  195, z:  10, startY:  85, speed: 0.19, swayPhase: 5.5 }  // Phải sâu
      ];

      const lane = cardLanes[i % cardLanes.length];
      mesh.position.set(lane.x, lane.startY, lane.z);
      orbitCardGroup.add(mesh);

      orbitingCards.push({
        mesh: mesh,
        baseX: lane.x,
        baseZ: lane.z,
        y: lane.startY,
        speed: lane.speed,
        swayPhase: lane.swayPhase,
        isZoomed: false,
        photoUrl: photoUrl,
        title: title,
        icon: icon,
        index: i
      });
    }
  }

  function buildEndingScene() {
    endingGroup = new THREE.Group();
    endingGroup.visible = false;
    scene.add(endingGroup);

    endingFloatingWishGroup = new THREE.Group();
    endingGroup.add(endingFloatingWishGroup);

    buildConstellation();
  }

  // Tạo các dải lụa chữ 3D trôi bồng bềnh giữa bầu trời đêm ngập tràn đèn trời
  function spawnEndingFloatingWishes(classWish) {
    if (!endingFloatingWishGroup) return;

    while (endingFloatingWishGroup.children.length > 0) {
      const obj = endingFloatingWishGroup.children[0];
      if (obj.geometry && typeof obj.geometry.dispose === 'function') obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => {
            if (m.map && typeof m.map.dispose === 'function') m.map.dispose();
            if (typeof m.dispose === 'function') m.dispose();
          });
        } else {
          if (obj.material.map && typeof obj.material.map.dispose === 'function') obj.material.map.dispose();
          if (typeof obj.material.dispose === 'function') obj.material.dispose();
        }
      }
      endingFloatingWishGroup.remove(obj);
    }
    endingFloatingWishes = [];

    const lines = (classWish && classWish.lines) ? classWish.lines : [
      '20/10 chúc các bạn nữ luôn vui, luôn xinh, luôn hạnh phúc.',
      'Quà nhiều thì nhận, lời chúc nhiều thì cười nha :))',
      'Mong các bạn lúc nào cũng vui vẻ, vì lớp có các bạn mới thành 11A2.',
      'Từ tập thể con trai hơi báo, hơi tào lao nhưng rất chân thành 💀',
      'Chúc toàn thể các bạn nữ 11A2 một ngày 20/10 thật vui và hạnh phúc! ❤️'
    ];

    const planeGeo = new THREE.PlaneGeometry(92, 12.5);
    lines.forEach((lineText, idx) => {
      const tex = createTextSpriteTexture(lineText, 0, '✨');
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(planeGeo, mat);

      const initY = -45 + idx * 36;
      const xOffset = (idx % 2 === 0 ? -12 : 12);
      const zOffset = 210 + (idx % 3) * 12;

      mesh.position.set(xOffset, initY, zOffset);
      endingFloatingWishGroup.add(mesh);

      endingFloatingWishes.push({
        mesh: mesh,
        baseX: xOffset,
        speedY: 0.12 + (idx % 2) * 0.03,
        swayPhase: idx * 1.3,
        swaySpeed: 0.014
      });
    });
  }

  function spawnSkyLanterns(girls) {
    skyLanterns.forEach(l => {
      if (l.mesh) {
        endingGroup.remove(l.mesh);
        if (typeof l.mesh.traverse === 'function') {
          l.mesh.traverse(child => {
            if (child.geometry && typeof child.geometry.dispose === 'function') child.geometry.dispose();
            if (child.material) {
              if (child.material.map && typeof child.material.map.dispose === 'function') child.material.map.dispose();
              if (typeof child.material.dispose === 'function') child.material.dispose();
            }
          });
        } else {
          if (l.mesh.geometry && typeof l.mesh.geometry.dispose === 'function') l.mesh.geometry.dispose();
          if (l.mesh.material && typeof l.mesh.material.dispose === 'function') l.mesh.material.dispose();
        }
      }
    });
    skyLanterns = [];

    const lanternCount = (girls && girls.length) ? girls.length : 25;
    const lanternGeo = new THREE.CylinderGeometry(4.2, 3.2, 9, 12, 1, true);

    for (let i = 0; i < lanternCount; i++) {
      const girl = (girls && girls[i]) || { shortName: 'Bạn ' + (i + 1), icon: '🌷' };

      const lanternMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xffa45b : 0xff6b8b,
        transparent: true,
        opacity: 0.88,
        wireframe: false
      });

      const lanternMesh = new THREE.Mesh(lanternGeo, lanternMat);

      const radius = 95 + Math.random() * 165;
      const angle = (i / lanternCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const x = Math.cos(angle) * radius;
      const y = -65 + Math.random() * 85;
      const z = Math.sin(angle) * radius;

      lanternMesh.position.set(x, y, z);

      const labelCanvas = document.createElement('canvas');
      labelCanvas.width = 256;
      labelCanvas.height = 64;
      const lCtx = labelCanvas.getContext('2d');
      lCtx.fillStyle = '#ffd166';
      lCtx.font = 'bold 26px "Be Vietnam Pro", sans-serif';
      lCtx.textAlign = 'center';
      lCtx.textBaseline = 'middle';
      lCtx.fillText(`${girl.shortName || girl.name} ${girl.icon || '🌷'}`, 128, 32);

      const labelTex = new THREE.Texture(labelCanvas);
      labelTex.needsUpdate = true;
      const labelSpriteMat = new THREE.SpriteMaterial({ map: labelTex, transparent: true });
      const labelSprite = new THREE.Sprite(labelSpriteMat);
      labelSprite.scale.set(16, 4, 1);
      labelSprite.position.set(0, -7, 0);
      lanternMesh.add(labelSprite);

      endingGroup.add(lanternMesh);

      skyLanterns.push({
        mesh: lanternMesh,
        speedY: 0.28 + Math.random() * 0.22,
        swingAngle: Math.random() * Math.PI * 2,
        swingSpeed: 0.02 + Math.random() * 0.02,
        radius: radius,
        girl: girl
      });
    }
  }

  function buildConstellation() {
    const starCount = 25;

    // 1. Tọa độ hình Trái Tim (25 điểm)
    for (let i = 0; i < starCount; i++) {
      const t = (i / starCount) * Math.PI * 2;
      const x = 7.5 * (16 * Math.pow(Math.sin(t), 3));
      const y = 7.5 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) + 80;
      const z = -120;
      constellationHeartPositions[i * 3] = x;
      constellationHeartPositions[i * 3 + 1] = y;
      constellationHeartPositions[i * 3 + 2] = z;

      constellationCurrentPositions[i * 3] = x;
      constellationCurrentPositions[i * 3 + 1] = y;
      constellationCurrentPositions[i * 3 + 2] = z;

      constellationTargetPositions[i * 3] = x;
      constellationTargetPositions[i * 3 + 1] = y;
      constellationTargetPositions[i * 3 + 2] = z;
    }

    // 2. Tọa độ chòm sao "20/10" (25 điểm chuẩn khớp)
    const datePoints = [
      [-86, 96, -120], [-73, 103, -120], [-62, 93, -120], [-74, 76, -120], [-86, 62, -120], [-62, 62, -120],
      [-42, 103, -120], [-28, 93, -120], [-28, 72, -120], [-42, 62, -120], [-54, 72, -120], [-54, 93, -120],
      [-6, 105, -120], [-13, 82, -120], [-20, 60, -120],
      [12, 93, -120], [22, 103, -120], [22, 80, -120], [22, 62, -120],
      [58, 103, -120], [72, 93, -120], [72, 72, -120], [58, 62, -120], [46, 72, -120], [46, 93, -120]
    ];

    for (let i = 0; i < starCount; i++) {
      constellationDatePositions[i * 3] = datePoints[i][0];
      constellationDatePositions[i * 3 + 1] = datePoints[i][1];
      constellationDatePositions[i * 3 + 2] = datePoints[i][2];
    }

    // 3. Đường nối hình Trái Tim
    heartIndices = [];
    for (let i = 0; i < starCount; i++) {
      heartIndices.push(i, (i + 1) % starCount);
    }
    const heartLinePositions = new Float32Array(heartIndices.length * 3);
    for (let k = 0; k < heartIndices.length; k++) {
      const pIdx = heartIndices[k];
      heartLinePositions[k * 3] = constellationCurrentPositions[pIdx * 3];
      heartLinePositions[k * 3 + 1] = constellationCurrentPositions[pIdx * 3 + 1];
      heartLinePositions[k * 3 + 2] = constellationCurrentPositions[pIdx * 3 + 2];
    }
    const constellationHeartLineGeo = new THREE.BufferGeometry();
    constellationHeartLineGeo.setAttribute('position', new THREE.BufferAttribute(heartLinePositions, 3));
    const heartMat = new THREE.LineBasicMaterial({
      color: 0xffeaa7,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    heartLinesMesh = new THREE.LineSegments(constellationHeartLineGeo, heartMat);
    endingGroup.add(heartLinesMesh);

    // 4. Đường nối chòm sao "20/10"
    dateIndices = [
      0, 1, 1, 2, 2, 3, 3, 4, 4, 5,
      6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 6,
      12, 13, 13, 14,
      15, 16, 16, 17, 17, 18,
      19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 19
    ];
    const dateLinePositions = new Float32Array(dateIndices.length * 3);
    for (let k = 0; k < dateIndices.length; k++) {
      const pIdx = dateIndices[k];
      dateLinePositions[k * 3] = constellationCurrentPositions[pIdx * 3];
      dateLinePositions[k * 3 + 1] = constellationCurrentPositions[pIdx * 3 + 1];
      dateLinePositions[k * 3 + 2] = constellationCurrentPositions[pIdx * 3 + 2];
    }
    const dateGeo = new THREE.BufferGeometry();
    dateGeo.setAttribute('position', new THREE.BufferAttribute(dateLinePositions, 3));
    const dateMat = new THREE.LineBasicMaterial({
      color: 0xff9ebb,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    });
    dateLinesMesh = new THREE.LineSegments(dateGeo, dateMat);
    endingGroup.add(dateLinesMesh);

    // 5. 25 ngôi sao lấp lánh (THREE.Points)
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(constellationCurrentPositions, 3));
    const starMat = new THREE.PointsMaterial({
      size: 4.8,
      map: createParticleTexture(),
      color: 0xffd166,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    constellationStarsMesh = new THREE.Points(starGeo, starMat);
    endingGroup.add(constellationStarsMesh);
  }

  function setConstellationMode(mode) {
    constellationMode = mode;
    const src = (mode === 'DATE') ? constellationDatePositions : constellationHeartPositions;
    for (let i = 0; i < 25 * 3; i++) {
      constellationTargetPositions[i] = src[i];
    }
  }

  function toggleConstellation() {
    setConstellationMode(constellationMode === 'HEART' ? 'DATE' : 'HEART');
    return constellationMode;
  }

  // Biến lưu trữ thời gian bắn pháo hoa tự động
  let lastAutoFireworkTime = 0;

  // Khởi tạo pháo hoa bung tỏa (Sphere Burst) tại tọa độ 3D xác định
  function spawnFireworkBurstAt(x, y, z, colorHex = null) {
    const sparkCount = 85;
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkVelocities = [];
    const sparkColors = new Float32Array(sparkCount * 3);

    const colorsPalette = [0xff9ebb, 0xffeaa7, 0xffd166, 0x7000ff, 0xffffff, 0xff758c];
    const pickedColorHex = colorHex || colorsPalette[Math.floor(Math.random() * colorsPalette.length)];
    const baseColor = new THREE.Color(pickedColorHex);

    for (let i = 0; i < sparkCount; i++) {
      sparkPositions[i * 3] = x;
      sparkPositions[i * 3 + 1] = y;
      sparkPositions[i * 3 + 2] = z;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 1.2 + Math.random() * 2.2;

      sparkVelocities.push({
        vx: Math.sin(phi) * Math.cos(theta) * speed,
        vy: Math.sin(phi) * Math.sin(theta) * speed,
        vz: Math.cos(phi) * speed
      });

      sparkColors[i * 3] = baseColor.r;
      sparkColors[i * 3 + 1] = baseColor.g;
      sparkColors[i * 3 + 2] = baseColor.b;
    }

    const sparkGeo = new THREE.BufferGeometry();
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    sparkGeo.setAttribute('color', new THREE.BufferAttribute(sparkColors, 3));

    const sparkMat = new THREE.PointsMaterial({
      size: 2.8,
      map: createParticleTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
    scene.add(sparkPoints);

    fireworkBursts.push({
      type: 'BURST',
      mesh: sparkPoints,
      geo: sparkGeo,
      velocities: sparkVelocities,
      positions: sparkPositions,
      life: 1.0,
      decay: 0.022
    });

    if (microShakeCallback) {
      microShakeCallback();
    }
  }

  // Phóng tên lửa pháo hoa bay vút lên từ chân trời kèm vệt tia lửa (Tet 2026 style)
  function launchFireworkRocket(targetX, targetY, targetZ, colorHex = null) {
    if (fireworkBursts.length >= 3) return; // Giới hạn tối đa 2-3 quả cùng lúc chống giật lag!

    const startX = targetX;
    const startY = -75;
    const startZ = targetZ || 180;

    const trailCount = 12;
    const trailPositions = new Float32Array(trailCount * 3);
    for (let k = 0; k < trailCount; k++) {
      trailPositions[k * 3] = startX;
      trailPositions[k * 3 + 1] = startY - k * 2.5;
      trailPositions[k * 3 + 2] = startZ;
    }

    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));

    const rocketColor = colorHex || (Math.random() > 0.5 ? 0xffd166 : 0xff758c);
    const trailMat = new THREE.PointsMaterial({
      size: 2.6,
      map: createParticleTexture(),
      color: rocketColor,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const rocketPoints = new THREE.Points(trailGeo, trailMat);
    scene.add(rocketPoints);

    fireworkBursts.push({
      type: 'ROCKET',
      mesh: rocketPoints,
      geo: trailGeo,
      currentX: startX,
      currentY: startY,
      currentZ: startZ,
      targetY: targetY,
      speedY: 4.2 + Math.random() * 1.0,
      colorHex: rocketColor
    });
  }

  // Pháo hoa 3D tương tác chạm màn hình
  function createFireworkBurst(screenX, screenY) {
    let burstOrigin;
    if (camera && typeof window !== 'undefined') {
      const vector = new THREE.Vector3(
        (screenX / window.innerWidth) * 2 - 1,
        -(screenY / window.innerHeight) * 2 + 1,
        0.5
      );
      vector.unproject(camera);
      const dir = vector.sub(camera.position).normalize();
      const distance = 260;
      burstOrigin = camera.position.clone().add(dir.multiplyScalar(distance));
    } else {
      burstOrigin = new THREE.Vector3(0, 40, 180);
    }

    spawnFireworkBurstAt(burstOrigin.x, burstOrigin.y, burstOrigin.z);
  }

  function clearAllFireworks() {
    for (let i = fireworkBursts.length - 1; i >= 0; i--) {
      const fw = fireworkBursts[i];
      scene.remove(fw.mesh);
      if (fw.geo) fw.geo.dispose();
      if (fw.mesh && fw.mesh.material) fw.mesh.material.dispose();
    }
    fireworkBursts = [];
  }

  // ===================================================================
  // CƠ CHẾ CÁCH LY PHÂN CẢNH TRIỆT ĐỂ (CHỐNG RÒ RỈ SCENE LEAKAGE)
  // ===================================================================
  function applySceneStage(stage) {
    currentStage = stage;

    if (stage === 'LOGIN') {
      cancelCameraTween();
      if (roomGroup) roomGroup.visible = false;
      if (endingGroup) endingGroup.visible = false;
      // Màn 1 (Login): TUYỆT ĐỐI ẨN HOÀN TOÀN TRÁI TIM 3D, VÀNH ĐAI VÀ ẢNH KỶ NIỆM
      if (galaxyParticles) {
        galaxyParticles.visible = false;
        disperseParticlesToDeepSpace();
      }
      if (deepSpaceStars) deepSpaceStars.visible = true;
      if (cosmicWindGroup) cosmicWindGroup.visible = true;
      clearAllFireworks();
      if (constellationMorphTimer) {
        clearTimeout(constellationMorphTimer);
        constellationMorphTimer = null;
      }
      targetRadius = 520;
      targetPhi = Math.PI / 2 - 0.28;
      targetTheta = 0;
      targetCenterLookAt.set(0, 0, 0);
      if (camera) {
        targetParallaxX = 0; targetParallaxY = 0; mouseParallaxX = 0; mouseParallaxY = 0;
        camera.position.set(0, 180, 520);
        camera.lookAt(0, 0, 0);
      }
    } else if (stage === 'INTRO') {
      cancelCameraTween();
      if (roomGroup) roomGroup.visible = false;
      if (endingGroup) endingGroup.visible = false;
      if (galaxyParticles) galaxyParticles.visible = true; // Bật hạt sao 3D để tụ thành số và chữ đếm ngược!
      if (deepSpaceStars) deepSpaceStars.visible = true;
      if (cosmicWindGroup) cosmicWindGroup.visible = true;
      clearAllFireworks();
      if (constellationMorphTimer) {
        clearTimeout(constellationMorphTimer);
        constellationMorphTimer = null;
      }
      targetRadius = 450;
      targetPhi = Math.PI / 2 - 0.05;
      targetTheta = 0;
      targetCenterLookAt.set(0, 0, 0);
    } else if (stage === 'ROOM') {
      targetRadius = 340;
      targetPhi = Math.PI / 2 - 0.14;
      targetTheta = 0;
      targetCenterLookAt.set(0, 15, 0);

      targetParallaxX = 0; targetParallaxY = 0; mouseParallaxX = 0; mouseParallaxY = 0;
      if (roomGroup) roomGroup.visible = true;
      if (orbitCardGroup) orbitCardGroup.visible = true;
      if (floatingWishGroup) floatingWishGroup.visible = true;
      if (endingGroup) endingGroup.visible = false;
      if (galaxyParticles) galaxyParticles.visible = true;
      if (deepSpaceStars) deepSpaceStars.visible = true;
      if (cosmicWindGroup) cosmicWindGroup.visible = true;

      clearAllFireworks();
      if (constellationMorphTimer) {
        clearTimeout(constellationMorphTimer);
        constellationMorphTimer = null;
      }

      skyLanterns.forEach(l => { if (l.mesh) l.mesh.visible = false; });
      if (constellationStarsMesh) constellationStarsMesh.visible = false;
      if (heartLinesMesh) heartLinesMesh.visible = false;
      if (dateLinesMesh) dateLinesMesh.visible = false;
      if (endingFloatingWishGroup) endingFloatingWishGroup.visible = false;
    } else if (stage === 'ENDING') {
      targetRadius = 540;
      targetPhi = Math.PI / 2 - 0.32;
      targetTheta = 0;
      targetCenterLookAt.set(0, 25, 0);

      targetParallaxX = 0; targetParallaxY = 0; mouseParallaxX = 0; mouseParallaxY = 0;
      if (roomGroup) roomGroup.visible = false;
      if (floatingWishGroup) floatingWishGroup.visible = false;
      if (endingGroup) endingGroup.visible = true;
      if (galaxyParticles) galaxyParticles.visible = true;
      if (endingFloatingWishGroup) endingFloatingWishGroup.visible = true;
      if (deepSpaceStars) deepSpaceStars.visible = true;
      if (cosmicWindGroup) cosmicWindGroup.visible = true;

      skyLanterns.forEach(l => { if (l.mesh) l.mesh.visible = true; });
      if (constellationStarsMesh) constellationStarsMesh.visible = true;
      if (constellationMode === 'HEART') {
        if (heartLinesMesh) heartLinesMesh.visible = true;
        if (dateLinesMesh) dateLinesMesh.visible = false;
      } else {
        if (heartLinesMesh) heartLinesMesh.visible = false;
        if (dateLinesMesh) dateLinesMesh.visible = true;
      }
    }
  }

  // ===================================================================
  // 4. ANIMATION LOOP (SOLID 60 FPS)
  // ===================================================================
  let clock = new THREE.Clock();

  function animate() {
    if (!isEngineRunning) return;
    animationFrameId = requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // 1. Nhịp tim thật (lub-dub: chu kỳ 1.2s phồng căng nảy nở, tỏa sóng hào quang)
    const cycleTime = elapsedTime % 1.2;
    const normTime = cycleTime / 1.2;
    let pulse = 0;
    if (normTime < 0.16) {
      // Nhịp 1 "lub": phồng căng mạnh mẽ (+16%)
      pulse = 0.16 * Math.sin((normTime / 0.16) * Math.PI);
    } else if (normTime >= 0.22 && normTime < 0.38) {
      // Nhịp 2 "dub": nảy nở thứ hai (+9%)
      pulse = 0.09 * Math.sin(((normTime - 0.22) / 0.16) * Math.PI);
    }
    const heartbeatScale = 1.0 + pulse;

    if (pointLightPink) {
      if (pointLightPink.color && typeof pointLightPink.color.setHex === 'function') {
        pointLightPink.color.setHex(0xff9ebb);
      }
      pointLightPink.intensity = 2.6 * heartbeatScale;
    }
    if (pointLightCyan) {
      if (pointLightCyan.color && typeof pointLightCyan.color.setHex === 'function') {
        pointLightCyan.color.setHex(0xffeaa7);
      }
      pointLightCyan.intensity = 2.0 * heartbeatScale;
    }

    // A. Co bóp nhịp tim thật lub-dub (15.000 hạt đầu) & Xoáy 360° Đĩa Ngân Hà (15.000 hạt sau)
    if (!isMorphing && galaxyGeo && galaxyGeo.attributes.position && particleBasePositions && particleBasePositions.length > 0) {
      const pos = galaxyGeo.attributes.position.array;
      const basePos = particleBasePositions;
      const HEART_COUNT = 15000;
      const PEDESTAL_COUNT = 15000;
      const Y_CENTER = 30.0;

      for (let i = 0; i < HEART_COUNT; i++) {
        const i3 = i * 3;
        const xBase = basePos[i3];
        const zBase = basePos[i3 + 2];

        // Trái Tim 3D đứng thẳng uy nghi, đập nảy nhịp nhàng theo nhịp tim thật
        let curX = xBase * heartbeatScale;
        let curY = Y_CENTER + (basePos[i3 + 1] - Y_CENTER) * heartbeatScale;
        let curZ = zBase * heartbeatScale;

        // Bụi sao viền ngoài nhấp nháy chuyển động sóng nhẹ nhàng ma thuật
        if (i >= 13500) {
          const auraDrift = Math.sin(elapsedTime * 1.2 + (heartTwinklePhases ? heartTwinklePhases[i] : 0)) * 0.8;
          curX += Math.cos(elapsedTime * 1.0 + i * 0.05) * 0.6;
          curY += auraDrift;
          curZ += Math.sin(elapsedTime * 0.9 + i * 0.08) * 0.6;
        }

        pos[i3] = curX;
        pos[i3 + 1] = curY;
        pos[i3 + 2] = curZ;
      }

      // Xoáy 360° Đĩa Ngân Hà Bồi Tụ Kèm 4 Nhánh Xoắn Logarithmic Sắc Nét Vĩnh Cửu
      vortexRotation += 0.0036;
      const tiltRad = (24.5 * Math.PI) / 180;
      const cosTP = Math.cos(tiltRad);
      const sinTP = Math.sin(tiltRad);

      const cVortex = Math.cos(vortexRotation);
      const sVortex = Math.sin(vortexRotation);

      for (let j = 0; j < PEDESTAL_COUNT; j++) {
        const idx = (HEART_COUNT + j) * 3;
        const x0 = pedestalUntiltedX[j] * cVortex - pedestalUntiltedZ[j] * sVortex;
        const z0 = pedestalUntiltedX[j] * sVortex + pedestalUntiltedZ[j] * cVortex;
        const y0 = pedestalUntiltedY[j];

        pos[idx] = x0;
        pos[idx + 1] = y0 * cosTP - z0 * sinTP;
        pos[idx + 2] = y0 * sinTP + z0 * cosTP;
      }

      galaxyGeo.attributes.position.needsUpdate = true;

      // Hạt sao nhấp nháy đa sắc độ (Twinkling Stardust) & bừng sáng ấm áp theo nhịp tim lub-dub
      if (galaxyGeo.attributes.color && galaxyGeo.attributes.color.array && particleBaseColors && particleBaseColors.length > 0) {
        const cols = galaxyGeo.attributes.color.array;
        for (let i = 0; i < HEART_COUNT; i++) {
          const i3 = i * 3;
          const tw = 0.09 * Math.sin(elapsedTime * (heartTwinkleFreqs ? heartTwinkleFreqs[i] : 2) + (heartTwinklePhases ? heartTwinklePhases[i] : 0));
          const hbBoost = 1.0 + pulse * 0.35 + tw;
          cols[i3] = Math.min(1.0, particleBaseColors[i3] * hbBoost);
          cols[i3 + 1] = Math.min(1.0, particleBaseColors[i3 + 1] * hbBoost);
          cols[i3 + 2] = Math.min(1.0, particleBaseColors[i3 + 2] * hbBoost);
        }
        galaxyGeo.attributes.color.needsUpdate = true;
      }
    }

    // Toàn bộ ngân hà: khi ở Intro morphing hạt lắc lư nhẹ, còn ở cảnh khác giữ thế tim chuẩn xác hướng mắt nhìn
    if (galaxyParticles && galaxyParticles.visible) {
      if (currentStage === 'INTRO' && isMorphing) {
        galaxyParticles.rotation.y = Math.sin(elapsedTime * 0.4) * 0.05;
      } else {
        galaxyParticles.rotation.y = 0;
      }
    }

    // Bầu trời sao sâu thẳm xoay nhẹ tạo cảm giác vô tận
    if (deepSpaceStars) {
      deepSpaceStars.rotation.y += 0.0003;
    }

    // Cập nhật Dải lụa hạt sao (Cosmic Wind)
    if (cosmicWindParticles && cosmicWindPositions) {
      const pos = cosmicWindPositions;
      const wCount = cosmicWindVelocities.length;
      for (let w = 0; w < wCount; w++) {
        const vel = cosmicWindVelocities[w];
        vel.phase += vel.freq;
        pos[w * 3] += vel.vx;
        pos[w * 3 + 1] += vel.vy + Math.sin(vel.phase) * 0.35;
        pos[w * 3 + 2] += vel.vz + Math.cos(vel.phase * 0.8) * 0.25;

        if (pos[w * 3] > 320) {
          pos[w * 3] = -320;
          pos[w * 3 + 1] = 85 + (Math.random() - 0.5) * 40;
        }
      }
      cosmicWindParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Cập nhật Sao Băng thành 1 ĐƯỜNG VẠCH BAY QUA LUÔN (Continuous Glowing Streak Line)
    if (meteors && meteors.length > 0) {
      meteors.forEach(m => {
        if (!m.active) {
          m.elapsed += delta;
          if (m.elapsed >= m.delay) {
            m.active = true;
            m.elapsed = 0;
            m.progress = 0;
            m.startX = -340 + Math.random() * 180;
            m.startY = 160 + Math.random() * 90;
            m.startZ = -40 + Math.random() * 160;
            m.dirX = 1.8 + Math.random() * 0.5;
            m.dirY = -1.1 - Math.random() * 0.4;
            m.dirZ = (Math.random() - 0.5) * 0.4;
            m.speed = 14.5 + Math.random() * 5.0; // Tốc độ xé gió
            if (m.lineMat) m.lineMat.opacity = 1.0;
            if (m.headMat) m.headMat.opacity = 1.0;
          }
        } else {
          m.progress += m.speed * delta * 60;
          const curX = m.startX + m.dirX * m.progress;
          const curY = m.startY + m.dirY * m.progress;
          const curZ = m.startZ + m.dirZ * m.progress;

          // 24 đốt tạo thành đường vạch sáng thẳng tắp
          const lPos = m.lineGeo.attributes.position.array;
          const streakLength = 76.0;
          for (let k = 0; k < m.segmentCount; k++) {
            const lagRatio = k / (m.segmentCount - 1);
            const lag = lagRatio * streakLength;
            lPos[k * 3]     = curX - m.dirX * lag;
            lPos[k * 3 + 1] = curY - m.dirY * lag;
            lPos[k * 3 + 2] = curZ - m.dirZ * lag;
          }
          m.lineGeo.attributes.position.needsUpdate = true;

          // Cập nhật đầu mũi chói lọi
          const hPos = m.headGeo.attributes.position.array;
          hPos[0] = curX;
          hPos[1] = curY;
          hPos[2] = curZ;
          m.headGeo.attributes.position.needsUpdate = true;

          if (curX > 360 || curY < -140) {
            m.active = false;
            if (m.lineMat) m.lineMat.opacity = 0.0;
            if (m.headMat) m.headMat.opacity = 0.0;
            m.delay = 1.8 + Math.random() * 3.2;
            m.elapsed = 0;
          }
        }
      });
    }

    // Cập nhật Cánh hoa bay lơ lửng trong gió ngân hà (Cosmic Petals)
    if (cosmicPetalsMesh && cosmicPetalPositions) {
      const pPos = cosmicPetalPositions;
      const pCount = cosmicPetalVelocities.length;
      for (let p = 0; p < pCount; p++) {
        const vel = cosmicPetalVelocities[p];
        vel.phaseX += vel.freq;
        vel.phaseY += vel.freq * 1.3;

        pPos[p * 3]     += vel.vx + Math.sin(vel.phaseX) * 0.35;
        pPos[p * 3 + 1] += vel.vy + Math.cos(vel.phaseY) * 0.22;
        pPos[p * 3 + 2] += vel.vz + Math.sin(vel.phaseY * 0.7) * 0.25;

        if (pPos[p * 3 + 1] < -80 || pPos[p * 3] > 280) {
          pPos[p * 3]     = -260 + (Math.random() - 0.5) * 80;
          pPos[p * 3 + 1] = 95 + Math.random() * 45;
          pPos[p * 3 + 2] = -50 + Math.random() * 120;
        }
      }
      cosmicPetalsMesh.geometry.attributes.position.needsUpdate = true;
    }



    // Cập nhật biến hình hạt sao Three.js
    if (isMorphing && galaxyGeo && galaxyGeo.attributes.position) {
      const pos = galaxyGeo.attributes.position.array;
      let hasMovement = false;
      const lerpFactor = 0.058;
      for (let i = 0; i < PARTICLE_COUNT * 3; i++) {
        const diff = particleTargetPositions[i] - pos[i];
        if (Math.abs(diff) > 0.06) {
          pos[i] += diff * lerpFactor;
          hasMovement = true;
        } else {
          pos[i] = particleTargetPositions[i];
        }
      }
      galaxyGeo.attributes.position.needsUpdate = true;
      if (!hasMovement && currentStage !== 'INTRO') {
        isMorphing = false;
      }
    }

    // 2. CĂN PHÒNG RIÊNG: Lời chúc & Ảnh Polaroid bay bồng bềnh lướt theo các nhánh xoáy ngân hà
    if (currentStage === 'ROOM' && roomGroup.visible) {
      const tiltRad = (24.0 * Math.PI) / 180;
      const cosT = Math.cos(tiltRad);
      const sinT = Math.sin(tiltRad);

      // A. Cập nhật thẻ ảnh kỷ niệm trôi bay bồng bềnh như câu chúc (Floating Polaroid Stream)
      if (orbitingCards.length > 0) {
        orbitingCards.forEach((card, idx) => {
          if (!card.isZoomed && !isCardZooming) {
            card.y += card.speed;
            card.swayPhase += 0.016;

            const curX = card.baseX + Math.sin(card.swayPhase) * 3.2;
            const curZ = card.baseZ + Math.cos(card.swayPhase * 0.8) * 2.0;

            // Fade in dưới đáy, sáng rõ ở giữa, fade out trên đỉnh
            let opacity = 0.96;
            if (card.y < -40) {
              opacity = Math.max(0, Math.min(0.96, (card.y - (-85)) / 45 * 0.96));
            } else if (card.y > 60) {
              opacity = Math.max(0, Math.min(0.96, (1.0 - (card.y - 60) / 40) * 0.96));
            }

            // Khi bay lên đỉnh quá giới hạn (y >= 100), quay về đáy (y = -85) lặp vô tận
            if (card.y >= 100) {
              card.y = -85;
              opacity = 0;
            }

            card.mesh.position.set(curX, card.y, curZ);
            if (card.mesh.material) {
              card.mesh.material.opacity = opacity;
            }
            if (camera) {
              card.mesh.lookAt(camera.position);
            }
          }
        });
      }

      // B. Hoạt ảnh Cinematic 3D Zoom (0.6s bay ra sát mắt người xem / bay ngược về)
      if (isCardZooming && activeZoomedCard) {
        const elapsed = performance.now() - zoomAnimStartTime;
        const t = Math.min(1.0, elapsed / ZOOM_DURATION);
        const ease = isZoomReturning
          ? (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
          : (1 - Math.pow(1 - t, 3)); // cubic ease-out cho cú bay lướt 0.6s

        if (!isZoomReturning) {
          activeZoomedCard.mesh.position.lerpVectors(zoomStartPos, zoomTargetPos, ease);
          activeZoomedCard.mesh.scale.lerpVectors(zoomStartScale, zoomTargetScale, ease);
          if (camera) activeZoomedCard.mesh.lookAt(camera.position);
          if (cinematicDimPlane && cinematicDimPlane.material) {
            cinematicDimPlane.material.opacity = ease * 0.72;
          }

          if (t >= 1.0) {
            isCardZooming = false;
          }
        } else {
          const curY = activeZoomedCard.y;
          const curX = activeZoomedCard.baseX + Math.sin(activeZoomedCard.swayPhase) * 3.2;
          const curZ = activeZoomedCard.baseZ + Math.cos(activeZoomedCard.swayPhase * 0.8) * 2.0;
          const destPos = new THREE.Vector3(curX, curY, curZ);
          const destScale = new THREE.Vector3(1, 1, 1);

          activeZoomedCard.mesh.position.lerpVectors(zoomStartPos, destPos, ease);
          activeZoomedCard.mesh.scale.lerpVectors(zoomStartScale, destScale, ease);
          if (camera) activeZoomedCard.mesh.lookAt(camera.position);
          if (cinematicDimPlane && cinematicDimPlane.material) {
            cinematicDimPlane.material.opacity = (1 - ease) * 0.72;
          }

          if (t >= 1.0) {
            isCardZooming = false;
            isZoomReturning = false;
            activeZoomedCard.isZoomed = false;
            activeZoomedCard = null;
            if (cinematicDimPlane) cinematicDimPlane.visible = false;
          }
        }
      } else if (activeZoomedCard && !isCardZooming) {
        if (camera) activeZoomedCard.mesh.lookAt(camera.position);
        if (cinematicDimPlane && cinematicDimPlane.material) {
          cinematicDimPlane.material.opacity = 0.72;
        }
      }

      // C. Cập nhật lời chúc 3D bay từ dưới lên -> mờ dần rồi tắt -> lặp vô tận (Infinite Loop)
      if (floatingWishItems.length > 0 && wishTextureList && wishTextureList.length > 0) {
        const planeScale = (camera && camera.aspect) ? Math.min(1.0, Math.max(0.72, camera.aspect / 1.35)) : 1.0;

        floatingWishItems.forEach((item) => {
          item.y += item.riseSpeed;
          item.swayPhase += item.swaySpeed;

          const curX = item.baseX + Math.sin(item.swayPhase) * 3.5;
          const curZ = item.baseZ + Math.cos(item.swayPhase * 0.8) * 2.2;

          // Tính độ trong suốt mờ ảo (Fade In dưới đáy, sáng rõ ở giữa, Fade Out tắt trên đỉnh)
          let opacity = 1.0;
          if (item.y < -35) {
            // Fade In khi mới trôi lên từ đáy (y: -75 -> -35)
            opacity = Math.max(0, Math.min(1.0, (item.y - (-75)) / 40));
          } else if (item.y > 45) {
            // Fade Out khi trôi lên cao (y: 45 -> 85)
            opacity = Math.max(0, Math.min(1.0, 1.0 - (item.y - 45) / 40));
          }

          // Khi câu chúc đã bay lên đỉnh và tắt hẳn (y >= 85)
          if (item.y >= 85) {
            item.y = -75; // Quay trở lại đáy
            // Lấy câu tiếp theo từ danh sách 20 câu chúc (Vòng lặp vô tận)
            nextWishIndex = (nextWishIndex + 1) % wishTextureList.length;
            item.textIndex = nextWishIndex;
            if (item.mesh.material && wishTextureList[item.textIndex]) {
              item.mesh.material.map = wishTextureList[item.textIndex];
              item.mesh.material.needsUpdate = true;
            }
            opacity = 0;
          }

          item.mesh.position.set(curX, item.y, curZ);
          item.mesh.scale.set(planeScale, planeScale, 1.0);
          if (item.mesh.material) {
            item.mesh.material.opacity = opacity * 0.96;
          }

          if (camera) {
            item.mesh.lookAt(camera.position);
          }
        });
      }

      if (floatingSparkleMesh) {
        floatingSparkleMesh.rotation.y += 0.0012;
      }
    }

    // 3. ĐẠI CẢNH ENDING (Nếu vào)
    if (currentStage === 'ENDING' && endingGroup.visible) {
      skyLanterns.forEach(lantern => {
        lantern.mesh.position.y += lantern.speedY;
        lantern.swingAngle += lantern.swingSpeed;
        lantern.mesh.position.x += Math.sin(lantern.swingAngle) * 0.28;

        if (lantern.mesh.position.y > 290) {
          lantern.mesh.position.y = -85;
        }
      });

      if (endingFloatingWishes.length > 0) {
        endingFloatingWishes.forEach(item => {
          item.mesh.position.y += item.speedY;
          item.swayPhase += item.swaySpeed;
          item.mesh.position.x = item.baseX + Math.sin(item.swayPhase) * 4.5;
          if (camera) {
            item.mesh.lookAt(camera.position);
          }
          if (item.mesh.position.y > 165) {
            item.mesh.position.y = -65;
          }
        });
      }

      if (constellationStarsMesh) {
        const lerpSpeed = 0.045;
        let starMoved = false;
        for (let i = 0; i < 25 * 3; i++) {
          const diff = constellationTargetPositions[i] - constellationCurrentPositions[i];
          if (Math.abs(diff) > 0.05) {
            constellationCurrentPositions[i] += diff * lerpSpeed;
            starMoved = true;
          } else {
            constellationCurrentPositions[i] = constellationTargetPositions[i];
          }
        }
        if (starMoved) {
          constellationStarsMesh.geometry.attributes.position.needsUpdate = true;

          if (heartLinesMesh && heartLinesMesh.geometry.attributes.position) {
            const hPos = heartLinesMesh.geometry.attributes.position.array;
            for (let k = 0; k < heartIndices.length; k++) {
              const pIdx = heartIndices[k];
              hPos[k * 3] = constellationCurrentPositions[pIdx * 3];
              hPos[k * 3 + 1] = constellationCurrentPositions[pIdx * 3 + 1];
              hPos[k * 3 + 2] = constellationCurrentPositions[pIdx * 3 + 2];
            }
            heartLinesMesh.geometry.attributes.position.needsUpdate = true;
          }

          if (dateLinesMesh && dateLinesMesh.geometry.attributes.position) {
            const dPos = dateLinesMesh.geometry.attributes.position.array;
            for (let k = 0; k < dateIndices.length; k++) {
              const pIdx = dateIndices[k];
              dPos[k * 3] = constellationCurrentPositions[pIdx * 3];
              dPos[k * 3 + 1] = constellationCurrentPositions[pIdx * 3 + 1];
              dPos[k * 3 + 2] = constellationCurrentPositions[pIdx * 3 + 2];
            }
            dateLinesMesh.geometry.attributes.position.needsUpdate = true;
          }
        }

        if (heartLinesMesh && dateLinesMesh) {
          if (constellationMode === 'HEART') {
            heartLinesMesh.material.opacity = Math.min(heartLinesMesh.material.opacity + 0.025, 0.75);
            dateLinesMesh.material.opacity = Math.max(dateLinesMesh.material.opacity - 0.025, 0.0);
          } else {
            heartLinesMesh.material.opacity = Math.max(heartLinesMesh.material.opacity - 0.025, 0.0);
            dateLinesMesh.material.opacity = Math.min(dateLinesMesh.material.opacity + 0.025, 0.85);
          }
        }
      }
    }

    // Cập nhật pháo hoa tương tác (khi người dùng click chạm tay)
    if (fireworkBursts.length > 0) {
      for (let i = fireworkBursts.length - 1; i >= 0; i--) {
        const fw = fireworkBursts[i];
        if (fw.type === 'ROCKET') {
          fw.currentY += fw.speedY;
          const pos = fw.geo.attributes.position.array;
          for (let k = 0; k < 12; k++) {
            pos[k * 3] = fw.currentX + (Math.random() - 0.5) * 1.2;
            pos[k * 3 + 1] = fw.currentY - k * 2.6;
            pos[k * 3 + 2] = fw.currentZ + (Math.random() - 0.5) * 1.2;
          }
          fw.geo.attributes.position.needsUpdate = true;

          if (fw.currentY >= fw.targetY) {
            scene.remove(fw.mesh);
            fw.geo.dispose();
            fw.mesh.material.dispose();
            fireworkBursts.splice(i, 1);
            spawnFireworkBurstAt(fw.currentX, fw.currentY, fw.currentZ, fw.colorHex);
          }
        } else {
          fw.life -= fw.decay;
          fw.mesh.material.opacity = Math.max(0, fw.life);

          const pos = fw.positions;
          const vels = fw.velocities;
          for (let j = 0; j < vels.length; j++) {
            pos[j * 3] += vels[j].vx;
            pos[j * 3 + 1] += vels[j].vy - 0.42;
            pos[j * 3 + 2] += vels[j].vz;

            vels[j].vx *= 0.98;
            vels[j].vy *= 0.98;
            vels[j].vz *= 0.98;
          }
          fw.geo.attributes.position.needsUpdate = true;

          if (fw.life <= 0) {
            scene.remove(fw.mesh);
            fw.geo.dispose();
            fw.mesh.material.dispose();
            fireworkBursts.splice(i, 1);
          }
        }
      }
    }

    // 4. BỘ ĐIỀU KHIỂN XOAY & NGẮM NHÌN ĐA CHIỀU (ORBITAL DRAG CONTROLLER)
    if (!isCameraTweening && camera) {
      curTheta += (targetTheta - curTheta) * 0.08;
      curPhi += (targetPhi - curPhi) * 0.08;
      curRadius += (targetRadius - curRadius) * 0.08;
      if (centerLookAt && targetCenterLookAt) {
        centerLookAt.x += (targetCenterLookAt.x - centerLookAt.x) * 0.08;
        centerLookAt.y += (targetCenterLookAt.y - centerLookAt.y) * 0.08;
        centerLookAt.z += (targetCenterLookAt.z - centerLookAt.z) * 0.08;
      }

      const sinPhi = Math.sin(curPhi);
      camera.position.x = centerLookAt.x + curRadius * sinPhi * Math.sin(curTheta);
      camera.position.y = centerLookAt.y + curRadius * Math.cos(curPhi);
      camera.position.z = centerLookAt.z + curRadius * sinPhi * Math.cos(curTheta);
      camera.lookAt(centerLookAt.x, centerLookAt.y, centerLookAt.z);

      if (!isPointerDragging && currentStage === 'ENDING') {
        targetTheta += 0.0006;
      }
    }

    renderer.render(scene, camera);
  }

  function clearIntroEngineTimeouts() {
    introTimeouts.forEach(id => clearTimeout(id));
    introTimeouts = [];
  }

  function tweenCamera(targetPos, targetLookAt, durationMs, onComplete) {
    cancelCameraTween();
    isCameraTweening = true;
    const tweenId = currentCameraTweenId;
    const startPos = camera.position.clone();
    const startTime = performance.now();

    function updateCam() {
      if (tweenId !== currentCameraTweenId) {
        isCameraTweening = false;
        return;
      }
      const now = performance.now();
      const progress = Math.min((now - startTime) / durationMs, 1);
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      camera.position.lerpVectors(startPos, targetPos, ease);
      camera.lookAt(targetLookAt);

      if (progress < 1) {
        requestAnimationFrame(updateCam);
      } else {
        isCameraTweening = false;

        // Đồng bộ lại góc cầu Orbital Drag Controller để người dùng tiếp tục xoay mượt mà
        const offset = camera.position.clone().sub(targetLookAt);
        curRadius = (typeof offset.length === 'function') ? offset.length() : Math.hypot(offset.x, offset.y, offset.z);
        targetRadius = curRadius;
        curPhi = Math.acos(Math.max(-1, Math.min(1, offset.y / (curRadius || 1))));
        targetPhi = curPhi;
        curTheta = Math.atan2(offset.x, offset.z);
        targetTheta = curTheta;
        if (typeof centerLookAt.copy === 'function') {
          centerLookAt.copy(targetLookAt);
        } else {
          centerLookAt.set(targetLookAt.x, targetLookAt.y, targetLookAt.z);
        }
        if (typeof targetCenterLookAt.copy === 'function') {
          targetCenterLookAt.copy(targetLookAt);
        } else {
          targetCenterLookAt.set(targetLookAt.x, targetLookAt.y, targetLookAt.z);
        }

        if (onComplete) onComplete();
      }
    }

    updateCam();
  }

  function flyThroughToRoom(girlData, onFinished) {
    clearIntroEngineTimeouts();
    currentGirlData = girlData;
    disperseParticlesToDeepSpace();
    applySceneStage('INTRO');

    if (galaxyParticles) {
      galaxyParticles.visible = true; // Bật hạt sao 3D để tạo số đếm và chữ morphing!
    }

    camera.position.set(0, 30, 480);
    camera.lookAt(0, 0, 0);

    const subText = document.getElementById('intro-sub-text');
    const mainText = document.getElementById('intro-main-text');
    const nameText = document.getElementById('intro-name-text');

    // 1. Số 3 rõ ràng, nổi bật, lộng lẫy (1.8s)
    if (subText) {
      subText.textContent = 'Chờ xíu nha người đẹp, chuẩn bị mở ra điều kỳ diệu... 🌷✨';
      subText.style.display = 'block';
      subText.classList.add('intro-text-visible');
    }
    if (mainText) {
      mainText.innerHTML = '<span class="countdown-pop-digit" style="display:inline-block; font-size: clamp(88px, 18vw, 150px); font-weight: 900; color: #ffd166; text-shadow: 0 0 35px rgba(255, 209, 102, 0.95), 0 0 65px rgba(255, 158, 187, 0.7);">3</span>';
      mainText.style.display = 'block';
      mainText.classList.add('intro-text-visible');
    }
    if (nameText) {
      nameText.style.display = 'none';
      nameText.classList.remove('intro-text-visible');
    }
    morphParticlesToText('3', 1.8, 0xffd166, 0xffffff);

    // 2. Số 2 rõ ràng (1.8s: 1.8s -> 3.6s)
    introTimeouts.push(setTimeout(() => {
      if (mainText) {
        mainText.innerHTML = '<span class="countdown-pop-digit" style="display:inline-block; font-size: clamp(88px, 18vw, 150px); font-weight: 900; color: #a55eea; text-shadow: 0 0 35px rgba(165, 94, 234, 0.95), 0 0 65px rgba(112, 161, 255, 0.7);">2</span>';
      }
      morphParticlesToText('2', 1.8, 0xa55eea, 0x48dbfb);
    }, 1800));

    // 3. Số 1 rõ ràng (1.8s: 3.6s -> 5.4s)
    introTimeouts.push(setTimeout(() => {
      if (mainText) {
        mainText.innerHTML = '<span class="countdown-pop-digit" style="display:inline-block; font-size: clamp(88px, 18vw, 150px); font-weight: 900; color: #ff4757; text-shadow: 0 0 35px rgba(255, 71, 87, 0.95), 0 0 65px rgba(255, 158, 187, 0.8);">1</span>';
      }
      morphParticlesToText('1', 1.8, 0xff4757, 0xffd166);
    }, 3600));

    // 4. Dòng chữ mừng: "Chúc Mừng 20/10 — 11A2 🌷" (2.8s: 5.4s -> 8.2s)
    introTimeouts.push(setTimeout(() => {
      if (subText) subText.style.display = 'none';
      if (mainText) {
        mainText.innerHTML = 'Chúc Mừng 20/10 — 11A2 <span class="blooming-tulip"><svg class="svg-tulip" viewBox="0 0 64 64" width="48" height="48" style="vertical-align:middle; display:inline-block;"><path d="M32 40 C30 48 31 58 32 62" stroke="#05c46b" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M31 46 C22 46 16 52 14 56 C20 56 28 52 31 48" fill="#05c46b"/><path d="M33 44 C42 44 48 50 50 54 C44 54 36 50 33 46" fill="#05c46b"/><path d="M32 10 C22 10 14 24 20 38 C26 44 38 44 44 38 C50 24 42 10 32 10 Z" fill="url(#tulipG)"/><path d="M32 14 C27 20 28 32 32 38 C36 32 37 20 32 14 Z" fill="#ff758c"/><defs><linearGradient id="tulipG" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ff2a5f"/><stop offset="100%" stop-color="#ff758c"/></linearGradient></defs></svg></span>';
        mainText.style.display = 'block';
        mainText.classList.add('intro-text-visible');
      }
      morphParticlesToText('20/10 — 11A2', 1.15, 0xff2a85, 0xffeaa7);
    }, 5400));

    // 5. Dòng chữ mừng riêng: "Gửi Riêng [Tên Bạn Nữ] ✨" (2.8s: 8.2s -> 11.0s)
    introTimeouts.push(setTimeout(() => {
      if (mainText) {
        mainText.style.display = 'none';
        mainText.classList.remove('intro-text-visible');
      }
      const girlName = (girlData && girlData.name) ? girlData.name : 'Người Đẹp';
      if (nameText) {
        nameText.innerHTML = `Gửi Riêng <span class="highlight-name">${girlName}</span> <span class="sparkle-star">✨</span>`;
        nameText.style.display = 'block';
        nameText.classList.add('intro-text-visible');
      }
      morphParticlesToText(girlName, 1.1, 0xffa8c5, 0xffffff);
    }, 8200));

    // 6. Sau khi đọc xong, các hạt bung tỏa và kết tinh thành Trái Tim 3D & Đài Ngân Hà (sau 11.0s)
    introTimeouts.push(setTimeout(() => {
      if (nameText) {
        nameText.style.display = 'none';
        nameText.classList.remove('intro-text-visible');
      }
      resetParticlesToGalaxy();
      if (galaxyParticles) galaxyParticles.visible = true;
      populateFloatingWishes(girlData ? girlData.wish : '', girlData);
      populateRoomCards(girlData);
      tweenCamera(new THREE.Vector3(0, 55, 340), new THREE.Vector3(0, 15, 0), 2500, () => {
        applySceneStage('ROOM');
        if (onFinished) onFinished();
      });
    }, 11000));
  }

  function skipIntroToRoom(girlData, onFinished) {
    cancelCameraTween();
    clearIntroEngineTimeouts();
    const subText = document.getElementById('intro-sub-text');
    const mainText = document.getElementById('intro-main-text');
    const nameText = document.getElementById('intro-name-text');
    if (subText) subText.style.display = 'none';
    if (mainText) {
      mainText.style.display = 'none';
      mainText.classList.remove('intro-text-visible');
    }
    if (nameText) {
      nameText.style.display = 'none';
      nameText.classList.remove('intro-text-visible');
    }
    currentGirlData = girlData;
    resetParticlesToGalaxy();
    if (galaxyParticles) galaxyParticles.visible = true;
    populateFloatingWishes(girlData ? girlData.wish : '', girlData);
    populateRoomCards(girlData);
    applySceneStage('ROOM');

    camera.position.set(0, 55, 340);
    camera.lookAt(0, 15, 0);

    if (onFinished) onFinished();
  }

  function zoomOutToEnding(allGirls, onFinished) {
    allGirlsList = allGirls;
    applySceneStage('ENDING');
    spawnSkyLanterns(allGirls);
    spawnEndingFloatingWishes(window.GIRLS_DATA ? window.GIRLS_DATA.classEndingWish : null);

    setConstellationMode('HEART');
    if (constellationMorphTimer) clearTimeout(constellationMorphTimer);
    constellationMorphTimer = setTimeout(() => {
      setConstellationMode('DATE');
    }, 5500);

    tweenCamera(new THREE.Vector3(0, 180, 540), new THREE.Vector3(0, 25, 0), 3800, () => {
      if (onFinished) onFinished();
    });
  }

  function returnToRoom(onFinished) {
    applySceneStage('ROOM');
    tweenCamera(new THREE.Vector3(0, 55, 340), new THREE.Vector3(0, 15, 0), 2200, () => {
      if (onFinished) onFinished();
    });
  }

  // Tương tác Cinematic 3D Zoom: Tách thẻ ảnh khỏi quỹ đạo ngân hà, lướt 0.6s ra giữa màn hình sát mắt người xem
  function zoomCardToCenter(cardData) {
    if (!camera || orbitingCards.length === 0) return;
    let targetCard = null;
    if (cardData && typeof cardData.index === 'number') {
      targetCard = orbitingCards.find(c => c.index === cardData.index);
    } else if (cardData && cardData.photoUrl) {
      targetCard = orbitingCards.find(c => c.photoUrl === cardData.photoUrl);
    }
    if (!targetCard && orbitingCards.length > 0) {
      targetCard = orbitingCards[0];
    }
    if (!targetCard) return;

    // Chặn gọi trùng lặp nếu thẻ này đã phóng to xong hoặc đang bay tới
    if (activeZoomedCard === targetCard && !isZoomReturning) {
      return;
    }

    if (activeZoomedCard && activeZoomedCard !== targetCard) {
      activeZoomedCard.isZoomed = false;
      activeZoomedCard.mesh.position.set(activeZoomedCard.baseX, activeZoomedCard.baseY, activeZoomedCard.baseZ);
      activeZoomedCard.mesh.scale.set(1, 1, 1);
    }

    activeZoomedCard = targetCard;
    targetCard.isZoomed = true;
    isCardZooming = true;
    isZoomReturning = false;
    zoomAnimStartTime = performance.now();

    zoomStartPos = targetCard.mesh.position.clone();
    zoomStartScale = targetCard.mesh.scale.clone();

    // Tính toán vị trí đích trước mắt camera 95 đơn vị theo hướng nhìn, phóng to x1.6 nét căng
    const camPos = camera.position.clone();
    const look = (centerLookAt && centerLookAt.clone) ? centerLookAt.clone() : new THREE.Vector3(0, 15, 0);
    const viewDir = look.sub(camPos).normalize();
    zoomTargetPos = camPos.clone().add(viewDir.clone().multiplyScalar(95));
    zoomTargetScale = new THREE.Vector3(1.6, 1.6, 1.6);

    // Bật màn che dịu vũ trụ phía sau bức ảnh (cách 108 đơn vị, không che mờ bức ảnh)
    if (cinematicDimPlane) {
      cinematicDimPlane.position.copy(camPos.clone().add(viewDir.clone().multiplyScalar(108)));
      cinematicDimPlane.lookAt(camera.position);
      cinematicDimPlane.visible = true;
    }

    const overlay = document.getElementById('cinematic-zoom-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.classList.add('active');
    }
  }

  function returnZoomedCardToOrbit() {
    if (!activeZoomedCard) return;
    if (isZoomReturning) return;
    isCardZooming = true;
    isZoomReturning = true;
    zoomAnimStartTime = performance.now();
    zoomStartPos = activeZoomedCard.mesh.position.clone();
    zoomStartScale = activeZoomedCard.mesh.scale.clone();

    const overlay = document.getElementById('cinematic-zoom-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => {
        if (!activeZoomedCard || isZoomReturning) {
          overlay.style.display = 'none';
        }
      }, 350);
    }
  }

  // ===================================================================
  // 6. XỬ LÝ SỰ KIỆN TƯƠNG TÁC (ORBITAL DRAG / ZOOM / RAYCAST / PHÁO HOA)
  // ===================================================================
  let lastTouchTime = 0;

  function setupInteractionEvents() {
    function handlePointerDown(event) {
      if (activeZoomedCard) return;

      if (event.target && event.target.closest) {
        const isInteractiveUI = event.target.closest(
          'button, input, .glass-panel, .modal-overlay, .wish-container, .film-reel-bar, .ending-actions-bar, .secret-gift-trigger, .room-header, #vinyl-audio-widget'
        );
        if (isInteractiveUI) return;
      }

      // Hỗ trợ cử chỉ Pinch Zoom 2 ngón tay trên điện thoại
      if (event.touches && event.touches.length === 2) {
        isPinchingOnCanvas = true;
        pinchStartDistance = Math.hypot(
          event.touches[0].clientX - event.touches[1].clientX,
          event.touches[0].clientY - event.touches[1].clientY
        );
        radiusOnPinchStart = targetRadius;
        return;
      }

      let clientX = event.clientX;
      let clientY = event.clientY;
      if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
        lastTouchTime = performance.now();
      }

      isPointerDragging = true;
      dragLastX = clientX;
      dragLastY = clientY;
      dragAccumDist = 0;
    }

    function handlePointerMove(event) {
      if (activeZoomedCard) return;

      // Xử lý cử chỉ phóng to thu nhỏ bằng 2 ngón tay
      if (isPinchingOnCanvas && event.touches && event.touches.length === 2) {
        const dist = Math.hypot(
          event.touches[0].clientX - event.touches[1].clientX,
          event.touches[0].clientY - event.touches[1].clientY
        );
        if (pinchStartDistance > 0) {
          const factor = dist / pinchStartDistance;
          targetRadius = Math.max(180, Math.min(680, radiusOnPinchStart / factor));
        }
        return;
      }

      let clientX = event.clientX;
      let clientY = event.clientY;
      if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      }

      if (isPointerDragging && typeof clientX === 'number' && typeof clientY === 'number') {
        const dx = clientX - dragLastX;
        const dy = clientY - dragLastY;
        dragAccumDist += Math.abs(dx) + Math.abs(dy);
        dragLastX = clientX;
        dragLastY = clientY;

        // Xoay góc phương vị và góc cực (Euler Spherical Angles) 360 độ tự do
        targetTheta -= dx * 0.0055;
        targetPhi -= dy * 0.0055;
        targetPhi = Math.max(0.18, Math.min(Math.PI - 0.18, targetPhi));
        if (canvasEl) canvasEl.style.cursor = 'grabbing';
        if (typeof document !== 'undefined' && document.body) document.body.style.cursor = 'grabbing';
      } else if (!isPointerDragging && currentStage === 'ROOM' && camera && typeof clientX === 'number' && typeof clientY === 'number') {
        // Cập nhật cursor: pointer khi rê chuột qua thẻ ảnh Polaroid hoặc Bé Mèo Nyan Cat
        mouseVector.x = (clientX / window.innerWidth) * 2 - 1;
        mouseVector.y = -(clientY / window.innerHeight) * 2 + 1;
        raycaster.setFromCamera(mouseVector, camera);

        const meshes = (orbitingCards.length > 0) ? orbitingCards.map(c => c.mesh).filter(Boolean) : [];
        const intersects = (meshes.length > 0) ? raycaster.intersectObjects(meshes, false) : [];

        if (intersects.length > 0) {
          if (canvasEl) canvasEl.style.cursor = 'pointer';
          if (typeof document !== 'undefined' && document.body) document.body.style.cursor = 'pointer';
        } else {
          if (canvasEl) canvasEl.style.cursor = 'default';
          if (typeof document !== 'undefined' && document.body) document.body.style.cursor = 'default';
        }
      }
    }

    function handlePointerUp(event) {
      if (isPinchingOnCanvas) {
        isPinchingOnCanvas = false;
        return;
      }

      let clientX = dragLastX;
      let clientY = dragLastY;
      if (event.changedTouches && event.changedTouches.length > 0) {
        clientX = event.changedTouches[0].clientX;
        clientY = event.changedTouches[0].clientY;
      } else if (typeof event.clientX === 'number') {
        clientX = event.clientX;
        clientY = event.clientY;
      }

      const wasTap = (dragAccumDist < 10);
      isPointerDragging = false;
      if (canvasEl) canvasEl.style.cursor = 'default';
      if (typeof document !== 'undefined' && document.body) document.body.style.cursor = 'default';

      // Xử lý chạm tap (không phải kéo xoay)
      if (wasTap && typeof clientX === 'number' && typeof clientY === 'number') {
        if (event.target && event.target.closest) {
          const isInteractiveUI = event.target.closest(
            'button, input, .glass-panel, .modal-overlay, .wish-container, .film-reel-bar, .ending-actions-bar, .secret-gift-trigger, .room-header, #vinyl-audio-widget'
          );
          if (isInteractiveUI) return;
        }

        // 1. Raycast kiểm tra chạm ảnh xoay quanh phòng (ROOM)
        if (currentStage === 'ROOM' && orbitingCards.length > 0 && camera) {
          mouseVector.x = (clientX / window.innerWidth) * 2 - 1;
          mouseVector.y = -(clientY / window.innerHeight) * 2 + 1;
          raycaster.setFromCamera(mouseVector, camera);

          const meshes = orbitingCards.map(c => c.mesh).filter(Boolean);
          const intersects = raycaster.intersectObjects(meshes, false);
          if (intersects.length > 0) {
            const hitMesh = intersects[0].object;
            if (activeZoomedCard && activeZoomedCard.mesh === hitMesh) {
              returnZoomedCardToOrbit();
              return;
            }
            if (hitMesh.userData) {
              zoomCardToCenter(hitMesh.userData);
              return;
            }
          } else if (activeZoomedCard && !isCardZooming) {
            // Chạm ra ngoài khi đang phóng to: lướt bay ngược về đúng vị trí quỹ đạo ban đầu trên dải ngân hà!
            returnZoomedCardToOrbit();
            return;
          }
        }
      }
    }

    function handleWheel(event) {
      if (event.target && event.target.closest && event.target.closest('.wish-scroller, .modal-overlay, .login-card')) {
        return;
      }
      targetRadius = Math.max(180, Math.min(680, targetRadius + event.deltaY * 0.35));
    }

    window.addEventListener('mousedown', handlePointerDown, false);
    window.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('mousemove', handlePointerMove, false);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('mouseup', handlePointerUp, false);
    window.addEventListener('touchend', handlePointerUp, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });
  }

  function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  }

  // Public APIs
  return {
    init: init,
    flyThroughToRoom: flyThroughToRoom,
    skipIntroToRoom: skipIntroToRoom,
    zoomOutToEnding: zoomOutToEnding,
    returnToRoom: returnToRoom,
    zoomCardToCenter: zoomCardToCenter,
    returnZoomedCardToOrbit: returnZoomedCardToOrbit,
    createFireworkBurst: createFireworkBurst,
    morphParticlesToText: morphParticlesToText,
    setStage: (stage) => { applySceneStage(stage); },
    setConstellationMode: setConstellationMode,
    toggleConstellation: toggleConstellation,
    populateFloatingWishes: populateFloatingWishes,
    populateRoomCards: populateRoomCards,
    getFloatingWishCount: () => floatingWishItems.length,
    getFloatingWishItems: () => floatingWishItems,
    getOrbitingCardCount: () => orbitingCards.length,
    renderFrame: animate
  };
})();

// Xuất ra toàn cục
window.GalaxyEngine = GalaxyEngine;
