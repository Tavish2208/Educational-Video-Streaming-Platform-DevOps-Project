from datetime import datetime, timedelta
from bson import ObjectId
from flask import Flask, json, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import get_jwt_identity, jwt_required, JWTManager
import boto3
import os
from dotenv import load_dotenv
from botocore.config import Config
from pymongo import MongoClient

# Load environment variables first
load_dotenv()

# Verify JWT secret key exists
jwt_secret = os.getenv("JWT_SECRET_KEY")
if not jwt_secret:
    raise RuntimeError("JWT_SECRET_KEY environment variable is not set")

app = Flask(__name__)


# MongoDB Connection Setup
client = MongoClient(os.getenv("MONGODB_URI"))
db = client.EDUCATIONAL_VIDEO_STREAMING_DB


# AWS Configuration
s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION"),
    config=Config(signature_version="s3v4"),
)

BUCKET_NAME = os.getenv("S3_BUCKET")

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_COOKIE_CSRF_PROTECT"] = False  # Disable CSRF for simplicity
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
app.config["JWT_COOKIE_SECURE"] = False
app.config["JWT_COOKIE_SAMESITE"] = "Lax"

# Update CORS configuration
CORS(app, supports_credentials=True, origins="*")

jwt = JWTManager(app)


@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({"error": "Invalid token", "message": str(error)}), 422


@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({"error": "Token has expired", "message": "The token has expired"}), 401


@app.route("/videos", methods=["GET"])
@jwt_required()
def list_videos():
    try:
        print("Listing videos...")
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({"error": "Unauthorized"}), 401

        # Get user info to check role
        user = db.users.find_one({"_id": ObjectId(current_user_id)})
        if not user:
            return jsonify({"error": "User not found"}), 404

        user_role = user.get("role")
        print(f"User role: {user_role}")  # Debug log

        # Allow both students and teachers to view videos
        if user_role not in ["student", "teacher"]:
            print(f"Access denied for role: {user_role}")  # Debug log
            return jsonify({"error": "Student or teacher access required"}), 403

        print(f"Getting videos from S3 bucket: {BUCKET_NAME}")
        response = s3.list_objects_v2(Bucket=BUCKET_NAME)
        videos = []

        if "Contents" in response:
            print(f"Found {len(response['Contents'])} objects in S3")
            for item in response["Contents"]:
                print(f"Processing object: {item['Key']}")
                if item["Key"].endswith((".mp4", ".webm")):
                    video_id = item["Key"].split("/")[-1].rsplit(".", 1)[0]
                    print(f"Found video: {video_id}")
                    video_metadata = db.videos.find_one({"id": video_id}) or {}
                    print(f"Video metadata: {video_metadata}")

                    videos.append(
                        {
                            "id": video_id,
                            "title": video_metadata.get("title", video_id),
                            "description": video_metadata.get("description", ""),
                            "thumbnailUrl": video_metadata.get("thumbnail_url", ""),
                            "uploadDate": video_metadata.get("upload_date", item["LastModified"].isoformat()),
                            "duration": video_metadata.get("duration", ""),
                        }
                    )

        print(f"Returning {len(videos)} videos")
        return jsonify(videos)
    except Exception as e:
        print(f"Error listing videos: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/videos/<video_id>/metadata", methods=["PUT"])
@jwt_required()
def update_video_metadata(video_id):
    try:
        data = request.get_json()

        metadata = {
            "id": video_id,
            "title": data.get("title"),
            "description": data.get("description"),
            "thumbnail_url": data.get("thumbnailUrl"),
            "duration": data.get("duration"),
            "upload_date": data.get("uploadDate"),
        }

        db.videos.update_one({"id": video_id}, {"$set": metadata}, upsert=True)

        return jsonify({"message": "Metadata updated successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/videos/<video_id>/url", methods=["GET"])
@jwt_required()
def get_video_url(video_id):
    try:
        # Get user identity and verify role
        current_user_id = get_jwt_identity()
        print(f"Current user ID: {current_user_id}")  # Debug log
        if not current_user_id:
            print("No user ID found in JWT")  # Debug log
            return jsonify({"error": "Unauthorized"}), 401

        # Get user info to check role
        user = db.users.find_one({"_id": ObjectId(current_user_id)})
        if not user:
            print(f"User not found in database: {current_user_id}")  # Debug log
            return jsonify({"error": "User not found"}), 404

        user_role = user.get("role")
        print(f"User role for video access: {user_role}")  # Debug log
        print(f"User document: {user}")  # Debug log

        # Allow both students and teachers to view videos
        if user_role not in ["student", "teacher"]:
            print(f"Access denied for role: {user_role}")  # Debug log
            return jsonify({"error": "Student or teacher access required"}), 403

        # First, list all objects to find matching video
        print(f"Looking for video with ID: {video_id}")
        response = s3.list_objects_v2(Bucket=BUCKET_NAME)

        if "Contents" in response:
            # Try to find matching video file
            for item in response["Contents"]:
                key = item["Key"]
                # Check if this key matches our video_id
                file_name = key.split("/")[-1] if "/" in key else key
                base_name = file_name.rsplit(".", 1)[0]

                if base_name == video_id:
                    print(f"Found matching video: {key}")
                    url = s3.generate_presigned_url(
                        "get_object",
                        Params={"Bucket": BUCKET_NAME, "Key": key, "ResponseContentType": "video/mp4"},
                        ExpiresIn=900,
                    )
                    return jsonify({"url": url})

        print("No matching video found")
        return jsonify({"error": "Video not found"}), 404

    except Exception as e:
        print(f"Error generating video URL: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/videos/upload", methods=["POST"])
@jwt_required()
def upload_video():
    try:
        # Get user identity
        current_user_id = get_jwt_identity()
        print(f"Current user identity: {current_user_id}")

        # Get user info from MongoDB to check teacher status
        try:
            user = db.users.find_one({"_id": ObjectId(current_user_id)})
            print(f"Found user: {user}")
        except Exception as e:
            print(f"Error finding user: {e}")
            return jsonify({"error": "Invalid user ID"}), 400

        if not user or user.get("role") != "teacher":
            return jsonify({"error": "Teacher access required"}), 403

        if "video" not in request.files:
            return jsonify({"error": "No video file"}), 400

        file = request.files["video"]
        print(f"Received file: {file.filename}")

        try:
            metadata = json.loads(request.form.get("metadata", "{}"))
            print(f"Received metadata: {metadata}")
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {str(e)}")
            return jsonify({"error": "Invalid metadata format"}), 422

        # Upload to S3
        try:
            file_name = f"{file.filename}"
            print(f"Uploading to S3: {file_name}")
            s3.upload_fileobj(file, BUCKET_NAME, file_name)
            print("S3 upload successful")
        except Exception as e:
            print(f"S3 upload error: {str(e)}")
            return jsonify({"error": f"S3 upload failed: {str(e)}"}), 500

        # Store metadata in MongoDB
        try:
            video_id = file.filename.rsplit(".", 1)[0]
            metadata_to_store = {
                "id": video_id,
                "title": metadata.get("title", ""),
                "description": metadata.get("description", ""),
                "thumbnail_url": metadata.get("thumbnailUrl", ""),
                "upload_date": datetime.utcnow().isoformat(),
                "uploaded_by": str(user["_id"]),
            }
            print(f"Storing metadata: {metadata_to_store}")
            db.videos.update_one({"id": video_id}, {"$set": metadata_to_store}, upsert=True)
            print("Metadata stored successfully")
        except Exception as e:
            print(f"MongoDB error: {str(e)}")
            return jsonify({"error": f"Failed to store metadata: {str(e)}"}), 500

        return jsonify({"message": "Upload successful"}), 201

    except Exception as e:
        print(f"Unexpected error in upload_video: {str(e)}")
        return jsonify({"error": f"Upload failed: {str(e)}"}), 500


# 5001 is the default port for video service
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
