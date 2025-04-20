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
from urllib.parse import unquote

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
try:
    region = os.getenv("AWS_REGION", "us-east-1")
    s3 = boto3.client(
        "s3",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=region,
        config=Config(
            signature_version="s3v4",
            retries={"max_attempts": 3}
        )
    )
    print(f"S3 client initialized with region: {region}")
except Exception as e:
    print(f"Error initializing S3 client: {str(e)}")
    raise

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

        # First, get all videos from MongoDB
        print("Fetching videos from MongoDB...")
        mongo_videos = list(db.videos.find({}))
        if not mongo_videos:
            print("No videos found in MongoDB")
            return jsonify([])

        # Then check S3 for these videos
        print(f"Getting videos from S3 bucket: {BUCKET_NAME}")
        try:
            response = s3.list_objects_v2(Bucket=BUCKET_NAME)
        except Exception as e:
            print(f"Error accessing S3: {str(e)}")
            return jsonify({"error": "Failed to access video storage"}), 500

        videos = []
        s3_files = {item["Key"].split("/")[-1].rsplit(".", 1)[0]: item["Key"] 
                   for item in response.get("Contents", []) 
                   if item["Key"].endswith((".mp4", ".webm"))}

        print(f"Found {len(s3_files)} video files in S3")

        # Only include videos that exist in both MongoDB and S3
        for video in mongo_videos:
            video_id = video.get("id")
            if video_id in s3_files:
                print(f"Found matching video in both MongoDB and S3: {video_id}")
                videos.append({
                    "id": video_id,
                    "title": video.get("title", video_id),
                    "description": video.get("description", ""),
                    "thumbnailUrl": video.get("thumbnail_url", ""),
                    "uploadDate": video.get("upload_date", ""),
                    "duration": video.get("duration", ""),
                })
            else:
                print(f"Video {video_id} exists in MongoDB but not in S3")

        print(f"Returning {len(videos)} videos that exist in both MongoDB and S3")
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


@app.route("/videos/<video_id>", methods=["DELETE"])
@jwt_required()
def delete_video(video_id):
    try:
        # Decode the URL-encoded video_id
        decoded_video_id = unquote(video_id)
        print(f"Starting delete operation for video. Raw ID: {video_id}, Decoded ID: {decoded_video_id}")
        
        # Get user identity
        current_user_id = get_jwt_identity()
        if not current_user_id:
            print("Authentication failed: No user identity")
            return jsonify({"error": "Unauthorized"}), 401

        # Get user info to check role
        user = db.users.find_one({"_id": ObjectId(current_user_id)})
        if not user:
            print(f"User not found: {current_user_id}")
            return jsonify({"error": "User not found"}), 404

        if user.get("role") != "teacher":
            print(f"Unauthorized role: {user.get('role')}")
            return jsonify({"error": "Teacher access required"}), 403

        # Find video in MongoDB using decoded ID
        video = db.videos.find_one({"id": decoded_video_id})
        if not video:
            print(f"Video not found in MongoDB: {decoded_video_id}")
            return jsonify({"error": "Video not found"}), 404

        print(f"Found video in MongoDB: {video}")

        # Delete from S3
        video_deleted = False
        try:
            print("Attempting to delete from S3...")
            print(f"S3 Bucket Name: {BUCKET_NAME}")

            # First, list all objects in the bucket to find our video
            try:
                print("Listing objects in S3 bucket...")
                response = s3.list_objects_v2(Bucket=BUCKET_NAME)
                if "Contents" not in response:
                    print("No objects found in S3 bucket")
                else:
                    print(f"Found {len(response['Contents'])} objects in bucket")
                    
                    # Print all objects for debugging
                    print("Objects in bucket:")
                    for item in response["Contents"]:
                        print(f"- {item['Key']}")

                    # Try to find and delete our video
                    for item in response["Contents"]:
                        key = item["Key"]
                        print(f"\nChecking object: {key}")
                        
                        # Check various possible matches
                        is_match = (
                            key == decoded_video_id or  # Exact match
                            key == video_id or  # Match with original ID
                            key.startswith(f"{decoded_video_id}.") or  # Match with extension
                            key.startswith(f"{video_id}.") or  # Match with original ID and extension
                            key.endswith(f"/{decoded_video_id}") or  # Match with path
                            key.endswith(f"/{video_id}")  # Match with path and original ID
                        )
                        
                        if is_match:
                            print(f"Found matching video in S3: {key}")
                            try:
                                # Try to delete the object
                                print(f"Attempting to delete S3 object: {key}")
                                delete_response = s3.delete_object(Bucket=BUCKET_NAME, Key=key)
                                print(f"S3 delete_object response: {delete_response}")
                                
                                # Verify deletion
                                try:
                                    s3.head_object(Bucket=BUCKET_NAME, Key=key)
                                    print(f"Warning: Object still exists after deletion: {key}")
                                except s3.exceptions.ClientError as e:
                                    if e.response['Error']['Code'] == '404':
                                        print(f"Confirmed object deletion: {key}")
                                        video_deleted = True
                                        break
                                    else:
                                        print(f"Error checking object existence: {str(e)}")
                            except Exception as del_err:
                                print(f"Error during deletion of {key}: {str(del_err)}")
                                continue

            except Exception as list_err:
                print(f"Error listing S3 objects: {str(list_err)}")

            if not video_deleted:
                print(f"Warning: Video file not found or could not be deleted from S3: {decoded_video_id}")
                # Continue with MongoDB deletion even if S3 file is not found or couldn't be deleted

        except Exception as e:
            print(f"S3 deletion error: {str(e)}")
            # Don't return error here, try to delete from MongoDB anyway
            print("Continuing with MongoDB deletion despite S3 error")

        # Delete from MongoDB using decoded ID
        try:
            print("Deleting from MongoDB...")
            result = db.videos.delete_one({"id": decoded_video_id})
            if result.deleted_count == 0:
                print(f"Warning: No document deleted from MongoDB: {decoded_video_id}")
            else:
                print("MongoDB deletion successful")
        except Exception as e:
            print(f"MongoDB deletion error: {str(e)}")
            return jsonify({"error": f"Failed to delete from MongoDB: {str(e)}"}), 500

        # Return appropriate response based on deletion status
        if video_deleted:
            print("Video successfully deleted from both S3 and MongoDB")
            return jsonify({"message": "Video deleted successfully from both S3 and MongoDB"}), 200
        else:
            print("Video deleted from MongoDB but may still exist in S3")
            return jsonify({
                "message": "Video deleted from database but may still exist in storage",
                "warning": "S3 deletion may have failed"
            }), 200

    except Exception as e:
        print(f"Unexpected error in delete_video: {str(e)}")
        return jsonify({"error": f"Delete failed: {str(e)}"}), 500


# 5001 is the default port for video service
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
