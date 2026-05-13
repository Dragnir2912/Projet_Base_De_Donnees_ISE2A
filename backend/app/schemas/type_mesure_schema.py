from marshmallow import Schema, fields


class TypeMesureSchema(Schema):
    id = fields.Int(dump_only=True)
    nom = fields.Str(dump_only=True)
    unite = fields.Str(dump_only=True)
    seuil_min_normal = fields.Float(dump_only=True)
    seuil_max_normal = fields.Float(dump_only=True)
    seuil_danger_bas = fields.Float(dump_only=True)
    seuil_danger_haut = fields.Float(dump_only=True)
    ponderation_vitascore = fields.Float(dump_only=True)
    description = fields.Str(dump_only=True)
    ordre_affichage = fields.Int(dump_only=True)
