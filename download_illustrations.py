"""
Génère les illustrations Sotera (SVG flat-design palette Sotera).
Undraw/Freepik bloquent les téléchargements programmatiques.
Ce script génère des SVGs inline de qualité cohérents avec le design system.
Exécuter : python gen_illustrations.py
"""
import sys, requests, re
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

DEST = Path("frontend/public/illustrations")
DEST.mkdir(parents=True, exist_ok=True)

COLOR = "0A84FF"   # bleu Sotera (sans #)

# Slugs Undraw connus pour chaque illustration
UNDRAW = {
    "health-person":       "healthy_habit_aredv",
    "conseil-nutrition":   "healthy_options_6kr0",
    "conseil-activite":    "working_out_6psf",
    "conseil-sommeil":     "sleeping_awdo",
    "conseil-hydratation": "drinking_coffee_v1hd",   # proche hydratation
    "ai-assistant":        "chatbot_nkwc",
    "doctor-patient":      "doctors_p8ub",
    "mesure-glycemie":     "medical_research_qg4d",
    "mesure-tension":      "medicine_b1ol",
    "mesure-poids":        "body_height_jx1t",        # morphologie / corps
    "mesure-spo2":         "breathing_re_5tch",
    "mesure-cardio":       "personal_health_7mpk",
    "profile-hero":        "profile_re_4c27",
    "empty-alerts":        "notify_re_65on",
    "empty-messages":      "no_data_re_kwbl",
    "empty-medecin":       "medical_care_movn",
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Referer": "https://undraw.co/",
    "Accept": "image/svg+xml,*/*",
}

def try_undraw(name, slug):
    url = f"https://undraw.co/illustrations/{slug}.svg"
    try:
        r = requests.get(url, headers=HEADERS, timeout=12)
        if r.status_code == 200 and "<svg" in r.text:
            # Remplacer la couleur primaire Undraw (#6C63FF → notre bleu)
            svg = re.sub(r"#6C63FF|#6c63ff", f"#{COLOR}", r.text)
            return svg
    except Exception:
        pass
    return None

# ─── SVG fallbacks inline ────────────────────────────────────────────────────
# Palette : blue #0A84FF, green #34C759, orange #FF9500, bg #F2F2F7, dark #1C1C1E

def svg_wrap(content, title=""):
    return f"""<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="{title}">
  <rect width="400" height="400" fill="#F2F2F7" rx="32"/>
  {content}
</svg>"""

FALLBACKS = {

"health-person": svg_wrap("""
  <!-- fond doux -->
  <circle cx="200" cy="200" r="150" fill="#E8F4FD"/>
  <!-- corps -->
  <ellipse cx="200" cy="260" rx="55" ry="70" fill="#0A84FF"/>
  <!-- tête -->
  <circle cx="200" cy="155" r="42" fill="#FFDBB5"/>
  <!-- cheveux -->
  <ellipse cx="200" cy="125" rx="42" ry="20" fill="#5A3825"/>
  <!-- sourire -->
  <path d="M185 160 Q200 175 215 160" stroke="#333" stroke-width="3" fill="none" stroke-linecap="round"/>
  <!-- bras gauche -->
  <path d="M145 240 Q110 220 105 260" stroke="#0A84FF" stroke-width="18" fill="none" stroke-linecap="round"/>
  <!-- bras droit levé (victoire) -->
  <path d="M255 240 Q290 210 300 175" stroke="#0A84FF" stroke-width="18" fill="none" stroke-linecap="round"/>
  <!-- jambes -->
  <path d="M175 325 Q165 355 155 375" stroke="#0A84FF" stroke-width="16" fill="none" stroke-linecap="round"/>
  <path d="M225 325 Q235 355 245 375" stroke="#0A84FF" stroke-width="16" fill="none" stroke-linecap="round"/>
  <!-- cœur flottant -->
  <path d="M290 130 C290 120 275 115 275 130 C275 115 260 120 260 130 C260 145 275 158 275 158 C275 158 290 145 290 130Z" fill="#FF2D55" opacity="0.9"/>
  <!-- étoiles -->
  <circle cx="120" cy="140" r="6" fill="#FFD60A"/>
  <circle cx="310" cy="200" r="4" fill="#34C759"/>
  <circle cx="100" cy="310" r="5" fill="#FF9500"/>
""", "Personne en bonne santé"),

"conseil-nutrition": svg_wrap("""
  <circle cx="200" cy="200" r="150" fill="#E8FDF0"/>
  <!-- assiette -->
  <ellipse cx="200" cy="230" rx="100" ry="20" fill="#E0E0E0"/>
  <ellipse cx="200" cy="220" rx="100" ry="20" fill="#FAFAFA"/>
  <ellipse cx="200" cy="215" rx="85" ry="15" fill="#F2F2F7"/>
  <!-- salade verte -->
  <ellipse cx="185" cy="210" rx="40" ry="20" fill="#34C759" opacity="0.85"/>
  <ellipse cx="210" cy="205" rx="30" ry="15" fill="#30D158" opacity="0.7"/>
  <!-- tomate -->
  <circle cx="240" cy="210" r="18" fill="#FF2D55"/>
  <path d="M238 193 C238 188 244 188 244 193" stroke="#34C759" stroke-width="3" fill="none"/>
  <!-- carotte -->
  <path d="M160 215 L150 235" stroke="#FF9500" stroke-width="8" stroke-linecap="round"/>
  <path d="M155 205 C155 205 148 210 150 215" stroke="#34C759" stroke-width="3" fill="none"/>
  <!-- fourchette -->
  <path d="M310 160 L310 230" stroke="#8E8E93" stroke-width="6" stroke-linecap="round"/>
  <path d="M305 160 L305 180" stroke="#8E8E93" stroke-width="4" stroke-linecap="round"/>
  <path d="M315 160 L315 180" stroke="#8E8E93" stroke-width="4" stroke-linecap="round"/>
  <!-- personne -->
  <circle cx="130" cy="130" r="32" fill="#FFDBB5"/>
  <ellipse cx="130" cy="185" rx="35" ry="45" fill="#0A84FF"/>
  <path d="M118 140 Q130 152 142 140" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- étoiles -->
  <circle cx="340" cy="120" r="5" fill="#FFD60A"/>
  <circle cx="80" cy="280" r="4" fill="#FF9500"/>
""", "Nutrition équilibrée"),

"conseil-activite": svg_wrap("""
  <circle cx="200" cy="200" r="150" fill="#FFF4E6"/>
  <!-- piste de course -->
  <ellipse cx="200" cy="320" rx="130" ry="25" fill="#E0E0E0"/>
  <!-- coureur -->
  <circle cx="200" cy="130" r="35" fill="#FFDBB5"/>
  <ellipse cx="200" cy="195" rx="30" ry="50" fill="#FF9500"/>
  <!-- jambe avant -->
  <path d="M215 240 Q235 280 220 320" stroke="#FF9500" stroke-width="14" fill="none" stroke-linecap="round"/>
  <!-- jambe arrière -->
  <path d="M185 240 Q165 270 175 310" stroke="#FF9500" stroke-width="14" fill="none" stroke-linecap="round"/>
  <!-- bras avant -->
  <path d="M230 190 Q265 170 275 195" stroke="#FF9500" stroke-width="12" fill="none" stroke-linecap="round"/>
  <!-- bras arrière -->
  <path d="M170 190 Q140 210 130 185" stroke="#FF9500" stroke-width="12" fill="none" stroke-linecap="round"/>
  <!-- cheveux -->
  <ellipse cx="200" cy="107" rx="35" ry="15" fill="#5A3825"/>
  <!-- sourire -->
  <path d="M190 137 Q200 148 210 137" stroke="#555" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- lignes de vitesse -->
  <path d="M100 220 L130 220" stroke="#FF9500" stroke-width="3" stroke-linecap="round" opacity="0.5"/>
  <path d="M90 240 L125 240" stroke="#FF9500" stroke-width="3" stroke-linecap="round" opacity="0.4"/>
  <path d="M95 260 L128 260" stroke="#FF9500" stroke-width="3" stroke-linecap="round" opacity="0.3"/>
  <!-- soleil -->
  <circle cx="330" cy="90" r="25" fill="#FFD60A"/>
  <line x1="330" y1="55" x2="330" y2="45" stroke="#FFD60A" stroke-width="4" stroke-linecap="round"/>
  <line x1="355" y1="65" x2="363" y2="57" stroke="#FFD60A" stroke-width="4" stroke-linecap="round"/>
  <line x1="365" y1="90" x2="375" y2="90" stroke="#FFD60A" stroke-width="4" stroke-linecap="round"/>
""", "Activité physique"),

"conseil-sommeil": svg_wrap("""
  <circle cx="200" cy="200" r="150" fill="#EEE8FF"/>
  <!-- lit -->
  <rect x="60" y="240" width="280" height="100" rx="20" fill="#BF5AF2" opacity="0.3"/>
  <rect x="60" y="220" width="280" height="30" rx="10" fill="#BF5AF2" opacity="0.5"/>
  <!-- oreiller -->
  <rect x="80" y="228" width="80" height="28" rx="14" fill="white" opacity="0.8"/>
  <!-- couverture -->
  <path d="M60 270 Q200 255 340 270 L340 340 Q200 325 60 340Z" fill="white" opacity="0.7"/>
  <!-- personne qui dort -->
  <circle cx="145" cy="230" r="30" fill="#FFDBB5"/>
  <path d="M125 238 Q145 250 165 238" stroke="#555" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- yeux fermés -->
  <path d="M135 226 Q140 222 145 226" stroke="#555" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M145 226 Q150 222 155 226" stroke="#555" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- cheveux -->
  <ellipse cx="145" cy="205" rx="30" ry="14" fill="#5A3825"/>
  <!-- ZZZ -->
  <text x="220" y="175" font-size="28" font-weight="bold" fill="#BF5AF2" opacity="0.7" font-family="system-ui">Z</text>
  <text x="250" y="145" font-size="22" font-weight="bold" fill="#BF5AF2" opacity="0.5" font-family="system-ui">Z</text>
  <text x="275" y="120" font-size="16" font-weight="bold" fill="#BF5AF2" opacity="0.35" font-family="system-ui">Z</text>
  <!-- lune -->
  <path d="M330 70 C310 70 295 85 295 105 C295 125 310 140 330 140 C315 140 305 128 305 110 C305 90 318 78 330 70Z" fill="#FFD60A"/>
  <!-- étoiles -->
  <circle cx="100" cy="100" r="3" fill="white"/>
  <circle cx="280" cy="80" r="4" fill="white"/>
  <circle cx="340" cy="160" r="3" fill="white"/>
  <circle cx="70" cy="180" r="2.5" fill="white"/>
""", "Sommeil réparateur"),

"conseil-hydratation": svg_wrap("""
  <circle cx="200" cy="200" r="150" fill="#E6F7FF"/>
  <!-- verre d'eau -->
  <path d="M155 130 L165 320 L235 320 L245 130Z" fill="#5AC8FA" opacity="0.3"/>
  <path d="M155 130 L165 320 L235 320 L245 130Z" stroke="#0A84FF" stroke-width="4" fill="none" rx="8"/>
  <!-- eau dans le verre -->
  <path d="M158 230 Q200 215 242 230 L242 320 L158 320Z" fill="#0A84FF" opacity="0.4"/>
  <!-- bulles -->
  <circle cx="175" cy="270" r="5" fill="white" opacity="0.7"/>
  <circle cx="200" cy="285" r="4" fill="white" opacity="0.6"/>
  <circle cx="220" cy="265" r="3.5" fill="white" opacity="0.6"/>
  <!-- gouttes -->
  <path d="M110 140 C110 120 125 110 125 130 C125 145 110 150 110 140Z" fill="#0A84FF" opacity="0.6"/>
  <path d="M270 160 C270 140 285 130 285 150 C285 165 270 170 270 160Z" fill="#0A84FF" opacity="0.5"/>
  <path d="M90 210 C90 195 103 185 103 202 C103 215 90 218 90 210Z" fill="#5AC8FA" opacity="0.7"/>
  <!-- personne -->
  <circle cx="200" cy="90" r="30" fill="#FFDBB5"/>
  <ellipse cx="200" cy="128" rx="10" ry="12" fill="#0A84FF"/>
  <!-- sourire satisfait -->
  <path d="M190 97 Q200 108 210 97" stroke="#555" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- gouttes autour de la personne -->
  <circle cx="150" cy="80" r="6" fill="#5AC8FA" opacity="0.5"/>
  <circle cx="260" cy="70" r="5" fill="#0A84FF" opacity="0.5"/>
  <circle cx="310" cy="100" r="4" fill="#5AC8FA" opacity="0.4"/>
""", "Hydratation"),

"ai-assistant": svg_wrap("""
  <circle cx="200" cy="200" r="150" fill="#EEF4FF"/>
  <!-- corps robot arrondi -->
  <rect x="130" y="180" width="140" height="130" rx="30" fill="#0A84FF"/>
  <!-- tête robot -->
  <rect x="145" y="105" width="110" height="95" rx="22" fill="#0A84FF"/>
  <!-- yeux -->
  <circle cx="175" cy="140" r="14" fill="white"/>
  <circle cx="225" cy="140" r="14" fill="white"/>
  <circle cx="178" cy="140" r="7" fill="#1C1C1E"/>
  <circle cx="228" cy="140" r="7" fill="#1C1C1E"/>
  <circle cx="181" cy="137" r="2.5" fill="white"/>
  <circle cx="231" cy="137" r="2.5" fill="white"/>
  <!-- antenne -->
  <line x1="200" y1="105" x2="200" y2="75" stroke="#0A84FF" stroke-width="6" stroke-linecap="round"/>
  <circle cx="200" cy="68" r="10" fill="#34C759"/>
  <!-- bouche sourire -->
  <path d="M178 170 Q200 182 222 170" stroke="white" stroke-width="4" fill="none" stroke-linecap="round"/>
  <!-- bras -->
  <rect x="80" y="195" width="50" height="20" rx="10" fill="#0A84FF"/>
  <rect x="270" y="195" width="50" height="20" rx="10" fill="#0A84FF"/>
  <!-- symbole médical sur poitrine -->
  <rect x="192" y="210" width="16" height="50" rx="5" fill="white" opacity="0.6"/>
  <rect x="174" y="228" width="52" height="16" rx="5" fill="white" opacity="0.6"/>
  <!-- bulles de dialogue -->
  <rect x="270" y="115" width="80" height="35" rx="12" fill="white"/>
  <path d="M270 140 L260 148 L275 140Z" fill="white"/>
  <circle cx="284" cy="132" r="4" fill="#0A84FF"/>
  <circle cx="298" cy="132" r="4" fill="#0A84FF"/>
  <circle cx="312" cy="132" r="4" fill="#0A84FF"/>
  <!-- étoiles -->
  <circle cx="90" cy="130" r="5" fill="#FFD60A"/>
  <circle cx="60" cy="250" r="4" fill="#34C759"/>
""", "Assistant IA médical"),

"doctor-patient": svg_wrap("""
  <circle cx="200" cy="200" r="150" fill="#E8F8FF"/>
  <!-- médecin (gauche) -->
  <circle cx="140" cy="135" r="35" fill="#FFDBB5"/>
  <ellipse cx="140" cy="195" rx="38" ry="55" fill="white"/>
  <rect x="102" y="175" width="76" height="10" rx="5" fill="#0A84FF"/>
  <ellipse cx="140" cy="112" rx="35" ry="15" fill="#5A3825"/>
  <!-- stéthoscope -->
  <path d="M155 195 Q175 185 180 210 Q185 230 165 240" stroke="#8E8E93" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="163" cy="243" r="8" fill="#8E8E93"/>
  <!-- bras médecin -->
  <path d="M178 195 Q210 190 215 205" stroke="white" stroke-width="14" fill="none" stroke-linecap="round"/>
  <!-- patient (droite) -->
  <circle cx="270" cy="145" r="32" fill="#FFDBB5"/>
  <ellipse cx="270" cy="200" rx="35" ry="50" fill="#E8E8E8"/>
  <ellipse cx="270" cy="122" rx="32" ry="14" fill="#333"/>
  <!-- sourire patient -->
  <path d="M260 153 Q270 163 280 153" stroke="#555" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- tablette médecin -->
  <rect x="195" y="205" width="65" height="85" rx="10" fill="#1C1C1E"/>
  <rect x="200" y="210" width="55" height="70" rx="7" fill="#0A84FF" opacity="0.9"/>
  <!-- graphique sur tablette -->
  <path d="M208 258 L220 242 L232 250 L244 235 L252 245" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- bureau -->
  <rect x="60" y="280" width="280" height="20" rx="10" fill="#E0E0E0"/>
  <rect x="80" y="300" width="240" height="10" rx="5" fill="#D0D0D0"/>
""", "Médecin et patient"),

"mesure-glycemie": svg_wrap("""
  <circle cx="200" cy="200" r="150" fill="#FFF0F3"/>
  <!-- glucomètre -->
  <rect x="130" y="150" width="140" height="170" rx="20" fill="#1C1C1E"/>
  <rect x="140" y="165" width="120" height="90" rx="12" fill="#0A84FF" opacity="0.9"/>
  <!-- valeur glycémie -->
  <text x="200" y="210" font-size="30" font-weight="bold" fill="white" text-anchor="middle" font-family="system-ui">0.95</text>
  <text x="200" y="232" font-size="12" fill="white" text-anchor="middle" font-family="system-ui" opacity="0.8">g/L</text>
  <!-- boutons glucomètre -->
  <circle cx="160" cy="280" r="12" fill="#333"/>
  <circle cx="200" cy="285" r="12" fill="#FF2D55"/>
  <circle cx="240" cy="280" r="12" fill="#333"/>
  <!-- goutte de sang -->
  <path d="M310 120 C310 100 325 90 325 110 C325 125 310 130 310 120Z" fill="#FF2D55"/>
  <!-- doigt avec lancette -->
  <ellipse cx="325" cy="148" rx="18" ry="28" fill="#FFDBB5"/>
  <circle cx="325" cy="123" r="5" fill="#FF2D55"/>
  <!-- graphique tendance -->
  <path d="M295 200 L305 185 L315 195 L325 175 L335 180 L345 165" stroke="#34C759" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- zone verte normale -->
  <rect x="80" y="160" width="40" height="80" rx="8" fill="#34C759" opacity="0.15"/>
  <text x="100" y="205" font-size="10" fill="#34C759" text-anchor="middle" font-family="system-ui">Normal</text>
""", "Mesure glycémie"),

"mesure-tension": svg_wrap("""
  <circle cx="200" cy="200" r="150" fill="#FFF0F0"/>
  <!-- brassard tensiomètre -->
  <ellipse cx="200" cy="230" rx="90" ry="50" fill="#0A84FF" opacity="0.2"/>
  <ellipse cx="200" cy="225" rx="90" ry="50" fill="#0A84FF" opacity="0.3"/>
  <!-- bras -->
  <rect x="160" y="130" width="80" height="160" rx="40" fill="#FFDBB5"/>
  <!-- brassard -->
  <rect x="140" y="195" width="120" height="65" rx="15" fill="#0A84FF"/>
  <!-- tube connexion -->
  <path d="M260 225 Q290 225 290 170 Q290 140 250 140" stroke="#0A84FF" stroke-width="6" fill="none" stroke-linecap="round"/>
  <!-- appareil -->
  <rect x="250" y="110" width="90" height="65" rx="12" fill="#1C1C1E"/>
  <rect x="257" y="118" width="76" height="42" rx="8" fill="#333"/>
  <!-- valeur -->
  <text x="295" y="140" font-size="16" font-weight="bold" fill="#34C759" text-anchor="middle" font-family="system-ui">120</text>
  <text x="295" y="155" font-size="11" fill="#8E8E93" text-anchor="middle" font-family="system-ui">/80</text>
  <!-- cœur ECG -->
  <path d="M60 260 L80 260 L90 240 L105 285 L120 240 L135 260 L155 260" stroke="#FF2D55" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- cœur icône -->
  <path d="M200 90 C200 78 185 72 185 84 C185 72 170 78 170 90 C170 105 185 118 185 118 C185 118 200 105 200 90Z" fill="#FF2D55"/>
""", "Tension artérielle"),

"mesure-poids": svg_wrap("""
  <circle cx="200" cy="200" r="150" fill="#F0FFF4"/>
  <!-- balance -->
  <ellipse cx="200" cy="290" rx="100" ry="18" fill="#E0E0E0"/>
  <rect x="185" y="250" width="30" height="45" rx="5" fill="#8E8E93"/>
  <ellipse cx="200" cy="258" rx="90" ry="20" fill="#1C1C1E"/>
  <ellipse cx="200" cy="252" rx="90" ry="20" fill="#333"/>
  <!-- écran balance -->
  <rect x="170" y="220" width="60" height="35" rx="8" fill="#0A84FF"/>
  <text x="200" y="242" font-size="16" font-weight="bold" fill="white" text-anchor="middle" font-family="system-ui">72 kg</text>
  <!-- personne debout sur balance -->
  <circle cx="200" cy="130" r="35" fill="#FFDBB5"/>
  <ellipse cx="200" cy="192" rx="38" ry="52" fill="#34C759"/>
  <!-- jambes -->
  <path d="M178 238 L165 280" stroke="#34C759" stroke-width="15" fill="none" stroke-linecap="round"/>
  <path d="M222 238 L235 280" stroke="#34C759" stroke-width="15" fill="none" stroke-linecap="round"/>
  <!-- pieds -->
  <ellipse cx="163" cy="285" rx="12" ry="7" fill="#FFDBB5"/>
  <ellipse cx="237" cy="285" rx="12" ry="7" fill="#FFDBB5"/>
  <!-- cheveux -->
  <ellipse cx="200" cy="107" rx="35" ry="14" fill="#5A3825"/>
  <!-- sourire -->
  <path d="M189 138 Q200 150 211 138" stroke="#555" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- bras -->
  <path d="M162 185 Q130 165 125 185" stroke="#34C759" stroke-width="14" fill="none" stroke-linecap="round"/>
  <path d="M238 185 Q270 165 275 185" stroke="#34C759" stroke-width="14" fill="none" stroke-linecap="round"/>
  <!-- courbe IMC -->
  <path d="M305 320 Q320 280 340 300 Q360 320 340 340" stroke="#34C759" stroke-width="3" fill="none" opacity="0.5"/>
""", "Mesure poids"),

"mesure-spo2": svg_wrap("""
  <circle cx="200" cy="200" r="150" fill="#E8FFF8"/>
  <!-- poumons stylisés -->
  <path d="M200 150 Q200 130 200 110" stroke="#5AC8FA" stroke-width="5" fill="none" stroke-linecap="round"/>
  <!-- poumon gauche -->
  <path d="M200 120 Q170 120 150 150 Q130 180 140 220 Q150 250 175 255 Q195 260 200 240" fill="#5AC8FA" opacity="0.4"/>
  <path d="M200 120 Q170 120 150 150 Q130 180 140 220 Q150 250 175 255 Q195 260 200 240" stroke="#0A84FF" stroke-width="3" fill="none"/>
  <!-- poumon droit -->
  <path d="M200 120 Q230 120 250 150 Q270 180 260 220 Q250 250 225 255 Q205 260 200 240" fill="#5AC8FA" opacity="0.4"/>
  <path d="M200 120 Q230 120 250 150 Q270 180 260 220 Q250 250 225 255 Q205 260 200 240" stroke="#0A84FF" stroke-width="3" fill="none"/>
  <!-- bulles O2 -->
  <circle cx="165" cy="185" r="12" fill="white" stroke="#5AC8FA" stroke-width="2"/>
  <text x="165" y="190" font-size="9" fill="#0A84FF" text-anchor="middle" font-family="system-ui" font-weight="bold">O₂</text>
  <circle cx="235" cy="175" r="12" fill="white" stroke="#5AC8FA" stroke-width="2"/>
  <text x="235" y="180" font-size="9" fill="#0A84FF" text-anchor="middle" font-family="system-ui" font-weight="bold">O₂</text>
  <circle cx="200" cy="200" r="10" fill="white" stroke="#5AC8FA" stroke-width="2"/>
  <text x="200" y="205" font-size="8" fill="#0A84FF" text-anchor="middle" font-family="system-ui" font-weight="bold">O₂</text>
  <!-- oxymètre doigt -->
  <rect x="290" y="200" width="70" height="100" rx="20" fill="#1C1C1E"/>
  <rect x="298" y="215" width="54" height="55" rx="10" fill="#0A84FF" opacity="0.9"/>
  <text x="325" y="243" font-size="18" font-weight="bold" fill="white" text-anchor="middle" font-family="system-ui">98</text>
  <text x="325" y="260" font-size="10" fill="white" text-anchor="middle" font-family="system-ui" opacity="0.8">SpO₂ %</text>
  <!-- doigt dans l'oxymètre -->
  <ellipse cx="325" cy="200" rx="20" ry="14" fill="#FFDBB5"/>
  <!-- indicateur OK -->
  <circle cx="80" cy="240" r="28" fill="#34C759" opacity="0.15"/>
  <text x="80" y="247" font-size="22" text-anchor="middle">✓</text>
""", "Saturation oxygène SpO2"),

"mesure-cardio": svg_wrap("""
  <circle cx="200" cy="200" r="150" fill="#FFF0F3"/>
  <!-- ECG fond -->
  <rect x="60" y="220" width="280" height="100" rx="16" fill="white"/>
  <rect x="60" y="220" width="280" height="100" rx="16" stroke="#F2F2F7" stroke-width="2" fill="none"/>
  <!-- tracé ECG -->
  <path d="M70 270 L105 270 L115 245 L130 300 L148 235 L162 270 L200 270 L210 250 L220 255 L235 270 L270 270 L280 250 L290 255 L300 270 L330 270" stroke="#FF2D55" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- grand cœur central -->
  <path d="M230 160 C230 140 210 130 210 150 C210 130 190 140 190 160 C190 185 210 202 210 202 C210 202 230 185 230 160Z" fill="#FF2D55"/>
  <path d="M230 160 C230 140 210 130 210 150 C210 130 190 140 190 160 C190 185 210 202 210 202 C210 202 230 185 230 160Z" fill="white" opacity="0.15"/>
  <!-- moniteur cardiaque -->
  <rect x="60" y="100" width="120" height="90" rx="14" fill="#1C1C1E"/>
  <rect x="68" y="108" width="104" height="70" rx="9" fill="#333"/>
  <!-- mini ECG sur moniteur -->
  <path d="M75 143 L90 143 L97 130 L108 158 L118 128 L126 143 L155 143 L163 135 L168 143" stroke="#34C759" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- valeur BPM -->
  <text x="120" y="192" font-size="14" font-weight="bold" fill="#FF2D55" text-anchor="middle" font-family="system-ui">72 bpm</text>
  <!-- petits cœurs -->
  <path d="M310 130 C310 122 300 118 300 126 C300 118 290 122 290 130 C290 140 300 148 300 148 C300 148 310 140 310 130Z" fill="#FF2D55" opacity="0.5"/>
  <path d="M360 165 C360 158 352 154 352 161 C352 154 344 158 344 165 C344 173 352 180 352 180 C352 180 360 173 360 165Z" fill="#FF2D55" opacity="0.4"/>
""", "Fréquence cardiaque ECG"),

"profile-hero": svg_wrap("""
  <circle cx="200" cy="200" r="150" fill="#F0F4FF"/>
  <!-- carte profil -->
  <rect x="80" y="130" width="240" height="200" rx="20" fill="white"/>
  <!-- dégradé haut de carte -->
  <rect x="80" y="130" width="240" height="80" rx="20" fill="#0A84FF"/>
  <rect x="80" y="170" width="240" height="40" fill="#0A84FF"/>
  <!-- avatar -->
  <circle cx="200" cy="175" r="40" fill="white"/>
  <circle cx="200" cy="162" r="26" fill="#FFDBB5"/>
  <ellipse cx="200" cy="140" rx="26" ry="12" fill="#5A3825"/>
  <ellipse cx="200" cy="185" rx="32" ry="20" fill="#0A84FF" opacity="0.3"/>
  <!-- nom -->
  <rect x="140" y="228" width="120" height="12" rx="6" fill="#E0E0E0"/>
  <rect x="160" y="248" width="80" height="10" rx="5" fill="#F2F2F7"/>
  <!-- stats -->
  <rect x="95" y="270" width="60" height="40" rx="10" fill="#F2F2F7"/>
  <rect x="170" y="270" width="60" height="40" rx="10" fill="#F2F2F7"/>
  <rect x="245" y="270" width="60" height="40" rx="10" fill="#F2F2F7"/>
  <text x="125" y="286" font-size="10" fill="#8E8E93" text-anchor="middle" font-family="system-ui">Score</text>
  <text x="125" y="302" font-size="14" font-weight="bold" fill="#0A84FF" text-anchor="middle" font-family="system-ui">85</text>
  <text x="200" y="286" font-size="10" fill="#8E8E93" text-anchor="middle" font-family="system-ui">Mesures</text>
  <text x="200" y="302" font-size="14" font-weight="bold" fill="#34C759" text-anchor="middle" font-family="system-ui">24</text>
  <text x="275" y="286" font-size="10" fill="#8E8E93" text-anchor="middle" font-family="system-ui">Alertes</text>
  <text x="275" y="302" font-size="14" font-weight="bold" fill="#FF9500" text-anchor="middle" font-family="system-ui">2</text>
  <!-- étoiles déco -->
  <circle cx="70" cy="150" r="6" fill="#FFD60A"/>
  <circle cx="340" cy="260" r="5" fill="#34C759"/>
  <circle cx="350" cy="140" r="4" fill="#BF5AF2"/>
""", "Profil utilisateur"),

"empty-alerts": svg_wrap("""
  <circle cx="200" cy="200" r="150" fill="#F8FFF8"/>
  <!-- grande cloche -->
  <path d="M200 100 C165 100 140 130 140 165 L140 220 L120 240 L120 255 L280 255 L280 240 L260 220 L260 165 C260 130 235 100 200 100Z" fill="#34C759" opacity="0.8"/>
  <ellipse cx="200" cy="258" rx="40" ry="8" fill="#34C759" opacity="0.6"/>
  <ellipse cx="200" cy="265" rx="18" ry="10" fill="#34C759" opacity="0.5"/>
  <!-- cercle check -->
  <circle cx="200" cy="170" r="45" fill="white"/>
  <path d="M183 170 L196 184 L222 158" stroke="#34C759" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- étoiles tout va bien -->
  <circle cx="105" cy="130" r="8" fill="#FFD60A"/>
  <circle cx="300" cy="120" r="7" fill="#FFD60A"/>
  <circle cx="85" cy="270" r="5" fill="#34C759"/>
  <circle cx="325" cy="280" r="6" fill="#34C759"/>
  <!-- texte -->
  <rect x="130" y="290" width="140" height="14" rx="7" fill="#34C759" opacity="0.2"/>
  <rect x="155" y="310" width="90" height="10" rx="5" fill="#34C759" opacity="0.15"/>
""", "Aucune alerte"),

"empty-messages": svg_wrap("""
  <circle cx="200" cy="200" r="150" fill="#F0F8FF"/>
  <!-- bulle principale -->
  <rect x="90" y="120" width="200" height="130" rx="24" fill="#0A84FF" opacity="0.15"/>
  <rect x="90" y="120" width="200" height="130" rx="24" stroke="#0A84FF" stroke-width="2.5" fill="none"/>
  <!-- queue bulle -->
  <path d="M120 250 L100 280 L145 250Z" fill="#0A84FF" opacity="0.15"/>
  <path d="M120 250 L100 280 L145 250" stroke="#0A84FF" stroke-width="2.5" fill="none"/>
  <!-- lignes de texte vides -->
  <rect x="115" y="148" width="150" height="12" rx="6" fill="#0A84FF" opacity="0.25"/>
  <rect x="115" y="168" width="120" height="12" rx="6" fill="#0A84FF" opacity="0.2"/>
  <rect x="115" y="188" width="135" height="12" rx="6" fill="#0A84FF" opacity="0.15"/>
  <rect x="115" y="208" width="90" height="12" rx="6" fill="#0A84FF" opacity="0.1"/>
  <!-- bulle réponse -->
  <rect x="170" y="280" width="160" height="70" rx="20" fill="#34C759" opacity="0.12"/>
  <rect x="170" y="280" width="160" height="70" rx="20" stroke="#34C759" stroke-width="2" fill="none"/>
  <path d="M280 280 L300 260 L265 280Z" fill="#34C759" opacity="0.12"/>
  <path d="M280 280 L300 260 L265 280" stroke="#34C759" stroke-width="2" fill="none"/>
  <!-- points attente dans bulle -->
  <circle cx="200" cy="315" r="7" fill="#34C759" opacity="0.5"/>
  <circle cx="220" cy="315" r="7" fill="#34C759" opacity="0.35"/>
  <circle cx="240" cy="315" r="7" fill="#34C759" opacity="0.2"/>
  <!-- avatar expéditeur -->
  <circle cx="75" cy="295" r="22" fill="#0A84FF" opacity="0.8"/>
  <circle cx="75" cy="285" r="12" fill="white" opacity="0.7"/>
  <ellipse cx="75" cy="302" rx="16" ry="10" fill="white" opacity="0.4"/>
""", "Aucun message"),

"empty-medecin": svg_wrap("""
  <circle cx="200" cy="200" r="150" fill="#F0F8FF"/>
  <!-- silhouette médecin -->
  <circle cx="200" cy="130" r="40" fill="#0A84FF" opacity="0.2"/>
  <circle cx="200" cy="130" r="40" stroke="#0A84FF" stroke-width="2.5" fill="none"/>
  <!-- stéthoscope dans le cercle -->
  <path d="M188 118 Q188 108 200 108 Q212 108 212 118" stroke="#0A84FF" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M188 118 Q185 130 190 138 Q195 145 200 145 Q205 145 210 138 Q215 130 212 118" stroke="#0A84FF" stroke-width="4" fill="none" stroke-linecap="round"/>
  <circle cx="200" cy="148" r="8" fill="#0A84FF" opacity="0.6"/>
  <!-- corps médecin stylisé -->
  <ellipse cx="200" cy="215" rx="50" ry="55" fill="#0A84FF" opacity="0.1"/>
  <ellipse cx="200" cy="215" rx="50" ry="55" stroke="#0A84FF" stroke-width="2" fill="none" stroke-dasharray="8 4"/>
  <!-- blouse blanche -->
  <path d="M160 195 Q160 185 200 185 Q240 185 240 195 L245 265 Q200 280 155 265Z" fill="white" opacity="0.7"/>
  <rect x="190" y="195" width="20" height="50" rx="5" fill="#0A84FF" opacity="0.2"/>
  <!-- croix médicale -->
  <rect x="192" y="205" width="16" height="42" rx="5" fill="#0A84FF" opacity="0.5"/>
  <rect x="178" y="219" width="44" height="16" rx="5" fill="#0A84FF" opacity="0.5"/>
  <!-- bouton lier médecin -->
  <rect x="120" y="300" width="160" height="44" rx="22" fill="#0A84FF"/>
  <text x="200" y="327" font-size="14" font-weight="bold" fill="white" text-anchor="middle" font-family="system-ui">Trouver un médecin</text>
  <!-- points décoratifs -->
  <circle cx="85" cy="170" r="7" fill="#0A84FF" opacity="0.2"/>
  <circle cx="320" cy="210" r="6" fill="#0A84FF" opacity="0.2"/>
  <circle cx="95" cy="290" r="5" fill="#5AC8FA" opacity="0.3"/>
""", "Aucun médecin lié"),
}

# ─── Boucle de génération ─────────────────────────────────────────────────────
success, from_undraw, from_svg = [], [], []

for name, slug in UNDRAW.items():
    dest = DEST / f"{name}.svg"
    if dest.exists():
        print(f"[OK] Already   : {name}.svg")
        success.append(name)
        continue

    svg = try_undraw(name, slug)
    if svg:
        dest.write_text(svg, encoding="utf-8")
        sz = len(svg) // 1024
        print(f"[UNDRAW] OK    : {name}.svg  ({sz} Ko)")
        success.append(name)
        from_undraw.append(name)
    else:
        # Fallback : SVG inline
        if name in FALLBACKS:
            dest.write_text(FALLBACKS[name], encoding="utf-8")
            print(f"[SVG] Generated: {name}.svg")
            success.append(name)
            from_svg.append(name)
        else:
            print(f"[FAIL] No fallback for: {name}")

print(f"\n=== BILAN ===")
print(f"Total         : {len(UNDRAW)} illustrations")
print(f"Depuis Undraw : {len(from_undraw)}")
print(f"SVG generes   : {len(from_svg)}")
print(f"Deja present  : {len(success) - len(from_undraw) - len(from_svg)}")
print(f"Echecs        : {len(UNDRAW) - len(success)}")
