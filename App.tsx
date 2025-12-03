
import React, { useState, useEffect, useRef } from 'react';
import { Github, Linkedin, Mail, ExternalLink, Cpu, Database, LayoutDashboard, FolderOpen, Clock, Terminal as TerminalIcon, ShieldCheck, Activity, Wifi, User, ImageOff } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { RetroComputerScene } from './components/RetroComputerScene';
import { TerminalChat } from './components/TerminalChat';
import { PORTFOLIO_DATA } from './data/portfolio';
import { Project } from './types';

// Wrapper for 3D Tilt Effect on cards
const TiltWrapper = ({ children }: { children?: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate rotation range -10 to 10 degrees
    const rotateY = ((x / rect.width) - 0.5) * 10; 
    const rotateX = ((y / rect.height) - 0.5) * -10;

    setRotation({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX: rotation.x, rotateY: rotation.y }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{ transformStyle: "preserve-3d" }}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  );
};

// Animated Cyber Grid Background
const CyberGrid = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Moving Grid */}
      <div 
        className="absolute inset-0 opacity-[0.05]" 
        style={{ 
          backgroundImage: `linear-gradient(to right, #00f0ff 1px, transparent 1px), linear-gradient(to bottom, #00f0ff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          transform: 'perspective(500px) rotateX(60deg) translateY(-100px) scale(2)',
          transformOrigin: 'top center'
        }} 
      />
      {/* Central Nebula Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyber/10 rounded-full blur-[100px] mix-blend-screen animate-pulse" />
      
      {/* Vignette */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-slate-900/50 to-slate-900/90" />
    </div>
  );
};

// --- View Components ---

const DashboardView = () => {
    const [imgError, setImgError] = useState(false);
    return (
    <div className="relative h-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-cyber/20 relative z-10">
            {/* Profile Card */}
            <div className="lg:col-span-2 space-y-6">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-8 flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyber/5 to-transparent pointer-events-none" />
                    <div className="relative shrink-0">
                        <div className="absolute inset-0 bg-cyber/20 blur-xl rounded-full" />
                        {imgError ? (
                            <div className="relative w-32 h-32 rounded-full border-2 border-cyber bg-slate-800 flex items-center justify-center">
                                <User size={48} className="text-cyber" />
                            </div>
                        ) : (
                            <img 
                                src={PORTFOLIO_DATA.avatarUrl} 
                                alt="Profile" 
                                className="relative w-32 h-32 rounded-full border-2 border-cyber object-cover object-top" 
                                onError={() => setImgError(true)}
                            />
                        )}
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900" />
                    </div>
                    <div className="space-y-4 text-center md:text-left relative">
                        <div>
                            <h2 className="text-3xl font-bold text-white tracking-tight">{PORTFOLIO_DATA.name}</h2>
                            <div className="text-cyber font-mono text-sm mt-1">{PORTFOLIO_DATA.title}</div>
                        </div>
                        <p className="text-slate-300 leading-relaxed max-w-lg">
                            {PORTFOLIO_DATA.bio}
                        </p>
                        <div className="flex gap-4 justify-center md:justify-start">
                            <motion.a 
                                whileHover={{ y: -2 }} 
                                href={PORTFOLIO_DATA.social.github} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-white/5 rounded-lg hover:bg-white/10 hover:text-cyber transition-colors"
                            >
                                <Github size={20} />
                            </motion.a>
                            <motion.a 
                                whileHover={{ y: -2 }} 
                                href={PORTFOLIO_DATA.social.linkedin} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 bg-white/5 rounded-lg hover:bg-white/10 hover:text-cyber transition-colors"
                            >
                                <Linkedin size={20} />
                            </motion.a>
                            <motion.a 
                                whileHover={{ y: -2 }} 
                                href={PORTFOLIO_DATA.social.email}
                                className="p-2 bg-white/5 rounded-lg hover:bg-white/10 hover:text-cyber transition-colors"
                            >
                                <Mail size={20} />
                            </motion.a>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'PROJECTS', value: '5+', icon: <FolderOpen className="text-purple-400" /> },
                        { label: 'EXP', value: '1 YR', icon: <Clock className="text-blue-400" /> },
                        { label: 'STACK', value: 'PYTHON', icon: <Database className="text-green-400" /> }
                    ].map((stat, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 + (i * 0.1) }}
                            className="bg-slate-900/40 border border-slate-700/50 p-4 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-slate-800/50 transition-colors"
                        >
                            {stat.icon}
                            <div className="text-2xl font-bold text-white">{stat.value}</div>
                            <div className="text-[10px] text-slate-500 tracking-widest">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Skills Panel */}
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 rounded-xl p-6 flex flex-col"
            >
                <h3 className="text-lg font-mono text-white mb-6 flex items-center gap-2">
                    <Cpu size={18} className="text-cyber" />
                    SKILL_PROFICIENCIES
                </h3>
                <div className="flex flex-wrap gap-2 content-start">
                    {PORTFOLIO_DATA.skills.map((skill, i) => (
                        <div key={skill} className="px-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded text-xs text-slate-300 hover:border-cyber/50 hover:text-cyber transition-colors cursor-default">
                            {skill}
                        </div>
                    ))}
                </div>
                
                <div className="mt-auto pt-6">
                    <div className="h-32 rounded-lg bg-slate-950/50 border border-slate-800 p-4 relative overflow-hidden flex items-end justify-between gap-1">
                        {/* Fake Graph */}
                        {[40, 70, 45, 90, 60, 80, 50, 75, 60, 95].map((h, i) => (
                            <motion.div 
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{ delay: 0.5 + (i * 0.05), duration: 1 }}
                                className="w-full bg-cyber/20 border-t border-cyber rounded-t-sm relative group"
                            >
                                <div className="absolute inset-0 bg-cyber opacity-0 group-hover:opacity-10 transition-opacity" />
                            </motion.div>
                        ))}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-2 font-mono text-center">SYSTEM_PERFORMANCE_METRICS</div>
                </div>
            </motion.div>
        </div>
    </div>
);
}

const ProjectCard = ({ project }: { project: Project }) => {
    const [imgError, setImgError] = useState(false);

    return (
        <div className="h-full">
            <TiltWrapper>
                <div className="group h-full bg-slate-900/60 backdrop-blur border border-slate-700 hover:border-cyber/50 rounded-xl overflow-hidden transition-all duration-300 flex flex-col">
                    <div className="h-40 overflow-hidden relative bg-slate-800">
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10" />
                        
                        {!imgError ? (
                            <img 
                                src={project.imageUrl} 
                                alt={project.title} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                onError={() => setImgError(true)}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 group-hover:scale-110 transition-transform duration-500">
                                <div className="text-center p-4">
                                    <ImageOff className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                                    <span className="text-xs text-slate-500 font-mono">IMG_NOT_FOUND</span>
                                </div>
                            </div>
                        )}
                        
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-lg text-white group-hover:text-cyber transition-colors">{project.title}</h3>
                            <div className="flex gap-3">
                                {project.repoUrl && <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-colors"><Github size={16} /></a>}
                                {project.demoUrl && <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-colors"><ExternalLink size={16} /></a>}
                            </div>
                        </div>
                        <p className="text-sm text-slate-400 mb-4 flex-1 leading-relaxed">{project.description}</p>
                        <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-slate-800">
                            {project.techStack.slice(0, 3).map(t => (
                                <span key={t} className="text-[10px] font-mono text-cyber/70 bg-cyber/5 px-2 py-1 rounded">
                                    {t}
                                </span>
                            ))}
                            {project.techStack.length > 3 && (
                                <span className="text-[10px] font-mono text-slate-500 px-2 py-1">+{project.techStack.length - 3}</span>
                            )}
                        </div>
                    </div>
                </div>
            </TiltWrapper>
        </div>
    );
};

const ProjectsView = () => (
    <div className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-cyber/20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {PORTFOLIO_DATA.projects.map((project, i) => (
                <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="h-full"
                >
                   <ProjectCard project={project} />
                </motion.div>
            ))}
        </div>
    </div>
);

const ExperienceView = () => (
    <div className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-cyber/20 relative z-10">
        <div className="max-w-3xl mx-auto space-y-8 relative pb-20">
            {/* Timeline Line */}
            <div className="absolute left-0 md:left-8 top-4 bottom-0 w-px bg-slate-800" />
            
            {PORTFOLIO_DATA.experience.map((exp, i) => (
                <motion.div 
                    key={exp.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.2 }}
                    className="relative pl-8 md:pl-20"
                >
                    {/* Timeline Node */}
                    <div className="absolute left-[-5px] md:left-[27px] top-1.5 w-3 h-3 rounded-full bg-slate-900 border-2 border-cyber shadow-[0_0_10px_rgba(0,240,255,0.5)] z-10" />
                    
                    <div className="bg-slate-900/60 border border-slate-700/50 p-6 rounded-xl hover:bg-slate-900/80 transition-colors group">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white group-hover:text-cyber transition-colors">{exp.role}</h3>
                                <div className="text-purple-400 font-mono text-sm">{exp.company}</div>
                            </div>
                            <div className="px-3 py-1 bg-slate-800 rounded-full text-xs font-mono text-slate-400 border border-slate-700 whitespace-nowrap">
                                {exp.period}
                            </div>
                        </div>
                        <ul className="space-y-2">
                            {exp.description.map((desc, idx) => (
                                <li key={idx} className="flex gap-3 text-sm text-slate-400">
                                    <span className="text-cyber mt-1.5 w-1 h-1 rounded-full shrink-0" />
                                    {desc}
                                </li>
                            ))}
                        </ul>
                    </div>
                </motion.div>
            ))}
        </div>
    </div>
);

// --- Main App ---

const App = () => {
  const [hasEntered, setHasEntered] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'projects' | 'experience' | 'terminal'>('dashboard');
  const [bootSequenceComplete, setBootSequenceComplete] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Track scroll for 3D camera movement - repurposed for parallax in dashboard if needed
  // For now, we keep it 0 since dashboard is fixed
  const scrollValue = 0;

  useEffect(() => {
    if (hasEntered) {
        setTimeout(() => setBootSequenceComplete(true), 800);
    }
  }, [hasEntered]);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'DASHBOARD' },
    { id: 'projects', icon: FolderOpen, label: 'PROJECTS' },
    { id: 'experience', icon: Clock, label: 'LOGS' },
    { id: 'terminal', icon: TerminalIcon, label: 'TERMINAL' },
  ] as const;

  return (
    <div className={`relative w-screen h-screen bg-[#2b002b] text-white overflow-hidden font-sans selection:bg-cyber selection:text-black`}>
      
      {/* 3D Background */}
      <div className="fixed inset-0 z-0">
        <RetroComputerScene 
            entered={hasEntered} 
            onEnter={() => setHasEntered(true)} 
            scrollProgress={scrollValue}
        />
      </div>

      {/* OS Interface */}
      <AnimatePresence>
        {hasEntered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="relative z-10 w-full h-full flex flex-col p-4 md:p-6"
          >
            {/* --- Status Bar --- */}
            <motion.header 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="h-10 mb-4 flex items-center justify-between px-4 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-lg font-mono text-xs text-slate-400 select-none z-50"
            >
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-cyber">
                        <Activity size={14} />
                        <span className="font-bold tracking-wider">NEURAL_OS v4.2</span>
                    </div>
                    <div className="hidden md:flex gap-4">
                        <span>CPU: 12%</span>
                        <span>MEM: 4.2GB</span>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Wifi size={14} />
                        <span className="text-green-500">CONNECTED</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={14} />
                        <span>SECURE</span>
                    </div>
                    <div>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            </motion.header>

            {/* --- Main Workspace --- */}
            <div className="flex-1 flex gap-6 overflow-hidden relative">
                
                {/* Dock / Sidebar */}
                <motion.nav 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="w-16 md:w-20 shrink-0 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col items-center py-6 gap-6 z-50"
                >
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            className={`group relative w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-300 ${activeView === item.id ? 'bg-cyber/20 text-cyber shadow-[0_0_15px_rgba(0,240,255,0.3)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <item.icon size={24} />
                            
                            {/* Tooltip */}
                            <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                {item.label}
                            </div>

                            {/* Active Indicator */}
                            {activeView === item.id && (
                                <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 w-1 h-8 bg-cyber rounded-full shadow-[0_0_10px_#00f0ff]" />
                            )}
                        </button>
                    ))}
                </motion.nav>

                {/* Content Viewport */}
                <motion.main 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="flex-1 bg-slate-900/20 backdrop-blur-sm border border-white/5 rounded-2xl relative overflow-hidden shadow-2xl"
                >
                    {/* Background Texture - CyberGrid */}
                    <CyberGrid />

                    {/* CRT Scanline Overlay specifically for the content area */}
                    <div className="absolute inset-0 pointer-events-none z-20 crt-overlay opacity-30 rounded-2xl" />
                    
                    {/* Header Decoration */}
                    <div className="absolute top-0 right-0 p-4 z-10 opacity-30 pointer-events-none">
                        <Database size={100} className="text-white/5" />
                    </div>

                    <div className="absolute inset-0 p-6 md:p-8 z-10">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeView}
                                initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
                                transition={{ duration: 0.3 }}
                                className="h-full"
                            >
                                <div className="mb-6 flex items-baseline gap-4 border-b border-white/5 pb-4">
                                    <h1 className="text-2xl font-bold tracking-wider text-white">{navItems.find(n => n.id === activeView)?.label}</h1>
                                    <span className="font-mono text-xs text-cyber animate-pulse">_SYSTEM_READY</span>
                                </div>
                                
                                <div className="h-[calc(100%-4rem)]">
                                    {activeView === 'dashboard' && <DashboardView />}
                                    {activeView === 'projects' && <ProjectsView />}
                                    {activeView === 'experience' && <ExperienceView />}
                                    {activeView === 'terminal' && (
                                        <div className="h-full flex flex-col justify-center">
                                            <TerminalChat />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.main>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
