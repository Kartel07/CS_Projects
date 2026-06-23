import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Heart, Volume2, VolumeX } from 'lucide-react';

// CSS for floating background animation and hiding scrollbars
const bgStyles = `
  @keyframes floatUp {
    0% { transform: translateY(0) rotate(-15deg); opacity: 0; }
    10% { opacity: 0.8; }
    90% { opacity: 0.8; }
    100% { transform: translateY(-130vh) rotate(15deg); opacity: 0; }
  }
  .floating-item {
    position: absolute;
    bottom: -10vh;
    opacity: 0;
    animation: floatUp linear infinite;
    z-index: 0;
  }
  /* Hide scrollbar for Chrome, Safari and Opera */
  .no-scrollbar::-webkit-scrollbar {
      display: none;
  }
  /* Hide scrollbar for IE, Edge and Firefox */
  .no-scrollbar {
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;  /* Firefox */
  }
`;

export default function App() {
  // Inject Tailwind CSS for localhost environments
  useEffect(() => {
    if (!document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
  }, []);

  // Your 19 photos and messages (updated to match your local paths verbatim)
  const storyData = [
    { id: 1, image: "/photos/IMG_20150515_190329435_HDR.jpg", message: "Happy Father's Day to the best Nanna ever!" },
    { id: 2, image: "/photos/IMG_20160815_181038349.jpg", message: "Thank you for always being our cavalry..." },
    { id: 3, image: "/photos/IMG_20181016_215019141.jpg", message: "...and for carrying all that style." },
    { id: 4, image: "/photos/IMG_20170413_185449975_HDR.jpg", message: "We'll never forget our amazing trips." },
    { id: 5, image: "/photos/IMG_20150531_143023365_HDR.jpg", message: "Even the small moments mean the world to us." },
    { id: 6, image: "/photos/IMG_20200419_175200256_HDR.jpg", message: "You taught us how to be strong." },
    { id: 7, image: "/photos/IMG_20151017_100943577.jpg", message: "And you showed us how to the best." },
    { id: 8, image: "/photos/Picture 137.jpg", message: "You're..." },
    { id: 9, image: "/photos/IMG1403.jpg", message: "...The best Father we could've ever asked for." },
    { id: 10, image: "/photos/IMG_20141031_235651415.jpg", message: "Thanks for fixing everything we broke." },
    { id: 11, image: "/photos/IMG_20141031_111545107_HDR.jpg", message: "For your endless patience." },
    { id: 12, image: "/photos/IMG_20160815_143456531.jpg", message: "And for your unconditional love." },
    { id: 13, image: "/photos/IMG1543.jpg", message: "Every swipe here is something we love about you." },
    { id: 14, image: "/photos/IMG_0392.JPG", message: "We've grown so much over the years." },
    { id: 15, image: "/photos/Picture 138.jpg", message: "And yet, you haven't aged a day! 😉" },
    { id: 16, image: "/photos/IMG1162.jpg", message: "We look up to you more than you know." },
    { id: 17, image: "/photos/IMG899.jpg", message: "You are our hero." },
    { id: 18, image: "/photos/Picture 047.jpg", message: "Our biggest role model." },
    { id: 19, image: "/photos/IMG_20160815_180937989.jpg", message: "Our inspiration!" },
  ];

  // The 20th final full-screen photo
  const finalPhoto = "/photos/IMG_20170902_191306119.jpg";

  const [started, setStarted] = useState(false);
  const [visibleSlides, setVisibleSlides] = useState(new Set());
  const [isPlaying, setIsPlaying] = useState(true);
  const audioRef = useRef(null);

  // Play background music instantly when user crosses the entry gate
  const handleStart = () => {
    setStarted(true);
    if (audioRef.current) {
      audioRef.current.play().catch((err) => {
        console.log("Audio playback blocked by browser policies:", err);
      });
    }
  };

  // Toggle state to dynamically pause/play local audio stream
  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((err) => console.log(err));
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Memoize background balloon and heart coordinates to decouple them from scrolling updates
  const floatingItems = useMemo(() => {
    return [...Array(20)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}vw`,
      animationDelay: `${Math.random() * 15}s`,
      animationDuration: `${12 + Math.random() * 15}s`,
      fontSize: `${1.5 + Math.random() * 1.5}rem`,
      icon: Math.random() > 0.5 ? '🎈' : '❤️'
    }));
  }, []);

  // Use Intersection Observer to detect active slide elements in focus
  useEffect(() => {
    if (!started) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleSlides((prev) => {
          const next = new Set(prev);
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              next.add(entry.target.dataset.id);
            } else {
              next.delete(entry.target.dataset.id);
            }
          });
          return next;
        });
      },
      { threshold: 0.5 } // Trigger animation once 50% of the slide frame enters viewport
    );

    // Minor delay ensures the layout mounts completely before we query slide card coordinates
    const timeoutId = setTimeout(() => {
      const elements = document.querySelectorAll('.story-slide');
      elements.forEach((el) => observer.observe(el));
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [started]);

  if (!started) {
    return (
      <div 
        className="w-full h-screen bg-pink-100 flex flex-col items-center justify-center text-pink-800 cursor-pointer select-none" 
        onClick={handleStart}
      >
        <Heart className="w-16 h-16 text-pink-500 mb-6 animate-pulse" fill="currentColor" />
        <h1 className="text-3xl font-serif mb-2">For You, Nanna</h1>
        <p className="text-pink-600 text-sm animate-bounce">Tap or scroll to open</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-pink-50 relative overflow-hidden">
      <style>{bgStyles}</style>

      {/* Hidden local audio asset loader */}
      <audio ref={audioRef} src="/music/PapaKehteHai.m4a" loop preload="auto" />
      
      {/* Frosted interactive sound toggle card */}
      <button 
        onClick={toggleAudio}
        className="absolute top-6 right-6 z-50 p-3 bg-white/40 backdrop-blur-md rounded-full shadow-lg text-pink-700 hover:bg-white/70 transition-all cursor-pointer"
      >
        {isPlaying ? <Volume2 size={24} /> : <VolumeX size={24} />}
      </button>

      {/* Static background floating balloon container */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {floatingItems.map((item) => (
          <div
            key={item.id}
            className="floating-item drop-shadow-sm"
            style={{
              left: item.left,
              animationDelay: item.animationDelay,
              animationDuration: item.animationDuration,
              fontSize: item.fontSize
            }}
          >
            {item.icon}
          </div>
        ))}
      </div>

      {/* Vertically locking newsfeed slide track */}
      <div className="absolute inset-0 z-10 overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar">
        {storyData.map((slide) => {
          const isVisible = visibleSlides.has(slide.id.toString());
          return (
            <div 
              key={slide.id}
              data-id={slide.id}
              className="story-slide w-full h-screen snap-start snap-always flex flex-col items-center justify-center p-4 md:p-8"
            >
              {/* Photo Box container with Reveal Animations */}
              <div 
                className={`relative w-[90%] max-w-md bg-white p-3 rounded-[2rem] shadow-2xl transition-all duration-1000 transform flex-shrink-0 ${isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-12'}`}
                style={{ aspectRatio: '4/5', minHeight: '50vh', maxHeight: '80vh' }}
              >
                <img 
                  src={slide.image} 
                  alt="Father's Day Memory" 
                  className="w-full h-full object-cover rounded-3xl select-none bg-slate-100"
                />
                
                {/* Gradient shade filter overlay for reading text clearly over highlights */}
                <div className="absolute inset-3 rounded-3xl bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
                
                {/* Text overlay containing our fading story message */}
                <div className="absolute bottom-12 left-0 right-0 px-8 text-center pointer-events-none">
                  <p className={`text-white text-2xl md:text-3xl font-serif leading-relaxed drop-shadow-lg transition-all duration-1000 delay-300 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                    {slide.message}
                  </p>
                </div>
              </div>
            </div>
          );
        })}

        {/* Cinematographic grand finale slide card */}
        <div 
          data-id="final"
          className="story-slide w-full h-screen snap-start snap-always relative flex flex-col items-center justify-center overflow-hidden bg-black"
        >
          {/* Full Screen ending photo fading in smoothly over 2s */}
          <div className={`absolute inset-0 bg-black transition-opacity duration-[2000ms] ease-in-out ${visibleSlides.has('final') ? 'opacity-100' : 'opacity-0'}`}>
            <img 
              src={finalPhoto} 
              alt="Grand Finale" 
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
          </div>
          
          {/* "We love You" final visual header fading over dark layout mask with 1s stagger delay */}
          <h2 className={`relative z-10 text-white text-4xl md:text-6xl px-6 font-serif tracking-widest text-center drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] transition-all duration-[3000ms] delay-[1000ms] transform ${visibleSlides.has('final') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            We love You. Happy Father's Day, Nanna!
          </h2>
        </div>
      </div>
    </div>
  );
}