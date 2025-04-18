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
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
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

        // Fetch watchlist
        try {
          const watchlist = await getWatchlist();
          console.log("Fetched watchlist:", watchlist);
          setWatchlistIds(watchlist.map((video: Video) => video.id));
          setIsInWatchlist(watchlist.some((v: Video) => v.id === videoId));
        } catch (watchlistError) {
          console.warn("Watchlist service not available, continuing without watchlist:", watchlistError);
          setWatchlistIds([]); // Fallback to an empty watchlist
        }
      } catch (error) {
        console.error("Error fetching video or watchlist:", error);
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
