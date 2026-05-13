# Expose tous les modèles pour Flask-Migrate
from .utilisateur import Utilisateur
from .type_mesure import TypeMesure
from .mesure import Mesure
from .mesure_composante import MesureComposante
from .alerte import Alerte
from .relation import RelationMedecinPatient
from .consultation import Consultation
from .message import Message
from .conversation_ia import ConversationIA
from .annotation import AnnotationMedecin
from .preference import PreferenceUtilisateur
