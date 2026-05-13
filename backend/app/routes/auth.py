from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from marshmallow import ValidationError
from ..schemas import RegisterSchema, LoginSchema, UtilisateurSchema
from ..services import auth_service
from ..utils.helpers import success_response, error_response, get_current_user

bp = Blueprint("auth", __name__)
_user_schema = UtilisateurSchema()


@bp.post("/register")
def register():
    try:
        data = RegisterSchema().load(request.get_json() or {})
    except ValidationError as e:
        return error_response(str(e.messages), "VALIDATION_ERROR")

    try:
        user, access_token, refresh_token = auth_service.register_user(data)
    except ValueError as e:
        return error_response(str(e), "REGISTER_ERROR")

    return success_response(
        {
            "user": _user_schema.dump(user),
            "access_token": access_token,
            "refresh_token": refresh_token,
        },
        status=201,
    )


@bp.post("/login")
def login():
    try:
        data = LoginSchema().load(request.get_json() or {})
    except ValidationError as e:
        return error_response(str(e.messages), "VALIDATION_ERROR")

    try:
        user, access_token, refresh_token = auth_service.login_user(
            data["email"], data["mot_de_passe"]
        )
    except ValueError as e:
        return error_response(str(e), "LOGIN_ERROR", 401)

    return success_response(
        {
            "user": _user_schema.dump(user),
            "access_token": access_token,
            "refresh_token": refresh_token,
        }
    )


@bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=user_id)
    return success_response({"access_token": access_token})


@bp.get("/me")
@jwt_required()
def me():
    user = get_current_user()
    return success_response({"user": _user_schema.dump(user)})
