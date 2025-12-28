import React from 'react';
import './ApplicationVerifyModal.css';

export default function ApplicationVerifyModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  applicationData,
  onEdit,
  isSubmitting
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Verify Application Details</h2>
        
        <div className="verification-details">
          <div className="detail-group">
            <label>Contact Number</label>
            <p>{applicationData.contactNumber}</p>
          </div>

          <div className="detail-group">
            <label>Resume</label>
            <p className="file-name">{applicationData.resumeFileName}</p>
          </div>

          {applicationData.coverLetter && (
            <div className="detail-group">
              <label>Cover Letter</label>
              <p className="cover-preview">{applicationData.coverLetter}</p>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button 
            className="btn-secondary" 
            onClick={onEdit}
            disabled={isSubmitting}
          >
            Edit Details
          </button>
          <button 
            className="btn-primary" 
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
          </button>
          <button 
            className="btn-outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}