from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from ..models.utilisateur import Utilisateur


def _get_current_user() -> Utilisateur | None:
    user_id = int(get_jwt_identity())
    return Utilisateur.query.get(user_id)


def patient_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user = _get_current_user()
        if not user or user.role != "patient":
            return jsonify({"success": False, "error": "Accès réservé aux patients.", "code": "PATIENT_REQUIRED"}), 403
        return fn(*args, **kwargs)
    return wrapper


def medecin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user = _get_current_user()
        if not user or user.role != "medecin":
            return jsonify({"success": False, "error": "Accès réservé aux médecins.", "code": "MEDECIN_REQUIRED"}), 403
        return fn(*args, **kwargs)
    return wrapper


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user = _get_current_user()
        if not user or not user.actif:
            return jsonify({"success": False, "error": "Compte inactif.", "code": "INACTIVE"}), 403
        return fn(*args, **kwargs)
    return wrapper
