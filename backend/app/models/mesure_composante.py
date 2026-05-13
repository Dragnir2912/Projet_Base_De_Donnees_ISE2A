from ..extensions import db


class MesureComposante(db.Model):
    __tablename__ = "mesures_composantes"

    id = db.Column(db.Integer, primary_key=True)
    mesure_id = db.Column(
        db.Integer, db.ForeignKey("mesures.id", ondelete="CASCADE"), nullable=False
    )
    composante = db.Column(db.String(50), nullable=False)
    valeur = db.Column(db.Float, nullable=False)

    mesure = db.relationship("Mesure", back_populates="composantes")

    __table_args__ = (db.UniqueConstraint("mesure_id", "composante"),)

    def __repr__(self) -> str:
        return f"<MesureComposante {self.composante}={self.valeur}>"
