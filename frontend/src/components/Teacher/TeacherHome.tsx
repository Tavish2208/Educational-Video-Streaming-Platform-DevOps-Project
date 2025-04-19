import React, { useEffect, useState } from "react";
import { useHistory, RouteComponentProps } from "react-router-dom";
import { getVideos } from "../../services/api";
import { Video } from "../../types/types";
import VideoCard from "../Video/VideoCard";
import axios from "axios";

const TeacherHome: React.FC<RouteComponentProps> = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [error, setError] = useState<string>("");
  const history = useHistory();

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const videoList = await getVideos();
        setVideos(videoList);
      } catch (error) {
        console.error("Error fetching videos:", error);
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            history.push("/login");
          } else {
            setError("Failed to load videos. Please try again later.");
          }
        }
      }
    };
    fetchVideos();
  }, [history]);

  return (
    <div className="teacher-home">
      <div className="teacher-header">
        <h1>Teacher Dashboard</h1>
        <button 
          className="upload-button"
          onClick={() => history.push("/teacher")}
        >
          Upload New Video
        </button>
      </div>

      <div className="stats-section">
        <div className="stat-card">
          <h3>Total Videos</h3>
          <p>{videos.length}</p>
        </div>
        {/* Add more statistics as needed */}
      </div>

      <div className="videos-section">
        <h2>Your Videos</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="video-grid">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              isTeacherView={true}
              onAddToWatchlist={undefined}
              isInWatchlist={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherHome; 