import React, { useEffect, useState, useCallback } from "react";
import { Link, useHistory } from "react-router-dom";
import { getWatchlist, removeFromWatchlist } from "../../services/api";
import { Video } from "../../types/types";
import VideoCard from "./VideoCard";
import "./Watchlist.style.css";
import axios from "axios";

const Watchlist: React.FC = () => {
  const [watchlistVideos, setWatchlistVideos] = useState<Video[]>([]);
  const [error, setError] = useState<string>(""); // State to handle errors
  const history = useHistory();

  // Fetch the watchlist
  const fetchWatchlist = useCallback(async () => {
    try {
      const watchlist = await getWatchlist();
      setWatchlistVideos(watchlist);
    } catch (error) {
      console.error("Error fetching watchlist:", error); // Log the error for debugging
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          history.push("/login");
        } else if (error.response?.status === 403) {
          setError("Access denied. Please ensure you have the correct role.");
        } else {
          setError("Failed to fetch watchlist. Please try again later.");
        }
      } else {
        setError("An unexpected error occurred.");
      }
    }
  }, [history]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  // Handle removing a video from the watchlist
  const handleRemoveFromWatchlist = async (video: Video) => {
    try {
      const success = await removeFromWatchlist(video.id);
      if (success) {
        // Update local state after successful removal
        setWatchlistVideos(watchlistVideos.filter((v) => v.id !== video.id));
      } else {
        setError("Failed to remove video from watchlist. Please try again.");
      }
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      setError("An unexpected error occurred while removing the video.");
    }
  };

  return (
    <div className="watchlist-container">
      <div className="watchlist-header">
        <h2>My Watchlist</h2>
      </div>
      {error && <div className="error-message">{error}</div>} {/* Display error messages */}
      {watchlistVideos.length === 0 && !error ? (
        <div className="empty-watchlist">
          <p>Your watchlist is empty</p>
          <Link to="/" className="btn-primary">
            Browse Videos
          </Link>
        </div>
      ) : (
        <div className="watchlist-grid">
          {watchlistVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onAddToWatchlist={handleRemoveFromWatchlist}
              isInWatchlist={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Watchlist;
