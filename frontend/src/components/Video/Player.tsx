import React, { useEffect, useState, useRef } from "react";
import { useParams, useHistory } from "react-router-dom";
import { getVideoUrl } from "../../services/api";
import axios, { AxiosError } from "axios";
import "./Player.style.css";
import { Video } from "../../types/types";

interface ErrorResponse {
  error: string;
}

const Player: React.FC = () => {
  const [videoData, setVideoData] = useState<Video | null>(null);
  const [error, setError] = useState<string>("");
  const { videoId } = useParams<{ videoId: string }>();
  const history = useHistory();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch video details
        const videoUrl = await getVideoUrl(videoId);
        const videoInfo: Video = {
          id: videoId,
          url: videoUrl,
          title: `Video ${videoId}`,
          description: "",
          thumbnailUrl: "",
        };
        setVideoData(videoInfo);
      } catch (error) {
        console.error("Error fetching video:", error);
        if (axios.isAxiosError(error)) {
          if (error.response?.status === 401) {
            history.push("/login");
          } else {
            setError("Failed to load video. Please try again later.");
          }
        }
      }
    };
    fetchData();
  }, [videoId, history]);

  return (
    <div className="video-player-container">
      {error ? (
        <div className="error">{error}</div>
      ) : videoData ? (
        <>
          <div className="video-player-wrapper">
            <video ref={videoRef} controls className="video-player" playsInline>
              <source src={videoData.url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="video-info">
            <h1>{videoData.title}</h1>
            <p className="video-description">{videoData.description}</p>
          </div>
        </>
      ) : (
        <div className="loading">Loading video...</div>
      )}
    </div>
  );
};

export default Player;
