from ..extensions import db


class TypeMesure(db.Model):
    __tablename__ = "types_mesure"

    id = db.Column(db.Integer, primary_key=True)
    nom = db.Column(db.String(100), unique=True, nullable=False)
    unite = db.Column(db.String(20), nullable=False)
    seuil_min_normal = db.Column(db.Float, nullable=True)
    seuil_max_normal = db.Column(db.Float, nullable=True)
    seuil_danger_bas = db.Column(db.Float, nullable=True)
    seuil_danger_haut = db.Column(db.Float, nullable=True)
    ponderation_vitascore = db.Column(db.Float, default=1.0)
    description = db.Column(db.Text, nullable=True)
    ordre_affichage = db.Column(db.Integer, default=0)

    mesures = db.relationship("Mesure", back_populates="type_mesure", lazy="dynamic")

    def __repr__(self) -> str:
        return f"<TypeMesure {self.nom}>"
