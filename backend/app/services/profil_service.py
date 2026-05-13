from ..extensions import db
from ..models.utilisateur import Utilisateur
from ..models.preference import PreferenceUtilisateur


def get_profil(user_id: int) -> Utilisateur:
    return Utilisateur.query.get(user_id)


def update_profil(user_id: int, data: dict) -> Utilisateur:
    user = Utilisateur.query.get(user_id)
    champs = ["nom", "prenom", "date_naissance", "taille_cm"]
    for champ in champs:
        if champ in data and data[champ] is not None:
            setattr(user, champ, data[champ])
    db.session.commit()
    return user


def get_preferences(user_id: int) -> list[PreferenceUtilisateur]:
    return PreferenceUtilisateur.query.filter_by(user_id=user_id).all()


def update_preferences(user_id: int, prefs: dict) -> list[PreferenceUtilisateur]:
    for cle, valeur in prefs.items():
        pref = PreferenceUtilisateur.query.filter_by(user_id=user_id, cle=cle).first()
        if pref:
            pref.valeur = str(valeur)
        else:
            db.session.add(PreferenceUtilisateur(user_id=user_id, cle=cle, valeur=str(valeur)))
    db.session.commit()
    return get_preferences(user_id)
