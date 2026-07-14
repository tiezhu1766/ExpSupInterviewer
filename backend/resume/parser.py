from io import BytesIO

import pdfplumber
from pypdf import PdfReader

from backend.llm.pydantic_agents import parse_resume_with_ai
from backend.schemas import ParsedResume

SUPPORTED_EXTENSIONS = {".pdf", ".txt", ".md", ".docx"}


async def parse_resume_text(text: str) -> ParsedResume:
    return await parse_resume_with_ai(text)


async def parse_resume_pdf(content: bytes) -> ParsedResume:
    text = extract_pdf_text(content)
    return await parse_resume_text(text)


async def parse_resume_docx(content: bytes) -> ParsedResume:
    text = extract_docx_text(content)
    return await parse_resume_text(text)


async def parse_resume_file(content: bytes, filename: str) -> ParsedResume:
    """根据文件扩展名自动选择解析器。"""
    ext = _get_extension(filename)
    if ext == ".pdf":
        return await parse_resume_pdf(content)
    if ext == ".docx":
        return await parse_resume_docx(content)
    if ext in (".txt", ".md"):
        return await parse_resume_text(content.decode("utf-8", errors="replace"))
    raise ValueError(f"Unsupported file type: {ext}")


def _get_extension(filename: str) -> str:
    dot = filename.rfind(".")
    return filename[dot:].lower() if dot != -1 else ""


def extract_pdf_text(content: bytes) -> str:
    try:
        return _extract_with_pdfplumber(content)
    except Exception:
        return _extract_with_pypdf(content)


def extract_docx_text(content: bytes) -> str:
    from docx import Document

    doc = Document(BytesIO(content))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip()).strip()


def _extract_with_pdfplumber(content: bytes) -> str:
    text_parts: list[str] = []
    with pdfplumber.open(BytesIO(content)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts).strip()


def _extract_with_pypdf(content: bytes) -> str:
    reader = PdfReader(BytesIO(content))
    text_parts: list[str] = []
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text_parts.append(page_text)
    return "\n".join(text_parts).strip()
