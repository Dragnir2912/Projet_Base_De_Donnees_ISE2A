from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from ..models.utilisateur import Utilisateur


def success_response(data=None, message: str = None, status: int = 200):
    payload = {"success": True}
    if data is not None:
        payload["data"] = data
    if message:
        payload["message"] = message
    return jsonify(payload), status


def error_response(error: str, code: str = "ERROR", status: int = 400):
    return jsonify({"success": False, "error": error, "code": code}), status


def get_current_user() -> Utilisateur:
    user_id = int(get_jwt_identity())
    return Utilisateur.query.get(user_id)
