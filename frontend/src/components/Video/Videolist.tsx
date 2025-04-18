import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { getVideos, addToWatchlist, removeFromWatchlist, getWatchlist } from "../../services/api";
import { Video } from "../../types/types";
import VideoCard from "./VideoCard";
import "./Videolist.style.css";
import axios from "axios";

const Videolist: React.FC = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const history = useHistory();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch videos
        const videoList = await getVideos();
        setVideos(videoList);
        console.log("Fetched videos:", videoList);

        // Fetch watchlist
        try {
          const watchlist = await getWatchlist();
          console.log("Fetched watchlist:", watchlist);
          setWatchlistIds(watchlist.map((video: Video) => video.id));
        } catch (watchlistError) {
          console.warn("Watchlist service not available, continuing without watchlist:", watchlistError);
          setWatchlistIds([]); // Fallback to an empty watchlist
        }
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
    fetchData();
  }, [history]);

  const handleWatchlistToggle = async (video: Video) => {
    try {
      let success;
      if (watchlistIds.includes(video.id)) {
        success = await removeFromWatchlist(video.id);
        if (success) {
          setWatchlistIds(watchlistIds.filter((id) => id !== video.id));
        }
      } else {
        success = await addToWatchlist(video);
        if (success) {
          setWatchlistIds([...watchlistIds, video.id]);
        }
      }

      if (!success) {
        console.error("Failed to update watchlist");
      }
    } catch (error) {
      console.error("Error updating watchlist:", error);
    }
  };

  return (
    <div className="video-container">
      <h1 className="page-title">Available Videos</h1>
      {error && <div className="error-message">{error}</div>}
      <div className="video-grid">
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onAddToWatchlist={handleWatchlistToggle}
            isInWatchlist={watchlistIds.includes(video.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default Videolist;
