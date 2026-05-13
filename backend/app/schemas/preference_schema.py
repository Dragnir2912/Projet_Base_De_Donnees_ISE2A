from marshmallow import Schema, fields


class PreferenceSchema(Schema):
    cle = fields.Str(dump_only=True)
    valeur = fields.Str(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class PreferencesUpdateSchema(Schema):
    preferences = fields.Dict(keys=fields.Str(), values=fields.Str(), required=True)
