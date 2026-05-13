from datetime import datetime
import bcrypt
from flask_jwt_extended import create_access_token, create_refresh_token
from ..extensions import db
from ..models.utilisateur import Utilisateur


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def register_user(data: dict) -> tuple[Utilisateur, str, str]:
    if Utilisateur.query.filter_by(email=data["email"]).first():
        raise ValueError("Un compte avec cet email existe déjà.")

    user = Utilisateur(
        email=data["email"],
        mot_de_passe_hash=hash_password(data["mot_de_passe"]),
        nom=data["nom"],
        prenom=data["prenom"],
        role=data.get("role", "patient"),
        date_naissance=data.get("date_naissance"),
        taille_cm=data.get("taille_cm"),
    )
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    return user, access_token, refresh_token


def login_user(email: str, password: str) -> tuple[Utilisateur, str, str]:
    user = Utilisateur.query.filter_by(email=email, actif=True).first()
    if not user or not verify_password(password, user.mot_de_passe_hash):
        raise ValueError("Email ou mot de passe incorrect.")

    user.derniere_connexion = datetime.utcnow()
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    return user, access_token, refresh_token
