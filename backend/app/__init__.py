from flask import Flask
from .config import get_config
from .extensions import db, migrate, jwt, cors


def create_app() -> Flask:
    app = Flask(__name__)
    app.config.from_object(get_config())

    # Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    # Importer les modèles pour que Flask-Migrate les détecte
    from .models import (  # noqa: F401
        utilisateur, mesure, mesure_composante, type_mesure,
        alerte, relation, demande_relation, consultation, message,
        conversation_ia, session_ia, annotation, preference,
    )

    # Blueprints
    from .routes.auth import bp as auth_bp
    from .routes.mesures import bp as mesures_bp
    from .routes.alertes import bp as alertes_bp
    from .routes.medecin import bp as medecin_bp
    from .routes.messages import bp as messages_bp
    from .routes.ia import bp as ia_bp
    from .routes.profil import bp as profil_bp
    from .routes.relations import bp as relations_bp
    from .routes.dashboard import bp as dashboard_bp

    app.register_blueprint(auth_bp,     url_prefix="/api/auth")
    app.register_blueprint(mesures_bp,  url_prefix="/api/mesures")
    app.register_blueprint(alertes_bp,  url_prefix="/api/alertes")
    app.register_blueprint(medecin_bp,  url_prefix="/api/medecin")
    app.register_blueprint(messages_bp, url_prefix="/api/messages")
    app.register_blueprint(ia_bp,       url_prefix="/api/ia")
    app.register_blueprint(profil_bp,    url_prefix="/api/profil")
    app.register_blueprint(relations_bp,  url_prefix="/api/relations")
    app.register_blueprint(dashboard_bp,  url_prefix="/api/dashboard")

    return app
