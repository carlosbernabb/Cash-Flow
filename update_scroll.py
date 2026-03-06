with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find start and end markers
start_marker = '    // =====================================================\n\n    // VIDEO SCRUBBING'
end_marker = '    if (video) {\n\n        if (video.readyState >= 1) initScrub();\n\n        else video.addEventListener(\'loadedmetadata\', initScrub, { once: true });\n\n    }'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker) + len(end_marker)

if start_idx == -1 or end_idx == -1:
    print("MARKERS NOT FOUND")
    print("start:", start_idx)
    print("end:", end_idx)
    exit(1)

new_block = """    // =====================================================
    // VIDEO SCRUB CINEMÁTICO — Momentum + isSeeking throttle
    // =====================================================
    const video = document.getElementById('bgVideo');
    const VIDEO_OFFSET = 2;

    let vtCurrent = VIDEO_OFFSET;
    let vtVelocity = 0;
    let lastScrollY = window.scrollY;
    let lastScrollAt = performance.now();
    let isSeeking = false;

    function initScrub() {
        video.currentTime = VIDEO_OFFSET;
        video.pause();

        video.addEventListener('seeked', () => { isSeeking = false; });

        window.addEventListener('scroll', () => {
            // Navbar
            const navbar = document.querySelector('.navbar');
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(11, 12, 16, 0.92)';
                navbar.style.boxShadow = '0 10px 30px rgba(0,0,0,0.6)';
            } else {
                navbar.style.background = 'var(--glass-bg)';
                navbar.style.boxShadow = 'none';
            }

            // Acumular momentum proporcional a la velocidad del scroll
            const now = performance.now();
            const deltaY = window.scrollY - lastScrollY;
            const deltaT = Math.max(1, now - lastScrollAt);
            const scrollVelocity = (deltaY / deltaT) * 0.04;

            vtVelocity += scrollVelocity;
            const maxVel = 0.5;
            if (vtVelocity > maxVel) vtVelocity = maxVel;
            if (vtVelocity < -maxVel) vtVelocity = -maxVel;

            lastScrollY = window.scrollY;
            lastScrollAt = now;
        }, { passive: true });

        function tick() {
            if (video.duration) {
                // Aplicar fricción para inercia suave
                vtVelocity *= 0.85;
                if (Math.abs(vtVelocity) < 0.0005) vtVelocity = 0;

                // Avanzar el tiempo virtual
                vtCurrent += vtVelocity;
                if (vtCurrent < VIDEO_OFFSET) vtCurrent = VIDEO_OFFSET;
                if (vtCurrent > video.duration) vtCurrent = video.duration;

                // Solo hacer seek cuando hay diferencia real Y el decoder está libre
                // Esto elimina el 100% del lag: isSeeking semáforo previene sobresaturar el decoder
                if (!isSeeking && Math.abs(video.currentTime - vtCurrent) > 0.04) {
                    isSeeking = true;
                    video.currentTime = vtCurrent;
                }
            }
            requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
    }

    if (video) {
        if (video.readyState >= 1) initScrub();
        else video.addEventListener('loadedmetadata', initScrub, { once: true });
    }"""

new_content = content[:start_idx] + new_block + content[end_idx:]

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Done! Lines replaced:", start_idx, "to", end_idx)
