import React, { useState } from "react";
import VideoMetadataEditor from "./VideoMetadataEditor";
import VideoUploader from "./VideoUploader";
import "./TeacherPanel.style.css";

const TeacherPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"upload" | "metadata">("upload");

  return (
    <div className="teacher-panel">
      <div className="teacher-tabs">
        <button className={`tab ${activeTab === "upload" ? "active" : ""}`} onClick={() => setActiveTab("upload")}>
          Upload Video
        </button>
        <button className={`tab ${activeTab === "metadata" ? "active" : ""}`} onClick={() => setActiveTab("metadata")}>
          Edit Metadata
        </button>
      </div>

      <div className="teacher-content">{activeTab === "upload" ? <VideoUploader /> : <VideoMetadataEditor />}</div>
    </div>
  );
};

export default TeacherPanel;
