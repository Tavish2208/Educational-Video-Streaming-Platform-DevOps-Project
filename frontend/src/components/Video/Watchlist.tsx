import React, { useEffect, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { getWatchlist, removeFromWatchlist } from "../../services/api";
import { Video } from "../../types/types";
import VideoCard from "./VideoCard";
import "./Watchlist.style.css";
import axios from "axios";

const Watchlist: React.FC = () => {
  const [watchlistVideos, setWatchlistVideos] = useState<Video[]>([]);
  const history = useHistory();

  const fetchWatchlist = React.useCallback(async () => {
    try {
      const watchlist = await getWatchlist();
      setWatchlistVideos(watchlist);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        history.push("/login");
      }
    }
  }, [history]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const handleRemoveFromWatchlist = async (video: Video) => {
    try {
      const success = await removeFromWatchlist(video.id);
      if (success) {
        // Update local state after successful removal
        setWatchlistVideos(watchlistVideos.filter((v) => v.id !== video.id));
      }
    } catch (error) {
      console.error("Error removing from watchlist:", error);
    }
  };

  return (
    <div className="watchlist-container">
      <div className="watchlist-header">
        <h2>My Watchlist</h2>
      </div>
      {watchlistVideos.length === 0 ? (
        <div className="empty-watchlist">
          <p>Your watchlist is empty</p>
          <Link to="/" className="btn-primary">
            Browse Videos
          </Link>
        </div>
      ) : (
        <div className="watchlist-grid">
          {watchlistVideos.map((video) => (
            <VideoCard key={video.id} video={video} onAddToWatchlist={handleRemoveFromWatchlist} isInWatchlist={true} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Watchlist;
