/**
 * ===================================================================
 * OUR LITTLE HOUSE — 11A2: APP CONTROLLER & LOGIC FLOW
 * Điều khiển toàn bộ Single Page App:
 *  - Nạp dữ liệu 25 bạn nữ từ girls.json (kèm fallback an toàn chống CORS file://)
 *  - Tìm kiếm & xác thực thông minh (Alias matching + Tiếng Việt bỏ dấu)
 *  - Giao diện đăng nhập thuần khiết: Người dùng tự gõ Tên & Ngày sinh
 *  - Quản lý luồng chuyển cảnh (Màn 1 -> Màn 2 -> Màn 3 -> Màn 4 -> Màn 5)
 *  - Nhận diện xoay ngang màn hình tự động đa nền tảng không reload
 *  - Lời chúc 3D bay bồng bềnh kiểu Dr.Gifter Falling Text 3D
 *  - Hộp quà bí mật nơ hồng & nổ pháo hoa Confetti
 *  - Xem ảnh cận cảnh Zoom x2.8 sát mặt kính & 3D Tilt Parallax & Pinch-Zoom
 *  - Widget âm thanh đĩa than Vinyl & Web Audio API Lofi Piano Synth Fallback
 *  - Micro-shake rung màn hình khi chạm pháo hoa
 * ===================================================================
 */

(function () {
  'use strict';

  // --- Biến lưu trữ dữ liệu lớp 11A2 ---
  let girlsData = [];
  let classEndingWish = {
    title: 'Gửi 25 bông hoa của 11A2 🌷',
    lines: [
      '20/10 chúc các bạn nữ luôn vui, luôn xinh, luôn hạnh phúc.',
      'Quà nhiều thì nhận, lời chúc nhiều thì cười nha :))',
      'Mong các bạn lúc nào cũng vui vẻ, vì lớp có các bạn mới thành 11A2.',
      'Từ tập thể con trai hơi báo, hơi tào lao nhưng rất chân thành 💀',
      'Chúc toàn thể các bạn nữ 11A2 một ngày 20/10 thật vui và hạnh phúc! ❤️'
    ]
  };

  let currentGirl = null;
  let isWishPaused = false;
  let wishScrollInterval = null;
  let introTimers = [];
  let resetPhotoZoom = null;

  // Quản lý hiển thị các phân cảnh (Screen Switcher)
  function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => {
      s.classList.remove('active');
    });
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
    }
  }

  // Hiệu ứng micro-shake rung nhẹ màn hình kèm Web Vibration API
  function triggerMicroShake() {
    const appContainer = document.getElementById('app-container');
    if (appContainer) {
      appContainer.classList.remove('micro-shake');
      void appContainer.offsetWidth; // Buộc reflow để kích hoạt lại CSS animation
      appContainer.classList.add('micro-shake');
      setTimeout(() => {
        appContainer.classList.remove('micro-shake');
      }, 250);
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(40);
      } catch (e) {
        // Bỏ qua nếu bị chặn quyền rung
      }
    }
  }

  // Quản lý hẹn giờ Intro chống rò rỉ khi người dùng bấm Bỏ qua
  function clearIntroTimers() {
    introTimers.forEach(id => clearTimeout(id));
    introTimers = [];
  }

  function resetIntroTextClasses() {
    const subEl = document.getElementById('intro-sub-text');
    const mainEl = document.getElementById('intro-main-text');
    const nameEl = document.getElementById('intro-name-text');
    if (subEl) subEl.classList.remove('intro-text-visible');
    if (mainEl) mainEl.classList.remove('intro-text-visible');
    if (nameEl) nameEl.classList.remove('intro-text-visible');
  }

  // Nạp dữ liệu 25 bạn nữ: Ưu tiên JSON qua HTTP, fallback an toàn qua girls-data.js khi mở file://
  function loadGirlsData(callback) {
    if (typeof window !== 'undefined' && window.GIRLS_DATA && window.GIRLS_DATA.girls && window.GIRLS_DATA.girls.length > 0) {
      girlsData = window.GIRLS_DATA.girls;
      if (window.GIRLS_DATA.classEndingWish) {
        classEndingWish = window.GIRLS_DATA.classEndingWish;
      }
      if (callback) callback();
      return;
    }

    if (typeof fetch === 'function') {
      fetch('data/girls.json')
        .then(res => {
          if (!res.ok) throw new Error('Network error: ' + res.status);
          return res.json();
        })
        .then(data => {
          if (data && data.girls) {
            girlsData = data.girls;
            if (data.classEndingWish) classEndingWish = data.classEndingWish;
          }
          if (callback) callback();
        })
        .catch(err => {
          console.warn('Dual-loader: Fetch data/girls.json fallback:', err);
          if (typeof window !== 'undefined' && window.GIRLS_DATA && window.GIRLS_DATA.girls) {
            girlsData = window.GIRLS_DATA.girls;
            if (window.GIRLS_DATA.classEndingWish) classEndingWish = window.GIRLS_DATA.classEndingWish;
          }
          if (callback) callback();
        });
    } else {
      if (callback) callback();
    }
  }

  // --- Khởi tạo Audio Engine (MP3 + Web Audio Synth Fallback) ---
  const AudioEngine = (function () {
    let audioCtx = null;
    let bgmAudio = null;
    let isPlaying = false;
    let isSynthRunning = false;
    let synthTimer = null;
    let hasUserInteracted = false;

    // Chuỗi hợp âm Lofi Piano ấm áp (Cmaj7 -> Am7 -> Fmaj7 -> G7)
    const LOFI_CHORDS = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7: C4, E4, G4, B4
      [220.00, 261.63, 329.63, 392.00], // Am7:   A3, C4, E4, G4
      [174.61, 220.00, 261.63, 329.63], // Fmaj7: F3, A3, C4, E4
      [196.00, 246.94, 293.66, 349.23]  // G7:    G3, B3, D4, F4
    ];
    let chordIndex = 0;

    function initAudioContext() {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
        }
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }

    function playPianoNote(freq, time, duration = 1.4) {
      if (!audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(950, time);
        filter.Q.setValueAtTime(1.5, time);

        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.linearRampToValueAtTime(0.12, time + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(time);
        osc.stop(time + duration);
      } catch (err) {
        // Bỏ qua lỗi audio
      }
    }

    function startLofiSynth() {
      if (isSynthRunning) return;
      isSynthRunning = true;

      function stepProgression() {
        if (!isPlaying || !isSynthRunning || !audioCtx) return;

        const now = audioCtx.currentTime;
        const currentChord = LOFI_CHORDS[chordIndex % LOFI_CHORDS.length];
        chordIndex++;

        currentChord.forEach((noteFreq, idx) => {
          playPianoNote(noteFreq, now + idx * 0.28, 2.2);
        });

        synthTimer = setTimeout(stepProgression, 2400);
      }

      stepProgression();
    }

    function stopLofiSynth() {
      isSynthRunning = false;
      if (synthTimer) {
        clearTimeout(synthTimer);
        synthTimer = null;
      }
    }

    let mp3Failed = false;

    function tryPlayMp3(onFail) {
      if (mp3Failed) {
        if (onFail) onFail();
        return;
      }

      if (!bgmAudio) {
        bgmAudio = new Audio('assets/music/bgm.mp3');
        bgmAudio.loop = true;
        bgmAudio.volume = 0.5;
        bgmAudio.onerror = () => {
          mp3Failed = true;
          if (onFail) onFail();
        };
      }

      const p = bgmAudio.play();
      if (p !== undefined) {
        p.then(() => {
          isPlaying = true;
          updateVinylUI(true);
        })
        .catch(() => {
          mp3Failed = true;
          if (onFail) onFail();
        });
      } else {
        isPlaying = true;
        updateVinylUI(true);
      }
    }

    function togglePlay() {
      initAudioContext();
      hasUserInteracted = true;

      if (isPlaying) {
        if (bgmAudio) bgmAudio.pause();
        stopLofiSynth();
        isPlaying = false;
        updateVinylUI(false);
      } else {
        isPlaying = true;
        tryPlayMp3(() => {
          startLofiSynth();
          updateVinylUI(true);
        });
      }
    }

    function unlockOnFirstTouch() {
      if (hasUserInteracted) return;
      hasUserInteracted = true;
      initAudioContext();
      if (!isPlaying) {
        tryPlayMp3(() => {
          startLofiSynth();
          isPlaying = true;
          updateVinylUI(true);
        });
      }
    }

    function updateVinylUI(active) {
      const disc = document.querySelector('.vinyl-disc');
      if (disc) {
        if (active) disc.classList.add('playing');
        else disc.classList.remove('playing');
      }
    }

    function playCrystalChime() {
      initAudioContext();
      if (!audioCtx) return;
      try {
        const now = audioCtx.currentTime;
        const freqs = [1760, 2217.46, 2637.02, 3520]; // A6, C#7, E7, A7
        freqs.forEach((f, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + idx * 0.04);

          gain.gain.setValueAtTime(0.0001, now + idx * 0.04);
          gain.gain.linearRampToValueAtTime(0.09 / (idx + 1), now + idx * 0.04 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 1.6);

          osc.connect(gain);
          gain.connect(audioCtx.destination);

          osc.start(now + idx * 0.04);
          osc.stop(now + idx * 0.04 + 1.6);
        });
      } catch (e) {}
    }

    function playKeyTap() {
      initAudioContext();
      if (!audioCtx) return;
      try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(540 + Math.random() * 80, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } catch (e) {}
    }

    return {
      initAudioContext: initAudioContext,
      togglePlay: togglePlay,
      unlockOnFirstTouch: unlockOnFirstTouch,
      playCrystalChime: playCrystalChime,
      playKeyTap: playKeyTap,
      isPlaying: () => isPlaying
    };
  })();

  // --- Chuẩn hóa Tiếng Việt (Bỏ dấu, chữ thường) ---
  function removeVietnameseAccents(str) {
    if (!str) return '';
    return str
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  // Chuẩn hóa ngày sinh (bỏ dấu gạch chéo, khoảng trắng)
  function normalizeDob(str) {
    if (!str) return '';
    return str.toString().replace(/[\/\-\.\s]/g, '').trim();
  }

  // Kiểm tra ngày sinh khớp với girl
  function isDobMatch(girl, rawDob) {
    if (!rawDob) return true;
    const cleanDob = normalizeDob(rawDob);
    const gDobClean = normalizeDob(girl.dob);
    if (gDobClean === cleanDob || gDobClean.includes(cleanDob) || cleanDob.includes(gDobClean)) return true;
    if (girl.dobAliases && Array.isArray(girl.dobAliases)) {
      return girl.dobAliases.some(alias => {
        const ca = normalizeDob(alias);
        return ca === cleanDob || cleanDob.includes(ca) || ca.includes(cleanDob);
      });
    }
    return false;
  }

  // Đánh giá điểm độ khớp giữa tên nhập vào và bạn nữ
  function scoreGirlMatch(girl, rawName) {
    const cleanName = removeVietnameseAccents(rawName);
    const nameTokens = cleanName.split(' ').filter(Boolean);
    const noSpaceInput = cleanName.replace(/\s+/g, '');

    const gFullName = removeVietnameseAccents(girl.name);
    const gFullNoSpace = gFullName.replace(/\s+/g, '');
    const gShortName = removeVietnameseAccents(girl.shortName);
    const gShortNoSpace = gShortName.replace(/\s+/g, '');

    // 1. Khớp chính xác tuyệt đối họ tên hoặc tên gọi
    if (gFullName === cleanName || gFullNoSpace === noSpaceInput) return 1000;
    if (gShortName === cleanName || gShortNoSpace === noSpaceInput) return 900;

    // 2. Khớp chính xác alias
    if (girl.searchAliases && Array.isArray(girl.searchAliases)) {
      for (const alias of girl.searchAliases) {
        const ca = removeVietnameseAccents(alias);
        const caNoSpace = ca.replace(/\s+/g, '');
        if (ca === cleanName || caNoSpace === noSpaceInput) return 800;
      }
    }

    // 3. Khớp tập hợp các từ (Tokens)
    const gTokens = gFullName.split(' ').filter(Boolean);
    const allTokensMatch = nameTokens.every(t => gTokens.includes(t));
    if (allTokensMatch && nameTokens.length >= 2) return 500 + nameTokens.length * 50;

    // 4. Khớp cụm từ con
    if (gFullName.includes(cleanName) || cleanName.includes(gFullName)) return 300;

    if (girl.searchAliases && Array.isArray(girl.searchAliases)) {
      for (const alias of girl.searchAliases) {
        const ca = removeVietnameseAccents(alias);
        if (ca.includes(cleanName) || cleanName.includes(ca)) return 200;
      }
    }

    return 0;
  }

  // --- Xác thực đăng nhập thông minh ---
  function findGirlByNameAndDob(rawName, rawDob) {
    if (!rawName) return null;

    let candidates = [];
    for (const g of girlsData) {
      const score = scoreGirlMatch(g, rawName);
      if (score > 0) {
        const dobOk = isDobMatch(g, rawDob);
        candidates.push({ girl: g, score: score, dobOk: dobOk });
      }
    }

    if (candidates.length === 0) {
      return { error: 'not_found' };
    }

    if (rawDob) {
      candidates.sort((a, b) => {
        if (a.dobOk !== b.dobOk) return a.dobOk ? -1 : 1;
        return b.score - a.score;
      });
    } else {
      candidates.sort((a, b) => b.score - a.score);
    }

    const topCandidate = candidates[0];
    if (rawDob && !topCandidate.dobOk) {
      return { error: 'dob_mismatch', girl: topCandidate.girl };
    }

    return { success: true, girl: topCandidate.girl };
  }

  // ===================================================================
  // CÁC LUỒNG MÀN HÌNH CHÍNH
  // ===================================================================

  let countdownTimer = null;
  let isCountdownActive = false;
  let roomButtonRevealTimer = null;

  // ===================================================================
  // HIỆU ỨNG MƯA MÃ HEX TÌNH YÊU 11A2 (#matrix-rain-overlay)
  // Các ký tự ma trận rơi từ trên xuống dưới chúc mừng bạn nữ 11A2
  // ===================================================================
  function triggerMatrixRainUnlock(onComplete) {
    const overlay = document.getElementById('matrix-rain-overlay');
    if (!overlay || typeof document === 'undefined') {
      if (onComplete) onComplete();
      return;
    }

    overlay.innerHTML = '';
    const canvas = document.createElement('canvas');
    canvas.width = (typeof window !== 'undefined' && window.innerWidth) ? window.innerWidth : 800;
    canvas.height = (typeof window !== 'undefined' && window.innerHeight) ? window.innerHeight : 600;
    overlay.appendChild(canvas);
    overlay.classList.add('active');

    const ctx = (canvas.getContext && typeof canvas.getContext === 'function') ? canvas.getContext('2d') : null;
    if (!ctx) {
      setTimeout(() => {
        overlay.classList.remove('active');
        if (onComplete) onComplete();
      }, 500);
      return;
    }

    const phrases = [
      '11A2', '20/10', '🌷', '💖', '✨', '0x2010', '0x11A2', 'LOVE',
      'HAPPY 20-10', 'CHÚC BẠN NỮ 11A2 20/10', 'BEAUTIFUL', 'XINH ĐẸP',
      '0101', '1100', 'GIRLS', 'ANGEL'
    ];

    const fontSize = 16;
    const columns = Math.floor(canvas.width / 24) || 20;
    const drops = [];
    for (let c = 0; c < columns; c++) {
      drops[c] = Math.floor(Math.random() * -25);
    }

    let isRunning = true;
    let animId = null;

    function draw() {
      if (!isRunning) return;
      if (typeof ctx.fillRect === 'function') {
        ctx.fillStyle = 'rgba(6, 4, 18, 0.18)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.font = `bold ${fontSize}px "Be Vietnam Pro", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = phrases[Math.floor(Math.random() * phrases.length)];
        const x = i * 24;
        const y = drops[i] * fontSize;

        if (typeof ctx.fillText === 'function') {
          // Đầu tia sáng trắng
          ctx.fillStyle = '#ffffff';
          ctx.fillText(text, x, y);

          // Thân hạt hồng pastel / vàng kim
          ctx.fillStyle = (i % 3 === 0) ? '#ff2a85' : ((i % 3 === 1) ? '#ff758c' : '#ffd166');
          ctx.fillText(text, x, y - fontSize);
        }

        if (y > canvas.height && Math.random() > 0.96) {
          drops[i] = 0;
        }
        drops[i]++;
      }
      if (typeof requestAnimationFrame === 'function') {
        animId = requestAnimationFrame(draw);
      }
    }

    draw();

    // Rơi rực rỡ 1.2s rồi chuyển tiếp êm ái
    setTimeout(() => {
      isRunning = false;
      if (animId && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(animId);
      overlay.classList.remove('active');
      setTimeout(() => {
        overlay.innerHTML = '';
        if (onComplete) onComplete();
      }, 350);
    }, 1200);
  }

  // Mở khóa vào không gian lớp 11A2
  function handleUnlock(girl) {
    currentGirl = girl;
    AudioEngine.unlockOnFirstTouch();
    AudioEngine.playCrystalChime();

    // Màn che bảo mật tan biến êm ái như làn sương
    const overlay = document.getElementById('matrix-rain-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }

    const loginCard = document.querySelector('.login-card');
    if (loginCard) {
      loginCard.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      loginCard.style.opacity = '0';
      loginCard.style.transform = 'scale(0.95)';
    }

    // Chuyển thẳng sang Screen Intro và kích hoạt chuỗi đếm ngược 3D & chữ chúc mừng
    setTimeout(() => {
      showScreen('screen-intro');
      GalaxyEngine.setStage('INTRO');
      GalaxyEngine.flyThroughToRoom(girl, () => {
        clearIntroTimers();
        enterPersonalRoom(girl);
      });
    }, 450);
  }

  function checkAndTriggerOrientationFlow() {
    // Giữ hàm để tương thích nếu được gọi
    if (!isCountdownActive) {
      startCountdown();
    }
  }

  function startCountdown() {
    if (isCountdownActive) return;
    isCountdownActive = true;
    AudioEngine.unlockOnFirstTouch();

    if (currentGirl) {
      startIntroSequence(currentGirl);
    }
  }

  // Màn 3: Three.js Cinematic Intro — Hạt sao biến hình & Đếm ngược 3D thuần túy
  function startIntroSequence(girl) {
    clearIntroTimers();
    resetIntroTextClasses();
    showScreen('screen-intro');
    GalaxyEngine.setStage('INTRO');

    GalaxyEngine.flyThroughToRoom(girl, () => {
      clearIntroTimers();
      enterPersonalRoom(girl);
    });
  }

  function skipIntro() {
    if (!currentGirl) return;
    clearIntroTimers();
    resetIntroTextClasses();
    GalaxyEngine.skipIntroToRoom(currentGirl, () => {
      enterPersonalRoom(currentGirl);
    });
  }

  // Màn 4: Căn phòng riêng của bạn nữ
  function enterPersonalRoom(girl) {
    showScreen('screen-room');

    const avatarEl = document.getElementById('room-girl-avatar');
    const nameEl = document.getElementById('room-girl-name');
    const titleEl = document.getElementById('room-girl-title');

    if (avatarEl) avatarEl.textContent = girl.icon || '🌷';
    if (nameEl) nameEl.textContent = girl.name;
    if (titleEl) titleEl.textContent = girl.giftTitle || 'Hoa Khôi 11A2';

    // Cập nhật vòng xoay các bức ảnh kỷ niệm Polaroid 2 bên rìa
    if (window.GalaxyEngine && window.GalaxyEngine.populateRoomCards) {
      window.GalaxyEngine.populateRoomCards(girl);
    }

    // Cập nhật hệ thống Lời chúc 3D bay bồng bềnh 8 câu đồng thời
    if (window.GalaxyEngine && window.GalaxyEngine.populateFloatingWishes) {
      window.GalaxyEngine.populateFloatingWishes(girl.wish, girl);
    }

    // Vẫn nạp dữ liệu vào scroller DOM để tương thích 100% test_suite
    setupInfiniteWishScroller(girl.wish);
  }

  function setupInfiniteWishScroller(wishText) {
    const streamEl = document.getElementById('wish-stream');
    const scrollerEl = document.getElementById('wish-scroller');
    if (!streamEl || !scrollerEl) return;

    if (wishScrollInterval) {
      cancelAnimationFrame(wishScrollInterval);
      wishScrollInterval = null;
    }

    const lines = (wishText || '')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    if (lines.length === 0) {
      lines.push('Chúc cậu ngày 20/10 luôn tràn ngập tiếng cười và hạnh phúc! 🌷✨');
    }

    const renderLines = [...lines, ...lines];
    streamEl.innerHTML = '';

    renderLines.forEach((lineText, idx) => {
      const p = document.createElement('div');
      p.className = 'wish-line' + (idx % 4 === 0 ? ' highlight' : '');
      p.textContent = lineText;
      streamEl.appendChild(p);
    });

    let currentScroll = 0;
    const speed = 0.55;

    function autoScroll() {
      if (!isWishPaused && scrollerEl) {
        currentScroll += speed;
        const firstClone = streamEl.children[lines.length];
        const loopResetPoint = firstClone ? firstClone.offsetTop : (streamEl.scrollHeight / 2);

        if (currentScroll >= loopResetPoint) {
          currentScroll = 0;
        }
        scrollerEl.scrollTop = currentScroll;
      }
      wishScrollInterval = requestAnimationFrame(autoScroll);
    }

    wishScrollInterval = requestAnimationFrame(autoScroll);

    scrollerEl.onmouseenter = () => { isWishPaused = true; };
    scrollerEl.onmouseleave = () => { isWishPaused = false; };
    scrollerEl.ontouchstart = () => { isWishPaused = true; };
    scrollerEl.ontouchend = () => {
      setTimeout(() => { isWishPaused = false; }, 1500);
    };
  }

  function toggleWishScroll() {
    isWishPaused = !isWishPaused;
    const btn = document.getElementById('btn-toggle-wish');
    if (btn) {
      btn.textContent = isWishPaused ? '▶' : '⏸';
    }
  }

  function resetWishScroll() {
    const scrollerEl = document.getElementById('wish-scroller');
    if (scrollerEl) scrollerEl.scrollTop = 0;
  }

  // Mở hộp quà bí mật nơ hồng
  function openSecretGift() {
    if (!currentGirl) return;

    triggerConfettiCelebration();
    triggerMicroShake();

    const modal = document.getElementById('modal-gift-reveal');
    const iconEl = document.getElementById('gift-reveal-icon');
    const honorTitleEl = document.getElementById('gift-honor-title');
    const girlNameEl = document.getElementById('gift-honor-girl');

    if (iconEl) iconEl.textContent = currentGirl.icon || '🎁';
    if (honorTitleEl) honorTitleEl.textContent = currentGirl.giftTitle || 'Nữ Thần 11A2 🌷';
    if (girlNameEl) girlNameEl.textContent = currentGirl.name;

    if (modal) modal.classList.add('active');
  }

  function triggerConfettiCelebration() {
    if (window.confetti) {
      window.confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ff2a85', '#ffd166', '#00f0ff', '#ffffff', '#7000ff']
      });

      setTimeout(() => {
        window.confetti({
          particleCount: 60,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.75 },
          colors: ['#ff2a85', '#ffd166', '#ff70a6']
        });
        window.confetti({
          particleCount: 60,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.75 },
          colors: ['#00f0ff', '#ffd166', '#7000ff']
        });
      }, 350);
    }
  }

  // Xem chi tiết ảnh (Zoom x2.8 & 3D Tilt Modal)
  function showPhotoDetailModal(cardData) {
    const modal = document.getElementById('modal-photo-detail');
    const imgEl = document.getElementById('photo-detail-img');
    const fallbackEl = document.getElementById('photo-fallback-card');
    const titleEl = document.getElementById('photo-detail-title');
    const iconEl = document.getElementById('photo-fallback-icon');

    if (!modal) return;

    if (titleEl) titleEl.textContent = cardData.title || 'Kỷ Niệm 11A2';

    if (cardData.isCustomPhoto && cardData.photoUrl) {
      if (imgEl) {
        imgEl.src = cardData.photoUrl;
        imgEl.style.display = 'block';
      }
      if (fallbackEl) fallbackEl.style.display = 'none';
    } else {
      if (imgEl) imgEl.style.display = 'none';
      if (fallbackEl) {
        fallbackEl.style.display = 'flex';
        if (iconEl) iconEl.textContent = cardData.icon || '🌷';
        const girlTitleEl = document.getElementById('fallback-card-title');
        if (girlTitleEl && currentGirl) {
          girlTitleEl.textContent = currentGirl.giftTitle || cardData.title;
        }
      }
    }

    if (resetPhotoZoom) {
      resetPhotoZoom();
    }

    modal.classList.add('active');
  }

  // Chuyển sang Màn 5 & 6: Đại cảnh Ending 11A2
  function goToEndingScene() {
    showScreen('screen-ending');

    const titleEl = document.getElementById('golden-class-title');
    const linesEl = document.getElementById('golden-class-lines');

    if (titleEl && classEndingWish) {
      titleEl.textContent = classEndingWish.title || 'Gửi 25 bông hoa của 11A2 🌷';
    }

    if (linesEl && classEndingWish && classEndingWish.lines) {
      linesEl.innerHTML = '';
      classEndingWish.lines.forEach(line => {
        const p = document.createElement('p');
        p.textContent = line;
        linesEl.appendChild(p);
      });
    }

    GalaxyEngine.zoomOutToEnding(girlsData, () => {
      // Hoàn thành Zoom Out Ending
    });
  }

  function returnFromEndingToRoom() {
    showScreen('screen-room');
    GalaxyEngine.returnToRoom();
    const btnGoEnding = document.getElementById('btn-go-ending');
    if (btnGoEnding) {
      btnGoEnding.style.opacity = '1';
      btnGoEnding.style.pointerEvents = 'auto';
    }
    if (currentGirl) {
      setupInfiniteWishScroller(currentGirl.wish);
    }
  }

  function switchGirl() {
    clearIntroTimers();
    resetIntroTextClasses();
    if (wishScrollInterval) {
      cancelAnimationFrame(wishScrollInterval);
      wishScrollInterval = null;
    }
    currentGirl = null;
    showScreen('screen-login');
    GalaxyEngine.setStage('LOGIN');
  }

  function fireGrandShow() {
    // Đã tắt pháo hoa theo yêu cầu
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
    if (modalId === 'modal-photo-detail' && resetPhotoZoom) {
      resetPhotoZoom();
    }
  }

  // ===================================================================
  // CÁC HIỆU ỨNG THIÊN THỂ NỀN (ĐÃ LOẠI BỎ CÁNH HOA ĐÀO 2D RÁC)
  // ===================================================================
  function spawnCosmicBackgroundFx() {
    const fxContainer = document.getElementById('cosmic-fx-container');
    if (!fxContainer) return;

    // Đom đóm lấp lánh như bụi sao
    for (let i = 0; i < 28; i++) {
      const f = document.createElement('div');
      f.className = 'firefly';
      f.style.left = Math.random() * 100 + 'vw';
      f.style.top = Math.random() * 100 + 'vh';
      f.style.animationDelay = (Math.random() * 8) + 's';
      f.style.animationDuration = (9 + Math.random() * 8) + 's';
      fxContainer.appendChild(f);
    }

    // Sao băng thỉnh thoảng xẹt chéo qua bầu trời đêm
    for (let k = 0; k < 3; k++) {
      const s = document.createElement('div');
      s.className = 'shooting-star';
      s.style.top = (10 + Math.random() * 40) + 'vh';
      s.style.animationDelay = (k * 2.8 + Math.random() * 2) + 's';
      fxContainer.appendChild(s);
    }
  }

  // 3D Tilt Parallax & Zoom x2.8 & Pinch-Zoom cho modal xem ảnh
  function setupPhotoTiltParallax() {
    const container = document.getElementById('photo-tilt-container');
    if (!container) return;

    let currentScale = 1.0;
    let initialPinchDistance = 0;
    let initialScaleOnPinch = 1.0;
    let isPinching = false;
    let lastPinchEndTime = 0;

    function applyTransforms(rotX = 0, rotY = 0, scale = currentScale) {
      container.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(${scale}, ${scale}, 1)`;
      const img = document.getElementById('photo-detail-img');
      const fallback = document.getElementById('photo-fallback-card');
      const innerScale = scale > 1 ? scale : 1;
      if (img && img.style.display !== 'none') {
        img.style.transform = `scale(${innerScale >= 2.0 ? 1.4 : (innerScale > 1.2 ? 1.2 : 1)})`;
      }
      if (fallback && fallback.style.display !== 'none') {
        fallback.style.transform = `scale(${innerScale >= 2.0 ? 1.15 : 1})`;
      }
    }

    resetPhotoZoom = function () {
      currentScale = 1.0;
      isPinching = false;
      if (container) {
        container.classList.remove('zoomed');
        applyTransforms(0, 0, 1.0);
      }
    };

    function handleTilt(x, y) {
      const rect = container.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (x - cx) / (rect.width / 2);
      const dy = (y - cy) / (rect.height / 2);

      const rotX = -dy * 16;
      const rotY = dx * 16;
      applyTransforms(rotX, rotY, currentScale);
    }

    container.addEventListener('mousemove', (e) => {
      if (!isPinching) handleTilt(e.clientX, e.clientY);
    });

    container.addEventListener('mouseleave', () => {
      applyTransforms(0, 0, currentScale);
    });

    container.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        isPinching = true;
        initialPinchDistance = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialScaleOnPinch = currentScale;
      }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2 && isPinching && initialPinchDistance > 0) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const factor = dist / initialPinchDistance;
        currentScale = Math.min(Math.max(initialScaleOnPinch * factor, 1.0), 2.8);
        if (currentScale > 1.25) {
          container.classList.add('zoomed');
        } else {
          container.classList.remove('zoomed');
        }
        applyTransforms(0, 0, currentScale);
      } else if (e.touches.length === 1 && !isPinching) {
        handleTilt(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        if (isPinching) {
          lastPinchEndTime = performance.now();
        }
        isPinching = false;
      }
      if (e.touches.length === 0) {
        applyTransforms(0, 0, currentScale);
      }
    });

    container.addEventListener('click', () => {
      if (isPinching || (performance.now() - lastPinchEndTime < 350)) return;
      if (currentScale > 1.2) {
        currentScale = 1.0;
        container.classList.remove('zoomed');
      } else {
        currentScale = 2.8; // Chuẩn phóng to x2.8 sát mặt kính
        container.classList.add('zoomed');
      }
      applyTransforms(0, 0, currentScale);
    });
  }

  // ===================================================================
  // KHỞI ĐỘNG VÀ GẮN SỰ KIỆN GIAO DIỆN
  // ===================================================================
  function initApp() {
    loadGirlsData(() => {});

    GalaxyEngine.init('webgl-canvas', {
      onCardSelect: (cardData) => {
        if (window.GalaxyEngine && window.GalaxyEngine.zoomCardToCenter) {
          window.GalaxyEngine.zoomCardToCenter(cardData);
        } else {
          showPhotoDetailModal(cardData);
        }
      },
      onMicroShake: () => {
        triggerMicroShake();
      }
    });

    // Gắn sự kiện đóng Cinematic 3D Zoom
    const btnClose3DZoom = document.getElementById('btn-close-3d-zoom');
    const zoomOverlay = document.getElementById('cinematic-zoom-overlay');
    if (btnClose3DZoom) {
      btnClose3DZoom.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.GalaxyEngine && window.GalaxyEngine.returnZoomedCardToOrbit) {
          window.GalaxyEngine.returnZoomedCardToOrbit();
        }
      });
    }
    if (zoomOverlay) {
      zoomOverlay.addEventListener('click', (e) => {
        if (e.target === zoomOverlay || e.target.classList.contains('cinematic-zoom-layer')) {
          if (window.GalaxyEngine && window.GalaxyEngine.returnZoomedCardToOrbit) {
            window.GalaxyEngine.returnZoomedCardToOrbit();
          }
        }
      });
    }

    spawnCosmicBackgroundFx();
    setupPhotoTiltParallax();

    function unlockAudio() {
      AudioEngine.unlockOnFirstTouch();
    }
    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
    document.addEventListener('keydown', unlockAudio, { once: true });

    // Biến trạng thái mã PIN 4 số ngày sinh
    let currentPinDigits = '';

    const btnUnlock = document.getElementById('btn-login-unlock');
    const inputName = document.getElementById('input-girl-name');
    const inputDob = document.getElementById('input-girl-dob');
    const errBox = document.getElementById('login-error-msg');
    const avatarBox = document.getElementById('login-preview-avatar');
    const heartSlots = document.querySelectorAll('.pin-heart-slot');

    function updatePinDisplay() {
      heartSlots.forEach((slot, idx) => {
        if (idx < currentPinDigits.length) {
          slot.classList.add('active');
        } else {
          slot.classList.remove('active');
        }
      });

      // Đồng bộ giá trị vào inputDob để tương thích 100% kiểm thử và logic khớp ngày sinh
      if (inputDob) {
        if (currentPinDigits.length === 4) {
          inputDob.value = currentPinDigits.slice(0, 2) + '/' + currentPinDigits.slice(2, 4);
        } else {
          inputDob.value = currentPinDigits;
        }
      }
    }

    // Bắt sự kiện bàn phím số cảm ứng trên web
    document.querySelectorAll('.cute-keypad-grid .key-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const key = btn.getAttribute('data-key');
        if (key !== null && key !== undefined) {
          if (currentPinDigits.length < 4) {
            currentPinDigits += key;
            AudioEngine.playKeyTap();
            updatePinDisplay();
            if (errBox) errBox.style.display = 'none';

            // Khi đã đủ 4 số: nếu đã nhập tên thì tự động đăng nhập mượt mà luôn
            if (currentPinDigits.length === 4 && inputName && inputName.value.trim().length > 0) {
              setTimeout(executeLogin, 220);
            }
          }
        }
      });
    });

    const btnKeyClear = document.getElementById('btn-key-clear');
    if (btnKeyClear) {
      btnKeyClear.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentPinDigits.length > 0) {
          currentPinDigits = currentPinDigits.slice(0, -1);
          AudioEngine.playKeyTap();
          updatePinDisplay();
          if (errBox) errBox.style.display = 'none';
        }
      });
    }

    // Hỗ trợ gõ phím vật lý từ bàn phím máy tính
    window.addEventListener('keydown', (e) => {
      const loginScreen = document.getElementById('screen-login');
      if (!loginScreen || !loginScreen.classList.contains('active')) return;
      if (document.activeElement === inputName) return;

      if (e.key >= '0' && e.key <= '9') {
        if (currentPinDigits.length < 4) {
          currentPinDigits += e.key;
          AudioEngine.playKeyTap();
          updatePinDisplay();
          if (errBox) errBox.style.display = 'none';
          if (currentPinDigits.length === 4 && inputName && inputName.value.trim().length > 0) {
            setTimeout(executeLogin, 220);
          }
        }
      } else if (e.key === 'Backspace') {
        if (currentPinDigits.length > 0) {
          currentPinDigits = currentPinDigits.slice(0, -1);
          AudioEngine.playKeyTap();
          updatePinDisplay();
        }
      } else if (e.key === 'Enter') {
        executeLogin();
      }
    });

    // Khi gõ tên: Tự động đoán và hiện icon bạn nữ trên avatar
    if (inputName) {
      inputName.addEventListener('input', () => {
        const val = inputName.value.trim();
        if (val.length >= 2 && avatarBox) {
          for (const g of girlsData) {
            if (scoreGirlMatch(g, val) >= 500) {
              avatarBox.textContent = g.icon || '🌷';
              break;
            }
          }
        } else if (avatarBox) {
          avatarBox.textContent = '🌷';
        }
      });
    }

    function executeLogin() {
      const rawName = inputName ? inputName.value.trim() : '';
      const rawDob = inputDob ? inputDob.value.trim() : '';

      function triggerCardShake() {
        const card = document.querySelector('.login-card');
        if (card) {
          card.classList.remove('shake-card');
          void card.offsetWidth;
          card.classList.add('shake-card');
          setTimeout(() => card.classList.remove('shake-card'), 450);
        }
      }

      if (!rawName) {
        if (errBox) {
          errBox.textContent = 'Bạn hãy nhập tên của mình nhé 🌸';
          errBox.style.display = 'block';
        }
        triggerCardShake();
        return;
      }

      const result = findGirlByNameAndDob(rawName, rawDob);

      if (!result || result.error === 'not_found' || result.error === 'dob_mismatch') {
        if (errBox) {
          errBox.textContent = 'Tên hoặc ngày sinh chưa khớp rồi bạn ơi, kiểm tra lại chút nhé ✨';
          errBox.style.display = 'block';
        }
        triggerCardShake();
        return;
      }

      if (result.success && result.girl) {
        if (errBox) errBox.style.display = 'none';
        handleUnlock(result.girl);
      }
    }

    if (btnUnlock) btnUnlock.onclick = executeLogin;
    if (inputName) {
      inputName.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') executeLogin();
      });
    }
    if (inputDob) {
      inputDob.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') executeLogin();
      });
    }

    // Nút đóng các Modal
    const modalPhoto = document.getElementById('modal-photo-detail');
    if (modalPhoto) {
      modalPhoto.addEventListener('click', (e) => {
        if (e.target === modalPhoto) {
          closeModal('modal-photo-detail');
        }
      });
      modalPhoto.addEventListener('touchend', (e) => {
        if (e.target === modalPhoto) {
          closeModal('modal-photo-detail');
        }
      });
    }

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal('modal-photo-detail');
        closeModal('modal-gift-reveal');
        closeModal('modal-quick-select');
      }
    });

    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.onclick = () => {
        const targetId = btn.getAttribute('data-close');
        if (targetId) closeModal(targetId);
      };
    });

    // Màn 2: Xoay ngang điện thoại (Orientation Prompt)
    const btnSkipOrient = document.getElementById('btn-skip-orientation');
    if (btnSkipOrient) {
      btnSkipOrient.onclick = () => {
        startCountdown();
      };
    }

    // Tự động nhận diện xoay máy ngang không cần reload (Hỗ trợ toàn diện Safari & Chrome)
    function checkOrientation() {
      checkAndTriggerOrientationFlow();
    }

    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', () => {
      setTimeout(checkOrientation, 250);
    });
    if (typeof screen !== 'undefined' && screen.orientation && screen.orientation.addEventListener) {
      screen.orientation.addEventListener('change', () => {
        setTimeout(checkOrientation, 250);
      });
    }
    if (typeof window.matchMedia === 'function') {
      try {
        const mql = window.matchMedia('(orientation: landscape)');
        mql.addEventListener('change', checkOrientation);
      } catch (e) {}
    }

    // Màn 3: Bỏ qua Intro
    const btnSkipIntro = document.getElementById('btn-skip-intro');
    if (btnSkipIntro) {
      btnSkipIntro.onclick = skipIntro;
    }

    // Màn 4: Room buttons
    const btnToggleWish = document.getElementById('btn-toggle-wish');
    if (btnToggleWish) btnToggleWish.onclick = toggleWishScroll;

    const btnResetWish = document.getElementById('btn-reset-wish');
    if (btnResetWish) btnResetWish.onclick = resetWishScroll;

    const btnSecretGift = document.getElementById('secret-gift-box');
    if (btnSecretGift) btnSecretGift.onclick = openSecretGift;

    const profileBadge = document.querySelector('.girl-profile-badge');
    if (profileBadge) {
      profileBadge.style.cursor = 'pointer';
      profileBadge.title = 'Xem thẻ kỷ niệm của bạn 📸';
      profileBadge.onclick = () => {
        if (currentGirl) {
          showPhotoDetailModal({
            title: currentGirl.name,
            icon: currentGirl.icon || '🌷',
            isCustomPhoto: Boolean(currentGirl.photos && currentGirl.photos[0]),
            photoUrl: (currentGirl.photos && currentGirl.photos[0]) || null
          });
        }
      };
    }

    const btnGoEnding = document.getElementById('btn-go-ending');
    if (btnGoEnding) btnGoEnding.onclick = goToEndingScene;

    // Màn 5: Ending buttons
    const btnBackRoom = document.getElementById('btn-back-room');
    if (btnBackRoom) btnBackRoom.onclick = returnFromEndingToRoom;

    const btnSwitchGirl = document.getElementById('btn-switch-girl');
    if (btnSwitchGirl) btnSwitchGirl.onclick = switchGirl;

    const btnGrandShow = document.getElementById('btn-grand-fireworks');
    if (btnGrandShow) btnGrandShow.onclick = fireGrandShow;

    const btnToggleConst = document.getElementById('btn-toggle-constellation');
    if (btnToggleConst) {
      btnToggleConst.onclick = () => {
        if (window.GalaxyEngine && window.GalaxyEngine.toggleConstellation) {
          const mode = window.GalaxyEngine.toggleConstellation();
          btnToggleConst.innerHTML = (mode === 'HEART')
            ? '<span>💖</span> Chòm Sao: Trái Tim'
            : '<span>✨</span> Chòm Sao: 20/10';
        }
      };
    }

    // Widget Đĩa Than Vinyl
    const vinylContainer = document.querySelector('.vinyl-disc-container');
    if (vinylContainer) {
      vinylContainer.onclick = () => {
        AudioEngine.togglePlay();
      };
    }
  }

  // Xuất ra API toàn cục phục vụ điều khiển và kiểm thử
  if (typeof window !== 'undefined') {
    window.AppController = {
      initApp: initApp,
      findGirlByNameAndDob: findGirlByNameAndDob,
      scoreGirlMatch: scoreGirlMatch,
      isDobMatch: isDobMatch,
      showScreen: showScreen,
      triggerMicroShake: triggerMicroShake,
      handleUnlock: handleUnlock,
      openSecretGift: openSecretGift,
      AudioEngine: AudioEngine
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
