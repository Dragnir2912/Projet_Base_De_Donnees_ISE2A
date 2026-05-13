"""Génère les 16 SVGs flat-design pour Sotera."""
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

DEST = Path("frontend/public/illustrations")
DEST.mkdir(parents=True, exist_ok=True)


def w(body, label=""):
    return (
        f'<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-label="{label}">\n'
        f'  <rect width="400" height="400" fill="#F2F2F7" rx="32"/>\n'
        f'  {body}\n'
        f'</svg>'
    )


SVGS = {

"health-person": w(
    '<circle cx="200" cy="200" r="148" fill="#E8F4FD"/>'
    '<circle cx="200" cy="145" r="45" fill="#FFDBB5"/>'
    '<ellipse cx="200" cy="118" rx="45" ry="20" fill="#5A3825"/>'
    '<path d="M185 155 Q200 170 215 155" stroke="#555" stroke-width="3" fill="none" stroke-linecap="round"/>'
    '<ellipse cx="200" cy="240" rx="58" ry="72" fill="#0A84FF"/>'
    '<path d="M142 225 Q108 205 100 250" stroke="#0A84FF" stroke-width="20" fill="none" stroke-linecap="round"/>'
    '<path d="M258 225 Q292 200 305 170" stroke="#0A84FF" stroke-width="20" fill="none" stroke-linecap="round"/>'
    '<path d="M170 308 Q158 345 148 368" stroke="#0A84FF" stroke-width="18" fill="none" stroke-linecap="round"/>'
    '<path d="M230 308 Q242 345 252 368" stroke="#0A84FF" stroke-width="18" fill="none" stroke-linecap="round"/>'
    '<path d="M295 120 C295 108 280 102 280 116 C280 102 265 108 265 120 C265 136 280 150 280 150 C280 150 295 136 295 120Z" fill="#FF2D55"/>'
    '<circle cx="118" cy="138" r="7" fill="#FFD60A"/>'
    '<circle cx="320" cy="210" r="5" fill="#34C759"/>'
    '<circle cx="95" cy="300" r="6" fill="#FF9500"/>',
    "Personne en bonne santé"
),

"conseil-nutrition": w(
    '<circle cx="200" cy="200" r="148" fill="#E8FDF0"/>'
    '<ellipse cx="200" cy="235" rx="105" ry="22" fill="#D0D0D0"/>'
    '<ellipse cx="200" cy="225" rx="105" ry="22" fill="#FAFAFA"/>'
    '<ellipse cx="200" cy="218" rx="88" ry="16" fill="#F5F5F5"/>'
    '<ellipse cx="182" cy="212" rx="42" ry="22" fill="#34C759" opacity=".85"/>'
    '<ellipse cx="208" cy="207" rx="32" ry="16" fill="#30D158" opacity=".7"/>'
    '<circle cx="242" cy="212" r="19" fill="#FF2D55"/>'
    '<path d="M240 194 C240 188 247 188 247 194" stroke="#34C759" stroke-width="3" fill="none"/>'
    '<path d="M158 218 L148 238" stroke="#FF9500" stroke-width="9" stroke-linecap="round"/>'
    '<path d="M312 158 L312 232" stroke="#8E8E93" stroke-width="7" stroke-linecap="round"/>'
    '<path d="M307 158 L307 180" stroke="#8E8E93" stroke-width="5" stroke-linecap="round"/>'
    '<path d="M317 158 L317 180" stroke="#8E8E93" stroke-width="5" stroke-linecap="round"/>'
    '<circle cx="128" cy="128" r="33" fill="#FFDBB5"/>'
    '<ellipse cx="128" cy="183" rx="36" ry="47" fill="#0A84FF"/>'
    '<path d="M116 136 Q128 148 140 136" stroke="#333" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
    '<ellipse cx="128" cy="106" rx="33" ry="14" fill="#5A3825"/>',
    "Nutrition équilibrée"
),

"conseil-activite": w(
    '<circle cx="200" cy="200" r="148" fill="#FFF4E6"/>'
    '<ellipse cx="215" cy="322" rx="135" ry="24" fill="#E0D5C0"/>'
    '<circle cx="210" cy="125" r="36" fill="#FFDBB5"/>'
    '<ellipse cx="210" cy="108" rx="36" ry="15" fill="#5A3825"/>'
    '<path d="M198 133 Q210 145 222 133" stroke="#555" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
    '<ellipse cx="210" cy="193" rx="32" ry="54" fill="#FF9500"/>'
    '<path d="M225 244 Q248 288 232 322" stroke="#FF9500" stroke-width="15" fill="none" stroke-linecap="round"/>'
    '<path d="M195 244 Q172 278 182 318" stroke="#FF9500" stroke-width="15" fill="none" stroke-linecap="round"/>'
    '<path d="M242 188 Q278 168 290 194" stroke="#FF9500" stroke-width="13" fill="none" stroke-linecap="round"/>'
    '<path d="M178 188 Q145 208 132 184" stroke="#FF9500" stroke-width="13" fill="none" stroke-linecap="round"/>'
    '<path d="M95 228 L128 228" stroke="#FF9500" stroke-width="4" stroke-linecap="round" opacity=".5"/>'
    '<path d="M85 248 L122 248" stroke="#FF9500" stroke-width="3" stroke-linecap="round" opacity=".4"/>'
    '<path d="M90 268 L125 268" stroke="#FF9500" stroke-width="3" stroke-linecap="round" opacity=".3"/>'
    '<circle cx="330" cy="85" r="28" fill="#FFD60A"/>',
    "Activité physique"
),

"conseil-sommeil": w(
    '<circle cx="200" cy="200" r="148" fill="#EEE8FF"/>'
    '<rect x="55" y="245" width="290" height="110" rx="22" fill="#BF5AF2" opacity=".25"/>'
    '<rect x="55" y="224" width="290" height="32" rx="12" fill="#BF5AF2" opacity=".45"/>'
    '<rect x="72" y="230" width="88" height="30" rx="15" fill="white" opacity=".75"/>'
    '<path d="M55 272 Q200 256 345 272 L345 355 Q200 338 55 355Z" fill="white" opacity=".65"/>'
    '<circle cx="148" cy="232" r="32" fill="#FFDBB5"/>'
    '<ellipse cx="148" cy="208" rx="32" ry="14" fill="#5A3825"/>'
    '<path d="M128 240 Q148 254 168 240" stroke="#555" stroke-width="2" fill="none" stroke-linecap="round"/>'
    '<text x="222" y="178" font-size="30" font-weight="bold" fill="#BF5AF2" opacity=".65" font-family="system-ui">Z</text>'
    '<text x="254" y="148" font-size="23" font-weight="bold" fill="#BF5AF2" opacity=".48" font-family="system-ui">Z</text>'
    '<text x="280" y="122" font-size="16" font-weight="bold" fill="#BF5AF2" opacity=".33" font-family="system-ui">Z</text>'
    '<path d="M335 68 C314 68 298 84 298 105 C298 126 314 142 335 142 C319 142 308 129 308 110 C308 89 322 76 335 68Z" fill="#FFD60A"/>'
    '<circle cx="96" cy="98" r="4" fill="white"/>'
    '<circle cx="282" cy="78" r="5" fill="white"/>'
    '<circle cx="346" cy="158" r="3" fill="white"/>',
    "Sommeil réparateur"
),

"conseil-hydratation": w(
    '<circle cx="200" cy="200" r="148" fill="#E6F7FF"/>'
    '<path d="M152 128 L162 322 L238 322 L248 128Z" fill="#5AC8FA" opacity=".28"/>'
    '<path d="M152 128 L162 322 L238 322 L248 128Z" stroke="#0A84FF" stroke-width="4" fill="none"/>'
    '<path d="M155 232 Q200 215 245 232 L245 322 L155 322Z" fill="#0A84FF" opacity=".38"/>'
    '<circle cx="174" cy="272" r="6" fill="white" opacity=".65"/>'
    '<circle cx="200" cy="288" r="5" fill="white" opacity=".55"/>'
    '<circle cx="222" cy="268" r="4" fill="white" opacity=".55"/>'
    '<path d="M108 138 C108 118 124 108 124 128 C124 144 108 150 108 138Z" fill="#0A84FF" opacity=".55"/>'
    '<path d="M272 158 C272 138 288 128 288 148 C288 164 272 170 272 158Z" fill="#0A84FF" opacity=".48"/>'
    '<path d="M88 208 C88 194 102 184 102 200 C102 214 88 218 88 208Z" fill="#5AC8FA" opacity=".65"/>'
    '<circle cx="200" cy="88" r="32" fill="#FFDBB5"/>'
    '<ellipse cx="200" cy="65" rx="32" ry="14" fill="#5A3825"/>'
    '<path d="M190 96 Q200 108 210 96" stroke="#555" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
    '<ellipse cx="200" cy="128" rx="12" ry="14" fill="#0A84FF"/>',
    "Hydratation"
),

"ai-assistant": w(
    '<circle cx="200" cy="200" r="148" fill="#EEF4FF"/>'
    '<rect x="128" y="182" width="144" height="134" rx="32" fill="#0A84FF"/>'
    '<rect x="142" y="104" width="116" height="98" rx="24" fill="#0A84FF"/>'
    '<circle cx="174" cy="140" r="15" fill="white"/>'
    '<circle cx="226" cy="140" r="15" fill="white"/>'
    '<circle cx="177" cy="140" r="7" fill="#1C1C1E"/>'
    '<circle cx="229" cy="140" r="7" fill="#1C1C1E"/>'
    '<circle cx="180" cy="137" r="2.5" fill="white"/>'
    '<circle cx="232" cy="137" r="2.5" fill="white"/>'
    '<line x1="200" y1="104" x2="200" y2="72" stroke="#0A84FF" stroke-width="6" stroke-linecap="round"/>'
    '<circle cx="200" cy="64" r="11" fill="#34C759"/>'
    '<path d="M177 172 Q200 185 223 172" stroke="white" stroke-width="4" fill="none" stroke-linecap="round"/>'
    '<rect x="78" y="198" width="50" height="22" rx="11" fill="#0A84FF"/>'
    '<rect x="272" y="198" width="50" height="22" rx="11" fill="#0A84FF"/>'
    '<rect x="190" y="212" width="18" height="54" rx="6" fill="white" opacity=".55"/>'
    '<rect x="172" y="230" width="56" height="18" rx="6" fill="white" opacity=".55"/>'
    '<rect x="268" y="114" width="86" height="38" rx="14" fill="white"/>'
    '<path d="M268 142 L256 150 L272 142Z" fill="white"/>'
    '<circle cx="284" cy="133" r="5" fill="#0A84FF"/>'
    '<circle cx="300" cy="133" r="5" fill="#0A84FF"/>'
    '<circle cx="316" cy="133" r="5" fill="#0A84FF"/>'
    '<circle cx="88" cy="128" r="6" fill="#FFD60A"/>'
    '<circle cx="58" cy="252" r="5" fill="#34C759"/>',
    "Assistant IA médical"
),

"doctor-patient": w(
    '<circle cx="200" cy="200" r="148" fill="#E8F8FF"/>'
    '<circle cx="138" cy="132" r="36" fill="#FFDBB5"/>'
    '<ellipse cx="138" cy="108" rx="36" ry="16" fill="#5A3825"/>'
    '<ellipse cx="138" cy="196" rx="40" ry="57" fill="white"/>'
    '<rect x="98" y="175" width="80" height="11" rx="5.5" fill="#0A84FF"/>'
    '<path d="M157 196 Q178 186 184 212 Q189 232 168 244" stroke="#8E8E93" stroke-width="4.5" fill="none" stroke-linecap="round"/>'
    '<circle cx="165" cy="247" r="9" fill="#8E8E93"/>'
    '<path d="M178 196 Q210 190 218 208" stroke="white" stroke-width="15" fill="none" stroke-linecap="round"/>'
    '<circle cx="272" cy="142" r="33" fill="#FFDBB5"/>'
    '<ellipse cx="272" cy="196" rx="37" ry="52" fill="#E8E8E8"/>'
    '<ellipse cx="272" cy="118" rx="33" ry="15" fill="#333"/>'
    '<path d="M261 150 Q272 162 283 150" stroke="#555" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
    '<rect x="196" y="206" width="68" height="88" rx="11" fill="#1C1C1E"/>'
    '<rect x="202" y="212" width="56" height="72" rx="8" fill="#0A84FF" opacity=".9"/>'
    '<path d="M210 260 L223 244 L236 252 L248 237 L258 247" stroke="white" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
    '<rect x="58" y="280" width="284" height="22" rx="11" fill="#E0E0E0"/>'
    '<rect x="78" y="302" width="244" height="11" rx="5.5" fill="#D0D0D0"/>',
    "Médecin et patient"
),

"mesure-glycemie": w(
    '<circle cx="200" cy="200" r="148" fill="#FFF0F3"/>'
    '<rect x="128" y="148" width="144" height="174" rx="22" fill="#1C1C1E"/>'
    '<rect x="138" y="162" width="124" height="94" rx="13" fill="#0A84FF" opacity=".9"/>'
    '<text x="200" y="212" font-size="32" font-weight="bold" fill="white" text-anchor="middle" font-family="system-ui">0.95</text>'
    '<text x="200" y="236" font-size="13" fill="white" text-anchor="middle" font-family="system-ui" opacity=".8">g/L</text>'
    '<circle cx="158" cy="278" r="13" fill="#333"/>'
    '<circle cx="200" cy="284" r="13" fill="#FF2D55"/>'
    '<circle cx="242" cy="278" r="13" fill="#333"/>'
    '<path d="M312 118 C312 97 328 87 328 108 C328 124 312 130 312 118Z" fill="#FF2D55"/>'
    '<ellipse cx="328" cy="148" rx="19" ry="30" fill="#FFDBB5"/>'
    '<circle cx="328" cy="120" r="6" fill="#FF2D55"/>'
    '<path d="M295 204 L306 188 L318 198 L330 178 L342 183 L354 168" stroke="#34C759" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
    '<rect x="75" y="158" width="42" height="84" rx="9" fill="#34C759" opacity=".14"/>'
    '<text x="96" y="206" font-size="10" fill="#34C759" text-anchor="middle" font-family="system-ui">Normal</text>',
    "Mesure glycémie"
),

"mesure-tension": w(
    '<circle cx="200" cy="200" r="148" fill="#FFF0F0"/>'
    '<rect x="158" y="128" width="84" height="164" rx="42" fill="#FFDBB5"/>'
    '<rect x="138" y="194" width="124" height="68" rx="16" fill="#0A84FF"/>'
    '<path d="M262 228 Q294 228 294 172 Q294 140 252 140" stroke="#0A84FF" stroke-width="7" fill="none" stroke-linecap="round"/>'
    '<rect x="252" y="108" width="94" height="68" rx="13" fill="#1C1C1E"/>'
    '<rect x="260" y="116" width="78" height="44" rx="9" fill="#333"/>'
    '<text x="299" y="140" font-size="18" font-weight="bold" fill="#34C759" text-anchor="middle" font-family="system-ui">120</text>'
    '<text x="299" y="157" font-size="12" fill="#8E8E93" text-anchor="middle" font-family="system-ui">/80</text>'
    '<path d="M55 262 L76 262 L87 242 L103 288 L122 242 L138 262 L158 262" stroke="#FF2D55" stroke-width="4.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
    '<path d="M204 88 C204 76 188 70 188 82 C188 70 172 76 172 88 C172 104 188 118 188 118 C188 118 204 104 204 88Z" fill="#FF2D55"/>',
    "Tension artérielle"
),

"mesure-poids": w(
    '<circle cx="200" cy="200" r="148" fill="#F0FFF4"/>'
    '<ellipse cx="200" cy="292" rx="104" ry="20" fill="#E0E0E0"/>'
    '<rect x="184" y="252" width="32" height="46" rx="6" fill="#8E8E93"/>'
    '<ellipse cx="200" cy="260" rx="92" ry="21" fill="#1C1C1E"/>'
    '<ellipse cx="200" cy="254" rx="92" ry="21" fill="#333"/>'
    '<rect x="170" y="222" width="60" height="36" rx="9" fill="#0A84FF"/>'
    '<text x="200" y="245" font-size="16" font-weight="bold" fill="white" text-anchor="middle" font-family="system-ui">72 kg</text>'
    '<circle cx="200" cy="128" r="36" fill="#FFDBB5"/>'
    '<ellipse cx="200" cy="104" rx="36" ry="15" fill="#5A3825"/>'
    '<ellipse cx="200" cy="196" rx="40" ry="55" fill="#34C759"/>'
    '<path d="M177 244 L164 282" stroke="#34C759" stroke-width="16" fill="none" stroke-linecap="round"/>'
    '<path d="M223 244 L236 282" stroke="#34C759" stroke-width="16" fill="none" stroke-linecap="round"/>'
    '<ellipse cx="161" cy="287" rx="13" ry="8" fill="#FFDBB5"/>'
    '<ellipse cx="239" cy="287" rx="13" ry="8" fill="#FFDBB5"/>'
    '<path d="M188 136 Q200 148 212 136" stroke="#555" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
    '<path d="M160 188 Q128 168 122 188" stroke="#34C759" stroke-width="15" fill="none" stroke-linecap="round"/>'
    '<path d="M240 188 Q272 168 278 188" stroke="#34C759" stroke-width="15" fill="none" stroke-linecap="round"/>',
    "Mesure poids"
),

"mesure-spo2": w(
    '<circle cx="200" cy="200" r="148" fill="#E8FFF8"/>'
    '<path d="M200 148 Q200 128 200 108" stroke="#5AC8FA" stroke-width="5.5" fill="none" stroke-linecap="round"/>'
    '<path d="M200 118 Q168 118 148 148 Q128 180 138 222 Q148 252 174 258 Q196 263 200 242" fill="#5AC8FA" opacity=".38"/>'
    '<path d="M200 118 Q168 118 148 148 Q128 180 138 222 Q148 252 174 258 Q196 263 200 242" stroke="#0A84FF" stroke-width="3.5" fill="none"/>'
    '<path d="M200 118 Q232 118 252 148 Q272 180 262 222 Q252 252 226 258 Q204 263 200 242" fill="#5AC8FA" opacity=".38"/>'
    '<path d="M200 118 Q232 118 252 148 Q272 180 262 222 Q252 252 226 258 Q204 263 200 242" stroke="#0A84FF" stroke-width="3.5" fill="none"/>'
    '<circle cx="164" cy="185" r="13" fill="white" stroke="#5AC8FA" stroke-width="2.5"/>'
    '<text x="164" y="190" font-size="9.5" fill="#0A84FF" text-anchor="middle" font-family="system-ui" font-weight="bold">O2</text>'
    '<circle cx="236" cy="175" r="13" fill="white" stroke="#5AC8FA" stroke-width="2.5"/>'
    '<text x="236" y="180" font-size="9.5" fill="#0A84FF" text-anchor="middle" font-family="system-ui" font-weight="bold">O2</text>'
    '<rect x="292" y="198" width="72" height="104" rx="22" fill="#1C1C1E"/>'
    '<rect x="300" y="213" width="56" height="57" rx="11" fill="#0A84FF" opacity=".9"/>'
    '<text x="328" y="242" font-size="19" font-weight="bold" fill="white" text-anchor="middle" font-family="system-ui">98</text>'
    '<text x="328" y="260" font-size="11" fill="white" text-anchor="middle" font-family="system-ui" opacity=".8">SpO2 %</text>'
    '<ellipse cx="328" cy="198" rx="21" ry="15" fill="#FFDBB5"/>'
    '<circle cx="78" cy="238" r="30" fill="#34C759" opacity=".14"/>'
    '<path d="M66 238 L75 248 L92 228" stroke="#34C759" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    "Saturation SpO2"
),

"mesure-cardio": w(
    '<circle cx="200" cy="200" r="148" fill="#FFF0F3"/>'
    '<rect x="55" y="222" width="290" height="104" rx="17" fill="white"/>'
    '<path d="M65 272 L102 272 L113 246 L129 302 L148 236 L164 272 L202 272 L213 252 L224 257 L238 272 L272 272 L282 252 L292 257 L304 272 L335 272" stroke="#FF2D55" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
    '<path d="M236 160 C236 138 214 128 214 148 C214 128 192 138 192 160 C192 186 214 204 214 204 C214 204 236 186 236 160Z" fill="#FF2D55"/>'
    '<rect x="58" y="98" width="124" height="94" rx="15" fill="#1C1C1E"/>'
    '<rect x="66" y="106" width="108" height="74" rx="10" fill="#333"/>'
    '<path d="M74 143 L90 143 L98 129 L110 158 L120 127 L128 143 L157 143 L165 134 L170 143" stroke="#34C759" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
    '<text x="120" y="194" font-size="14" font-weight="bold" fill="#FF2D55" text-anchor="middle" font-family="system-ui">72 bpm</text>'
    '<path d="M314 128 C314 120 304 116 304 124 C304 116 294 120 294 128 C294 138 304 147 304 147 C304 147 314 138 314 128Z" fill="#FF2D55" opacity=".55"/>'
    '<path d="M362 165 C362 158 354 154 354 161 C354 154 346 158 346 165 C346 174 354 182 354 182 C354 182 362 174 362 165Z" fill="#FF2D55" opacity=".42"/>',
    "Fréquence cardiaque"
),

"profile-hero": w(
    '<circle cx="200" cy="200" r="148" fill="#F0F4FF"/>'
    '<rect x="78" y="128" width="244" height="204" rx="22" fill="white"/>'
    '<rect x="78" y="128" width="244" height="82" rx="22" fill="#0A84FF"/>'
    '<rect x="78" y="168" width="244" height="42" fill="#0A84FF"/>'
    '<circle cx="200" cy="174" r="42" fill="white"/>'
    '<circle cx="200" cy="160" r="27" fill="#FFDBB5"/>'
    '<ellipse cx="200" cy="137" rx="27" ry="13" fill="#5A3825"/>'
    '<ellipse cx="200" cy="185" rx="33" ry="22" fill="#0A84FF" opacity=".28"/>'
    '<rect x="138" y="228" width="124" height="13" rx="6.5" fill="#E0E0E0"/>'
    '<rect x="158" y="248" width="84" height="11" rx="5.5" fill="#F2F2F7"/>'
    '<rect x="93" y="270" width="62" height="42" rx="11" fill="#F2F2F7"/>'
    '<rect x="169" y="270" width="62" height="42" rx="11" fill="#F2F2F7"/>'
    '<rect x="245" y="270" width="62" height="42" rx="11" fill="#F2F2F7"/>'
    '<text x="124" y="287" font-size="10" fill="#8E8E93" text-anchor="middle" font-family="system-ui">Score</text>'
    '<text x="124" y="304" font-size="15" font-weight="bold" fill="#0A84FF" text-anchor="middle" font-family="system-ui">85</text>'
    '<text x="200" y="287" font-size="10" fill="#8E8E93" text-anchor="middle" font-family="system-ui">Mesures</text>'
    '<text x="200" y="304" font-size="15" font-weight="bold" fill="#34C759" text-anchor="middle" font-family="system-ui">24</text>'
    '<text x="276" y="287" font-size="10" fill="#8E8E93" text-anchor="middle" font-family="system-ui">Alertes</text>'
    '<text x="276" y="304" font-size="15" font-weight="bold" fill="#FF9500" text-anchor="middle" font-family="system-ui">2</text>'
    '<circle cx="68" cy="148" r="7" fill="#FFD60A"/>'
    '<circle cx="342" cy="262" r="6" fill="#34C759"/>'
    '<circle cx="352" cy="138" r="5" fill="#BF5AF2"/>',
    "Profil utilisateur"
),

"empty-alerts": w(
    '<circle cx="200" cy="200" r="148" fill="#F8FFF8"/>'
    '<path d="M200 98 C163 98 137 130 137 166 L137 222 L116 244 L116 258 L284 258 L284 244 L263 222 L263 166 C263 130 237 98 200 98Z" fill="#34C759" opacity=".78"/>'
    '<ellipse cx="200" cy="262" rx="42" ry="9" fill="#34C759" opacity=".55"/>'
    '<ellipse cx="200" cy="270" rx="20" ry="11" fill="#34C759" opacity=".45"/>'
    '<circle cx="200" cy="168" r="47" fill="white"/>'
    '<path d="M182 168 L196 183 L223 157" stroke="#34C759" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
    '<circle cx="102" cy="128" r="9" fill="#FFD60A"/>'
    '<circle cx="302" cy="118" r="8" fill="#FFD60A"/>'
    '<circle cx="82" cy="272" r="6" fill="#34C759"/>'
    '<circle cx="328" cy="282" r="7" fill="#34C759"/>'
    '<rect x="128" y="295" width="144" height="15" rx="7.5" fill="#34C759" opacity=".18"/>'
    '<rect x="153" y="316" width="94" height="11" rx="5.5" fill="#34C759" opacity=".13"/>',
    "Aucune alerte"
),

"empty-messages": w(
    '<circle cx="200" cy="200" r="148" fill="#F0F8FF"/>'
    '<rect x="88" y="118" width="204" height="134" rx="25" fill="#0A84FF" opacity=".14"/>'
    '<rect x="88" y="118" width="204" height="134" rx="25" stroke="#0A84FF" stroke-width="2.5" fill="none"/>'
    '<path d="M118 252 L96 282 L144 252Z" fill="#0A84FF" opacity=".14"/>'
    '<path d="M118 252 L96 282 L144 252" stroke="#0A84FF" stroke-width="2.5" fill="none"/>'
    '<rect x="113" y="148" width="154" height="13" rx="6.5" fill="#0A84FF" opacity=".24"/>'
    '<rect x="113" y="170" width="122" height="13" rx="6.5" fill="#0A84FF" opacity=".18"/>'
    '<rect x="113" y="192" width="138" height="13" rx="6.5" fill="#0A84FF" opacity=".14"/>'
    '<rect x="113" y="214" width="92" height="13" rx="6.5" fill="#0A84FF" opacity=".1"/>'
    '<rect x="168" y="280" width="164" height="72" rx="21" fill="#34C759" opacity=".11"/>'
    '<rect x="168" y="280" width="164" height="72" rx="21" stroke="#34C759" stroke-width="2" fill="none"/>'
    '<path d="M282 280 L302 258 L267 280Z" fill="#34C759" opacity=".11"/>'
    '<path d="M282 280 L302 258 L267 280" stroke="#34C759" stroke-width="2" fill="none"/>'
    '<circle cx="202" cy="316" r="8" fill="#34C759" opacity=".48"/>'
    '<circle cx="224" cy="316" r="8" fill="#34C759" opacity=".33"/>'
    '<circle cx="246" cy="316" r="8" fill="#34C759" opacity=".2"/>'
    '<circle cx="73" cy="296" r="23" fill="#0A84FF" opacity=".78"/>'
    '<circle cx="73" cy="286" r="12" fill="white" opacity=".65"/>'
    '<ellipse cx="73" cy="304" rx="16" ry="11" fill="white" opacity=".38"/>',
    "Aucun message"
),

"empty-medecin": w(
    '<circle cx="200" cy="200" r="148" fill="#F0F8FF"/>'
    '<circle cx="200" cy="128" r="55" fill="#0A84FF" opacity=".1"/>'
    '<circle cx="200" cy="128" r="55" stroke="#0A84FF" stroke-width="2.5" fill="none" stroke-dasharray="8 5"/>'
    '<path d="M186 115 Q186 104 200 104 Q214 104 214 115" stroke="#0A84FF" stroke-width="4.5" fill="none" stroke-linecap="round"/>'
    '<path d="M186 115 Q183 128 188 138 Q194 147 200 147 Q206 147 212 138 Q217 128 214 115" stroke="#0A84FF" stroke-width="4.5" fill="none" stroke-linecap="round"/>'
    '<circle cx="200" cy="150" r="9" fill="#0A84FF" opacity=".55"/>'
    '<ellipse cx="200" cy="218" rx="52" ry="57" fill="#0A84FF" opacity=".09"/>'
    '<ellipse cx="200" cy="218" rx="52" ry="57" stroke="#0A84FF" stroke-width="2" fill="none" stroke-dasharray="8 5"/>'
    '<path d="M158 198 Q158 188 200 188 Q242 188 242 198 L248 268 Q200 284 152 268Z" fill="white" opacity=".65"/>'
    '<rect x="191" y="200" width="18" height="52" rx="6" fill="#0A84FF" opacity=".45"/>'
    '<rect x="176" y="215" width="48" height="18" rx="6" fill="#0A84FF" opacity=".45"/>'
    '<rect x="118" y="302" width="164" height="46" rx="23" fill="#0A84FF"/>'
    '<text x="200" y="330" font-size="13" font-weight="bold" fill="white" text-anchor="middle" font-family="system-ui">Trouver un medecin</text>'
    '<circle cx="82" cy="168" r="8" fill="#0A84FF" opacity=".2"/>'
    '<circle cx="322" cy="212" r="7" fill="#0A84FF" opacity=".2"/>'
    '<circle cx="92" cy="292" r="6" fill="#5AC8FA" opacity=".28"/>',
    "Aucun médecin lié"
),

}

for name, svg in SVGS.items():
    p = DEST / f"{name}.svg"
    p.write_text(svg, encoding="utf-8")
    print(f"[SVG] {name}.svg  ({len(svg)//1024} Ko)")

print(f"\nTotal: {len(SVGS)} SVGs generes dans {DEST}")
