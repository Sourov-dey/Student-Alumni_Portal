import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import http from '../api/http';
import { useAuth } from '../context/AuthContext';
import ApplicationVerifyModal from '../components/ApplicationVerifyModal';
import { 
  ArrowLeft, Building2, MapPin, Clock, Briefcase, CheckCircle, 
  FileText, Phone, Upload, Mail, User, TrendingUp, Users 
} from 'lucide-react';
import '../styles/pages/jobdetail.css';

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [message, setMessage] = useState('');

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

            {/* Applications Section (for job owners) */}
            {isJobOwner && applications.length > 0 && (
              <section className="content-card applications-section">
                <div className="card-header">
                  <Users size={20} />
                  <h2>Applications</h2>
                  <span className="badge">{applications.length}</span>
                </div>

                {/* Application Stats */}
                {job.applicationStats && (
                  <div className="stats-grid">
                    <div className="stat-card total">
                      <div className="stat-icon">
                        <Users size={24} />
                      </div>
                      <div className="stat-info">
                        <div className="stat-value">{job.applicationStats.totalApplications}</div>
                        <div className="stat-label">Total Applications</div>
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

                {/* Applications List */}
                <div className="applications-list">
                  {applications.map(app => (
                    <div key={app._id} className="application-item">
                      <div className="applicant-header">
                        <div className="applicant-avatar">
                          <User size={20} />
                        </div>
                        <div className="applicant-info">
                          <h4>{app.student?.name || app.student?.email}</h4>
                          <span className="application-date">
                            Applied {new Date(app.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', day: 'numeric', year: 'numeric' 
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="applicant-details">
                        <div className="detail-item">
                          <Phone size={16} />
                          <span>{app.contactNumber || 'Not provided'}</span>
                        </div>
                        {app.resumeUrl && (
                          <div className="detail-item">
                            <FileText size={16} />
                            <a href={app.resumeUrl} target="_blank" rel="noreferrer" className="resume-link">
                              View Resume
                            </a>
                          </div>
                        )}
                      </div>

                      {app.coverLetter && (
                        <div className="cover-letter">
                          <strong>Cover Letter:</strong>
                          <p>{app.coverLetter}</p>
                        </div>
                      )}

                      <div className="applicant-actions">
                        <select
                          value={app.status}
                          onChange={(e) => updateApplicationStatus(app._id, e.target.value)}
                          className={`status-dropdown status-${app.status}`}
                        >
                          <option value="submitted">Submitted</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="rejected">Rejected</option>
                          <option value="hired">Hired</option>
                        </select>
                        {app.student?.email && (
                          <a href={`mailto:${app.student.email}`} className="btn-contact">
                            <Mail size={16} />
                            Contact
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* Right Column - Application Form */}
          <aside className="job-sidebar">
            {user?.role === 'student' ? (
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
            ) : (
              <div className="info-card">
                <Briefcase size={32} />
                <h4>Student Login Required</h4>
                <p>Only students can apply for job positions</p>
                <Link to="/login" className="btn-login">
                  Login to Apply
                </Link>
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