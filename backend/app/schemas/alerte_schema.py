from marshmallow import Schema, fields


class AlerteSchema(Schema):
    id = fields.Int(dump_only=True)
    patient_id = fields.Int(dump_only=True)
    mesure_id = fields.Int(dump_only=True)
    type_alerte = fields.Str(dump_only=True)
    niveau = fields.Str(dump_only=True)
    message = fields.Str(dump_only=True)
    vue = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
