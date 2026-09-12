import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useSpring } from 'framer-motion';
import { Play, Menu, X, ArrowDown, ChevronRight } from 'lucide-react';

const BASE_URL = import.meta.env.BASE_URL;
const MANIFEST_URL = `${BASE_URL}data/manifest.json`;

const toSlug = (value) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

const formatCampaignTitle = (folderName) =>
    folderName
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map((word) => (word === word.toUpperCase() ? word : `${word.charAt(0).toUpperCase()}${word.slice(1)}`))
        .join(' ');

const formatMediaTitle = (fileName) => {
    const withoutExt = fileName.replace(/\.[^/.]+$/, '');
    return withoutExt.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
};

const useInViewVideo = () => {
    const ref = useRef(null);

    useEffect(() => {
        const video = ref.current;
        if (!video) return undefined;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    video.play().catch(() => {});
                } else {
                    video.pause();
                }
            },
            { rootMargin: '200px' }
        );

        observer.observe(video);
        return () => observer.disconnect();
    }, []);

    return ref;
};

const stripExtension = (fileName) => fileName.replace(/\.[^.]+$/, '');

const getMediaType = (fileName) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['mp4', 'mov', 'webm', 'm4v'].includes(ext)) return 'video';
    if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return 'image';
    return 'unknown';
};

const App = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [playingWithAudio, setPlayingWithAudio] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [loadingCampaigns, setLoadingCampaigns] = useState(true);
    const [campaignLoadError, setCampaignLoadError] = useState(null);
    const { scrollY } = useScroll();
    const heroOpacity = useTransform(scrollY, [0, 500], [1, 0]);
    const heroScale = useTransform(scrollY, [0, 500], [1, 1.1]);
    const navbarBg = useTransform(scrollY, [0, 100], ['rgba(10, 10, 10, 0)', 'rgba(10, 10, 10, 0.95)']);

    const mouseX = useSpring(0, { damping: 20, stiffness: 400 });
    const mouseY = useSpring(0, { damping: 20, stiffness: 400 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadCampaigns = async () => {
            try {
                setLoadingCampaigns(true);
                setCampaignLoadError(null);
                const response = await fetch(`${MANIFEST_URL}?v=${Date.now()}`);
                if (!response.ok) {
                    throw new Error(`Manifest request failed (${response.status}).`);
                }

                const manifest = await response.json();
                const normalizedCampaigns = (manifest.campaigns || [])
                    .map((campaign, campaignIndex) => {
                        const folderName = campaign.folderName || '';
                        const files = campaign.files || [];

                        const items = files
                            .map((fileName, itemIndex) => {
                                const mediaType = getMediaType(fileName);
                                return {
                                    id: campaignIndex * 100 + itemIndex + 1,
                                    title: formatMediaTitle(fileName),
                                    type: mediaType,
                                    file: encodeURI(`${BASE_URL}data/${folderName}/${fileName}`),
                                    poster: mediaType === 'video'
                                        ? encodeURI(`${BASE_URL}posters/${folderName}/${stripExtension(fileName)}.webp`)
                                        : null
                                };
                            })
                            .filter((item) => item.type !== 'unknown');

                        return {
                            id: toSlug(folderName),
                            title: formatCampaignTitle(folderName),
                            items
                        };
                    })
                    .filter((campaign) => campaign.id && campaign.items.length > 0);

                if (isMounted) {
                    setCampaigns(normalizedCampaigns);
                }
            } catch (error) {
                if (isMounted) {
                    setCampaignLoadError(error.message || 'Failed to load campaign data.');
                }
            } finally {
                if (isMounted) {
                    setLoadingCampaigns(false);
                }
            }
        };

        loadCampaigns();

        return () => {
            isMounted = false;
        };
    }, []);

    const firstCampaignId = campaigns[0]?.id;
    // A short, heavily compressed loop. The hero renders it at 30% opacity in
    // grayscale, so fidelity matters far less than weight here.
    const aboutVideoRef = useInViewVideo();
    const heroVideo = `${BASE_URL}hero/loop.mp4`;
    const heroPoster = `${BASE_URL}hero/poster.webp`;

    const MediaReel = ({ item, isPlaying, onToggle }) => {
        const videoRef = useRef(null);
        const isVideo = item.type === 'video';

        useEffect(() => {
            if (isVideo && videoRef.current) {
                if (isPlaying) {
                    videoRef.current.muted = false;
                    videoRef.current.play().catch(e => console.log("Play blocked:", e));
                } else {
                    videoRef.current.muted = true;
                }
            }
        }, [isPlaying, isVideo]);

        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                onClick={isVideo ? onToggle : undefined}
                className={`min-w-[70vw] md:min-w-[380px] aspect-[9/16] bg-zinc-950 rounded-[32px] overflow-hidden relative group snap-start border border-white/5 transition-all duration-700 ${isVideo ? 'cursor-pointer' : 'cursor-default'} ${isPlaying ? 'ring-2 ring-white/30' : ''}`}
            >
                {isVideo ? (
                    <>
                        {item.poster ? (
                            <img
                                src={item.poster}
                                alt=""
                                aria-hidden="true"
                                loading="lazy"
                                decoding="async"
                                className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${isPlaying ? 'opacity-100' : 'opacity-60 group-hover:opacity-100 grayscale-[30%] group-hover:grayscale-0'}`}
                            />
                        ) : null}
                        <video
                            ref={videoRef}
                            loop
                            playsInline
                            preload="none"
                            muted={!isPlaying}
                            className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${isPlaying ? 'opacity-100 scale-100' : 'opacity-60 group-hover:opacity-100 grayscale-[30%] group-hover:grayscale-0'}`}
                            onMouseEnter={e => !isPlaying && e.currentTarget.play()}
                            onMouseLeave={e => !isPlaying && e.currentTarget.pause()}
                        >
                            <source src={item.file} type="video/mp4" />
                        </video>
                    </>
                ) : (
                    <img
                        src={item.file}
                        alt={item.title}
                        className="absolute inset-0 h-full w-full object-cover opacity-75 group-hover:opacity-100 grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
                        loading="lazy"
                    />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent flex flex-col justify-end p-8">
                    <p className="text-white text-sm md:text-base font-semibold tracking-wide">{item.title}</p>
                </div>

                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 pointer-events-none ${isPlaying ? 'opacity-0 scale-150' : 'opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100'} ${isVideo ? '' : 'hidden'}`}>
                    <div className="h-28 w-28 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-white border border-white/20">
                        <Play fill="currentColor" size={40} />
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="relative overflow-hidden bg-[#050505] font-['Outfit'] selection:bg-amber-500 selection:text-black text-white px-[50px] md:px-0">
            {/* Custom Cursor */}
            <motion.div
                className="pointer-events-none fixed left-0 top-0 z-[10000] h-6 w-6 mix-blend-difference hidden md:block"
                style={{ x: mouseX, y: mouseY, translateX: -12, translateY: -12 }}
            >
                <div className="h-full w-full rounded-full border-2 border-white" />
            </motion.div>

            {/* Navbar */}
            <motion.nav
                style={{ backgroundColor: navbarBg }}
                className="fixed top-0 z-50 flex h-24 w-full items-center justify-between px-14 md:px-[250px] backdrop-blur-xl border-b border-white/5"
            >
                <div className="text-3xl font-black uppercase tracking-tighter">
                    THEEB<span className="text-zinc-500">.</span>
                </div>

                <div className="hidden items-center gap-12 md:flex">
                    <a href="#home" className="text-[10px] font-black uppercase tracking-[4px] text-zinc-500 hover:text-white transition-colors">Home</a>

                    {/* Work Dropdown */}
                    <div className="group relative py-4">
                        <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[4px] text-zinc-500 group-hover:text-white transition-colors">
                            Work
                            <ChevronRight size={12} className="rotate-90 group-hover:rotate-[-90deg] transition-transform duration-300" />
                        </button>

                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform scale-95 group-hover:scale-100 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                            <div className="space-y-1">
                                {campaigns.map((campaign) => (
                                    <a
                                        key={campaign.id}
                                        href={`#${campaign.id}`}
                                        className="group/item flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white"
                                    >
                                        {campaign.title}
                                        <ChevronRight size={10} className="opacity-0 group-hover/item:opacity-100 -translate-x-2 group-hover/item:translate-x-0 transition-all" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    <a href="#about" className="text-[10px] font-black uppercase tracking-[4px] text-zinc-500 hover:text-white transition-colors">About</a>

                    <a href="#contact" className="rounded-full bg-white px-16 py-6 text-sm font-black uppercase tracking-[3px] text-black hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 shadow-2xl flex items-center justify-center min-w-[200px]">
                        Let's Talk
                    </a>
                </div>

                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden">
                    <Menu size={32} />
                </button>
            </motion.nav>

            {/* Hero Section */}
            <section id="home" className="relative h-[95vh] w-full flex items-center justify-center text-center px-10 md:px-[250px]">
                <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="absolute inset-0 -z-10">
                    <video autoPlay muted loop playsInline poster={heroPoster || undefined} className="h-full w-full object-cover opacity-30 grayscale">
                        {heroVideo ? <source src={heroVideo} type="video/mp4" /> : null}
                    </video>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/50 to-[#050505]" />
                </motion.div>

                <div className="max-w-4xl">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-zinc-400 text-xs font-black uppercase tracking-[10px] mb-6 block"
                    >
                        Director & Visual Artist
                    </motion.span>
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-6xl md:text-9xl font-black uppercase tracking-tighter leading-none mb-8"
                    >
                        CRAFTING <br /> <span className="outline-text">STORIES</span>
                    </motion.h1>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="flex justify-center gap-4"
                    >
                        <a href={firstCampaignId ? `#${firstCampaignId}` : '#home'} className="h-16 w-16 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all group">
                            <ArrowDown size={24} className="group-hover:translate-y-1 transition-transform" />
                        </a>
                    </motion.div>
                </div>
            </section>

            {loadingCampaigns ? (
                <section className="py-24 px-10 md:px-[250px] border-t border-white/5">
                    <p className="text-zinc-400 text-sm uppercase tracking-[6px]">Loading work...</p>
                </section>
            ) : null}

            {campaignLoadError ? (
                <section className="py-24 px-10 md:px-[250px] border-t border-white/5">
                    <p className="text-red-300 text-sm uppercase tracking-[4px]">Could not load media manifest: {campaignLoadError}</p>
                </section>
            ) : null}

            {/* Campaigns Mapping */}
            {campaigns.map((campaign, cIdx) => (
                <section key={campaign.id} id={campaign.id} className="py-[15vh] px-10 md:px-[250px] border-t border-white/5">
                    <div className="mb-24 max-w-5xl mx-auto">
                        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[15px] mb-8 block">Archive—0{cIdx + 1}</span>
                        <h2 className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-8">{campaign.title}</h2>
                    </div>

                    <div className="flex overflow-x-auto pb-12 gap-10 no-scrollbar snap-x snap-mandatory">
                        {campaign.items.map((item, idx) => (
                            <MediaReel
                                key={item.id}
                                item={item}
                                isPlaying={playingWithAudio === item.id}
                                onToggle={() => setPlayingWithAudio(playingWithAudio === item.id ? null : item.id)}
                            />
                        ))}
                    </div>
                </section>
            ))}

            {/* About Section */}
            <section id="about" className="py-[30vh] px-10 md:pl-[250px] md:pr-0 bg-[#070707] overflow-hidden">
                <div className="flex flex-col lg:flex-row gap-48 items-center">
                    <div className="space-y-20 lg:w-1/2">
                        <div className="space-y-8">
                            <span className="text-zinc-400 text-xs font-black uppercase tracking-[20px] block">Capabilities</span>
                            <h2 className="text-7xl md:text-9xl font-black uppercase tracking-tighter leading-[0.85]">Theeb <br /> Storytelling.</h2>
                        </div>

                        <p className="text-zinc-500 text-3xl font-light leading-relaxed max-w-2xl tracking-wide">
                            Specializing in high-impact short-form content. From the raw energy of street fashion to the technical precision of automotive cinema. We don't just record; we architect visual experiences.
                        </p>

                        <div className="grid grid-cols-2 gap-10 pt-8 max-w-xl">
                            <div className="p-10 bg-zinc-900/40 backdrop-blur-md rounded-3xl border border-white/5 group hover:border-white/20 transition-all duration-500">
                                <h3 className="text-5xl font-black mb-3 text-white group-hover:scale-110 transition-transform origin-left">{campaigns.length}</h3>
                                <p className="text-[11px] uppercase tracking-[3px] text-zinc-500 font-black">Key Campaigns</p>
                            </div>
                            <div className="p-10 bg-zinc-900/40 backdrop-blur-md rounded-3xl border border-white/5 group hover:border-white/20 transition-all duration-500">
                                <h3 className="text-5xl font-black mb-3 text-white group-hover:scale-110 transition-transform origin-left">{campaigns.reduce((acc, c) => acc + c.items.length, 0)}</h3>
                                <p className="text-[11px] uppercase tracking-[3px] text-zinc-500 font-black">Signature Reels</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative w-full lg:w-1/2 h-[70vh] grayscale hover:grayscale-0 transition-all duration-1000 group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#070707] to-transparent z-10 w-32" />
                        <video ref={aboutVideoRef} muted loop playsInline preload="none" poster={heroPoster || undefined} className="h-full w-full object-cover rounded-l-3xl lg:rounded-none">
                            {heroVideo ? <source src={heroVideo} type="video/mp4" /> : null}
                        </video>
                        <div className="absolute inset-0 border-y border-l border-white/10 rounded-l-3xl lg:rounded-none pointer-events-none" />
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="py-[40vh] px-10 md:px-[250px] text-center bg-[#050505] relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-6xl md:text-[12rem] font-black uppercase tracking-tighter mb-32 leading-none">Let's Ignite <br /> the Vision.</h2>
                    <div className="flex flex-col md:flex-row justify-center gap-20 md:gap-40">
                        <a href="https://mail.google.com/mail/?view=cm&fs=1&to=Theeb.97x@gmail.com" target="_blank" rel="noopener noreferrer" className="group">
                            <p className="text-[10px] font-black uppercase tracking-[8px] text-zinc-500 mb-6">Email (Gmail)</p>
                            <p className="text-3xl font-bold group-hover:text-white transition-all group-hover:tracking-wider">Theeb.97x@gmail.com</p>
                        </a>
                        <a href="https://www.instagram.com/theeb_alghanem?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" rel="noopener noreferrer" className="group">
                            <p className="text-[10px] font-black uppercase tracking-[8px] text-zinc-500 mb-6">Instagram</p>
                            <p className="text-3xl font-bold group-hover:text-white transition-all group-hover:tracking-wider">@theeb.alghanem</p>
                        </a>
                    </div>
                </div>
            </section>

            <footer className="py-24 px-10 md:px-[250px] text-center border-t border-white/5">
                <p className="text-zinc-600 text-[10px] uppercase tracking-[10px]">&copy; 2026 THEEB VISUALS</p>
            </footer>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-[60] bg-[#050505] flex flex-col items-center justify-center p-10"
                    >
                        <button onClick={() => setIsMenuOpen(false)} className="absolute top-10 right-10">
                            <X size={40} />
                        </button>
                        <div className="flex flex-col items-center gap-10">
                            <a href="#home" onClick={() => setIsMenuOpen(false)} className="text-4xl font-black uppercase tracking-tighter text-white">Home</a>

                            <div className="flex flex-col items-center gap-6">
                                <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[10px]">Work</span>
                                <div className="flex flex-col items-center gap-6">
                                    {campaigns.map(campaign => (
                                        <a
                                            key={campaign.id}
                                            href={`#${campaign.id}`}
                                            onClick={() => setIsMenuOpen(false)}
                                            className="text-3xl font-bold uppercase tracking-tight text-zinc-300 hover:text-white"
                                        >
                                            {campaign.title}
                                        </a>
                                    ))}
                                </div>
                            </div>

                            <a href="#about" onClick={() => setIsMenuOpen(false)} className="text-4xl font-black uppercase tracking-tighter text-white">About</a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style dangerouslySetInnerHTML={{
                __html: `
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .outline-text { -webkit-text-stroke: 1px rgba(255,255,255,0.3); color: transparent; }
            ` }} />
        </div>
    );
};

export default App;
