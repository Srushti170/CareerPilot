import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './ui/Card';
import { getStudentProfile, saveStudentProfile } from '../lib/studentProfile';
import { authApi } from '../lib/backendSync';

const inputClass = "w-full px-4 py-2.5 rounded-lg bg-white border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-colors text-sm";

function displayValue(value, placeholder) {
  return String(value || '').trim() || placeholder;
}

export function Profile({ currentUser, setCurrentUser }) {
  const [profile, setProfile] = useState(() => getStudentProfile(currentUser));

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(null);
  const [newSocialHandle, setNewSocialHandle] = useState('');

  const [editName, setEditName] = useState(profile.name);
  const [editLocation, setEditLocation] = useState(profile.location);
  const [editSummary, setEditSummary] = useState(profile.summary);
  const [editUniversity, setEditUniversity] = useState(profile.university);
  const [editGpa, setEditGpa] = useState(profile.gpa);
  const [editCoursework, setEditCoursework] = useState(profile.coursework);
  const [editGraduation, setEditGraduation] = useState(profile.graduation);
  const [newSkillText, setNewSkillText] = useState('');

  const saveProfile = async (updated) => {
    const normalized = saveStudentProfile(updated, currentUser);
    setProfile(normalized);

    if (currentUser && (normalized.name !== currentUser.name || normalized.email !== currentUser.email)) {
      try {
        const response = await authApi.updateProfile({
          currentEmail: currentUser.email,
          name: normalized.name,
          email: normalized.email,
        });
        const updatedUser = response.user || { ...currentUser, name: normalized.name, email: normalized.email };
        setCurrentUser(updatedUser);
        localStorage.setItem('careerpilot_current_user', JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Profile account sync error:', error);
      }
    }
  };

  const handleDownloadResume = () => {
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
            h2 { font-size: 16px; font-weight: bold; text-transform: uppercase; color: #0f766e; margin-top: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
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
    let score = 20;
    if (profile.summary.length > 50) score += 20;
    if (profile.skills.length >= 5) score += 20;
    if (profile.university && profile.gpa) score += 20;

    const connectedCount = Object.values(profile.socials).filter(s => s.connected).length;
    if (connectedCount >= 2) score += 20;
    else if (connectedCount === 1) score += 10;

    return score;
  };

  const strength = calculateProfileStrength();

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    await saveProfile({
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
      [isConnectOpen]: { connected: true, handle: newSocialHandle }
    };
    saveProfile({ ...profile, socials: updatedSocials });
    setIsConnectOpen(null);
    setNewSocialHandle('');
  };

  const handleDisconnectSocial = (platform) => {
    const updatedSocials = {
      ...profile.socials,
      [platform]: { connected: false, handle: "" }
    };
    saveProfile({ ...profile, socials: updatedSocials });
  };

  const addSkill = (e) => {
    e.preventDefault();
    if (!newSkillText.trim() || profile.skills.includes(newSkillText.trim())) return;
    saveProfile({ ...profile, skills: [...profile.skills, newSkillText.trim()] });
    setNewSkillText('');
  };

  const removeSkill = (skill) => {
    saveProfile({ ...profile, skills: profile.skills.filter(s => s !== skill) });
  };

  const headline = [profile.role, profile.university].filter(Boolean).join(' @ ');
  const educationTitle = profile.degree || profile.branch;

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-8 pb-12 pt-24">
      <header className="flex flex-col md:flex-row gap-8 items-start md:items-center">
        <div className="relative">
          <div className="w-28 h-28 rounded-2xl overflow-hidden border border-slate-200 elev-sm">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC42WzyRRM9i-A-ICmV_pg60wrnV6wmP2YNel9d09qWP8QDl2Z5I0UTb-etCnEIu3CR6etIn6A1mvu9hW8Nu905W_iU-v39Jmhr3643oecpxiMi__iNi9fkrb5kxEv150M8m9agiFNGNyqvy1n9Tlo54Czu1umtCZOmVVDeD6ga9MEaDTIFsB23F95vkFtAHieg1w2r4MxiQwjFr6r77oUKzRgPhI45cIwOIef4r0P29jWL9GS1Y_j85DmndrFu8roy5VTB0UHtRB0"
              className="w-full h-full object-cover"
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
            className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-white elev-md flex items-center justify-center text-primary border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
        </div>

        <div className="flex-1">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-headline font-semibold text-slate-900 tracking-tight">{profile.name}</h1>
                <span className="px-2.5 py-1 bg-primary-soft text-primary text-[11px] font-semibold rounded-md">Student</span>
              </div>
              <p className="text-base text-slate-500 mb-4">{displayValue(headline, 'Profile details not added')}</p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="material-symbols-outlined text-primary text-base">location_on</span>
                  <span className="text-xs font-medium text-slate-700">{displayValue(profile.location, 'Location not added')}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="material-symbols-outlined text-primary text-base">mail</span>
                  <span className="text-xs font-medium text-slate-700">{displayValue(profile.email, 'Email not added')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 elev-sm">
              <div className="relative h-20 w-20">
                <svg className="h-full w-full -rotate-90">
                  <circle cx="40" cy="40" r="32" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    fill="transparent"
                    stroke="#0f766e"
                    strokeWidth="8"
                    strokeDasharray="201"
                    strokeDashoffset={201 - (201 * strength) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-lg font-headline font-bold text-slate-900">
                  {strength}%
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">Profile strength</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {strength >= 80 ? 'Excellent' : strength >= 50 ? 'Good' : 'Incomplete'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handleDownloadResume} className="px-4 py-2.5 bg-primary text-on-primary font-semibold rounded-xl hover:bg-primary-hover transition-colors text-sm">
            Download resume
          </button>
          
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Professional summary</h3>
            <Card className="p-4 leading-relaxed text-slate-600 text-sm">
              {profile.summary}
            </Card>
          </section>
          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Education</h3>
            <Card className="p-0 overflow-hidden">
              <div className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex gap-4">
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-slate-900 text-base">{displayValue(educationTitle, 'Education not added')}</h4>
                      <span className="text-xs font-medium text-slate-400">{displayValue(profile.graduation, 'Graduation year not added')}</span>
                    </div>
                    <p className="text-primary font-semibold text-sm">{displayValue(profile.university, 'University not added')}</p>
                    <p className="text-xs text-slate-500 mt-2">Major GPA: {profile.gpa} • Relevant coursework: {profile.coursework}</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Key skills & expertise</h3>
            <form onSubmit={addSkill} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Type skill (e.g. Go, Rust) and press enter..."
                value={newSkillText}
                onChange={(e) => setNewSkillText(e.target.value)}
                className={inputClass}
              />
              <button type="submit" className="px-4 bg-primary text-on-primary font-semibold rounded-lg text-sm hover:bg-primary-hover transition-colors">Add</button>
            </form>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map(skill => (
                <div key={skill} className="px-3 py-2 bg-white rounded-lg border border-slate-200 flex items-center gap-2 group hover:border-danger/30 transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors"></span>
                  <span className="text-sm font-medium text-slate-700">{skill}</span>
                  <button onClick={() => removeSkill(skill)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-slate-400 hover:text-danger">
                    <span className="material-symbols-outlined text-xs">close</span>
                  </button>
                </div>
              ))}
            </div>
          </section>

          
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-8">
          <Card className="p-6">
            <h4 className="font-semibold text-slate-900 mb-5">Social connections</h4>
            <div className="space-y-3">
              {Object.entries(profile.socials).map(([name, data]) => {
                let icon = name === 'LinkedIn' ? 'link' : name === 'GitHub' ? 'code' : 'language';
                return (
                  <div key={name} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-400">{icon}</span>
                      <div>
                        <span className="text-sm font-semibold text-slate-900 block leading-tight">{name}</span>
                        {data.connected && <span className="text-[11px] text-slate-500 truncate block max-w-[120px]">{data.handle}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {data.connected ? (
                        <>
                          <span className="material-symbols-outlined text-success text-sm">verified</span>
                          <button onClick={() => handleDisconnectSocial(name)} className="text-[11px] text-slate-400 hover:text-danger font-semibold ml-1">Disconnect</button>
                        </>
                      ) : (
                        <button onClick={() => setIsConnectOpen(name)} className="text-[11px] font-semibold text-primary hover:text-primary-hover">Connect</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl p-8 max-w-xl w-full border border-slate-200 elev-md relative my-8"
            >
              <button onClick={() => setIsEditOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <span className="material-symbols-outlined">close</span>
              </button>

              <h3 className="text-lg font-headline font-semibold text-slate-900 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit</span>
                Edit profile details
              </h3>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Full name</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required className={inputClass} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Location</label>
                    <input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Graduation year</label>
                    <input type="text" value={editGraduation} onChange={(e) => setEditGraduation(e.target.value)} className={inputClass} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">University</label>
                  <input type="text" value={editUniversity} onChange={(e) => setEditUniversity(e.target.value)} className={inputClass} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">GPA</label>
                    <input type="text" value={editGpa} onChange={(e) => setEditGpa(e.target.value)} className={inputClass} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Coursework</label>
                    <input type="text" value={editCoursework} onChange={(e) => setEditCoursework(e.target.value)} className={inputClass} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Professional summary</label>
                  <textarea rows="3" value={editSummary} onChange={(e) => setEditSummary(e.target.value)} className={`${inputClass} resize-none`} />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2.5 border border-slate-300 bg-white text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2.5 bg-primary text-on-primary font-semibold rounded-xl text-sm hover:bg-primary-hover transition-colors">
                    Save changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isConnectOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full border border-slate-200 elev-md relative"
            >
              <button onClick={() => setIsConnectOpen(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
                <span className="material-symbols-outlined">close</span>
              </button>

              <h3 className="text-lg font-headline font-semibold text-slate-900 mb-4">Connect {isConnectOpen}</h3>

              <form onSubmit={handleConnectSocial} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Username or URL</label>
                  <input
                    type="text"
                    placeholder={isConnectOpen === 'Portfolio' ? 'https://myportfolio.com' : `${isConnectOpen.toLowerCase()}.com/username`}
                    value={newSocialHandle}
                    onChange={(e) => setNewSocialHandle(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsConnectOpen(null)} className="px-4 py-2 border border-slate-300 bg-white text-slate-700 font-semibold rounded-lg text-sm hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-primary text-on-primary font-semibold rounded-lg text-sm hover:bg-primary-hover transition-colors">
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
