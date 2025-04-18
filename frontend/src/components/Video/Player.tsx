import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useHistory } from "react-router-dom";
import { getVideoUrl, addToWatchlist, removeFromWatchlist, getWatchlist } from "../../services/api";
import axios, { AxiosError } from "axios";
import "./Player.style.css";
import { Video } from "../../types/types";
interface ErrorResponse {
  error: string;
}

const Player: React.FC = () => {
  const [videoData, setVideoData] = useState<Video | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [error, setError] = useState<string>("");
  const { videoId } = useParams<{ videoId: string }>();
  const history = useHistory();
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleError = useCallback(
    (error: unknown) => {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ErrorResponse>;
        if (axiosError.response?.status === 401) {
          history.push("/login");
          return;
        }
        setError(axiosError.response?.data?.error || "Failed to load video");
      } else {
        setError("An unexpected error occurred");
      }
    },
    [history],
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [videoUrl, watchlist] = await Promise.all([getVideoUrl(videoId), getWatchlist()]);

        const videoInfo: Video = {
          id: videoId,
          url: videoUrl,
          title: `Video ${videoId}`,
          description: "",
          thumbnailUrl: "",
        };

        setVideoData(videoInfo);
        setIsInWatchlist(watchlist.some((v: Video) => v.id === videoId));
      } catch (error) {
        handleError(error);
      }
    };
    fetchData();
  }, [videoId, history, handleError]);

  const handleWatchlistToggle = async () => {
    try {
      if (!videoData) return;

      if (isInWatchlist) {
        await removeFromWatchlist(videoId);
      } else {
        await addToWatchlist(videoData);
      }
      setIsInWatchlist(!isInWatchlist);
    } catch (error) {
      handleError(error);
    }
  };

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
            <button className={`watchlist-button ${isInWatchlist ? "in-watchlist" : ""}`} onClick={handleWatchlistToggle}>
              {isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
            </button>
          </div>
        </>
      ) : (
        <div className="loading">Loading video...</div>
      )}
    </div>
  );
};

export default Player;
