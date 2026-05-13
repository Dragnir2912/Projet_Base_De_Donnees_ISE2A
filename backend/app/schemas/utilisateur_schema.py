from marshmallow import Schema, fields, validate, validates, ValidationError


class UtilisateurSchema(Schema):
    id = fields.Int(dump_only=True)
    email = fields.Email(dump_only=True)
    nom = fields.Str(dump_only=True)
    prenom = fields.Str(dump_only=True)
    role = fields.Str(dump_only=True)
    date_naissance = fields.Date(dump_only=True)
    taille_cm = fields.Float(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    derniere_connexion = fields.DateTime(dump_only=True)
    actif = fields.Bool(dump_only=True)


class RegisterSchema(Schema):
    email = fields.Email(required=True)
    mot_de_passe = fields.Str(
        required=True,
        load_only=True,
        validate=validate.Length(min=8, error="Le mot de passe doit contenir au moins 8 caractères."),
    )
    nom = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    prenom = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    role = fields.Str(
        load_default="patient",
        validate=validate.OneOf(["patient", "medecin"]),
    )
    date_naissance = fields.Date(load_default=None)
    taille_cm = fields.Float(load_default=None)


class LoginSchema(Schema):
    email = fields.Email(required=True)
    mot_de_passe = fields.Str(required=True, load_only=True)


class ProfilUpdateSchema(Schema):
    nom = fields.Str(validate=validate.Length(min=1, max=100))
    prenom = fields.Str(validate=validate.Length(min=1, max=100))
    date_naissance = fields.Date()
    taille_cm = fields.Float()
