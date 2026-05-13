from marshmallow import Schema, fields, validate


class ConsultationSchema(Schema):
    id = fields.Int(dump_only=True)
    medecin_id = fields.Int(dump_only=True)
    patient_id = fields.Int(dump_only=True)
    date_consultation = fields.DateTime(dump_only=True)
    diagnostic = fields.Str(dump_only=True)
    recommandations = fields.Str(dump_only=True)
    statut = fields.Str(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    medecin_nom = fields.Str(dump_only=True)


class ConsultationCreateSchema(Schema):
    patient_id = fields.Int(required=True)
    date_consultation = fields.DateTime(required=True)
    diagnostic = fields.Str(load_default=None)
    recommandations = fields.Str(load_default=None)
    statut = fields.Str(
        load_default="redige",
        validate=validate.OneOf(["redige", "valide", "archive"]),
    )
