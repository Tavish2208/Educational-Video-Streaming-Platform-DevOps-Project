import React from "react";
import { Link } from "react-router-dom";
import { Video } from "../../types/types";
import "./VideoCard.style.css";

interface VideoCardProps {
  video: Video;
  onAddToWatchlist: (video: Video) => void;
  isInWatchlist: boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onAddToWatchlist, isInWatchlist }) => {
  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation when clicking the button
    onAddToWatchlist(video);
  };

  return (
    <div className="video-card">
      <Link to={`/watch/${video.id}`} className="video-card-link">
        <div className="thumbnail-container">
          <img src={video.thumbnailUrl || "/default-thumbnail.jpg"} alt={video.title} className="video-thumbnail" />
          {video.duration && <span className="video-duration">{video.duration}</span>}
        </div>
        <div className="video-info">
          <h3 className="video-title">{video.title}</h3>
          <p className="video-description">{video.description}</p>
          {video.uploadDate && <span className="video-upload-date">{new Date(video.uploadDate).toLocaleDateString()}</span>}
        </div>
      </Link>
      <button className={`watchlist-button ${isInWatchlist ? "in-watchlist" : ""}`} onClick={handleWatchlistClick}>
        {isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
      </button>
    </div>
  );
};

export default VideoCard;
