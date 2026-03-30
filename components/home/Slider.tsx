'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Slider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = ['/slider/image11.png', '/slider/image22.png', '/slider/image33.png'];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg">
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div key={index} className="min-w-full">
            <Image
              src={slide}
              alt={`Slide ${index + 1}`}
              width={800}
              height={400}
              className="w-full h-auto"
              priority={index === 0}
            />
          </div>
        ))}
      </div>
      
      {/* Slide Indicators */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              currentSlide === index ? 'bg-white w-4' : 'bg-white/50'
            }`}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
