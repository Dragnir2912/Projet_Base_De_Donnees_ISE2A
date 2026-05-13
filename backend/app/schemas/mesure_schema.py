from marshmallow import Schema, fields, validate


class ComposanteSchema(Schema):
    composante = fields.Str(required=True)
    valeur = fields.Float(required=True)


class MesureSchema(Schema):
    id = fields.Int(dump_only=True)
    patient_id = fields.Int(dump_only=True)
    type_mesure_id = fields.Int(dump_only=True)
    valeur = fields.Float(dump_only=True)
    date_mesure = fields.DateTime(dump_only=True)
    contexte = fields.Str(dump_only=True)
    note = fields.Str(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    source = fields.Str(dump_only=True)
    composantes = fields.List(fields.Nested(ComposanteSchema), dump_only=True)
    # Enrichi depuis le type
    nom_type = fields.Str(dump_only=True)
    unite = fields.Str(dump_only=True)


class MesureCreateSchema(Schema):
    type_mesure_id = fields.Int(required=True)
    valeur = fields.Float(required=True)
    date_mesure = fields.DateTime(required=True)
    contexte = fields.Str(
        load_default=None,
        validate=validate.OneOf(
            [None, "a_jeun", "post_repas", "au_repos", "apres_effort", "avant_coucher"]
        ),
    )
    note = fields.Str(load_default=None)
    composantes = fields.List(fields.Nested(ComposanteSchema), load_default=[])
