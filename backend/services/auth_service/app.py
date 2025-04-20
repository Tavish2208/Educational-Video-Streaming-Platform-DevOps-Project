from datetime import datetime, timedelta
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from pymongo import MongoClient
import bcrypt
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, supports_credentials=True, origins="*")

# MongoDB Connection
client = MongoClient(os.getenv("MONGODB_URI"))
db = client.EDUCATIONAL_VIDEO_STREAMING_DB
users = db.users

# JWT Configuration
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_COOKIE_SECURE"] = False
app.config["JWT_COOKIE_CSRF_PROTECT"] = False
app.config["JWT_COOKIE_SAMESITE"] = "Lax"

jwt = JWTManager(app)


@app.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = users.find_one({"email": email})
    if not user or not bcrypt.checkpw(password.encode("utf-8"), user["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    # Add role to token (optional, or keep it in DB only)
    additional_claims = {"role": user.get("role", "student")}
    access_token = create_access_token(identity=str(user["_id"]), additional_claims=additional_claims)

    response = make_response(jsonify({
        "role": user.get("role", "student")
    }))
    response.set_cookie(
        "access_token_cookie",
        value=access_token,
        max_age=3600,
        httponly=True,
        samesite="Lax",
        path="/",
        secure=False,
    )
    return response


@app.route("/auth/logout", methods=["POST"])
@jwt_required()
def logout():
    response = make_response(jsonify({"message": "Logout successful"}))
    response.delete_cookie("access_token_cookie", path="/")
    return response


@app.route("/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "student")  # Default to student

    if role not in ["student", "teacher"]:
        return jsonify({"error": "Invalid role"}), 400

    if users.find_one({"email": email}):
        return jsonify({"error": "Email already exists"}), 400

    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    user = {"email": email, "password": hashed, "role": role}
    users.insert_one(user)

    return jsonify({"message": "User registered successfully"}), 201


@app.route("/auth/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    access_token = create_access_token(identity=identity)
    return jsonify({"access_token": access_token}), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
