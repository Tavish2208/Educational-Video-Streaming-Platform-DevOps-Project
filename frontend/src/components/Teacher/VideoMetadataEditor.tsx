import React, { useState, useEffect } from "react";
import { getVideos, updateVideoMetadata } from "../../services/api";
import { Video } from "../../types/types";
import "./VideoMetadataEditor.style.css";

const VideoMetadataEditor: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
    duration: "",
  });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const videoList = await getVideos();
      setVideos(videoList);
    } catch (error) {
      console.error("Failed to fetch videos:", error);
    }
  };

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
    setFormData({
      title: video.title || "",
      description: video.description || "",
      thumbnailUrl: video.thumbnailUrl || "",
      duration: video.duration || "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVideo) return;

    try {
      await updateVideoMetadata(selectedVideo.id, formData);
      await fetchVideos(); // Refresh the video list
      alert("Metadata updated successfully!");
    } catch (error) {
      console.error("Failed to update metadata:", error);
      alert("Failed to update metadata");
    }
  };

  return (
    <div className="metadata-editor">
      <div className="video-list">
        <h2>Select Video</h2>
        {videos.map((video) => (
          <div
            key={video.id}
            className={`video-item ${selectedVideo?.id === video.id ? "selected" : ""}`}
            onClick={() => handleVideoSelect(video)}
          >
            {video.title || video.id}
          </div>
        ))}
      </div>

      {selectedVideo && (
        <form onSubmit={handleSubmit} className="metadata-form">
          <h2>Edit Metadata</h2>
          <div className="form-group">
            <label>Title:</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          </div>

          <div className="form-group">
            <label>Description:</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </div>

          <div className="form-group">
            <label>Thumbnail URL:</label>
            <input type="url" value={formData.thumbnailUrl} onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })} />
          </div>

          <div className="form-group">
            <label>Duration (e.g., "5:30"):</label>
            <input type="text" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} />
          </div>

          <button type="submit">Update Metadata</button>
        </form>
      )}
    </div>
  );
};

export default VideoMetadataEditor;
