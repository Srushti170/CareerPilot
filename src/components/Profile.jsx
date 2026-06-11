import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './MetricCard';

export function Profile({ currentUser, setCurrentUser }) {
  const [profile, setProfile] = useState(() => {
    const stored = localStorage.getItem('careerpilot_student_profile');
    if (stored) return JSON.parse(stored);

    const defaultProfile = {
      name: currentUser?.name || "Alex Rivera",
      role: "CS Senior Student",
      email: currentUser?.email || "alex.r@stanford.edu",
      university: "Stanford University",
      location: "Palo Alto, CA",
      summary: "Passionate Computer Science student with a strong foundation in full-stack development and artificial intelligence. Experienced in building scalable web applications using React and Node.js. Actively seeking opportunities to contribute to innovative projects and grow as a software engineer. Currently focused on LLM integrations and distributed systems.",
      skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'System Design'],
      gpa: "3.92/4.00",
      coursework: "Algorithms, Operating Systems, Database Systems, Machine Learning",
      graduation: "2026 - 2026",
      socials: {
        LinkedIn: { connected: true, handle: "linkedin.com/in/alexrivera" },
        GitHub: { connected: true, handle: "github.com/alexrivera" },
        Portfolio: { connected: false, handle: "" }
      }
    };
    localStorage.setItem('careerpilot_student_profile', JSON.stringify(defaultProfile));
    return defaultProfile;
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(null); // 'LinkedIn', 'GitHub', 'Portfolio' or null
  const [newSocialHandle, setNewSocialHandle] = useState('');

  // Form edit states
  const [editName, setEditName] = useState(profile.name);
  const [editLocation, setEditLocation] = useState(profile.location);
  const [editSummary, setEditSummary] = useState(profile.summary);
  const [editUniversity, setEditUniversity] = useState(profile.university);
  const [editGpa, setEditGpa] = useState(profile.gpa);
  const [editCoursework, setEditCoursework] = useState(profile.coursework);
  const [editGraduation, setEditGraduation] = useState(profile.graduation);
  const [newSkillText, setNewSkillText] = useState('');

  const saveProfile = (updated) => {
    setProfile(updated);
    localStorage.setItem('careerpilot_student_profile', JSON.stringify(updated));

    // Sync header/user info if name changes
    if (currentUser && updated.name !== currentUser.name) {
      const updatedUser = { ...currentUser, name: updated.name };
      setCurrentUser(updatedUser);
      localStorage.setItem('careerpilot_current_user', JSON.stringify(updatedUser));

      // Also update in users list
      const users = JSON.parse(localStorage.getItem('careerpilot_users') || '[]');
      const userIndex = users.findIndex(u => u.email.toLowerCase() === currentUser.email.toLowerCase());
      if (userIndex !== -1) {
        users[userIndex].name = updated.name;
        localStorage.setItem('careerpilot_users', JSON.stringify(users));
      }
    }
  };

  const handleDownloadResume = () => {
    // Premium Resume print-preview download
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${profile.name} - Resume</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 40px; line-height: 1.6; }
            h1 { font-size: 28px; margin-bottom: 5px; color: #1e293b; }
            .subtitle { font-size: 16px; color: #64748b; font-style: italic; margin-bottom: 20px; }
            .contact-info { font-size: 12px; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; display: flex; gap: 20px; }
            h2 { font-size: 16px; font-weight: bold; text-transform: uppercase; color: #2563eb; margin-top: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
            .summary { margin-bottom: 25px; }
            .skills-list { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
            .skill-tag { background: #f1f5f9; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .edu-header { display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 5px; }
            .edu-dates { color: #64748b; font-size: 13px; }
            .edu-detail { font-size: 13px; color: #475569; }
          </style>
        </head>
        <body>
          <h1>${profile.name}</h1>
          <div class="subtitle">${profile.role}</div>
          <div class="contact-info">
            <span>Email: ${profile.email}</span>
            <span>Location: ${profile.location}</span>
            ${profile.socials.LinkedIn.connected ? `<span>LinkedIn: ${profile.socials.LinkedIn.handle}</span>` : ''}
            ${profile.socials.GitHub.connected ? `<span>GitHub: ${profile.socials.GitHub.handle}</span>` : ''}
          </div>

          <h2>Professional Summary</h2>
          <p class="summary">${profile.summary}</p>

          <h2>Education</h2>
          <div class="edu-header">
            <span>${profile.university}</span>
            <span class="edu-dates">${profile.graduation}</span>
          </div>
          <div class="edu-detail">GPA: ${profile.gpa}</div>
          <div class="edu-detail">Coursework: ${profile.coursework}</div>

          <h2>Key Skills & Expertises</h2>
          <div class="skills-list">
            ${profile.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const calculateProfileStrength = () => {
    let score = 20; // Base details: Name, Email
    if (profile.summary.length > 50) score += 20;
    if (profile.skills.length >= 5) score += 20;
    if (profile.university && profile.gpa) score += 20;

    const connectedCount = Object.values(profile.socials).filter(s => s.connected).length;
    if (connectedCount >= 2) score += 20;
    else if (connectedCount === 1) score += 10;

    return score;
  };

  const strength = calculateProfileStrength();

  const handleEditSubmit = (e) => {
    e.preventDefault();
    saveProfile({
      ...profile,
      name: editName,
      location: editLocation,
      summary: editSummary,
      university: editUniversity,
      gpa: editGpa,
      coursework: editCoursework,
      graduation: editGraduation
    });
    setIsEditOpen(false);
  };

  const handleConnectSocial = (e) => {
    e.preventDefault();
    if (!newSocialHandle.trim()) return;

    const updatedSocials = {
      ...profile.socials,
      [isConnectOpen]: {
        connected: true,
        handle: newSocialHandle
      }
    };
    saveProfile({ ...profile, socials: updatedSocials });
    setIsConnectOpen(null);
    setNewSocialHandle('');
  };

  const handleDisconnectSocial = (platform) => {
    const updatedSocials = {
      ...profile.socials,
      [platform]: {
        connected: false,
        handle: ""
      }
    };
    saveProfile({ ...profile, socials: updatedSocials });
  };

  const addSkill = (e) => {
    e.preventDefault();
    if (!newSkillText.trim() || profile.skills.includes(newSkillText.trim())) return;
    saveProfile({
      ...profile,
      skills: [...profile.skills, newSkillText.trim()]
    });
    setNewSkillText('');
  };

  const removeSkill = (skill) => {
    saveProfile({
      ...profile,
      skills: profile.skills.filter(s => s !== skill)
    });
  };

  return (
    <div className="pt-24 px-8 pb-12 max-w-5xl mx-auto space-y-10">
      <header className="flex flex-col md:flex-row gap-8 items-start md:items-center">
        <div className="relative">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-primary-container p-1 shadow-2xl">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC42WzyRRM9i-A-ICmV_pg60wrnV6wmP2YNel9d09qWP8QDl2Z5I0UTb-etCnEIu3CR6etIn6A1mvu9hW8Nu905W_iU-v39Jmhr3643oecpxiMi__iNi9fkrb5kxEv150M8m9agiFNGNyqvy1n9Tlo54Czu1umtCZOmVVDeD6ga9MEaDTIFsB23F95vkFtAHieg1w2r4MxiQwjFr6r77oUKzRgPhI45cIwOIef4r0P29jWL9GS1Y_j85DmndrFu8roy5VTB0UHtRB0"
              className="w-full h-full rounded-[20px] object-cover"
              alt="Profile"
            />
          </div>
          <button
            onClick={() => {
              setEditName(profile.name);
              setEditLocation(profile.location);
              setEditSummary(profile.summary);
              setEditUniversity(profile.university);
              setEditGpa(profile.gpa);
              setEditCoursework(profile.coursework);
              setEditGraduation(profile.graduation);
              setIsEditOpen(true);
            }}
            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-primary border border-slate-100 hover:scale-110 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-xl">edit</span>
          </button>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-black text-on-surface tracking-tight">{profile.name}</h1>
            <span className="px-3 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-black uppercase rounded-full tracking-widest">Student</span>
          </div>
          <p className="text-lg font-medium text-slate-500 mb-4 italic">{profile.role} @ {profile.university}</p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-xl border border-outline-variant/10">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <span className="text-xs font-bold text-on-surface">{profile.location}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-xl border border-outline-variant/10">
              <span className="material-symbols-outlined text-secondary">mail</span>
              <span className="text-xs font-bold text-on-surface">{profile.email}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDownloadResume}
            className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase tracking-wider"
          >
            Download Resume
          </button>
          <button className="p-3 bg-surface-container-lowest text-on-surface font-bold rounded-xl border border-outline-variant/20 hover:bg-slate-50 transition-colors">
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <section>
            <h3 className="text-xl font-black text-on-surface mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              Professional Summary
            </h3>
            <Card className="p-8 leading-relaxed text-slate-600 font-medium">
              {profile.summary}
            </Card>
          </section>

          <section>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-on-surface flex items-center gap-2">
                <span className="w-1.5 h-6 bg-secondary rounded-full"></span>
                Key Skills & Expertise
              </h3>
            </div>
            <form onSubmit={addSkill} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Type skill (e.g. Go, Rust) and press enter..."
                value={newSkillText}
                onChange={(e) => setNewSkillText(e.target.value)}
                className="flex-1 px-4 py-2 bg-white rounded-xl border border-outline-variant/35 focus:ring-2 focus:ring-primary/25 outline-none text-sm font-semibold"
              />
              <button type="submit" className="px-4 bg-primary text-white font-bold rounded-xl text-xs uppercase tracking-wider">Add</button>
            </form>
            <div className="flex flex-wrap gap-3">
              {profile.skills.map(skill => (
                <div key={skill} className="px-5 py-2.5 bg-white rounded-2xl border border-outline-variant/10 shadow-sm flex items-center gap-2 group hover:border-red-200 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-primary/30 group-hover:bg-primary transition-colors"></span>
                  <span className="text-sm font-bold text-on-surface">{skill}</span>
                  <button
                    onClick={() => removeSkill(skill)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-slate-400 hover:text-red-500"
                  >
                    <span className="material-symbols-outlined text-xs">close</span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-xl font-black text-on-surface mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-tertiary rounded-full"></span>
              Education
            </h3>
            <Card className="p-0 overflow-hidden">
              <div className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center p-2">
                    <img src="https://upload.wikimedia.org/wikipedia/en/thumb/b/b7/Stanford_University_seal.svg/1200px-Stanford_University_seal.svg.png" alt="Stanford" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-on-surface text-lg">B.S. in Computer Science</h4>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{profile.graduation}</span>
                    </div>
                    <p className="text-primary font-bold text-sm">{profile.university}</p>
                    <p className="text-xs text-slate-500 mt-2 font-medium">Major GPA: {profile.gpa} • Relevant Coursework: {profile.coursework}</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
          <Card className="p-8 bg-gradient-to-br from-slate-900 to-black text-white border-0 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">Profile Strength</h3>
            <div className="relative w-40 h-40 mx-auto mb-8">
              <svg className="w-full h-full -rotate-90">
                <circle cx="80" cy="80" r="70" fill="transparent" stroke="#ffffff10" strokeWidth="12" />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="transparent"
                  stroke="url(#gradient-p)"
                  strokeWidth="12"
                  strokeDasharray="440"
                  strokeDashoffset={440 - (440 * strength) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="gradient-p" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#d2e4ff" />
                    <stop offset="100%" stopColor="#2c5ff2" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black">{strength}%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {strength >= 80 ? 'Excellent' : strength >= 50 ? 'Good' : 'Incomplete'}
                </span>
              </div>
            </div>
            {strength < 100 && (
              <>
                <p className="text-center text-slate-400 text-xs font-medium mb-8">Complete details to reach 100%:</p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={strength >= 80 ? "material-symbols-outlined text-green-400 text-sm" : "material-symbols-outlined text-slate-500 text-sm"}>check_circle</span>
                    <span className="text-xs font-bold">Add 5+ skills ({Math.min(profile.skills.length, 5)}/5)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={Object.values(profile.socials).filter(s => s.connected).length >= 2 ? "material-symbols-outlined text-green-400 text-sm" : "material-symbols-outlined text-orange-400 text-sm"}>
                      {Object.values(profile.socials).filter(s => s.connected).length >= 2 ? "check_circle" : "radio_button_unchecked"}
                    </span>
                    <span className="text-xs font-bold">Connect at least 2 Social Networks</span>
                  </div>
                </div>
              </>
            )}
            <button
              onClick={() => setIsEditOpen(true)}
              className="w-full mt-8 py-3 bg-white text-black font-black rounded-xl text-xs uppercase tracking-widest hover:bg-slate-100 transition-colors"
            >
              Improve Profile
            </button>
          </Card>

          <Card className="p-6">
            <h4 className="font-bold text-on-surface mb-6">Social Connections</h4>
            <div className="space-y-4">
              {Object.entries(profile.socials).map(([name, data]) => {
                let icon = name === 'LinkedIn' ? 'link' : name === 'GitHub' ? 'code' : 'language';
                return (
                  <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low/50">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-400">{icon}</span>
                      <div>
                        <span className="text-sm font-bold text-on-surface block leading-tight">{name}</span>
                        {data.connected && <span className="text-[10px] text-slate-500 font-medium truncate block max-w-[120px]">{data.handle}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {data.connected ? (
                        <>
                          <span className="material-symbols-outlined text-green-500 text-sm">verified</span>
                          <button onClick={() => handleDisconnectSocial(name)} className="text-[10px] text-slate-400 hover:text-red-500 font-bold uppercase underline ml-1">Disconnect</button>
                        </>
                      ) : (
                        <button onClick={() => setIsConnectOpen(name)} className="text-[10px] font-black text-primary uppercase underline">Connect</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full border border-slate-100 shadow-2xl relative my-8"
            >
              <button
                onClick={() => setIsEditOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit</span>
                Edit Profile Details
              </h3>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Location</label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/25"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Graduation Year</label>
                    <input
                      type="text"
                      value={editGraduation}
                      onChange={(e) => setEditGraduation(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/25"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">University</label>
                  <input
                    type="text"
                    value={editUniversity}
                    onChange={(e) => setEditUniversity(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">GPA</label>
                    <input
                      type="text"
                      value={editGpa}
                      onChange={(e) => setEditGpa(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/25"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Coursework</label>
                    <input
                      type="text"
                      value={editCoursework}
                      onChange={(e) => setEditCoursework(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/25"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Professional Summary</label>
                  <textarea
                    rows="3"
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/25 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-primary/10 hover:shadow-primary/25"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Connect Social Modal */}
      <AnimatePresence>
        {isConnectOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full border border-slate-100 shadow-2xl relative"
            >
              <button
                onClick={() => setIsConnectOpen(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              <h3 className="text-lg font-bold text-slate-800 mb-4">Connect {isConnectOpen}</h3>

              <form onSubmit={handleConnectSocial} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Username or URL</label>
                  <input
                    type="text"
                    placeholder={isConnectOpen === 'Portfolio' ? 'https://myportfolio.com' : `${isConnectOpen.toLowerCase()}.com/username`}
                    value={newSocialHandle}
                    onChange={(e) => setNewSocialHandle(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/25"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsConnectOpen(null)}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white font-bold rounded-lg text-xs uppercase shadow-md shadow-primary/10"
                  >
                    Connect
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

