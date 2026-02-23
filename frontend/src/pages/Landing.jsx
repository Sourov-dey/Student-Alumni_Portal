import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Hero from '../components/Hero';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/Jobcard';
import http from '../api/http';
import './Landing.css';

gsap.registerPlugin(ScrollTrigger);

export default function Landing() {
  const { user } = useAuth();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    jobs: 120,
    companies: 50,
    alumni: 500,
  });

  // Refs for animations
  const featuredRef = useRef(null);
  const storiesRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    // Fetch featured jobs
    http
      .get('/api/jobs', { params: { page: 1, limit: 6, sort: 'recent' } })
      .then((res) => {
        setFeatured(res.data.items || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Animate featured section on scroll
    if (featuredRef.current) {
      gsap.fromTo(
        featuredRef.current.querySelectorAll('.job-card'),
        {
          opacity: 0,
          y: 50,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: featuredRef.current,
            start: 'top 80%',
          },
        }
      );
    }

    // Animate stories section
    if (storiesRef.current) {
      gsap.fromTo(
        storiesRef.current.querySelectorAll('.story-card'),
        {
          opacity: 0,
          x: -50,
        },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: storiesRef.current,
            start: 'top 80%',
          },
        }
      );
    }


  }, [featured]);

  const alumniStories = [
    {
      id: 1,
      name: 'Priya Sharma',
      year: 2018,
      department: 'Computer Science',
      quote: 'The alumni network helped me land my dream job at a leading tech firm. The mentorship I received was invaluable.',
      role: 'Software Engineer at Google',
    },
    {
      id: 2,
      name: 'Rahul Das',
      year: 2019,
      department: 'Electronics',
      quote: 'Connecting with seniors through this portal opened doors I never knew existed. Truly a game-changer for my career.',
      role: 'Product Manager at Microsoft',
    },
    {
      id: 3,
      name: 'Ananya Bora',
      year: 2020,
      department: 'Biotechnology',
      quote: 'From campus to corporate — the guidance from our alumni community made the transition seamless and exciting.',
      role: 'Research Scientist at CSIR',
    },
  ];

  return (
    <div className="landing-page">
      <Hero user={user} />

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">💼</div>
              <span className="stat-number">{stats.jobs}+</span>
              <span className="stat-label">Job Opportunities</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏢</div>
              <span className="stat-number">{stats.companies}+</span>
              <span className="stat-label">Partner Companies</span>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎓</div>
              <span className="stat-number">{stats.alumni}+</span>
              <span className="stat-label">Alumni Connected</span>
            </div>
          </div>
        </div>
      </section>


      {/* Featured Opportunities */}
      <section className="featured-section" ref={featuredRef}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured Opportunities</h2>
            <p className="section-subtitle">
              Discover the latest job openings from our alumni network
            </p>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading opportunities...</p>
            </div>
          ) : featured.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No featured jobs yet</h3>
              <p>Check back soon for exciting opportunities!</p>
            </div>
          ) : (
            <div className="card-grid">
              {featured.map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          )}

          <div className="section-footer">
            <a href="/jobs" className="btn-view-all">
              View All Jobs →
            </a>
          </div>
        </div>
      </section>

      {/* Alumni Stories */}
      <section className="stories-section" ref={storiesRef}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Alumni Stories</h2>
            <p className="section-subtitle">
              Inspiring journeys from our accomplished alumni
            </p>
          </div>

          <div className="stories-grid">
            {alumniStories.map((story) => (
              <article key={story.id} className="story-card">
                <div className="story-content">
                  <div className="story-quote-icon">💬</div>
                  <p className="story-excerpt">{story.quote}</p>
                  <div className="story-meta">
                    <div className="story-author">
                      <span className="author-name">{story.name}</span>
                      <span className="author-role">{story.role}</span>
                      <span className="author-year">{story.department} · Class of {story.year}</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Start Your Journey?</h2>
            <p className="cta-subtitle">
              Join our thriving alumni network and unlock endless opportunities
            </p>
            <div className="cta-actions">
              {user ? (
                <>
                  {user.role === 'student' && (
                    <a href="/jobs" className="btn btn-primary">
                      Explore Jobs
                    </a>
                  )}
                  {(user.role === 'alumni' || user.role === 'admin') && (
                    <a href="/post-job" className="btn btn-primary">
                      Post a Job
                    </a>
                  )}
                </>
              ) : (
                <>
                  <a href="/login" className="btn btn-primary">
                    Get Started
                  </a>
                  <a href="/about" className="btn btn-secondary">
                    Learn More
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}