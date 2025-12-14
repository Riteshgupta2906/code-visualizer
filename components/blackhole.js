'use client';

import { useEffect, useRef, useState } from 'react';

export default function BlackHole({ 
  videoSrc = './black-hole.webm',
  className = '' 
}) {
  const videoRef = useRef(null);
  const [hoveredDot, setHoveredDot] = useState(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => console.log('Video autoplay failed:', err));
    }
  }, []);

  // Generate animated stars
  const stars = Array.from({ length: 100 }, (_, i) => {
    const duration = 7 + Math.random() * 7; // 7-14s
    const delay = Math.random() * 5; // 0-5s
    const top = Math.random() * 100;
    const left = Math.random() * 100;
    const translateX = (Math.random() - 0.5) * 600;
    const translateY = (Math.random() - 0.5) * 600;

    return {
      id: i,
      style: {
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
        top: `${top}%`,
        left: `${left}%`,
        '--transform': `translate(${translateX}px, ${translateY}px)`,
      },
    };
  });

  // Three concentric circles with dots
  const circles = [
    { index: 0, dotCount: 8, radius: 120 },
    { index: 1, dotCount: 8, radius: 180 },
    { index: 2, dotCount: 8, radius: 240 },
  ];

  return (
    <div className={`hero-black-hole ${className}`}>
      {/* Video Background */}
      <div className="lazy-video">
        <video
          ref={videoRef}
          preload="auto"
          muted
          playsInline
          loop
          src={videoSrc}
          className="w-full h-full object-cover"
        />
      </div>

   
    </div>
  );
}