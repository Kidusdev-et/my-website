// --- Global Interaction State ---
const state = {
    isDragging: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    rotationX: 0,
    rotationY: 0,
    targetRotationX: 0,
    targetRotationY: 0
};

// --- Event Listeners for Drag Logic ---
document.addEventListener('mousedown', (e) => {
    // Only drag if not clicking interactive elements (links, etc)
    // But allowing "Name" and "Profile" to be draggables if they don't have click actions? 
    // Actually simplicity is better: drag everywhere.
    state.isDragging = true;
    state.startX = e.clientX;
    state.startY = e.clientY;
    document.body.classList.add('grabbing');
});

window.addEventListener('mouseup', () => {
    state.isDragging = false;
    document.body.classList.remove('grabbing');
});

document.addEventListener('mousemove', (e) => {
    if (!state.isDragging) return;

    // Calculate displacement
    const deltaX = e.clientX - state.startX;
    const deltaY = e.clientY - state.startY;

    // Update start position for next frame
    state.startX = e.clientX;
    state.startY = e.clientY;

    // Update targets with Clamping
    // Limits the rotation so the website doesn't flip over or spin wildly
    const sensitivity = 0.005;
    const maxY = 0.5; // Max horizontal rotation (approx 30 deg)
    const maxX = 0.3; // Max vertical rotation (approx 15 deg)

    state.targetRotationY += deltaX * sensitivity;
    state.targetRotationX += deltaY * sensitivity;

    // Apply strict clamping
    state.targetRotationY = Math.max(-maxY, Math.min(maxY, state.targetRotationY));
    state.targetRotationX = Math.max(-maxX, Math.min(maxX, state.targetRotationX));
});

// --- 3D Background with Three.js ---
const initThreeJS = () => {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Create Stars
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const posArray = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 20; // Spread stars
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // Star Material
    const starMaterial = new THREE.PointsMaterial({
        size: 0.03,
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending
    });

    const starMesh = new THREE.Points(starGeometry, starMaterial);
    scene.add(starMesh);

    camera.position.z = 4;

    const animate = () => {
        requestAnimationFrame(animate);

        // Smoothly interpolate current rotation to target rotation (Drag Physics)
        state.rotationY += (state.targetRotationY - state.rotationY) * 0.1;
        state.rotationX += (state.targetRotationX - state.rotationX) * 0.1;

        // Apply to Star Mesh
        // Strictly follow the clamped state (no infinite spin)
        starMesh.rotation.y = state.rotationY;
        starMesh.rotation.x = state.rotationX;

        renderer.render(scene, camera);
    };

    animate();

    // Handle Resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
};

// --- 3D Tilt Effect for Cards ---
const initTiltEffect = () => {
    const tiltElements = document.querySelectorAll('.card, .profile-container');

    tiltElements.forEach(el => {
        let bounds;
        let mouseX, mouseY;
        let isHovering = false;

        const update = () => {
            if (!isHovering || state.isDragging) return;

            const centerX = bounds.width / 2;
            const centerY = bounds.height / 2;
            const elementX = mouseX - bounds.left;
            const elementY = mouseY - bounds.top;

            // Calculate rotation
            const rotateX = ((elementY - centerY) / centerY) * -10;
            const rotateY = ((elementX - centerX) / centerX) * 10;

            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;

            requestAnimationFrame(update);
        };

        el.addEventListener('mouseenter', () => {
            isHovering = true;
            el.classList.add('is-tilting');
            bounds = el.getBoundingClientRect();
            requestAnimationFrame(update);
        });

        el.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });

        el.addEventListener('mouseleave', () => {
            isHovering = false;
            el.classList.remove('is-tilting');
            // Reset transform
            el.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
        });
    });
};

// --- Global Website Tilt (Profile & Content) ---
const initGlobalTilt = () => {
    const container = document.querySelector('.container');
    if (!container) return;

    const update = () => {
        requestAnimationFrame(update);

        // Sync Content Tilt with the Drag State
        // We use the smoothed values
        const rotYDeg = state.rotationY * 20;
        const rotXDeg = state.rotationX * -20;

        container.style.transform = `
            perspective(1500px)
            rotateY(${rotYDeg}deg) 
            rotateX(${rotXDeg}deg)
        `;
    };

    update();
};

// Initialize everything on load
document.addEventListener('DOMContentLoaded', () => {
    initThreeJS();
    initTiltEffect();
    initGlobalTilt();
});
