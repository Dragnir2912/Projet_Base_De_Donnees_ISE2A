from marshmallow import Schema, fields


class AnnotationSchema(Schema):
    id = fields.Int(dump_only=True)
    medecin_id = fields.Int(dump_only=True)
    mesure_id = fields.Int(dump_only=True)
    commentaire = fields.Str(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    medecin_nom = fields.Str(dump_only=True)


class AnnotationCreateSchema(Schema):
    mesure_id = fields.Int(required=True)
    commentaire = fields.Str(required=True)
