import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { JobCard } from './JobCard';
import { ResumeIntelligence } from './ResumeIntelligence';

export function JobSearch({ searchQuery = '', setSearchQuery, applications = [], setApplications, setActiveTab }) {
  const [activeSearchTab, setActiveSearchTab] = useState('listings');
  const [localQuery, setLocalQuery] = useState(searchQuery);

  const [filterJobTypes, setFilterJobTypes] = useState([]);
  const [filterLocationTypes, setFilterLocationTypes] = useState([]);
  const [filterLocationText, setFilterLocationText] = useState('');
  const [filterExperience, setFilterExperience] = useState('Any Experience');
  const [filterIncome, setFilterIncome] = useState(0);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const featuredJobs = [
    {
      company: "Google",
      title: "Software Engineer III",
      location: "Mountain View, CA",
      type: "Full-time",
      locationType: "On-site",
      experience: "Senior (5+ years)",
      salaryMin: 165000,
      match: 98,
      salary: "$165k - $220k",
      tags: ["Distributed Systems", "Cloud"],
      logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuC6n9O4Yw1sHm33bnxv42c3Lc__KboJawPt7X0Q7ccBUqzaPBfqbyO3NijginBJ6pnNTcE0_zmA7b1bGoiapK3X6BW-S-8TbXCeAv06XaZs1HCk-oGvvv1g-VLo9cAZjCiqB0aOwe6GDt5BS-e1hdsRwWFNw_UkfrG-HrmWWGQZ8xxzZibnX37QHy3ASKJFheqhCdg0lpHIJRVgXK5s52Z5gSAIq78DMoGGiR60gBtoynaU4cZUm8k_PZT2u6YCkx7jmjC36lPZNho",
      missingSkills: ["Go (Golang)"],
      shortDescription: "Lead the design and implementation of highly scalable distributed cloud services.",
      description: [
        "Design, develop, test, deploy, maintain and improve software.",
        "Manage individual project priorities, deadlines and deliverables.",
        "Lead designs of major software components, systems, and features.",
        "Mentor and train other team members on design techniques, and coding standards."
      ]
    },
    {
      company: "Stripe",
      title: "Frontend Engineer (Payments)",
      location: "Seattle, WA",
      type: "Full-time",
      locationType: "Remote",
      experience: "Mid Level (3-5 years)",
      salaryMin: 150000,
      match: 94,
      salary: "$150k - $190k",
      tags: ["React", "Typescript", "Fintech"],
      logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwmqkI3ugEyAnfsIVvXzR8vd1J9f9masmOZDuUcNxM7Pmv5auaHnJq4jqZ5RB7EIjvXQsdKUi2ABBHG3llgUqyEP5yE7D0qP5CkjcWdlKUA7oZBD_Dlw2-p_9z5NlKJZYVCIdL0Vm7HIl-f2boEq24HBF7pJTQqExh8pVkjGr08UsJTHsMsobEApFce94gIcP0x-ewbECTANIIia9-IFVjjnPsCN_GKmKcyFq7ad9D5XaRJsmIF7esEeXyeTEQEeY4oE8nnrrOxvY",
      missingSkills: ["GraphQL"],
      shortDescription: "Build pixel-perfect, accessible, and performant user interfaces for global payment flows.",
      description: [
        "Architect and build responsive, accessible React components.",
        "Collaborate with design and product to define frontend APIs and standards.",
        "Optimize Webpack builds and frontend performance metrics.",
        "Ensure secure and compliant rendering of sensitive payment information."
      ]
    },
    {
      company: "Airbnb",
      title: "Product Designer",
      location: "San Francisco, CA",
      type: "Contract",
      locationType: "Hybrid",
      experience: "Mid Level (3-5 years)",
      salaryMin: 90000,
      match: 82,
      salary: "$90/hr",
      tags: ["Figma", "Design Systems"],
      logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDg5TCxfVEVTwqJBz3K-PoZz7BV9o2AA5pVePpvL0rcQ2qmEXRmFlA0q4xQj7Ledty0tT-oWh2v2MJfW10NJ7T7tBsXlcXcFhkRCegUsSzWpq1n-AwnLT3vxcZslE9dqzR8qr6GivlnTq0nPfj52oIBX2EI5FBBkYXMZKOXFqLvniLWgMp_jvg1z5bBSSGNYbv98_i3eMvUx7ss6vf3rnSI7gZmquBT9kSXD_J-T9MEFc6Y8BfHITPC-q8VBN9vrnEJMIYTTXdwmiA",
      missingSkills: ["Framer"],
      shortDescription: "Craft intuitive end-to-end user journeys for hosts and guests around the world.",
      description: [
        "Create wireframes, prototypes, and high-fidelity designs.",
        "Conduct user research and translate insights into design solutions.",
        "Maintain and evolve our core Design System.",
        "Partner closely with engineering to ensure high-quality implementation."
      ]
    },
    {
      company: "Meta",
      title: "Machine Learning Engineer",
      location: "Menlo Park, CA",
      type: "Full-time",
      locationType: "On-site",
      experience: "Mid Level (3-5 years)",
      salaryMin: 180000,
      match: 88,
      salary: "$180k - $250k",
      tags: ["PyTorch", "Recommendation Systems"],
      logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg",
      missingSkills: ["C++"],
      shortDescription: "Develop deep learning models to personalize content discovery for billions of users.",
      description: [
        "Train and evaluate large-scale recommendation models.",
        "Optimize PyTorch inference pipelines for low latency.",
        "Run massive A/B tests to measure model impact.",
        "Publish novel ML research and contribute to open source."
      ]
    },
    {
      company: "Amazon",
      title: "SDE Intern",
      location: "Seattle, WA",
      type: "Internship",
      locationType: "On-site",
      experience: "Entry Level (0-2 years)",
      salaryMin: 96000,
      match: 95,
      salary: "$8k/mo",
      tags: ["Java", "AWS"],
      logo: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg",
      missingSkills: ["DynamoDB"],
      shortDescription: "Join a 12-week internship program building backend services for AWS core infrastructure.",
      description: [
        "Design and implement a scalable microservice using Java and AWS.",
        "Participate in daily standups and agile sprint planning.",
        "Write unit and integration tests to ensure code reliability.",
        "Present your final project to senior engineering leadership."
      ]
    },
    {
      company: "Netflix",
      title: "Backend Developer",
      location: "Los Gatos, CA",
      type: "Full-time",
      locationType: "Remote",
      experience: "Senior (5+ years)",
      salaryMin: 200000,
      match: 91,
      salary: "$200k - $280k",
      tags: ["Java", "Microservices", "Spring Boot"],
      logo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
      missingSkills: ["gRPC"],
      shortDescription: "Build resilient, high-throughput backend services powering global video streaming.",
      description: [
        "Design APIs that serve millions of requests per second.",
        "Implement chaos engineering practices to ensure high availability.",
        "Optimize JVM performance and memory footprints.",
        "Collaborate with client teams to define efficient data payloads."
      ]
    },
    {
      company: "Microsoft",
      title: "Data Scientist",
      location: "Redmond, WA",
      type: "Full-time",
      locationType: "Hybrid",
      experience: "Mid Level (3-5 years)",
      salaryMin: 140000,
      match: 86,
      salary: "$140k - $180k",
      tags: ["Python", "SQL", "PowerBI"],
      logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
      missingSkills: ["Azure ML"],
      shortDescription: "Analyze massive telemetry datasets to drive product strategy for Office 365.",
      description: [
        "Build predictive models for user churn and engagement.",
        "Design complex SQL pipelines and data warehouses.",
        "Create interactive dashboards for executive leadership.",
        "Translate abstract business questions into quantitative analyses."
      ]
    },
    {
      company: "Apple",
      title: "Hardware Engineer",
      location: "Cupertino, CA",
      type: "Full-time",
      locationType: "On-site",
      experience: "Senior (5+ years)",
      salaryMin: 150000,
      match: 75,
      salary: "$150k - $200k",
      tags: ["Verilog", "PCB Design"],
      logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
      missingSkills: ["SystemVerilog", "Thermal Analysis"],
      shortDescription: "Design next-generation silicon and board-level components for future Apple devices.",
      description: [
        "Perform schematic capture and PCB layout reviews.",
        "Conduct signal integrity and power integrity simulations.",
        "Collaborate with industrial design and manufacturing teams.",
        "Bring up and debug prototype hardware in the lab."
      ]
    },
    {
      company: "Vercel",
      title: "Developer Advocate",
      location: "San Francisco, CA",
      type: "Part-time",
      locationType: "Remote",
      experience: "Mid Level (3-5 years)",
      salaryMin: 80000,
      match: 99,
      salary: "$80k - $120k",
      tags: ["Next.js", "Content Creation"],
      logo: "https://assets.vercel.com/image/upload/v1588805858/repositories/vercel/logo.png",
      missingSkills: [],
      shortDescription: "Empower the developer community through education, open-source, and exceptional documentation.",
      description: [
        "Write in-depth technical blog posts and tutorials.",
        "Speak at conferences and host community livestreams.",
        "Gather feedback from developers to shape product roadmaps.",
        "Build engaging demo applications showcasing new Vercel features."
      ]
    },
    {
      company: "Spotify",
      title: "iOS Engineer",
      location: "New York, NY",
      type: "Full-time",
      locationType: "Hybrid",
      experience: "Entry Level (0-2 years)",
      salaryMin: 130000,
      match: 89,
      salary: "$130k - $170k",
      tags: ["Swift", "Objective-C"],
      logo: "https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg",
      missingSkills: ["CoreAudio"],
      shortDescription: "Deliver seamless audio streaming experiences to millions of iOS users worldwide.",
      description: [
        "Write clean, testable Swift code for the core Spotify app.",
        "Collaborate with designers to implement fluid animations and UI.",
        "Optimize app binary size and battery consumption.",
        "Participate in comprehensive code reviews and architectural planning."
      ]
    },
    {
      company: "Uber",
      title: "Product Manager",
      location: "San Francisco, CA",
      type: "Full-time",
      locationType: "On-site",
      experience: "Senior (5+ years)",
      salaryMin: 160000,
      match: 81,
      salary: "$160k - $210k",
      tags: ["Strategy", "Agile", "Data Analysis"],
      logo: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png",
      missingSkills: ["SQL", "Growth Marketing"],
      shortDescription: "Lead the roadmap and execution for the driver-side earnings experience.",
      description: [
        "Define the vision and strategy for driver financial products.",
        "Write PRDs and coordinate sprints with engineering and design.",
        "Analyze market trends and conduct user interviews.",
        "Track KPIs and iterate rapidly based on data insights."
      ]
    }
  ];

  const handleApply = (job) => {
    const isAlreadyApplied = applications.some(
      app => app.company.toLowerCase() === job.company.toLowerCase() &&
             app.role.toLowerCase() === job.title.toLowerCase()
    );
    if (isAlreadyApplied) return;

    const newApp = {
      id: Date.now().toString(),
      company: job.company,
      role: job.title,
      appliedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      status: 'Applied',
      logo: job.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.company)}&background=random`
    };

    setApplications([newApp, ...applications]);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setLocalQuery(val);
    if (setSearchQuery) {
      setSearchQuery(val);
    }
  };

  const filteredJobs = featuredJobs.filter(job => {
    const q = localQuery.toLowerCase();
    const matchesQuery = !q || job.title.toLowerCase().includes(q) ||
                         job.company.toLowerCase().includes(q) ||
                         job.location.toLowerCase().includes(q) ||
                         job.tags.some(tag => tag.toLowerCase().includes(q));

    const matchesType = filterJobTypes.length === 0 || filterJobTypes.includes(job.type);
    const matchesLocType = filterLocationTypes.length === 0 || filterLocationTypes.includes(job.locationType);
    const matchesLocText = !filterLocationText || job.location.toLowerCase().includes(filterLocationText.toLowerCase());
    const matchesExp = filterExperience === 'Any Experience' || job.experience === filterExperience;
    const matchesIncome = job.salaryMin >= filterIncome;

    return matchesQuery && matchesType && matchesLocType && matchesLocText && matchesExp && matchesIncome;
  });

  const tabClass = (active) =>
    `px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${active ? 'bg-white elev-sm text-primary' : 'text-slate-500 hover:text-slate-900'}`;

  return (
    <div className="pt-24 px-8 pb-12 max-w-7xl mx-auto space-y-8">
      <header className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-2xl md:text-3xl font-headline font-semibold text-slate-900 tracking-tight">Opportunities</h2>
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button onClick={() => setActiveSearchTab('listings')} className={tabClass(activeSearchTab === 'listings')}>
              All listings
            </button>
            <button onClick={() => setActiveSearchTab('intelligence')} className={tabClass(activeSearchTab === 'intelligence')}>
              Resume AI match
            </button>
          </div>
        </div>

        {activeSearchTab === 'listings' && (
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
              <input
                type="text"
                placeholder="Search by role, company, or keywords..."
                value={localQuery}
                onChange={handleSearchChange}
                className="w-full bg-white pl-12 pr-6 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-colors text-slate-900"
              />
            </div>
            <button className="px-5 bg-white rounded-xl border border-slate-300 flex items-center gap-2 font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined">tune</span>
              Filters
            </button>
          </div>
        )}
      </header>

      <AnimatePresence mode="wait">
        {activeSearchTab === 'listings' ? (
          <motion.div
            key="listings"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            className="grid grid-cols-12 gap-8"
          >
            <div className="col-span-12 lg:col-span-8 space-y-6">
              {filteredJobs.length === 0 ? (
                <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 text-sm">
                  No jobs match your search query. Try another keyword!
                </div>
              ) : (
                filteredJobs.map((job, i) => {
                  const isApplied = applications.some(
                    app => app.company.toLowerCase() === job.company.toLowerCase() &&
                           app.role.toLowerCase() === job.title.toLowerCase()
                  );
                  return (
                    <JobCard key={i} job={job} applied={isApplied} onApply={() => handleApply(job)} />
                  );
                })
              )}

              <div className="flex justify-center pt-6">
                <button className="px-6 py-2.5 border border-slate-300 bg-white text-slate-700 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-colors">
                  Load more results
                </button>
              </div>
            </div>

            <aside className="col-span-12 lg:col-span-4 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 elev-sm sticky top-28">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                  <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">tune</span>
                    Filters
                  </h3>
                  <button className="text-xs font-semibold text-slate-400 hover:text-primary transition-colors">Clear all</button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 mb-3">Job type</h4>
                    <div className="space-y-2.5">
                      {['Full-time', 'Part-time', 'Internship', 'Contract'].map(type => (
                        <label key={type} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={filterJobTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) setFilterJobTypes([...filterJobTypes, type]);
                              else setFilterJobTypes(filterJobTypes.filter(t => t !== type));
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                          />
                          <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 mb-3">Location type</h4>
                    <div className="space-y-2.5">
                      {['Remote', 'Hybrid', 'On-site'].map(type => (
                        <label key={type} className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={filterLocationTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) setFilterLocationTypes([...filterLocationTypes, type]);
                              else setFilterLocationTypes(filterLocationTypes.filter(t => t !== type));
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                          />
                          <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 mb-3">Location</h4>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">location_on</span>
                      <input
                        type="text"
                        placeholder="e.g. San Francisco, CA"
                        value={filterLocationText}
                        onChange={(e) => setFilterLocationText(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-colors text-slate-700 placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-700 mb-3">Experience level</h4>
                    <select
                      value={filterExperience}
                      onChange={(e) => setFilterExperience(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-colors text-slate-700 cursor-pointer"
                    >
                      <option>Any Experience</option>
                      <option>Entry Level (0-2 years)</option>
                      <option>Mid Level (3-5 years)</option>
                      <option>Senior (5+ years)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xs font-semibold text-slate-700">Min income range</h4>
                      <span className="text-xs font-semibold text-primary bg-primary-soft px-2 py-0.5 rounded-md">${Math.round(filterIncome / 1000)}k+</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="250000"
                      step="10000"
                      value={filterIncome}
                      onChange={(e) => setFilterIncome(Number(e.target.value))}
                      className="w-full accent-primary cursor-pointer"
                    />
                    <div className="flex justify-between mt-2 text-xs text-slate-400 font-medium">
                      <span>$0</span>
                      <span>$250k+</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setFilterJobTypes([]);
                    setFilterLocationTypes([]);
                    setFilterLocationText('');
                    setFilterExperience('Any Experience');
                    setFilterIncome(0);
                  }}
                  className="w-full mt-8 py-3 bg-primary text-on-primary font-semibold rounded-xl hover:bg-primary-hover transition-colors"
                >
                  Clear filters
                </button>
              </div>
            </aside>
          </motion.div>
        ) : (
          <motion.div
            key="intelligence"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
          >
            <ResumeIntelligence />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
