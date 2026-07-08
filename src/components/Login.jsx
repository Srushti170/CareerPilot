import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { saveStudentProfile } from '../lib/studentProfile';
import { authApi } from '../lib/backendSync';

// ─────────────────────────────────────────────
// Globe Canvas Component
// ─────────────────────────────────────────────
function GlobeCanvas() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const rotationRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    let W = canvas.parentElement.clientWidth;
    let H = canvas.parentElement.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.scale(dpr, dpr);

    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) * 0.38;

    // Project a 3D point on the sphere to 2D canvas
    function project(lat, lon, rotation) {
      const phi = (lat * Math.PI) / 180;
      const theta = (lon * Math.PI) / 180 + rotation;
      const x3 = Math.cos(phi) * Math.sin(theta);
      const y3 = Math.sin(phi);
      const z3 = Math.cos(phi) * Math.cos(theta);
      return { x: cx + R * x3, y: cy - R * y3, z: z3 };
    }

    // Draw a great-circle arc between two lat/lon points
    function drawArc(lat1, lon1, lat2, lon2, rotation, alpha, dashed) {
      const steps = 60;
      const pts = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const lat = lat1 + t * (lat2 - lat1);
        const lon = lon1 + t * (lon2 - lon1);
        pts.push(project(lat, lon, rotation));
      }
      ctx.save();
      if (dashed) ctx.setLineDash([6, 8]);
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        if (a.z < -0.1 && b.z < -0.1) continue; // fully behind
        const fade = Math.max(0, Math.min(1, (a.z + b.z) / 2 + 0.5));
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(20, 184, 166, ${alpha * fade})`;
        ctx.lineWidth = dashed ? 1.5 : 0.9;
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Draw one latitude circle
    function drawLatCircle(lat, rotation, alpha) {
      const steps = 120;
      let started = false;
      for (let i = 0; i <= steps; i++) {
        const lon = (i / steps) * 360 - 180;
        const lonNext = ((i + 1) / steps) * 360 - 180;
        const a = project(lat, lon, rotation);
        const b = project(lat, lonNext, rotation);
        const fade = Math.max(0, Math.min(1, (a.z + b.z) / 2 + 0.5));
        if (fade < 0.05) { started = false; continue; }
        ctx.strokeStyle = `rgba(20, 184, 166, ${alpha * fade * 0.7})`;
        ctx.lineWidth = lat === 0 ? 1.4 : 0.8; // equator slightly thicker
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    // Draw one longitude line
    function drawLonLine(lon, rotation, alpha) {
      const steps = 120;
      for (let i = 0; i < steps; i++) {
        const lat = (i / steps) * 180 - 90;
        const latNext = ((i + 1) / steps) * 180 - 90;
        const a = project(lat, lon, rotation);
        const b = project(latNext, lon, rotation);
        const fade = Math.max(0, Math.min(1, (a.z + b.z) / 2 + 0.5));
        if (fade < 0.05) continue;
        ctx.strokeStyle = `rgba(20, 184, 166, ${alpha * fade * 0.7})`;
        ctx.lineWidth = lon === 0 || lon === 180 ? 1.4 : 0.8;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    // Draw outer glow ring
    function drawGlowRing() {
      const grad = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.18);
      grad.addColorStop(0, 'rgba(20, 184, 166, 0.18)');
      grad.addColorStop(0.5, 'rgba(7, 88, 78, 0.10)');
      grad.addColorStop(1, 'rgba(7, 88, 78, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.18, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Draw silhouette outline circle
    function drawOutline() {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // Plane orbit params
    // The plane orbits on a tilted great circle (inclination ~30°)
    const orbitInclination = 28; // degrees tilt from equator
    let planeAngle = 0;        // current angle around the orbit
    const planeSpeed = 0.012;   // radians per frame
    const TRAIL_STEPS = 80;     // how many dashes to show for trajectory

    function getPlanePos(angle, rotation) {
      // Tilted great circle: parameterize
      const lon = (angle * 180) / Math.PI;
      const lat = orbitInclination * Math.sin(angle);
      return project(lat, lon, rotation);
    }

    // Draw plane icon (simple triangle)
    function drawPlane(pos, angle) {
      if (pos.z < -0.15) return; // behind globe
      const size = 11;
      const fade = Math.max(0, Math.min(1, pos.z + 0.5));
      const heading = angle + Math.PI / 2; // approximate heading tangent
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(heading);
      ctx.globalAlpha = fade;

      // Draw plane body
      ctx.beginPath();
      ctx.moveTo(0, -size);        // nose
      ctx.lineTo(-size * 0.55, size * 0.5); // left wing tip
      ctx.lineTo(-size * 0.2, size * 0.25);
      ctx.lineTo(0, size * 0.4);   // tail center
      ctx.lineTo(size * 0.2, size * 0.25);
      ctx.lineTo(size * 0.55, size * 0.5); // right wing tip
      ctx.closePath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.shadowColor = 'rgba(20, 184, 166, 0.8)';
      ctx.shadowBlur = 12;
      ctx.fill();

      ctx.restore();
    }

    function render() {
      ctx.clearRect(0, 0, W, H);

      // Very subtle background dark radial
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.5);
      bgGrad.addColorStop(0, 'rgba(7, 88, 78, 0.08)');
      bgGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      drawGlowRing();

      const rot = rotationRef.current;

      // Latitude lines every 15°
      for (let lat = -90; lat <= 90; lat += 15) {
        drawLatCircle(lat, rot, 0.85);
      }

      // Longitude lines every 15°
      for (let lon = -180; lon < 180; lon += 15) {
        drawLonLine(lon, rot, 0.85);
      }

      drawOutline();

      // --- Plane trajectory (dashed great-circle trail ahead of plane) ---
      // Draw the full orbit circle as dashed line
      const trailSteps = 200;
      for (let i = 0; i < trailSteps; i++) {
        const t = i / trailSteps;
        const a1 = t * Math.PI * 2;
        const a2 = (t + 1 / trailSteps) * Math.PI * 2;
        const lon1 = (a1 * 180) / Math.PI;
        const lat1 = orbitInclination * Math.sin(a1);
        const lon2 = (a2 * 180) / Math.PI;
        const lat2 = orbitInclination * Math.sin(a2);
        const p1 = project(lat1, lon1, rot);
        const p2 = project(lat2, lon2, rot);
        const fade = Math.max(0, Math.min(1, (p1.z + p2.z) / 2 + 0.5));
        if (fade < 0.05) continue;

        // Segment index relative to plane position
        const planeT = ((planeAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const segT = a1 % (Math.PI * 2);
        let diff = (segT - planeT + Math.PI * 2) % (Math.PI * 2);
        // Segments ahead of plane → dashed bright, behind → dimmer
        const isAhead = diff < Math.PI;
        const trailAlpha = isAhead
          ? 0.7 * fade * (1 - diff / Math.PI)
          : 0.25 * fade * (diff - Math.PI) / Math.PI;

        ctx.save();
        if (isAhead) ctx.setLineDash([5, 7]);
        else ctx.setLineDash([2, 9]);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(20, 184, 166, ${trailAlpha})`;
        ctx.lineWidth = isAhead ? 1.8 : 1;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // --- Plane ---
      const planePos = getPlanePos(planeAngle, rot);
      drawPlane(planePos, planeAngle);

      // Advance
      rotationRef.current += 0.003;
      planeAngle = (planeAngle + planeSpeed) % (Math.PI * 2);

      animRef.current = requestAnimationFrame(render);
    }

    animRef.current = requestAnimationFrame(render);

    const handleResize = () => {
      W = canvas.parentElement.clientWidth;
      H = canvas.parentElement.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.scale(dpr, dpr);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}

// ─────────────────────────────────────────────
// Floating badge component
// ─────────────────────────────────────────────
function FloatingBadge({ children, style, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: [0, -8, 0] }}
      transition={{ delay, duration: 3, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }}
      style={style}
      className="absolute backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl px-4 py-2 text-white text-xs font-bold shadow-lg"
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// Main Login Component
// ─────────────────────────────────────────────
export function Login({ onLogin }) {
  const [mode, setMode] = useState('signin');
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'signin') {
      try {
        const { user: authenticatedUser, sessionToken } = await authApi.login({ email, password, role });
        onLogin(authenticatedUser, false, sessionToken);
      } catch (apiError) {
        setError(apiError.message || 'Invalid email or password.');
      }
    } else {
      if (!name.trim()) { setError('Please enter your full name.'); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
      if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

      const normalizedEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        setError('Use a valid email address to create your account.');
        return;
      }

      const newUser = { name: name.trim(), email: normalizedEmail, password, role };
      if (role === 'student') {
        await saveStudentProfile({ name: newUser.name, email: newUser.email, role: 'CS Senior Student', skills: [], onboardingComplete: false }, newUser);
      }

      try {
        const { user: createdUser, sessionToken } = await authApi.register(newUser);
        setSuccess('Account created successfully! Logging you in...');
        setTimeout(() => { onLogin(createdUser, true, sessionToken); }, 700);
      } catch (apiError) {
        setError(apiError.message || 'An error occurred during registration.');
      }
    }
  };

  const roles = [
    { id: 'student', label: 'Student' },
    { id: 'recruiter', label: 'Recruiter' },
    { id: 'admin', label: 'Placement' },
  ];

  return (
    <div className="flex min-h-screen bg-surface overflow-hidden">
      {/* ── LEFT PANEL: Globe ──────────────────────── */}
      <div
        className="hidden lg:flex relative flex-col items-center justify-center flex-1 overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #021f1b 0%, #07584e 50%, #0a6e62 100%)' }}
      >
        {/* Subtle star-field dots */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() * 2 + 1 + 'px',
                height: Math.random() * 2 + 1 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                opacity: Math.random() * 0.4 + 0.1,
              }}
            />
          ))}
        </div>

        {/* Globe Canvas */}
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative" style={{ width: '85%', maxWidth: 520, aspectRatio: '1/1' }}>
            <GlobeCanvas />

            {/* Floating info badges */}
            <FloatingBadge style={{ top: '8%', left: '-8%' }} delay={0}>
              ✈️ 500+ Partners
            </FloatingBadge>
            <FloatingBadge style={{ top: '18%', right: '-10%' }} delay={0.8}>
              🎓 10k+ Students
            </FloatingBadge>
            <FloatingBadge style={{ bottom: '20%', left: '-10%' }} delay={1.6}>
              📈 98% Placement
            </FloatingBadge>
            <FloatingBadge style={{ bottom: '10%', right: '-6%' }} delay={2.4}>
              🌏 Global Network
            </FloatingBadge>
          </div>
        </div>

        {/* Bottom branding */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-white/40 text-xs tracking-widest uppercase font-semibold">
            The Future of Campus Hiring
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL: Form ──────────────────────── */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 lg:max-w-[480px] xl:max-w-[520px] bg-surface">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <img src="/logo.png" alt="CareerPilot Logo" className="h-28 object-contain" />
            </div>

            {/* Heading */}
            <div className="mb-8 text-center">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={mode}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  className="text-3xl font-black tracking-tight text-on-surface mb-2"
                >
                  {mode === 'signin' ? 'Welcome back' : 'Create account'}
                </motion.h1>
              </AnimatePresence>
              <p className="text-sm text-on-surface-variant">
                {mode === 'signin'
                  ? 'Sign in to your CareerPilot account'
                  : 'Join the campus recruitment network'}
              </p>
            </div>

            {/* Alerts */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700"
                >
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{error}</span>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-xs font-medium text-green-700"
                >
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <span>{success}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Role switcher */}
            <div className="mb-6 grid grid-cols-3 gap-1 rounded-xl border border-outline-variant bg-surface-container-low p-1">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`rounded-lg py-2 text-sm font-semibold transition-all ${
                    role === r.id
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleAuth} className="space-y-4">
              <AnimatePresence>
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <label className="mb-1.5 block text-sm font-medium text-on-surface">Full name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="e.g. Alex Rivera"
                      className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-on-surface">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={
                    role === 'student'
                      ? 'Enter your student email'
                      : role === 'recruiter'
                      ? 'Enter your recruiter email'
                      : 'Enter your placement email'
                  }
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div className={`grid gap-4 ${mode === 'signup' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-on-surface">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-outline-variant bg-surface-container-low pl-4 pr-10 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700"
                    >
                      <span className="material-symbols-outlined text-xl select-none">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
                <AnimatePresence>
                  {mode === 'signup' && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <label className="mb-1.5 block text-sm font-medium text-on-surface">Confirm password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          placeholder="••••••••"
                          className="w-full rounded-xl border border-outline-variant bg-surface-container-low pl-4 pr-10 py-2.5 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-700"
                        >
                          <span className="material-symbols-outlined text-xl select-none">
                            {showConfirmPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {mode === 'signin' && (
                <div className="flex items-center justify-between pb-1 pt-0.5">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-on-surface-variant">
                    <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-primary" />
                    Remember me
                  </label>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); setError('Password reset is not configured yet.'); }}
                    className="text-sm font-medium text-primary hover:opacity-80"
                  >
                    Forgot password?
                  </a>
                </div>
              )}

              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-primary py-3 text-sm font-bold text-on-primary transition-all hover:opacity-90 hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-primary/20 shadow-lg shadow-primary/20"
              >
                {mode === 'signin'
                  ? `Sign in as ${role.charAt(0).toUpperCase() + role.slice(1)}`
                  : `Register as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
              </button>
            </form>

            {/* Toggle mode */}
            <div className="mt-6 border-t border-outline-variant pt-4 text-center text-sm text-on-surface-variant">
              {mode === 'signin' ? (
                <>
                  Don't have an account?{' '}
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); setMode('signup'); setError(''); setShowPassword(false); setShowConfirmPassword(false); }}
                    className="font-bold text-primary hover:opacity-80"
                  >
                    Sign up
                  </a>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); setMode('signin'); setError(''); setShowPassword(false); setShowConfirmPassword(false); }}
                    className="font-bold text-primary hover:opacity-80"
                  >
                    Sign in
                  </a>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
