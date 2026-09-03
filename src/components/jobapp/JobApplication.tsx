import React from "react";
import jobapp from '../../assets/jobapp.webp';
import "./JobApplication.css";

const JobApplication: React.FC = () => {
  return (
    <div className="JobApplication-applications">
      <div className="JobApplication-application">
        <div className="JobApplication-title">Job Application</div>
        <div className="JobApplication-desc">
          Explore exciting opportunities and embark on a unique journey by selecting your preferred path within our dynamic, interactive environment.
        </div>
      </div>
      <br />
      <div className="JobApplication">
        <img
          className="JobApplication-card"
          src={jobapp}
          alt="card"
        />
      </div>
    </div>
  );
};

export default JobApplication;