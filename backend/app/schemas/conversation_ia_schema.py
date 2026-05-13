from marshmallow import Schema, fields


class ConversationIASchema(Schema):
    id = fields.Int(dump_only=True)
    session_id = fields.UUID(dump_only=True)
    ordre_dans_session = fields.Int(dump_only=True)
    role = fields.Str(dump_only=True)
    message = fields.Str(dump_only=True)
    date_message = fields.DateTime(dump_only=True)
    model_utilise = fields.Str(dump_only=True)
