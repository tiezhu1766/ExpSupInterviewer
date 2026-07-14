"""匹配报告 PDF 生成器（自包含版）。

原实现依赖 .trae/skills/minimax-pdf/scripts/ 下的三个脚本
（palette.py / render_body.py / merge.py）。本文件把这些依赖全部内联，
使模块可独立运行、便于独立部署。
"""

import io
import os
import datetime
import tempfile
from xml.sax.saxutils import escape

from pypdf import PdfReader, PdfWriter

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_JUSTIFY
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame,
    Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, Flowable, KeepTogether, Image as RLImage,
)
from reportlab.lib.styles import ParagraphStyle

from backend.config import settings
from backend.schemas import MatchResponse, ParsedResume


# ══════════════════════════════════════════════════════════════════════════════
# Section 1: 中文字体注册
# ══════════════════════════════════════════════════════════════════════════════

_FONT_REG = "MSYH"
_FONT_BOLD = "MSYH-Bold"
_fonts_registered = False


def _font_available(name: str) -> bool:
    try:
        pdfmetrics.getFont(name)
        return True
    except Exception:
        return False


def _register_cjk_fonts(
    font_regular_path: str | None = None,
    font_bold_path: str | None = None,
):
    global _fonts_registered
    if _fonts_registered:
        return
    reg_path = font_regular_path or settings.pdf.font_regular
    bold_path = font_bold_path or settings.pdf.font_bold
    candidates = [
        (_FONT_REG,  reg_path),
        (_FONT_BOLD, bold_path),
    ]
    fallback = [
        ("SimHei",      "C:/Windows/Fonts/simhei.ttf"),
        ("SimHei-Bold", "C:/Windows/Fonts/simhei.ttf"),
    ]
    for name, path in candidates:
        if os.path.exists(path):
            try:
                pdfmetrics.registerFont(TTFont(name, path))
            except Exception:
                pass
    if not _font_available(_FONT_REG):
        for name, path in fallback:
            if os.path.exists(path):
                try:
                    pdfmetrics.registerFont(TTFont(name, path))
                except Exception:
                    pass
    _fonts_registered = True


def _get_font_names():
    if _font_available(_FONT_REG):
        bold = _FONT_BOLD if _font_available(_FONT_BOLD) else _FONT_REG
        return _FONT_REG, bold
    if _font_available("SimHei"):
        return "SimHei", "SimHei-Bold" if _font_available("SimHei-Bold") else "SimHei"
    return "Helvetica", "Helvetica-Bold"


_matplotlib_ready = False


def _setup_matplotlib_cjk():
    global _matplotlib_ready
    if _matplotlib_ready:
        return
    try:
        import matplotlib
        matplotlib.use("Agg")
        matplotlib.rcParams["font.sans-serif"] = ["Microsoft YaHei", "SimHei", "DejaVu Sans"]
        matplotlib.rcParams["axes.unicode_minus"] = False
        _matplotlib_ready = True
    except Exception:
        pass


# ══════════════════════════════════════════════════════════════════════════════
# Section 2: 设计 token 系统（内联自 palette.py）
# ══════════════════════════════════════════════════════════════════════════════

_PALETTES = {
    "report": {
        "cover_bg":   "#1B2A38",
        "accent":     "#3B6D8A",
        "accent_lt":  "#E6EFF5",
        "text_light": "#EDE9E2",
        "page_bg":    "#FAFAF8",
        "dark":       "#1A1E24",
        "body_text":  "#2C2C30",
        "muted":      "#7A7A84",
        "mood": "authoritative",
    },
    "general": {
        "cover_bg":   "#1F2329",
        "accent":     "#4A6070",
        "accent_lt":  "#E6EAEC",
        "text_light": "#EEEBE5",
        "page_bg":    "#F8F6F2",
        "dark":       "#1A1A1A",
        "body_text":  "#2C2C2C",
        "muted":      "#888888",
        "mood": "neutral",
    },
}

_FONT_PAIRS = {
    "authoritative": {
        "display_rl":  "Times-Bold",
        "body_rl":     "Helvetica",
        "body_b_rl":   "Helvetica-Bold",
    },
    "neutral": {
        "display_rl":  "Times-Bold",
        "body_rl":     "Helvetica",
        "body_b_rl":   "Helvetica-Bold",
    },
}

_SYSTEM_FALLBACK = {
    "display_rl":  "Times-Bold",
    "body_rl":     "Helvetica",
    "body_b_rl":   "Helvetica-Bold",
}


def _hex_to_rgb(h: str) -> tuple:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def _lighten(hex_color: str, factor: float = 0.09) -> str:
    """Blend hex_color toward white (factor = accent weight, 0=white, 1=full color)."""
    r, g, b = _hex_to_rgb(hex_color)
    return "#{:02X}{:02X}{:02X}".format(
        round(r * factor + 255 * (1 - factor)),
        round(g * factor + 255 * (1 - factor)),
        round(b * factor + 255 * (1 - factor)),
    )


def _build_tokens(title: str, doc_type: str, author: str = "", date: str = "",
                  accent_override: str = "") -> dict:
    palette = _PALETTES.get(doc_type, _PALETTES["general"]).copy()
    mood = palette["mood"]
    font_pair = _FONT_PAIRS.get(mood, _SYSTEM_FALLBACK)

    if accent_override:
        palette["accent"]    = accent_override
        palette["accent_lt"] = _lighten(accent_override, 0.09)

    tokens = {
        "title":    title,
        "author":   author,
        "date":     date,
        "doc_type": doc_type,
        "cover_bg":      palette["cover_bg"],
        "accent":        palette["accent"],
        "accent_lt":     palette["accent_lt"],
        "text_light":    palette["text_light"],
        "page_bg":       palette["page_bg"],
        "dark":          palette["dark"],
        "body_text":     palette["body_text"],
        "muted":         palette["muted"],
        "mood":          mood,
        "font_display_rl":  font_pair["display_rl"],
        "font_body_rl":     font_pair["body_rl"],
        "font_body_b_rl":   font_pair["body_b_rl"],
        "font_paths":       {},
        "size_display": 54,
        "size_h1":      22,
        "size_h2":      15,
        "size_h3":      11.5,
        "size_body":    10.5,
        "size_caption": 8.5,
        "size_meta":    8,
        "margin_left":   79,
        "margin_right":  79,
        "margin_top":    79,
        "margin_bottom": 71,
        "section_gap":   26,
        "para_gap":      8,
        "line_gap":      17,
    }
    return tokens


def _pick_accent(overall_score: int) -> str:
    if overall_score >= 70:
        return "#2E5E3A"
    if overall_score >= 40:
        return "#8A6A2A"
    return "#8A2A2A"


def _grade_text(score: int) -> str:
    if score >= 70:
        return "匹配度优秀"
    if score >= 40:
        return "匹配度中等"
    return "匹配度偏低"


# ══════════════════════════════════════════════════════════════════════════════
# Section 3: ReportLab 正文渲染（内联自 render_body.py 核心部分）
# ══════════════════════════════════════════════════════════════════════════════

class _CalloutBox(Flowable):
    """Highlighted insight box: coloured background + 4px left accent bar."""

    def __init__(self, text: str, style, accent: str, bg: str):
        super().__init__()
        self._para   = Paragraph(text, style)
        self._accent = HexColor(accent)
        self._bg     = HexColor(bg)

    def wrap(self, aw, ah):
        self._w = aw
        _, ph = self._para.wrap(aw - 36, ah)
        self._h = ph + 22
        return aw, self._h

    def draw(self):
        c = self.canv
        c.setFillColor(self._bg)
        c.roundRect(0, 0, self._w, self._h, 5, fill=1, stroke=0)
        c.setFillColor(self._accent)
        c.rect(0, 0, 4, self._h, fill=1, stroke=0)
        self._para.drawOn(c, 18, 11)


class _BeautifulDoc(BaseDocTemplate):
    def __init__(self, path: str, tokens: dict, **kw):
        self._t = tokens
        super().__init__(path, **kw)
        fr = Frame(
            self.leftMargin, self.bottomMargin,
            self.width, self.height, id="body",
        )
        tmpl = PageTemplate(id="main", frames=fr, onPage=self._decorate)
        self.addPageTemplates([tmpl])

    def _decorate(self, canv, doc):
        t   = self._t
        lm  = doc.leftMargin
        rm  = doc.rightMargin
        pw  = doc.pagesize[0]
        ph  = doc.pagesize[1]
        top = ph - doc.topMargin

        canv.saveState()

        canv.setStrokeColor(HexColor(t["accent"]))
        canv.setLineWidth(1.5)
        canv.line(lm, top + 12, pw - rm, top + 12)

        canv.setFillColor(HexColor(t["muted"]))
        canv.setFont(t["font_body_rl"], t["size_meta"])
        canv.drawString(lm, top + 16, t["title"].upper())
        canv.drawRightString(pw - rm, top + 16, t.get("date", ""))

        canv.setStrokeColor(HexColor("#DDDDDD"))
        canv.setLineWidth(0.5)
        canv.line(lm, doc.bottomMargin - 12, pw - rm, doc.bottomMargin - 12)

        canv.setFillColor(HexColor(t["muted"]))
        canv.setFont(t["font_body_rl"], t["size_meta"])
        canv.drawString(lm, doc.bottomMargin - 22, t.get("author", ""))
        canv.drawRightString(pw - rm, doc.bottomMargin - 22, str(doc.page))

        canv.restoreState()


def _make_styles(t: dict) -> dict:
    hf  = t["font_display_rl"]
    bf  = t["font_body_rl"]
    bfb = t["font_body_b_rl"]
    dk  = t["body_text"]
    d   = t["dark"]
    mu  = t["muted"]

    return {
        "h1": ParagraphStyle("H1",
            fontName=hf, fontSize=t["size_h1"],
            leading=t["size_h1"] * 1.3,
            textColor=HexColor(d),
            spaceBefore=t["section_gap"], spaceAfter=4,
        ),
        "h2": ParagraphStyle("H2",
            fontName=hf, fontSize=t["size_h2"],
            leading=t["size_h2"] * 1.4,
            textColor=HexColor(d),
            spaceBefore=18, spaceAfter=5,
        ),
        "h3": ParagraphStyle("H3",
            fontName=bfb, fontSize=t["size_h3"],
            leading=t["size_h3"] * 1.5,
            textColor=HexColor(d),
            spaceBefore=12, spaceAfter=3,
        ),
        "body": ParagraphStyle("Body",
            fontName=bf, fontSize=t["size_body"],
            leading=t["line_gap"],
            textColor=HexColor(dk),
            spaceAfter=t["para_gap"], alignment=TA_JUSTIFY,
        ),
        "bullet": ParagraphStyle("Bullet",
            fontName=bf, fontSize=t["size_body"],
            leading=t["line_gap"] - 1,
            textColor=HexColor(dk),
            spaceAfter=4, leftIndent=14,
        ),
        "numbered": ParagraphStyle("Numbered",
            fontName=bf, fontSize=t["size_body"],
            leading=t["line_gap"] - 1,
            textColor=HexColor(dk),
            spaceAfter=4, leftIndent=22, firstLineIndent=-22,
        ),
        "callout": ParagraphStyle("Callout",
            fontName=bfb, fontSize=t["size_body"] + 0.5, leading=16,
            textColor=HexColor(d),
        ),
        "caption": ParagraphStyle("Caption",
            fontName=bf, fontSize=t["size_caption"], leading=13,
            textColor=HexColor(mu), spaceAfter=6,
        ),
        "table_header": ParagraphStyle("TblH",
            fontName=bfb, fontSize=9.5, leading=13,
            textColor=HexColor("#FFFFFF"),
        ),
        "table_cell": ParagraphStyle("TblC",
            fontName=bf, fontSize=9.5, leading=13,
            textColor=HexColor(dk),
        ),
    }


def _divider(accent: str) -> HRFlowable:
    return HRFlowable(
        width="100%", thickness=1.2,
        color=HexColor(accent),
        spaceBefore=14, spaceAfter=14,
    )


def _image_from_bytes(png_bytes: bytes, usable_w: float, max_frac: float = 0.88) -> RLImage:
    img = RLImage(io.BytesIO(png_bytes))
    max_w = usable_w * max_frac
    if img.drawWidth > max_w:
        scale = max_w / img.drawWidth
        img.drawWidth  = max_w
        img.drawHeight = img.drawHeight * scale
    return img


def _render_chart_png(item: dict, accent: str, dpi: int = 150) -> bytes:
    """Render bar/line/pie chart to PNG using matplotlib."""
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import matplotlib.colors as mcolors
    import colorsys
    import numpy as np

    chart_type = item.get("chart_type", "bar")
    title_text = item.get("title", "")
    labels     = item.get("labels", [])
    datasets   = item.get("datasets", [])

    r, g, b = mcolors.to_rgb(accent)
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    palette = [
        colorsys.hsv_to_rgb(
            (h + i * 0.13) % 1.0,
            max(0.35, s - i * 0.08),
            min(0.92, v + i * 0.04),
        )
        for i in range(max(len(datasets), 1))
    ]

    fig, ax = plt.subplots(figsize=(7, 3.6), dpi=dpi)
    fig.patch.set_facecolor("white")
    ax.set_facecolor("white")

    if chart_type == "pie":
        vals   = datasets[0].get("values", []) if datasets else []
        colors = [
            colorsys.hsv_to_rgb(
                (h + i * 0.11) % 1.0,
                max(0.30, s - i * 0.06),
                min(0.92, v + i * 0.03),
            )
            for i in range(len(vals))
        ]
        ax.pie(vals, labels=labels, colors=colors,
               autopct="%1.1f%%", pctdistance=0.82,
               wedgeprops=dict(edgecolor="white", linewidth=1.4),
               textprops=dict(fontsize=8.5))

    for spine in ax.spines.values():
        spine.set_linewidth(0.5)
        spine.set_color("#CCCCCC")
    ax.tick_params(axis="both", length=0, labelsize=8.5)
    if title_text:
        ax.set_title(title_text, fontsize=10, pad=8,
                     color="#333333", fontweight="bold")

    plt.tight_layout(pad=0.4)
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=dpi, bbox_inches="tight",
                facecolor="white", pad_inches=0.06)
    plt.close(fig)
    buf.seek(0)
    return buf.read()


# ── Block renderers ────────────────────────────────────────────────────────────

def _add_heading(story, item, ctx, level):
    key  = f"h{level}"
    para = Paragraph(item["text"], ctx["styles"][key])
    if level == 1:
        story.append(KeepTogether([para, _divider(ctx["acc"])]))
    else:
        story.append(para)


def _add_body(story, item, ctx):
    story.append(Paragraph(item["text"], ctx["styles"]["body"]))


def _add_bullet(story, item, ctx):
    story.append(Paragraph(
        f"\u2022\u2002{item['text']}", ctx["styles"]["bullet"]
    ))


def _add_numbered(story, item, ctx):
    ctx["numbered_n"] += 1
    story.append(Paragraph(
        f"{ctx['numbered_n']}.\u2002{item['text']}",
        ctx["styles"]["numbered"],
    ))


def _add_callout(story, item, ctx):
    story.append(Spacer(1, 8))
    story.append(_CalloutBox(
        item["text"], ctx["styles"]["callout"], ctx["acc"], ctx["acc_lt"]
    ))
    story.append(Spacer(1, 8))


def _add_table(story, item, ctx):
    t        = ctx["tokens"]
    styles   = ctx["styles"]
    usable_w = ctx["usable_w"]
    acc      = ctx["acc"]
    acc_lt   = ctx["acc_lt"]

    headers = [Paragraph(h, styles["table_header"]) for h in item["headers"]]
    rows    = [
        [Paragraph(str(c), styles["table_cell"]) for c in row]
        for row in item.get("rows", [])
    ]
    n_cols = len(item["headers"])

    if "col_widths" in item and len(item["col_widths"]) == n_cols:
        col_w = [usable_w * f for f in item["col_widths"]]
    else:
        col_w = [usable_w / n_cols] * n_cols

    tbl = Table([headers] + rows, colWidths=col_w)
    tbl.setStyle(TableStyle([
        ("BACKGROUND",     (0, 0), (-1,  0), HexColor(acc)),
        ("TEXTCOLOR",      (0, 0), (-1,  0), HexColor("#FFFFFF")),
        ("FONTNAME",       (0, 0), (-1,  0), t["font_body_b_rl"]),
        ("FONTSIZE",       (0, 0), (-1,  0), 9.5),
        ("TOPPADDING",     (0, 0), (-1,  0), 7),
        ("BOTTOMPADDING",  (0, 0), (-1,  0), 7),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1),
         [HexColor("#FFFFFF"), HexColor(acc_lt)]),
        ("FONTNAME",       (0, 1), (-1, -1), t["font_body_rl"]),
        ("FONTSIZE",       (0, 1), (-1, -1), 9.5),
        ("TOPPADDING",     (0, 1), (-1, -1), 6),
        ("BOTTOMPADDING",  (0, 1), (-1, -1), 6),
        ("LEFTPADDING",    (0, 0), (-1, -1), 10),
        ("RIGHTPADDING",   (0, 0), (-1, -1), 10),
        ("BOX",            (0, 0), (-1, -1), 0.5, HexColor("#CCCCCC")),
        ("LINEBELOW",      (0, 0), (-1,  0), 1.2, HexColor(acc)),
        ("TEXTCOLOR",      (0, 1), (-1, -1), HexColor(t["body_text"])),
        ("VALIGN",         (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(tbl)
    story.append(Spacer(1, 12))


def _add_chart(story, item, ctx):
    uw  = ctx["usable_w"]
    try:
        png = _render_chart_png(item, ctx["acc"])
    except Exception:
        story.append(Paragraph(
            "[Chart: install matplotlib to render — pip install matplotlib]",
            ctx["styles"]["caption"],
        ))
        return

    img = _image_from_bytes(png, uw, max_frac=0.95)
    story.append(Spacer(1, 8))
    row_tbl = Table([[img]], colWidths=[uw])
    row_tbl.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER")]))
    story.append(row_tbl)

    raw_cap = item.get("caption", "")
    if raw_cap:
        story.append(Spacer(1, 4))
        story.append(Paragraph(raw_cap, ctx["styles"]["caption"]))
    story.append(Spacer(1, 10))


def _build_story(content: list, tokens: dict, styles: dict) -> list:
    usable_w = A4[0] - tokens["margin_left"] - tokens["margin_right"]

    ctx = {
        "tokens":     tokens,
        "styles":     styles,
        "usable_w":   usable_w,
        "acc":        tokens["accent"],
        "acc_lt":     tokens["accent_lt"],
        "mu":         tokens["muted"],
        "dark":       tokens["dark"],
        "numbered_n": 0,
    }

    story = []
    for item in content:
        kind = item.get("type", "body")
        if kind in ("h1", "h2", "h3", "body", "bullet", "callout", "table",
                    "pagebreak", "spacer", "divider", "caption"):
            ctx["numbered_n"] = 0

        if   kind == "h1":         _add_heading(story, item, ctx, 1)
        elif kind == "h2":         _add_heading(story, item, ctx, 2)
        elif kind == "h3":         _add_heading(story, item, ctx, 3)
        elif kind == "body":       _add_body(story, item, ctx)
        elif kind == "bullet":     _add_bullet(story, item, ctx)
        elif kind == "numbered":   _add_numbered(story, item, ctx)
        elif kind == "callout":    _add_callout(story, item, ctx)
        elif kind == "table":      _add_table(story, item, ctx)
        elif kind == "chart":      _add_chart(story, item, ctx)
        elif kind == "divider":    story.append(_divider(ctx["acc"]))
        elif kind == "pagebreak":  story.append(PageBreak())
        elif kind == "spacer":     story.append(Spacer(1, item.get("pt", 12)))

    return story


def _build_body_pdf(tokens: dict, content: list, out_path: str):
    styles = _make_styles(tokens)
    doc = _BeautifulDoc(
        out_path, tokens,
        pagesize=A4,
        leftMargin=tokens["margin_left"],
        rightMargin=tokens["margin_right"],
        topMargin=tokens["margin_top"],
        bottomMargin=tokens["margin_bottom"],
    )
    doc.build(_build_story(content, tokens, styles))


# ══════════════════════════════════════════════════════════════════════════════
# Section 4: PDF 合并（内联自 merge.py）
# ══════════════════════════════════════════════════════════════════════════════

def _merge_pdfs(cover_path: str, body_path: str, out_path: str, title: str = ""):
    writer = PdfWriter()
    for fpath in (cover_path, body_path):
        reader = PdfReader(fpath)
        for page in reader.pages:
            writer.add_page(page)
    if title:
        writer.add_metadata({"/Title": title})
    os.makedirs(os.path.dirname(os.path.abspath(out_path)) or ".", exist_ok=True)
    with open(out_path, "wb") as f:
        writer.write(f)


# ══════════════════════════════════════════════════════════════════════════════
# Section 5: 封面（Canvas）
# ══════════════════════════════════════════════════════════════════════════════

class _CoverPage:
    def __init__(self, tokens: dict):
        self.t = tokens
        self.W, self.H = A4

    def draw(self, canv, resume_name: str, jd_short: str,
             overall_score: int, match_mode: str):
        t = self.t
        accent = HexColor(t["accent"])
        cover_bg = HexColor(t["cover_bg"])
        text_light = HexColor(t["text_light"])
        muted = HexColor("#8A95A0")

        font_reg, font_bold = _get_font_names()

        canv.setFillColor(cover_bg)
        canv.rect(0, 0, self.W, self.H, fill=1, stroke=0)

        canv.setFillColor(accent)
        for row in range(7):
            for col in range(22):
                x = 50 + col * 24
                y = self.H - 70 - row * 24
                if x < self.W - 50:
                    canv.circle(x, y, 1.6, fill=1, stroke=0)

        canv.setFillColor(text_light)
        canv.setFont(font_bold, 40)
        canv.drawCentredString(self.W / 2, self.H - 260, "简历-JD 匹配报告")

        canv.setFont(font_reg, 15)
        canv.setFillColor(muted)
        canv.drawCentredString(self.W / 2, self.H - 300, f"候选人：{resume_name or '未知'}")

        if jd_short:
            display = jd_short[:50] + ("..." if len(jd_short) > 50 else "")
            canv.setFont(font_reg, 12)
            canv.drawCentredString(self.W / 2, self.H - 325, f"岗位：{display}")

        canv.setFillColor(accent)
        canv.setFont(font_bold, 110)
        canv.drawCentredString(self.W / 2, self.H / 2 - 30, str(overall_score))

        canv.setFillColor(text_light)
        canv.setFont(font_reg, 22)
        canv.drawCentredString(self.W / 2, self.H / 2 - 80, _grade_text(overall_score))

        canv.setFont(font_reg, 11)
        canv.setFillColor(muted)
        canv.drawCentredString(self.W / 2, self.H / 2 - 105, "满分 100 分")

        mode_text = "混合模式（LLM + Embedding）" if match_mode == "hybrid" else "纯 LLM 模式"
        canv.setFont(font_reg, 10)
        label_w = 300
        label_x = (self.W - label_w) / 2
        label_y = self.H / 2 - 150
        canv.setFillColor(HexColor("#2A3A4A"))
        canv.roundRect(label_x, label_y, label_w, 26, 4, fill=1, stroke=0)
        canv.setFillColor(text_light)
        canv.drawCentredString(self.W / 2, label_y + 9, mode_text)

        today = datetime.date.today().strftime("%Y-%m-%d")
        canv.setFont(font_reg, 11)
        canv.setFillColor(muted)
        canv.drawCentredString(self.W / 2, 75, f"生成日期：{today}")

        canv.setFillColor(accent)
        canv.rect(0, 0, self.W, 6, fill=1, stroke=0)


# ══════════════════════════════════════════════════════════════════════════════
# Section 6: Content block 构建
# ══════════════════════════════════════════════════════════════════════════════

def _esc(text) -> str:
    if text is None:
        return ""
    return escape(str(text))


def _status_label(status: str) -> str:
    return {"full": "完全匹配", "partial": "部分匹配", "missing": "缺失"}.get(status, status)


def _build_content(resume: ParsedResume, jd: str, match: MatchResponse) -> list:
    blocks = []

    counts = {"full": 0, "partial": 0, "missing": 0}
    for item in match.items:
        counts[item.status] = counts.get(item.status, 0) + 1
    total = len(match.items)

    blocks.append({"type": "h1", "text": "匹配度概览"})
    overview = (
        f"总分 {match.overallScore}/100 — {_grade_text(match.overallScore)}。"
        f"共分析 {total} 项技能，其中 {counts['full']} 项完全匹配，"
        f"{counts['partial']} 项部分匹配，{counts['missing']} 项缺失。"
    )
    blocks.append({"type": "callout", "text": _esc(overview)})

    if total > 0:
        blocks.append({
            "type": "chart",
            "chart_type": "pie",
            "labels": ["完全匹配", "部分匹配", "缺失"],
            "datasets": [{"values": [counts["full"], counts["partial"], counts["missing"]]}],
            "caption": "技能匹配分布",
        })

    blocks.append({"type": "h1", "text": "技能匹配明细"})
    headers = ["技能", "状态", "得分", "相似度", "建议"]
    rows = []
    for item in match.items:
        sim_str = f"{round(item.similarity * 100)}%" if item.similarity else "-"
        rows.append([
            _esc(item.skill),
            _status_label(item.status),
            f"{item.score}%",
            sim_str,
            _esc(item.suggestion) if item.suggestion else "-",
        ])
    blocks.append({
        "type": "table",
        "headers": headers,
        "rows": rows,
        "col_widths": [0.20, 0.14, 0.10, 0.12, 0.44],
    })

    if match.suggestions:
        blocks.append({"type": "h1", "text": "改进建议"})
        for s in match.suggestions:
            blocks.append({"type": "numbered", "text": _esc(s)})

    blocks.append({"type": "pagebreak"})
    blocks.append({"type": "h1", "text": "岗位要求原文"})
    blocks.append({"type": "body", "text": _esc(jd) if jd else "（未提供岗位要求）"})

    blocks.append({"type": "h1", "text": "候选人简历摘要"})
    blocks.append({"type": "body", "text": f"姓名：{_esc(resume.name or '未知')}"})

    if resume.skills:
        blocks.append({"type": "h3", "text": "技能列表"})
        blocks.append({"type": "body", "text": _esc("、".join(resume.skills))})

    if resume.experiences:
        blocks.append({"type": "h3", "text": "工作经历"})
        for exp in resume.experiences:
            line = f"{exp.company or '未知公司'} · {exp.role or '未知职位'}"
            if exp.duration:
                line += f"（{exp.duration}）"
            blocks.append({"type": "bullet", "text": _esc(line)})

    if resume.projects:
        blocks.append({"type": "h3", "text": "项目经历"})
        for proj in resume.projects:
            line = proj.name or "未命名项目"
            if proj.description:
                line += f" — {proj.description}"
            blocks.append({"type": "bullet", "text": _esc(line)})

    return blocks


# ══════════════════════════════════════════════════════════════════════════════
# Section 7: 公开入口
# ══════════════════════════════════════════════════════════════════════════════

class MatchReportPDF:
    """匹配报告 PDF 生成器入口。"""

    def generate(self, resume: ParsedResume, jd: str,
                 match: MatchResponse) -> io.BytesIO:
        _register_cjk_fonts()
        _setup_matplotlib_cjk()

        font_reg, font_bold = _get_font_names()
        accent = _pick_accent(match.overallScore)

        tokens = _build_tokens(
            title="简历-JD 匹配报告",
            doc_type="report",
            author=resume.name or "候选人",
            date=datetime.date.today().strftime("%Y-%m-%d"),
            accent_override=accent,
        )
        tokens["font_body_rl"] = font_reg
        tokens["font_body_b_rl"] = font_bold
        tokens["font_display_rl"] = font_bold

        content = _build_content(resume, jd, match)

        with tempfile.TemporaryDirectory() as tmpdir:
            body_path = os.path.join(tmpdir, "body.pdf")
            cover_path = os.path.join(tmpdir, "cover.pdf")
            final_path = os.path.join(tmpdir, "final.pdf")

            _build_body_pdf(tokens, content, body_path)

            c = canvas.Canvas(cover_path, pagesize=A4)
            cover = _CoverPage(tokens)
            jd_short = jd[:60] if jd else ""
            cover.draw(c, resume.name or "", jd_short,
                       match.overallScore, match.matchMode)
            c.showPage()
            c.save()

            _merge_pdfs(cover_path, body_path, final_path,
                        title="简历-JD 匹配报告")

            with open(final_path, "rb") as f:
                buffer = io.BytesIO(f.read())

        buffer.seek(0)
        return buffer
