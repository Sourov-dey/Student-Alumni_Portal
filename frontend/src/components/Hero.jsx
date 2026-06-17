import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { gsap } from "gsap";
import "./Hero.css";

export default function Hero() {
  // Refs for GSAP animations
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const buttonRef = useRef(null);
  const statsRef = useRef(null);
  const imagesRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Timeline for coordinated animations
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Animate title
      tl.fromTo(
        titleRef.current,
        {
          opacity: 0,
          y: -50,
        },
        {
          opacity: 1,
          y: 0,
          duration: 1,
        }
      );

      // Animate subtitle
      tl.fromTo(
        subtitleRef.current,
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
        },
        "-=0.5"
      );

      // Animate button
      tl.fromTo(
        buttonRef.current,
        {
          opacity: 0,
          scale: 0.8,
        },
        {
          opacity: 1,
          scale: 1,
          duration: 0.6,
        },
        "-=0.4"
      );

      // Animate stats with stagger
      tl.fromTo(
        statsRef.current.querySelectorAll(".stat-item"),
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15,
        },
        "-=0.4"
      );

      // Animate floating visual elements
      tl.fromTo(
        imagesRef.current.querySelectorAll(".floating-card"),
        {
          opacity: 0,
          scale: 0.8,
          x: 50,
        },
        {
          opacity: 1,
          scale: 1,
          x: 0,
          duration: 1,
          stagger: 0.2,
        },
        "-=0.8"
      );

      // Floating animation for cards
      gsap.to(imagesRef.current.querySelectorAll(".floating-card"), {
        y: -15,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.5,
      });

      // Counter animation for stats
      const counters = statsRef.current.querySelectorAll(".stat-number");
      counters.forEach((counter) => {
        const target = parseInt(counter.getAttribute("data-target"));
        gsap.fromTo(
          counter,
          { innerText: 0 },
          {
            innerText: target,
            duration: 2.5,
            delay: 0.5,
            ease: "power1.out",
            snap: { innerText: 1 },
            onUpdate: function () {
              counter.innerText = Math.ceil(counter.innerText) + "+";
            },
          }
        );
      });
    }, heroRef);

    return () => ctx.revert(); // Cleanup
  }, []);

  return (
    <section className="hero" ref={heroRef}>
      <div className="hero-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title" ref={titleRef}>
            Assam University Careers
          </h1>
          <p className="hero-subtitle" ref={subtitleRef}>
            Connecting students, alumni, and companies through opportunities.
          </p>

          {/* Call to Action Button */}
          <div className="hero-actions" ref={buttonRef}>
            <Link to="/jobs" className="btn-primary">
              <span>Browse Jobs</span>
              <svg
                className="btn-arrow"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M4 10h12m0 0l-4-4m4 4l-4 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>

          {/* Stats Section */}
          <div className="hero-stats" ref={statsRef}>
            <div className="stat-item">
              <div className="stat-icon">💼</div>
              <span className="stat-number" data-target="120">
                0+
              </span>
              <span className="stat-label">Active Jobs</span>
            </div>
            <div className="stat-item">
              <div className="stat-icon">🏢</div>
              <span className="stat-number" data-target="50">
                0+
              </span>
              <span className="stat-label">Companies</span>
            </div>
            <div className="stat-item">
              <div className="stat-icon">🎓</div>
              <span className="stat-number" data-target="500">
                0+
              </span>
              <span className="stat-label">Alumni</span>
            </div>
          </div>
        </div>

        {/* Hero Visual Redesign */}
        <div className="hero-visual" ref={imagesRef}>
          <div className="visual-container">
            {/* Background Glows */}
            <div className="visual-glow"></div>
            
            {/* Floating UI Elements */}
            <div className="floating-card card-job">
              <div className="card-badge">New Opportunity</div>
              <div className="card-icon">🚀</div>
              <div className="card-info">
                <h4>Software Engineer</h4>
                <p>Google • Full-time</p>
              </div>
            </div>

            <div className="floating-card card-network">
              <div className="card-users">
                <div className="user-avatar" style={{background: "linear-gradient(135deg, #6366f1, #a855f7)"}}>JD</div>
                <div className="user-avatar" style={{background: "linear-gradient(135deg, #10b981, #3b82f6)"}}>AS</div>
                <div className="user-avatar" style={{background: "linear-gradient(135deg, #f59e0b, #ef4444)"}}>MK</div>
                <div className="user-avatar extra">+12</div>
              </div>
              <p>500+ Alumni Connected</p>
            </div>

            <div className="floating-card card-event">
              <div className="event-date">
                <span className="month">MAY</span>
                <span className="day">15</span>
              </div>
              <div className="event-info">
                <h4>Tech Alumni Meetup</h4>
                <p>Silicon Valley • Hybrid</p>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="abstract-shape shape-1"></div>
            <div className="abstract-shape shape-2"></div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="scroll-indicator">
        <div className="scroll-mouse">
          <div className="scroll-wheel"></div>
        </div>
        <span className="scroll-text">Scroll to explore</span>
      </div>
    </section>
  );
}
