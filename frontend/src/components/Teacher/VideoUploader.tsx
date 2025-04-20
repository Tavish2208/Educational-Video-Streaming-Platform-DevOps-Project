import React, { useState } from "react";
import { uploadVideo } from "../../services/api";
// import axios, { AxiosError } from "axios";
import "./VideoUploader.style.css";

const VideoUploader: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState({
    title: "",
    description: "",
    thumbnailUrl: "",
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!file) return;

  //   try {
  //     setUploading(true);
  //     setError("");

  //     const formData = new FormData();
  //     formData.append("video", file);
  //     formData.append(
  //       "metadata",
  //       JSON.stringify({
  //         title: metadata.title || file.name,
  //         description: metadata.description,
  //         thumbnailUrl: metadata.thumbnailUrl,
  //       }),
  //     );

  //     await uploadVideo(formData);
  //     alert("Video uploaded successfully!");

  //     // Reset form
  //     setFile(null);
  //     setMetadata({ title: "", description: "", thumbnailUrl: "" });
  //   } catch (err) {
  //     if (err instanceof Error) {
  //       setError(err.message);
  //     } else {
  //       setError("Failed to upload video");
  //     }
  //     console.error("Upload error:", err);
  //   } finally {
  //     setUploading(false);
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("video", file);

      // Ensure thumbnail URL is properly formatted
      const videoMetadata = {
        title: metadata.title || file.name,
        description: metadata.description,
        thumbnailUrl: metadata.thumbnailUrl.trim(), // Ensure no whitespace
      };

      formData.append("metadata", JSON.stringify(videoMetadata));

      await uploadVideo(formData);
      alert("Video uploaded successfully!");

      // Reset form
      setFile(null);
      setMetadata({ title: "", description: "", thumbnailUrl: "" });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to upload video");
      }
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="video-uploader">
      <h2>Upload New Video</h2>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Video File:</label>
          <input type="file" accept="video/*" onChange={handleFileChange} required />
        </div>

        <div className="form-group">
          <label>Title:</label>
          <input type="text" value={metadata.title} onChange={(e) => setMetadata({ ...metadata, title: e.target.value })} required />
        </div>

        <div className="form-group">
          <label>Description:</label>
          <textarea value={metadata.description} onChange={(e) => setMetadata({ ...metadata, description: e.target.value })} required />
        </div>

        <div className="form-group">
          <label>Thumbnail URL:</label>
          <input type="url" value={metadata.thumbnailUrl} onChange={(e) => setMetadata({ ...metadata, thumbnailUrl: e.target.value })} />
        </div>

        <button type="submit" disabled={!file || uploading}>
          {uploading ? "Uploading..." : "Upload Video"}
        </button>
      </form>
    </div>
  );
};

export default VideoUploader;
