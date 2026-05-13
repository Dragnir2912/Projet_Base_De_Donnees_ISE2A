"""
Génération de rapports PDF patients — Sotera.
Design professionnel, police Poppins (auto-téléchargée au premier appel).
"""
import io
import os
import urllib.request
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, KeepTogether,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ── Dossier polices ──────────────────────────────────────
_HERE     = os.path.dirname(__file__)
FONTS_DIR = os.path.normpath(os.path.join(_HERE, '..', 'static', 'fonts'))
os.makedirs(FONTS_DIR, exist_ok=True)

_FONT_URLS = {
    'Poppins':            'https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Regular.ttf',
    'Poppins-Bold':       'https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Bold.ttf',
    'Poppins-Italic':     'https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Italic.ttf',
    'Poppins-BoldItalic': 'https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-BoldItalic.ttf',
}
_REGISTERED = False


def _register_fonts() -> str:
    """Enregistre Poppins dans ReportLab. Retourne 'Poppins' ou 'Helvetica'."""
    global _REGISTERED
    if _REGISTERED:
        return 'Poppins'
    try:
        for name, url in _FONT_URLS.items():
            path = os.path.join(FONTS_DIR, f'{name}.ttf')
            if not os.path.exists(path):
                urllib.request.urlretrieve(url, path)
            pdfmetrics.registerFont(TTFont(name, path))
        pdfmetrics.registerFontFamily(
            'Poppins',
            normal='Poppins',
            bold='Poppins-Bold',
            italic='Poppins-Italic',
            boldItalic='Poppins-BoldItalic',
        )
        _REGISTERED = True
        return 'Poppins'
    except Exception:
        return 'Helvetica'


# ── Couleurs ─────────────────────────────────────────────
BLUE   = colors.HexColor('#0A84FF')
PURPLE = colors.HexColor('#BF5AF2')
GREEN  = colors.HexColor('#34C759')
ORANGE = colors.HexColor('#FF9500')
RED    = colors.HexColor('#FF2D55')
DARK   = colors.HexColor('#1C1C1E')
GREY1  = colors.HexColor('#8E8E93')
GREY2  = colors.HexColor('#F2F2F7')
GREY3  = colors.HexColor('#E5E5EA')
HEADER = colors.HexColor('#0A0A28')
WHITE  = colors.white

STATUT_C = {'normal': GREEN, 'attention': ORANGE, 'danger': RED}
NIVEAU_C = {'danger': RED, 'attention': ORANGE}

# ── Helpers ───────────────────────────────────────────────

def _fmt(val, fmt='%d/%m/%Y'):
    if val is None:
        return '—'
    try:
        if isinstance(val, datetime):
            return val.strftime(fmt)
        return datetime.fromisoformat(str(val).replace('Z', '').replace(' ', 'T')).strftime(fmt)
    except Exception:
        return str(val)[:10] if val else '—'


def _score_color(s):
    if s is None:   return GREY1
    if s >= 65:     return GREEN
    if s >= 50:     return ORANGE
    return RED


def _score_msg(s):
    if s is None:   return 'Données insuffisantes'
    if s >= 80:     return 'Excellent état général'
    if s >= 65:     return 'Bon état général'
    if s >= 50:     return 'Surveillance recommandée'
    return 'Consultation urgente'


def _P(text, font, size=9, color=DARK, bold=False, italic=False,
       align=TA_LEFT, leading=None, space_before=0, space_after=0):
    fn = font
    if bold and italic:
        fn = f'{font}-BoldItalic' if font == 'Poppins' else 'Helvetica-BoldOblique'
    elif bold:
        fn = f'{font}-Bold' if font == 'Poppins' else 'Helvetica-Bold'
    elif italic:
        fn = f'{font}-Italic' if font == 'Poppins' else 'Helvetica-Oblique'
    return Paragraph(text or '', ParagraphStyle(
        '_', fontName=fn, fontSize=size, textColor=color,
        leading=leading or (size * 1.4), alignment=align,
        spaceBefore=space_before, spaceAfter=space_after,
    ))


def _simple_table(rows, widths, header_bg=BLUE, row_colors=None, extra=None):
    """Table avec en-tête bleu et rangées alternées."""
    t = Table(rows, colWidths=widths, repeatRows=1)
    style = [
        ('BACKGROUND',    (0, 0), (-1, 0),  header_bg),
        ('TEXTCOLOR',     (0, 0), (-1, 0),  WHITE),
        ('FONTSIZE',      (0, 0), (-1, 0),  8),
        ('TOPPADDING',    (0, 0), (-1, 0),  7),
        ('BOTTOMPADDING', (0, 0), (-1, 0),  7),
        ('ROWBACKGROUNDS',(0, 1), (-1, -1), row_colors or [WHITE, GREY2]),
        ('FONTSIZE',      (0, 1), (-1, -1), 8.5),
        ('TOPPADDING',    (0, 1), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
        ('LEFTPADDING',   (0, 0), (-1, -1), 9),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 9),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEBELOW',     (0, 0), (-1, 0),  1.5, BLUE),
        ('LINEBELOW',     (0, 1), (-1, -2), 0.3, GREY3),
    ]
    if extra:
        style.extend(extra)
    t.setStyle(TableStyle(style))
    return t


def _section(title: str, font: str):
    """En-tête de section avec texte bleu."""
    return [
        Spacer(1, 6),
        _P(f'▌  {title.upper()}', font, size=9.5, color=BLUE, bold=True, space_after=5),
    ]


# ════════════════════════════════════════════════════════
#  GÉNÉRATION PRINCIPALE
# ════════════════════════════════════════════════════════

def generer_rapport(medecin, patient_data: dict) -> bytes:
    F = _register_fonts()   # 'Poppins' ou 'Helvetica'
    FB = f'{F}-Bold'        # variante bold
    FI = f'{F}-Italic'      # variante italic

    buf = io.BytesIO()
    W, H  = A4
    MH, MV = 1.8 * cm, 1.5 * cm
    CW = W - 2 * MH           # largeur utile

    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=MH, rightMargin=MH,
        topMargin=MV,  bottomMargin=MV,
    )

    p     = patient_data.get('patient', {})
    vs    = patient_data.get('vitascore', {}) or {}
    score = vs.get('score')
    items = []

    # ══════════════════════════════════════════════════════
    #  EN-TÊTE SOMBRE
    # ══════════════════════════════════════════════════════
    hdr = Table([[
        _P('SOTERA', F, size=22, color=WHITE, bold=True, leading=26),
        _P(f'Dr {medecin.prenom} {medecin.nom}\nRapport médical · {_fmt(datetime.now(), "%d/%m/%Y %H:%M")}',
           F, size=8.5, color=colors.HexColor('#A0C4FF'), align=TA_RIGHT, leading=13),
    ]], colWidths=[CW * 0.55, CW * 0.45])
    hdr.setStyle(TableStyle([
        ('BACKGROUND',    (0, 0), (-1, -1), HEADER),
        ('LEFTPADDING',   (0, 0), (-1, -1), 16),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 16),
        ('TOPPADDING',    (0, 0), (-1, -1), 16),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 16),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('ROUNDEDCORNERS', [6]),
    ]))
    items.append(hdr)
    items.append(Spacer(1, 10))

    # ══════════════════════════════════════════════════════
    #  PATIENT  +  VITASCORE (2 colonnes)
    # ══════════════════════════════════════════════════════
    sc   = score
    scol = _score_color(sc)

    def _info(label, val):
        return [
            _P(label, F, size=7, color=GREY1, bold=True),
            _P(str(val) if val else '—', F, size=9, color=DARK, bold=True),
        ]

    pat_info = Table([
        _info('NOM COMPLET', f"{p.get('prenom', '')} {p.get('nom', '')}"),
        _info('ÂGE',         f"{p.get('age')} ans" if p.get('age') else '—'),
        _info('TAILLE',      f"{p.get('taille_cm')} cm" if p.get('taille_cm') else '—'),
        _info('EMAIL',       p.get('email', '—')),
    ], colWidths=[2.8*cm, 6.5*cm])
    pat_info.setStyle(TableStyle([
        ('TOPPADDING',    (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('LEFTPADDING',   (0, 0), (-1, -1), 0),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 0),
        ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
    ]))

    # Card patient
    pat_card = Table([
        [_P('PATIENT', F, size=7, color=BLUE, bold=True, space_after=4)],
        [pat_info],
    ], colWidths=[9.5*cm])
    pat_card.setStyle(TableStyle([
        ('BOX',           (0, 0), (-1, -1), 0.5, GREY3),
        ('LEFTPADDING',   (0, 0), (-1, -1), 12),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 12),
        ('TOPPADDING',    (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('BACKGROUND',    (0, 0), (-1, -1), WHITE),
        ('ROUNDEDCORNERS', [6]),
    ]))

    # Card VitaScore
    vs_card = Table([
        [_P('VITASCORE', F, size=7, color=BLUE, bold=True, align=TA_CENTER)],
        [_P(str(sc) if sc is not None else '—', F, size=36, color=scol, bold=True, align=TA_CENTER, leading=40)],
        [_P('/100', F, size=8, color=GREY1, align=TA_CENTER)],
        [Spacer(1, 4)],
        [_P(_score_msg(sc), F, size=8.5, color=DARK, bold=True, align=TA_CENTER)],
    ], colWidths=[6.8*cm])
    vs_card.setStyle(TableStyle([
        ('BOX',           (0, 0), (-1, -1), 0.5, GREY3),
        ('BACKGROUND',    (0, 0), (-1, -1), GREY2),
        ('LEFTPADDING',   (0, 0), (-1, -1), 10),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 10),
        ('TOPPADDING',    (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('ALIGN',         (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
        ('ROUNDEDCORNERS', [6]),
    ]))

    # Rangée côte à côte
    side = Table(
        [[pat_card, Spacer(8, 1), vs_card]],
        colWidths=[9.5*cm, 0.5*cm, CW - 10*cm],
    )
    side.setStyle(TableStyle([
        ('VALIGN',        (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING',   (0, 0), (-1, -1), 0),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 0),
        ('TOPPADDING',    (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    items.append(side)

    # ══════════════════════════════════════════════════════
    #  INDICATEURS DE SANTÉ
    # ══════════════════════════════════════════════════════
    mesures = patient_data.get('dernieres_mesures') or []
    if mesures:
        items += _section('Indicateurs de santé', F)

        def _statut_p(s):
            labels = {'normal': '✓  Normal', 'attention': '⚠  Attention', 'danger': '✗  Danger'}
            return _P(labels.get(s, s), F, size=8, color=STATUT_C.get(s, GREY1), bold=True)

        rows = [[
            _P('INDICATEUR',  F, size=8, color=WHITE, bold=True),
            _P('VALEUR',      F, size=8, color=WHITE, bold=True, align=TA_RIGHT),
            _P('UNITÉ',       F, size=8, color=WHITE, bold=True),
            _P('STATUT',      F, size=8, color=WHITE, bold=True),
            _P('DERNIÈRE MESURE', F, size=8, color=WHITE, bold=True),
        ]]
        for m in mesures:
            rows.append([
                _P(m.get('type_nom', ''), F, size=8.5, color=DARK, bold=True),
                _P(str(m.get('derniere_valeur', '—')), F, size=9, color=DARK, bold=True, align=TA_RIGHT),
                _P(m.get('type_unite', ''), F, size=8, color=GREY1),
                _statut_p(m.get('statut', 'normal')),
                _P(_fmt(m.get('derniere_date')), F, size=8, color=GREY1),
            ])

        tbl = _simple_table(rows, [4.5*cm, 2.2*cm, 1.8*cm, 2.8*cm, 5.8*cm],
                            extra=[('ALIGN', (1, 0), (1, -1), 'RIGHT')])
        items.append(tbl)

    # ══════════════════════════════════════════════════════
    #  ALERTES ACTIVES
    # ══════════════════════════════════════════════════════
    alertes = [a for a in (patient_data.get('alertes') or []) if not a.get('vue', True)]
    if alertes:
        items += _section('Alertes actives', F)
        rows = [[
            _P('NIVEAU',  F, size=8, color=WHITE, bold=True),
            _P('MESSAGE', F, size=8, color=WHITE, bold=True),
            _P('DATE',    F, size=8, color=WHITE, bold=True),
        ]]
        for a in alertes[:8]:
            niv   = a.get('niveau', '')
            label = {'danger': '✗  DANGER', 'attention': '⚠  ATTENTION'}.get(niv, niv.upper())
            rows.append([
                _P(label, F, size=8, color=NIVEAU_C.get(niv, ORANGE), bold=True),
                _P(a.get('message', ''), F, size=8.5, color=DARK),
                _P(_fmt(a.get('created_at'), '%d/%m/%Y %H:%M'), F, size=8, color=GREY1),
            ])
        tbl = _simple_table(rows, [2.6*cm, 10.7*cm, 3.8*cm])
        items.append(tbl)

    # ══════════════════════════════════════════════════════
    #  CONSULTATIONS
    # ══════════════════════════════════════════════════════
    consultations = patient_data.get('consultations') or []
    if consultations:
        items += _section('Consultations', F)

        for c in consultations[:8]:
            s       = c.get('statut', 'redige')
            s_color = GREEN if s == 'valide' else BLUE
            s_label = {'redige': 'Rédigé', 'valide': 'Validé', 'archive': 'Archivé'}.get(s, s.capitalize())

            # En-tête consultation : date + statut
            c_header = Table([[
                _P(_fmt(c.get('date_consultation'), '%d %B %Y'), F, size=9.5, color=DARK, bold=True),
                _P(s_label, F, size=7.5, color=s_color, bold=True, align=TA_RIGHT),
            ]], colWidths=[CW - 3*cm, 3*cm])
            c_header.setStyle(TableStyle([
                ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
                ('LEFTPADDING',   (0, 0), (-1, -1), 12),
                ('RIGHTPADDING',  (0, 0), (-1, -1), 12),
                ('TOPPADDING',    (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('BACKGROUND',    (0, 0), (-1, -1), GREY2),
            ]))

            # Corps consultation
            body_rows = []
            if c.get('diagnostic'):
                body_rows.append([_P('DIAGNOSTIC', F, size=7, color=GREY1, bold=True)])
                body_rows.append([_P(c['diagnostic'], F, size=8.5, color=DARK)])
            if c.get('recommandations'):
                body_rows.append([_P('RECOMMANDATIONS', F, size=7, color=GREY1, bold=True, space_before=4)])
                body_rows.append([_P(c['recommandations'], F, size=8.5, color=DARK)])

            card_parts = [c_header]

            if body_rows:
                c_body = Table(body_rows, colWidths=[CW])
                c_body.setStyle(TableStyle([
                    ('LEFTPADDING',   (0, 0), (-1, -1), 12),
                    ('RIGHTPADDING',  (0, 0), (-1, -1), 12),
                    ('TOPPADDING',    (0, 0), (-1, -1), 4),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                    ('BACKGROUND',    (0, 0), (-1, -1), WHITE),
                ]))
                card_parts.append(c_body)

            # Encadrement de la carte complète
            wrapper = Table([[part] for part in card_parts], colWidths=[CW])
            wrapper.setStyle(TableStyle([
                ('BOX',           (0, 0), (-1, -1), 0.5, GREY3),
                ('LINEBEFORE',    (0, 0), (0, -1), 3,   s_color),
                ('TOPPADDING',    (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
                ('LEFTPADDING',   (0, 0), (-1, -1), 0),
                ('RIGHTPADDING',  (0, 0), (-1, -1), 0),
                ('ROUNDEDCORNERS', [4]),
            ]))
            items.append(KeepTogether([wrapper, Spacer(1, 6)]))

    # ══════════════════════════════════════════════════════
    #  ANNOTATIONS
    # ══════════════════════════════════════════════════════
    annotations = patient_data.get('annotations') or []
    if annotations:
        items += _section('Annotations médicales', F)
        rows = [[
            _P('MESURE',      F, size=8, color=WHITE, bold=True),
            _P('VALEUR',      F, size=8, color=WHITE, bold=True, align=TA_RIGHT),
            _P('DATE',        F, size=8, color=WHITE, bold=True),
            _P('COMMENTAIRE', F, size=8, color=WHITE, bold=True),
        ]]
        for a in annotations[:12]:
            rows.append([
                _P(a.get('type_mesure', ''), F, size=8.5, color=DARK, bold=True),
                _P(f"{a.get('valeur', '')} {a.get('unite', '')}".strip(), F, size=9, color=DARK, bold=True, align=TA_RIGHT),
                _P(_fmt(a.get('date_mesure')), F, size=8, color=GREY1),
                _P(a.get('commentaire', ''), F, size=8.5, color=PURPLE, italic=True),
            ])
        tbl = _simple_table(rows, [3.2*cm, 2.5*cm, 2.5*cm, 8.9*cm],
                            extra=[('ALIGN', (1, 0), (1, -1), 'RIGHT')])
        items.append(tbl)

    # ══════════════════════════════════════════════════════
    #  PIED DE PAGE
    # ══════════════════════════════════════════════════════
    items.append(Spacer(1, 14))
    items.append(HRFlowable(width='100%', thickness=0.5, color=GREY3))
    items.append(Spacer(1, 5))
    footer = Table([[
        _P(f'Dr {medecin.prenom} {medecin.nom}  ·  {_fmt(datetime.now(), "%d/%m/%Y %H:%M")}',
           F, size=7, color=GREY1),
        _P('Sotera — Application de suivi médical confidentiel',
           F, size=7, color=GREY1, align=TA_RIGHT),
    ]], colWidths=[CW / 2, CW / 2])
    footer.setStyle(TableStyle([
        ('TOPPADDING',    (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING',   (0, 0), (-1, -1), 0),
        ('RIGHTPADDING',  (0, 0), (-1, -1), 0),
        ('VALIGN',        (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    items.append(footer)

    doc.build(items)
    return buf.getvalue()
