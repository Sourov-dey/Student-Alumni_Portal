import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import http from '../api/http';
import { useAuth } from '../context/AuthContext';
import ApplicationVerifyModal from '../components/ApplicationVerifyModal';
import {
  ArrowLeft, Building2, MapPin, Clock, Briefcase, CheckCircle,
  FileText, Phone, Upload, Mail, User, Users, ChevronDown, ChevronUp,
  GraduationCap, Award, FolderOpen, Heart, Code, Sparkles, ExternalLink,
  Download, Globe, Calendar
} from 'lucide-react';
import '../styles/pages/jobdetail.css';

/* ─── Reusable: Tag Chip ─── */
function TagChip({ label, variant = 'default' }) {
  return <span className={`tag-chip tag-${variant}`}>{label}</span>;
}

/* ─── Reusable: Applicant Card (expandable) ─── */
function ApplicantCard({ app, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const s = app.student || {};

  const backendBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const resumeHref = app.resumeUrl
    ? (app.resumeUrl.startsWith('http') ? app.resumeUrl : `${backendBase}${app.resumeUrl}`)
    : null;

  return (
    <div className={`applicant-card ${expanded ? 'expanded' : ''}`}>
      {/* ── Card Header (always visible) ── */}
      <div className="applicant-card-header" onClick={() => setExpanded(e => !e)}>
        <div className="applicant-card-left">
          {s.avatarUrl ? (
            <img src={s.avatarUrl} alt={s.name} className="applicant-avatar-img" />
          ) : (
            <div className="applicant-avatar"><User size={22} /></div>
          )}
          <div className="applicant-summary">
            <h4 className="applicant-name">{s.name || s.email || 'Unknown'}</h4>
            <div className="applicant-sub">
              {s.department && <span>{s.department}</span>}
              {s.graduationYear && <span>Class of {s.graduationYear}</span>}
              <span className="applied-date">
                <Calendar size={12} />
                {new Date(app.createdAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="applicant-card-right">
          <span className={`status-badge status-${app.status}`}>{app.status}</span>
          <span className="expand-toggle">
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
        </div>
      </div>

      {/* ── Expanded Body ── */}
      {expanded && (
        <div className="applicant-card-body">
          {/* Top actions row */}
          <div className="applicant-actions-bar">
            <div className="actions-left">
              {resumeHref && (
                <a href={resumeHref} target="_blank" rel="noreferrer" className="btn-resume">
                  <Download size={16} /> View Resume
                </a>
              )}
              {s.email && (
                <a href={`mailto:${s.email}`} className="btn-mail">
                  <Mail size={16} /> {s.email}
                </a>
              )}
              {(app.contactNumber || s.phone) && (
                <span className="btn-phone">
                  <Phone size={16} /> {app.contactNumber || s.phone}
                </span>
              )}
            </div>
            <div className="actions-right">
              <label className="status-label">Status:</label>
              <select
                value={app.status}
                onChange={e => onStatusChange(app._id, e.target.value)}
                className={`status-dropdown status-${app.status}`}
              >
                <option value="submitted">Submitted</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
                <option value="hired">Hired</option>
              </select>
            </div>
          </div>

          {/* Bio */}
          {s.bio && (
            <div className="profile-section">
              <h5><User size={15} /> About</h5>
              <p className="bio-text">{s.bio}</p>
            </div>
          )}

          {/* Cover Letter */}
          {app.coverLetter && (
            <div className="profile-section">
              <h5><FileText size={15} /> Cover Letter</h5>
              <div className="cover-letter-box">
                <p>{app.coverLetter}</p>
              </div>
            </div>
          )}

          {/* Skills */}
          {((s.technicalSkills && s.technicalSkills.length > 0) ||
            (s.nonTechnicalSkills && s.nonTechnicalSkills.length > 0) ||
            (s.skills && s.skills.length > 0)) && (
            <div className="profile-section">
              <h5><Code size={15} /> Skills</h5>
              <div className="skills-grid">
                {s.technicalSkills && s.technicalSkills.length > 0 && (
                  <div className="skill-group">
                    <span className="skill-group-label">Technical</span>
                    <div className="tags-row">
                      {s.technicalSkills.map((sk, i) => (
                        <TagChip key={i} label={sk} variant="tech" />
                      ))}
                    </div>
                  </div>
                )}
                {s.nonTechnicalSkills && s.nonTechnicalSkills.length > 0 && (
                  <div className="skill-group">
                    <span className="skill-group-label">Non-Technical</span>
                    <div className="tags-row">
                      {s.nonTechnicalSkills.map((sk, i) => (
                        <TagChip key={i} label={sk} variant="soft" />
                      ))}
                    </div>
                  </div>
                )}
                {s.skills && s.skills.length > 0 && (
                  <div className="skill-group">
                    <span className="skill-group-label">General</span>
                    <div className="tags-row">
                      {s.skills.map((sk, i) => (
                        <TagChip key={i} label={sk} variant="default" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Projects */}
          {s.projects && s.projects.length > 0 && (
            <div className="profile-section">
              <h5><FolderOpen size={15} /> Projects</h5>
              <div className="projects-grid">
                {s.projects.map((p, i) => (
                  <div key={i} className="project-card">
                    <div className="project-title">
                      {p.title}
                      {p.link && (
                        <a href={p.link} target="_blank" rel="noreferrer" className="project-link">
                          <ExternalLink size={13} />
                        </a>
                      )}
                    </div>
                    {p.description && <p className="project-desc">{p.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {s.certifications && s.certifications.length > 0 && (
            <div className="profile-section">
              <h5><Award size={15} /> Certifications</h5>
              <div className="certs-list">
                {s.certifications.map((c, i) => (
                  <div key={i} className="cert-item">
                    <Award size={14} className="cert-icon" />
                    <div>
                      <span className="cert-title">{c.title}</span>
                      {c.issuer && <span className="cert-issuer"> — {c.issuer}</span>}
                      {c.year && <span className="cert-year"> ({c.year})</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {s.interests && s.interests.length > 0 && (
            <div className="profile-section">
              <h5><Heart size={15} /> Interests</h5>
              <div className="tags-row">
                {s.interests.map((int, i) => (
                  <TagChip key={i} label={int} variant="interest" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main JobDetail Page
   ═══════════════════════════════════════════ */
export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Apply form state
  const [cover, setCover] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [applying, setApplying] = useState(false);

  // Review modal state
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const isJobOwner = user && (user.role === 'alumni' || user.role === 'admin');

  useEffect(() => {
    http.get(`/api/jobs/${id}`)
      .then(r => setJob(r.data))
      .catch(() => setJob(null));

    if (isJobOwner) {
      http.get(`/api/applications/job/${id}`)
        .then(r => setApplications(r.data.items || r.data || []))
        .catch(err => console.error('Failed to fetch applications:', err));
    }
  }, [id, isJobOwner]);

  /* Filtered applications */
  const filteredApps = useMemo(() => {
    if (statusFilter === 'all') return applications;
    return applications.filter(a => a.status === statusFilter);
  }, [applications, statusFilter]);

  /* Status counts */
  const statusCounts = useMemo(() => {
    const counts = { all: applications.length, submitted: 0, shortlisted: 0, rejected: 0, hired: 0 };
    applications.forEach(a => { if (counts[a.status] !== undefined) counts[a.status]++; });
    return counts;
  }, [applications]);

  const openVerify = () => {
    setMessage('');
    if (!user) return setMessage('Please login as a student to apply.');
    if (user.role !== 'student') return setMessage('Only students can apply.');
    if (!contactNumber.trim()) return setMessage('Please enter your contact number.');
    if (!resumeFile) return setMessage('Please select your resume file (PDF/DOC/DOCX).');
    setVerifyOpen(true);
  };

  const confirmAndSubmit = async () => {
    setVerifying(true);
    setApplying(true);
    setMessage('');

    try {
      const fd = new FormData();
      fd.append('jobId', id);
      fd.append('coverLetter', cover);
      fd.append('contactNumber', contactNumber);
      fd.append('resume', resumeFile);

      await http.post('/api/applications', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setMessage('Applied successfully.');
      setVerifyOpen(false);
      setCover('');
      setContactNumber('');
      setResumeFile(null);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Apply failed');
    } finally {
      setVerifying(false);
      setApplying(false);
    }
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      await http.patch(`/api/applications/${applicationId}/status`, { status: newStatus });
      const [jobRes, appsRes] = await Promise.all([
        http.get(`/api/jobs/${id}`),
        http.get(`/api/applications/job/${id}`)
      ]);
      setJob(jobRes.data);
      setApplications(appsRes.data.items || appsRes.data || []);
    } catch (err) {
      console.error('Failed to update application status:', err);
    }
  };

  if (job === null) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading job details...</p>
      </div>
    );
  }

  const applicationDataForModal = {
    contactNumber,
    resumeFileName: resumeFile?.name || '(no file)',
    coverLetter: cover
  };

  return (
    <div className="job-detail-page">
      {/* Header Section */}
      <div className="job-detail-header">
        <div className="header-container">
          <button onClick={() => navigate('/jobs')} className="back-btn">
            <ArrowLeft size={20} />
            Back to Jobs
          </button>

          <div className="job-header-content">
            <div className="company-logo">
              <Building2 size={32} />
            </div>
            <div className="job-header-info">
              <h1 className="job-title">{job.title}</h1>
              <div className="job-meta">
                <span className="meta-item">
                  <Building2 size={16} />
                  {job.company}
                </span>
                <span className="meta-divider">•</span>
                <span className="meta-item">
                  <MapPin size={16} />
                  {job.location}
                </span>
                <span className="meta-divider">•</span>
                <span className="meta-item">
                  <Clock size={16} />
                  {job.type}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="job-detail-container">
        <div className="job-detail-grid">
          {/* Left Column - Job Details */}
          <main className="job-main-content">
            {/* Description Section */}
            <section className="content-card">
              <div className="card-header">
                <FileText size={20} />
                <h2>Job Description</h2>
              </div>
              <div className="card-body">
                <p className="job-description">{job.description}</p>
              </div>
            </section>

            {/* Requirements Section */}
            {job.requirements && job.requirements.length > 0 && (
              <section className="content-card">
                <div className="card-header">
                  <CheckCircle size={20} />
                  <h2>Requirements</h2>
                </div>
                <div className="card-body">
                  <ul className="requirements-list">
                    {job.requirements.map((r, i) => (
                      <li key={i} className="requirement-item">
                        <CheckCircle size={16} />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* ═══ Applications Section (alumni / admin) ═══ */}
            {isJobOwner && (
              <section className="content-card applications-section">
                <div className="card-header">
                  <Users size={20} />
                  <h2>Applications</h2>
                  <span className="badge">{applications.length}</span>
                </div>

                {/* Stats bar */}
                {job.applicationStats && (
                  <div className="stats-grid">
                    <div className="stat-card total">
                      <div className="stat-icon"><Users size={24} /></div>
                      <div className="stat-info">
                        <div className="stat-value">{job.applicationStats.totalApplications}</div>
                        <div className="stat-label">Total</div>
                      </div>
                    </div>
                    <div className="stat-card submitted">
                      <div className="stat-value">{job.applicationStats.statusBreakdown.submitted}</div>
                      <div className="stat-label">Submitted</div>
                    </div>
                    <div className="stat-card shortlisted">
                      <div className="stat-value">{job.applicationStats.statusBreakdown.shortlisted}</div>
                      <div className="stat-label">Shortlisted</div>
                    </div>
                    <div className="stat-card hired">
                      <div className="stat-value">{job.applicationStats.statusBreakdown.hired}</div>
                      <div className="stat-label">Hired</div>
                    </div>
                  </div>
                )}

                {/* Status filter tabs */}
                {applications.length > 0 && (
                  <div className="filter-tabs">
                    {['all', 'submitted', 'shortlisted', 'rejected', 'hired'].map(st => (
                      <button
                        key={st}
                        className={`filter-tab ${statusFilter === st ? 'active' : ''} tab-${st}`}
                        onClick={() => setStatusFilter(st)}
                      >
                        {st.charAt(0).toUpperCase() + st.slice(1)}
                        <span className="filter-count">{statusCounts[st]}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Applicant cards or empty state */}
                {applications.length === 0 ? (
                  <div className="no-apps-empty">
                    <Briefcase size={48} />
                    <h4>No applications yet</h4>
                    <p>When students apply, their full profiles will appear here.</p>
                  </div>
                ) : filteredApps.length === 0 ? (
                  <div className="no-apps-empty">
                    <Sparkles size={36} />
                    <p>No applicants with status <strong>{statusFilter}</strong>.</p>
                  </div>
                ) : (
                  <div className="applications-list">
                    {filteredApps.map(app => (
                      <ApplicantCard
                        key={app._id}
                        app={app}
                        onStatusChange={updateApplicationStatus}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </main>

          {/* Right Column - Application Form */}
          <aside className="job-sidebar">
            {user?.role === 'student' && (
              <div className="application-card">
                <div className="application-header">
                  <Briefcase size={24} />
                  <h3>Apply for this position</h3>
                </div>

                <div className="application-form">
                  <div className="form-field">
                    <label className="field-label">
                      <Phone size={16} />
                      Contact Number
                      <span className="required">*</span>
                    </label>
                    <input
                      type="tel"
                      value={contactNumber}
                      onChange={e => setContactNumber(e.target.value)}
                      placeholder="Enter your phone number"
                      className="field-input"
                    />
                  </div>

                  <div className="form-field">
                    <label className="field-label">
                      <Upload size={16} />
                      Resume
                      <span className="required">*</span>
                    </label>
                    <div className="file-upload">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={e => setResumeFile(e.target.files?.[0] || null)}
                        className="file-input"
                        id="resume-upload"
                      />
                      <label htmlFor="resume-upload" className="file-label">
                        {resumeFile ? (
                          <>
                            <CheckCircle size={16} />
                            {resumeFile.name}
                          </>
                        ) : (
                          <>
                            <Upload size={16} />
                            Choose file (PDF/DOC/DOCX)
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="form-field">
                    <label className="field-label">
                      <FileText size={16} />
                      Cover Letter
                      <span className="optional">(Optional)</span>
                    </label>
                    <textarea
                      placeholder="Tell us why you're a great fit..."
                      value={cover}
                      onChange={e => setCover(e.target.value)}
                      rows={6}
                      className="field-textarea"
                    />
                  </div>

                  <button
                    className="btn-apply"
                    onClick={openVerify}
                    disabled={applying}
                  >
                    {applying ? (
                      <>
                        <div className="spinner"></div>
                        Applying...
                      </>
                    ) : (
                      <>
                        <Briefcase size={18} />
                        Review & Apply
                      </>
                    )}
                  </button>

                  {message && (
                    <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
                      {message}
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>

      <ApplicationVerifyModal
        isOpen={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        onConfirm={confirmAndSubmit}
        onEdit={() => setVerifyOpen(false)}
        applicationData={applicationDataForModal}
        isSubmitting={verifying}
      />
    </div>
  );
}