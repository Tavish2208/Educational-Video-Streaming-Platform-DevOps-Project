import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Video } from "../../types/types";
import "./VideoCard.style.css";
import { useHistory } from "react-router-dom";
import { deleteVideo } from "../../services/api";

interface VideoCardProps {
  video: Video;
  onAddToWatchlist?: (video: Video) => void;
  isInWatchlist?: boolean;
  isTeacherView?: boolean;
  onDelete?: (videoId: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onAddToWatchlist,
  isInWatchlist = false,
  isTeacherView = false,
  onDelete
}) => {
  const history = useHistory();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    if (window.confirm("Are you sure you want to delete this video? This action cannot be undone.")) {
      try {
        setIsDeleting(true);
        setError(null);
        const result = await deleteVideo(video.id);
        if (result.success) {
          onDelete?.(video.id);
        } else {
          setError(result.error || "Failed to delete video. Please try again.");
        }
      } catch (err) {
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setIsDeleting(false);
      }
    }
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
          {error && <div className="error-message">{error}</div>}
        </div>
      </Link>
      {isTeacherView ? (
        <button
          className={`delete-button ${isDeleting ? 'deleting' : ''}`}
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete Video"}
        </button>
      ) : onAddToWatchlist && (
        <button
          className={`watchlist-button ${isInWatchlist ? "in-watchlist" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            onAddToWatchlist(video);
          }}
        >
          {isInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
        </button>
      )}
    </div>
  );
};

export default VideoCard;
