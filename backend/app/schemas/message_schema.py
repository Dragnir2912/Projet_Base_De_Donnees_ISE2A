from marshmallow import Schema, fields


class MessageSchema(Schema):
    id = fields.Int(dump_only=True)
    conversation_id = fields.UUID(dump_only=True)
    expediteur_id = fields.Int(dump_only=True)
    destinataire_id = fields.Int(dump_only=True)
    contenu = fields.Str(dump_only=True)
    envoye_le = fields.DateTime(dump_only=True)
    lu = fields.Bool(dump_only=True)
    lu_le = fields.DateTime(dump_only=True)
    # Noms enrichis
    expediteur_nom = fields.Str(dump_only=True)
    destinataire_nom = fields.Str(dump_only=True)


class MessageCreateSchema(Schema):
    destinataire_id = fields.Int(required=True)
    contenu = fields.Str(required=True)
    conversation_id = fields.UUID(load_default=None)


class ConversationSchema(Schema):
    conversation_id = fields.UUID(dump_only=True)
    interlocuteur_id = fields.Int(dump_only=True)
    interlocuteur_nom = fields.Str(dump_only=True)
    interlocuteur_role = fields.Str(dump_only=True)
    dernier_message = fields.Str(dump_only=True)
    dernier_message_le = fields.DateTime(dump_only=True)
    non_lus = fields.Int(dump_only=True)
