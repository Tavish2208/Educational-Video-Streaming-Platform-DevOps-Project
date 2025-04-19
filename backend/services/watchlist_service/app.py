from datetime import timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import jwt_required, get_jwt_identity, JWTManager
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# MongoDB Connection
client = MongoClient(os.getenv("MONGODB_URI"))
db = client.EDUCATIONAL_VIDEO_STREAMING_DB
watchlists = db.watchlists

# JWT Configuration
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_COOKIE_CSRF_PROTECT"] = False
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
app.config["JWT_COOKIE_SECURE"] = False
app.config["JWT_COOKIE_SAMESITE"] = "Lax"

CORS(app, supports_credentials=True, origins="*")

jwt = JWTManager(app)


@app.route("/watchlist", methods=["GET"])
@jwt_required()
def get_watchlist():
    try:
        # Fetch all videos in the watchlist collection
        all_watchlists = watchlists.find({})
        videos = []
        for watchlist in all_watchlists:
            videos.extend(watchlist.get("videos", []))  # Collect all videos

        return jsonify(videos)  # Return all videos
    except Exception as e:
        app.logger.error(f"Error fetching watchlist: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/watchlist/add", methods=["POST"])
@jwt_required()
def add_to_watchlist():
    try:
        video_data = request.get_json()
        # Add the video to a global watchlist (not tied to a specific user)
        watchlists.update_one({"global": True}, {"$addToSet": {"videos": video_data}}, upsert=True)
        return jsonify({"message": "Video added to watchlist"}), 200
    except Exception as e:
        app.logger.error(f"Error adding to watchlist: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/watchlist/remove/<video_id>", methods=["DELETE"])
@jwt_required()
def remove_from_watchlist(video_id):
    try:
        # Remove the video from the global watchlist
        watchlists.update_one({"global": True}, {"$pull": {"videos": {"id": video_id}}})
        return jsonify({"message": "Video removed from watchlist"}), 200
    except Exception as e:
        app.logger.error(f"Error removing video {video_id} from watchlist: {str(e)}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002)
