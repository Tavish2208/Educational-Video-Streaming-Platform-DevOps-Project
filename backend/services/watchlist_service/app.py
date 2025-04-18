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
        user_id = get_jwt_identity()
        user = db.users.find_one({"_id": user_id})
        if not user or user.get("role") != "student":
            return jsonify({"error": "Student access required"}), 403

        user_watchlist = watchlists.find_one({"user_id": user_id})
        return jsonify(user_watchlist.get("videos", []) if user_watchlist else [])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/watchlist/add", methods=["POST"])
@jwt_required()
def add_to_watchlist():
    try:
        user_id = get_jwt_identity()
        user = db.users.find_one({"_id": user_id})
        if not user or user.get("role") != "student":
            return jsonify({"error": "Student access required"}), 403

        video_data = request.get_json()
        watchlists.update_one({"user_id": user_id}, {"$addToSet": {"videos": video_data}}, upsert=True)
        return jsonify({"message": "Video added to watchlist"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/watchlist/remove/<video_id>", methods=["DELETE"])
@jwt_required()
def remove_from_watchlist(video_id):
    try:
        user_id = get_jwt_identity()
        user = db.users.find_one({"_id": user_id})
        if not user or user.get("role") != "student":
            return jsonify({"error": "Student access required"}), 403

        watchlists.update_one({"user_id": user_id}, {"$pull": {"videos": {"id": video_id}}})
        return jsonify({"message": "Video removed from watchlist"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002)
