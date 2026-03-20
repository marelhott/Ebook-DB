import base64
from datetime import UTC, datetime
from email.message import EmailMessage
from html import unescape
import hashlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import re
import smtplib
import threading
import time
from urllib.parse import quote, unquote
from urllib.request import Request, urlopen

from ebooklib import ITEM_DOCUMENT, epub


HOST = os.getenv("WORKER_HOST", "0.0.0.0")
PORT = int(os.getenv("WORKER_PORT", "8000"))
PUBLIC_BASE_URL = os.getenv("PUBLIC_BASE_URL", f"http://localhost:{PORT}")

UPLOAD_ROOT = Path(os.getenv("UPLOAD_ROOT", "./data/uploads"))
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)

CATALOG_PATH = Path(os.getenv("CATALOG_PATH", "./data/catalog.json"))
CATALOG_PATH.parent.mkdir(parents=True, exist_ok=True)

DELIVERY_JOBS_PATH = Path(os.getenv("DELIVERY_JOBS_PATH", "./data/delivery-jobs.json"))
DELIVERY_JOBS_PATH.parent.mkdir(parents=True, exist_ok=True)

TRANSLATION_JOBS_PATH = Path(os.getenv("TRANSLATION_JOBS_PATH", "./data/translation-jobs.json"))
TRANSLATION_JOBS_PATH.parent.mkdir(parents=True, exist_ok=True)

TRANSLATION_OUTPUT_ROOT = Path(os.getenv("TRANSLATION_OUTPUT_ROOT", "./data/translations"))
TRANSLATION_OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)

INTELLIGENCE_BOOK_ROOT = Path(os.getenv("INTELLIGENCE_BOOK_ROOT", "./data/intelligence/books"))
INTELLIGENCE_BOOK_ROOT.mkdir(parents=True, exist_ok=True)

INTELLIGENCE_AUTHOR_ROOT = Path(os.getenv("INTELLIGENCE_AUTHOR_ROOT", "./data/intelligence/authors"))
INTELLIGENCE_AUTHOR_ROOT.mkdir(parents=True, exist_ok=True)

RECOMMENDATION_BOOK_ROOT = Path(os.getenv("RECOMMENDATION_BOOK_ROOT", "./data/recommendations/books"))
RECOMMENDATION_BOOK_ROOT.mkdir(parents=True, exist_ok=True)

RECOMMENDATION_AUTHOR_ROOT = Path(os.getenv("RECOMMENDATION_AUTHOR_ROOT", "./data/recommendations/authors"))
RECOMMENDATION_AUTHOR_ROOT.mkdir(parents=True, exist_ok=True)
EXTERNAL_AUTHOR_ROOT = Path(os.getenv("EXTERNAL_AUTHOR_ROOT", "./data/external/authors"))
EXTERNAL_AUTHOR_ROOT.mkdir(parents=True, exist_ok=True)
BOOK_SIGNAL_ROOT = Path(os.getenv("BOOK_SIGNAL_ROOT", "./data/signals/books"))
BOOK_SIGNAL_ROOT.mkdir(parents=True, exist_ok=True)

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USERNAME)
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() != "false"
GENERATOR_VERSION = 7
OPENLIBRARY_BASE_URL = os.getenv("OPENLIBRARY_BASE_URL", "https://openlibrary.org")
OPENLIBRARY_APP_NAME = os.getenv("OPENLIBRARY_APP_NAME", "BookUniverse")
OPENLIBRARY_CONTACT = os.getenv("OPENLIBRARY_CONTACT", "contact@example.org")
DEEPL_API_KEY = os.getenv("DEEPL_API_KEY", "")
DEEPL_API_BASE_URL = os.getenv("DEEPL_API_BASE_URL", "")

FILE_LOCK = threading.Lock()
STOP_WORDS = {
    "the", "and", "for", "with", "that", "this", "from", "into", "your", "their", "they", "them",
    "have", "has", "had", "was", "were", "are", "but", "not", "you", "his", "her", "its", "our",
    "about", "after", "before", "where", "when", "what", "which", "would", "could", "there", "here",
    "alice", "chapter", "book", "books", "very", "down", "said", "little", "one", "came", "must", "know",
    "look", "back", "made", "felt", "thought", "thing", "good", "dear", "project", "gutenberg", "ebook",
    "release", "date", "language", "credits", "updated", "author", "title", "english", "wonderland",
}


def now_iso() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    return value.strip("-") or "untitled"


def normalize_title(value: str) -> str:
    normalized = value.lower()
    normalized = re.sub(r"[\(\)\[\]\{\}:;,.!?\"'`]+", " ", normalized)
    normalized = re.sub(r"\b(the|a|an)\b", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


def strip_html(raw: str) -> str:
    text = re.sub(r"<[^>]+>", " ", raw)
    return re.sub(r"\s+", " ", unescape(text)).strip()


def normalize_source_text(text: str) -> str:
    lines = []
    for line in text.splitlines():
        lowered = line.lower().strip()
        if not lowered:
            continue
        if "project gutenberg" in lowered:
            continue
        if lowered.startswith("release date"):
            continue
        if lowered.startswith("language :") or lowered.startswith("language:"):
            continue
        if lowered.startswith("credits :") or lowered.startswith("credits:"):
            continue
        if lowered.startswith("*** start of the project gutenberg"):
            continue
        lines.append(line)
    normalized = " ".join(lines)
    return re.sub(r"\s+", " ", normalized).strip()


def tokenize(text: str) -> list[str]:
    tokens = re.findall(r"[a-zA-Z]{4,}", text.lower())
    return [token for token in tokens if token not in STOP_WORDS]


def top_terms(text: str, limit: int = 6) -> list[str]:
    counts: dict[str, int] = {}
    for token in tokenize(text):
        counts[token] = counts.get(token, 0) + 1
    ranked = sorted(counts.items(), key=lambda item: (-item[1], item[0]))
    return [token for token, _count in ranked[:limit]]


def split_sentences(text: str) -> list[str]:
    return [part.strip() for part in re.split(r"(?<=[.!?])\s+", text) if part.strip()]


def extract_text_features(text: str) -> dict:
    tokens = tokenize(text)
    sentences = split_sentences(text)
    quoted_segments = re.findall(r"[\"“”‘’']([^\"“”‘’']+)[\"“”‘’']", text)
    quoted_tokens = tokenize(" ".join(quoted_segments))
    unique_tokens = len(set(tokens))
    sentence_lengths = [len(tokenize(sentence)) for sentence in sentences if tokenize(sentence)]
    word_count = len(tokens)
    sentence_count = len(sentences)
    return {
        "word_count": word_count,
        "sentence_count": sentence_count,
        "avg_sentence_words": round(sum(sentence_lengths) / max(1, len(sentence_lengths)), 2),
        "dialogue_ratio": round(len(quoted_tokens) / max(1, word_count), 3),
        "question_density": round(text.count("?") / max(1, sentence_count), 3),
        "exclamation_density": round(text.count("!") / max(1, sentence_count), 3),
        "lexical_diversity": round(unique_tokens / max(1, word_count), 3),
    }


def merge_feature_dicts(feature_dicts: list[dict]) -> dict:
    if not feature_dicts:
        return extract_text_features("")

    numeric_keys = [
        "word_count",
        "sentence_count",
        "avg_sentence_words",
        "dialogue_ratio",
        "question_density",
        "exclamation_density",
        "lexical_diversity",
    ]
    merged: dict[str, float] = {}
    for key in numeric_keys:
        merged[key] = round(sum(float(item.get(key, 0.0)) for item in feature_dicts) / len(feature_dicts), 3)
    merged["word_count"] = int(sum(int(item.get("word_count", 0)) for item in feature_dicts))
    merged["sentence_count"] = int(sum(int(item.get("sentence_count", 0)) for item in feature_dicts))
    return merged


def chapter_signal_terms(chapters: list[dict], limit: int = 6) -> list[str]:
    counts: dict[str, int] = {}
    for chapter in chapters:
        for term in set(chapter.get("key_terms", [])):
            counts[term] = counts.get(term, 0) + 1
    ranked = sorted(counts.items(), key=lambda item: (-item[1], item[0]))
    return [term for term, _count in ranked[:limit]]


def rank_signal_terms(chapters: list[dict], preview_text: str, limit: int = 6) -> list[str]:
    scores: dict[str, float] = {}
    for term in top_terms(preview_text, limit=12):
        scores[term] = scores.get(term, 0.0) + 0.75

    for chapter in chapters:
        title_tokens = tokenize(chapter.get("title", ""))
        excerpt_tokens = chapter.get("key_terms", [])
        feature_weight = 1.0 + float(chapter.get("dialogue_ratio", 0)) + float(chapter.get("question_density", 0)) * 0.4
        for term in set(excerpt_tokens):
            scores[term] = scores.get(term, 0.0) + feature_weight
        for term in set(title_tokens):
            scores[term] = scores.get(term, 0.0) + 1.4

    ranked = sorted(scores.items(), key=lambda item: (-item[1], item[0]))
    return [term for term, _score in ranked[:limit]]


def term_overlap(left: list[str], right: list[str]) -> int:
    return len(set(left) & set(right))


def confidence_label(score: int) -> str:
    if score >= 5:
        return "high"
    if score >= 3:
        return "medium"
    return "low"


def fetch_remote_json(url: str) -> dict | None:
    headers = {"User-Agent": f"{OPENLIBRARY_APP_NAME} ({OPENLIBRARY_CONTACT})"}
    try:
        req = Request(url, headers=headers)
        with urlopen(req, timeout=8) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception:
        return None


def fetch_openlibrary_author_profile(author_name: str) -> dict | None:
    cache_path = EXTERNAL_AUTHOR_ROOT / f"{slugify(author_name)}.json"
    cached = read_json(cache_path)
    if cached and cached.get("known_works") is not None and "/authors/" in cached.get("author_url", ""):
        return cached

    search_url = f"{OPENLIBRARY_BASE_URL}/search/authors.json?q={quote(author_name)}"
    search_payload = fetch_remote_json(search_url)
    if not search_payload or not search_payload.get("docs"):
        return None

    top_match = search_payload["docs"][0]
    author_key = top_match.get("key")
    if not author_key:
        return None
    author_path = author_key if str(author_key).startswith("/authors/") else f"/authors/{author_key}"

    author_payload = fetch_remote_json(f"{OPENLIBRARY_BASE_URL}{author_path}.json") or {}
    works_payload = fetch_remote_json(f"{OPENLIBRARY_BASE_URL}{author_path}/works.json?limit=30") or {}
    works = works_payload.get("entries", []) or []
    bio_value = author_payload.get("bio", "")
    if isinstance(bio_value, dict):
        bio_value = bio_value.get("value", "")

    profile = {
        "source": "Open Library",
        "author_key": author_path.removeprefix("/authors/"),
        "author_url": f"{OPENLIBRARY_BASE_URL}{author_path}",
        "top_work_count": top_match.get("work_count", 0),
        "top_subjects": top_match.get("top_subjects", [])[:6],
        "bio": bio_value,
        "birth_date": author_payload.get("birth_date", ""),
        "death_date": author_payload.get("death_date", ""),
        "notable_works": [entry.get("title") for entry in works if entry.get("title")][:6],
        "known_works": [
            {
                "title": entry.get("title", ""),
                "normalized_title": normalize_title(entry.get("title", "")),
                "key": entry.get("key", ""),
                "first_publish_year": entry.get("first_publish_year"),
                "subjects": (entry.get("subject") or [])[:5],
            }
            for entry in works
            if entry.get("title")
        ],
    }
    write_json(cache_path, profile)
    return profile


def get_deepl_base_url() -> str:
    if DEEPL_API_BASE_URL:
        return DEEPL_API_BASE_URL.rstrip("/")
    if DEEPL_API_KEY.endswith(":fx"):
        return "https://api-free.deepl.com"
    return "https://api.deepl.com"


def translate_with_deepl(texts: list[str], target_language: str, source_language: str = "", context_text: str = "") -> list[str] | None:
    if not DEEPL_API_KEY or not texts:
        return None

    payload: dict[str, object] = {
        "text": texts,
        "target_lang": target_language.upper(),
    }
    if source_language:
        payload["source_lang"] = source_language.upper()
    if context_text:
        payload["context"] = context_text[:4000]

    body = json.dumps(payload).encode("utf-8")
    headers = {
        "Authorization": f"DeepL-Auth-Key {DEEPL_API_KEY}",
        "Content-Type": "application/json",
        "User-Agent": f"{OPENLIBRARY_APP_NAME} ({OPENLIBRARY_CONTACT})",
    }

    try:
        req = Request(f"{get_deepl_base_url()}/v2/translate", data=body, headers=headers, method="POST")
        with urlopen(req, timeout=20) as response:
            parsed = json.loads(response.read().decode("utf-8"))
    except Exception:
        return None

    translations = parsed.get("translations", [])
    return [item.get("text", "") for item in translations]


def load_json_list(path: Path) -> list[dict]:
    with FILE_LOCK:
        if not path.exists():
            return []
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return []


def save_json_list(path: Path, items: list[dict]) -> None:
    with FILE_LOCK:
        path.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")


def read_json(path: Path) -> dict | None:
    with FILE_LOCK:
        if not path.exists():
            return None
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return None


def write_json(path: Path, payload: dict) -> None:
    with FILE_LOCK:
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def load_generated_or_refresh(path: Path, generator) -> dict | None:
    payload = read_json(path)
    if payload and payload.get("generator_version") == GENERATOR_VERSION:
        return payload
    return generator()


def get_job_by_id(path: Path, item_id: str) -> dict | None:
    for item in load_json_list(path):
        if item.get("id") == item_id:
            return item
    return None


def update_job(path: Path, item_id: str, updater) -> dict | None:
    items = load_json_list(path)
    updated = None
    for index, item in enumerate(items):
        if item.get("id") != item_id:
            continue
        updated = updater(dict(item))
        items[index] = updated
        break

    if updated is None:
        return None

    save_json_list(path, items)
    return updated


def load_catalog() -> list[dict]:
    return load_json_list(CATALOG_PATH)


def save_catalog(items: list[dict]) -> None:
    save_json_list(CATALOG_PATH, items)


def find_catalog_book_by_slug(work_slug: str) -> dict | None:
    for item in load_catalog():
        if item.get("slug") == work_slug:
            return item
    return None


def find_catalog_books_by_author(author_slug: str) -> list[dict]:
    return [item for item in load_catalog() if slugify(item.get("author", "")) == author_slug]


def find_catalog_book_by_file_asset_id(file_asset_id: str) -> dict | None:
    if not file_asset_id.startswith("worker-file-"):
        return None
    checksum = file_asset_id.removeprefix("worker-file-")
    for item in load_catalog():
        if item.get("id") == checksum:
            return item
    return None


def build_book_signal_profile(book: dict) -> dict:
    work_slug = book.get("slug", "")
    stored_path = Path(book.get("stored_path", ""))
    preview_text = ""
    chapters: list[dict] = []
    if stored_path.exists():
        try:
            preview_text = extract_epub_preview(stored_path, max_chars=3600)
        except Exception:
            preview_text = ""
        try:
            chapters = extract_epub_chapters(stored_path, max_chapters=10, excerpt_chars=700)
        except Exception:
            chapters = []

    chapter_features = [chapter.get("features", {}) for chapter in chapters if chapter.get("features")]
    aggregate_features = merge_feature_dicts(chapter_features or [extract_text_features(preview_text)])
    signal_terms = rank_signal_terms(chapters, preview_text, limit=8) or top_terms(f"{book.get('title', '')} {preview_text}", limit=8)
    payload = {
        "generator_version": GENERATOR_VERSION,
        "work_slug": work_slug,
        "title": book.get("title", ""),
        "author": book.get("author", ""),
        "language": book.get("language", ""),
        "preview_terms": top_terms(preview_text, limit=10),
        "chapter_terms": chapter_signal_terms(chapters, limit=10),
        "signal_terms": signal_terms,
        "chapter_count": len(chapters),
        "chapter_title_samples": [chapter.get("title", "") for chapter in chapters[:5]],
        **aggregate_features,
    }
    write_json(BOOK_SIGNAL_ROOT / f"{work_slug}.json", payload)
    return payload


def load_book_signal_profile(work_slug: str) -> dict | None:
    path = BOOK_SIGNAL_ROOT / f"{work_slug}.json"
    payload = read_json(path)
    if payload and payload.get("generator_version") == GENERATOR_VERSION:
        return payload
    book = find_catalog_book_by_slug(work_slug)
    if not book:
        return None
    return build_book_signal_profile(book)


def build_translation_output_url(job_id: str) -> str:
    return f"{PUBLIC_BASE_URL}/artifacts/translations/{job_id}.md"


def build_translation_json_url(job_id: str) -> str:
    return f"{PUBLIC_BASE_URL}/artifacts/translations/{job_id}.json"


def extract_book_metadata(epub_path: Path) -> dict:
    book = epub.read_epub(str(epub_path))

    def first_value(key: str) -> str | None:
        values = book.get_metadata("DC", key)
        if not values:
            return None
        value = values[0][0]
        return str(value) if value is not None else None

    return {
        "title": first_value("title"),
        "creator": first_value("creator"),
        "language": first_value("language"),
        "identifier": first_value("identifier"),
    }


def extract_epub_preview(epub_path: Path, max_chars: int = 2400) -> str:
    book = epub.read_epub(str(epub_path))
    chunks: list[str] = []

    for item in book.get_items():
        if item.get_type() != ITEM_DOCUMENT:
            continue
        text = normalize_source_text(strip_html(item.get_body_content().decode("utf-8", errors="ignore")))
        if not text:
            continue
        chunks.append(text)
        if sum(len(chunk) for chunk in chunks) >= max_chars:
            break

    preview = "\n\n".join(chunks)
    return preview[:max_chars].strip()


def extract_epub_chapters(epub_path: Path, max_chapters: int = 8, excerpt_chars: int = 900) -> list[dict]:
    book = epub.read_epub(str(epub_path))
    chapters: list[dict] = []

    for item in book.get_items():
        if item.get_type() != ITEM_DOCUMENT:
            continue
        text = normalize_source_text(strip_html(item.get_body_content().decode("utf-8", errors="ignore")))
        if len(text) < 80:
            continue
        chapter_title = (
            item.get_name().rsplit("/", 1)[-1].rsplit(".", 1)[0].replace("_", " ").replace("-", " ").strip()
            or f"Chapter {len(chapters) + 1}"
        )
        excerpt = text[:excerpt_chars].strip()
        chapter_terms = top_terms(f"{chapter_title} {excerpt}", limit=5)
        features = extract_text_features(excerpt)
        chapters.append(
            {
                "index": len(chapters) + 1,
                "source_item": item.get_name(),
                "title": chapter_title.title(),
                "status": "draft",
                "focus": f"Preserve the tone and terminology around {', '.join(chapter_terms[:2]) or 'the central scene'}.",
                "study_prompt": f"Check how this section handles voice, pacing, and key terms such as {', '.join(chapter_terms[:3]) or 'the main motifs'}.",
                "key_terms": chapter_terms,
                "features": features,
                "word_count": features["word_count"],
                "avg_sentence_words": features["avg_sentence_words"],
                "dialogue_ratio": features["dialogue_ratio"],
                "question_density": features["question_density"],
                "source_excerpt": excerpt,
                "translated_excerpt": f"[Pending translation] {excerpt[: min(280, len(excerpt))]}",
            }
        )
        if len(chapters) >= max_chapters:
            break

    if not chapters:
        preview = extract_epub_preview(epub_path)
        if preview:
            chapters.append(
                {
                    "index": 1,
                    "source_item": "preview",
                    "title": "Full Text Preview",
                    "status": "draft",
                    "focus": "Preserve the central explanatory tone of the preview.",
                    "study_prompt": "Review whether the translated preview keeps terminology and rhythm aligned with the source.",
                    "key_terms": top_terms(preview, limit=5),
                    "source_excerpt": preview,
                    "translated_excerpt": "[Pending translation] " + preview[: min(280, len(preview))],
                }
            )

    return chapters


def generate_book_intelligence(work_slug: str) -> dict | None:
    book = find_catalog_book_by_slug(work_slug)
    if not book:
        return None

    signal_profile = load_book_signal_profile(work_slug) or {}
    signal_terms = signal_profile.get("signal_terms", [])[:6]
    dialogue_ratio = float(signal_profile.get("dialogue_ratio", 0))
    avg_sentence_words = float(signal_profile.get("avg_sentence_words", 0))
    question_density = float(signal_profile.get("question_density", 0))
    lexical_diversity = float(signal_profile.get("lexical_diversity", 0))
    themes = []
    if dialogue_ratio >= 0.12:
        themes.append({"label": "Dialogue-led", "why": "A high share of quoted language suggests a conversational or scene-driven reading experience."})
    if avg_sentence_words >= 13:
        themes.append({"label": "Dense prose", "why": "Longer sentence patterns suggest a more idea-led or syntactically layered style."})
    if question_density >= 0.18:
        themes.append({"label": "Interrogative motion", "why": "Questions recur often enough to shape tone, curiosity, or argumentative rhythm."})
    if lexical_diversity <= 0.48 and signal_profile.get("word_count", 0) > 0:
        themes.append({"label": "Accessible register", "why": "Lower lexical variety points toward a more direct, readable linguistic surface."})
    for term in signal_terms:
        if len(themes) >= 3:
            break
        themes.append(
            {
                "label": term.title(),
                "why": "This term recurs across chapter titles and excerpts, making it a stable study and recommendation signal.",
            }
        )
    if not themes:
        themes = [
            {"label": "Ownership", "why": "The book is already in your managed library and ready for delivery or translation."},
            {"label": "Study workflow", "why": "This work can participate in translation, author study, and recommendation flows."},
        ]

    payload = {
        "generator_version": GENERATOR_VERSION,
        "work_slug": work_slug,
        "one_line_summary": f"Owned {book.get('format', 'book')} by {book.get('author', 'Unknown author')} with strong signals around {', '.join(signal_terms[:2]) or 'study and ownership'}.",
        "deep_summary": (
            f"This generated profile is grounded in imported ownership data, embedded metadata, and a live preview of the owned text. "
            f"It currently reads this book as most useful for readers who care about {', '.join(signal_terms[:3]) or 'long-form study'}."
        ),
        "themes": themes,
        "moods": signal_terms[:3] or ["imported", "owned", "study-ready"],
        "read_if_you_want": signal_terms[:3] or ["personal library control", "translation workflow", "author deep dives"],
        "best_for": ["wireless delivery", "chapter-level translation", "author comparison"],
        "generated_at": now_iso(),
    }
    write_json(INTELLIGENCE_BOOK_ROOT / f"{work_slug}.json", payload)
    return payload


def generate_author_intelligence(author_slug: str) -> dict | None:
    books = find_catalog_books_by_author(author_slug)
    if not books:
        return None

    author_name = books[0].get("author", "Unknown author")
    languages: set[str] = set()
    owned_titles = [book.get("title", "") for book in books if book.get("title")]
    owned_titles_normalized = {normalize_title(title): title for title in owned_titles if normalize_title(title)}
    signal_profiles: list[dict] = []
    for book in books:
        languages.add(book.get("language", "unknown"))
        signal_profile = load_book_signal_profile(book.get("slug", ""))
        if signal_profile:
            signal_profiles.append(signal_profile)
    external_profile = fetch_openlibrary_author_profile(author_name)
    corpus_terms = top_terms(
        " ".join(
            [author_name, *owned_titles, *[" ".join(profile.get("signal_terms", [])) for profile in signal_profiles]]
        ),
        limit=8,
    )
    known_works = external_profile.get("known_works", []) if external_profile else []
    matched: list[dict] = []
    known_not_owned: list[str] = []
    matched_normalized_titles: set[str] = set()
    for work in known_works:
        known_title = work.get("title", "")
        normalized = work.get("normalized_title", "") or normalize_title(known_title)
        if normalized in owned_titles_normalized:
            matched.append(
                {
                    "owned_title": owned_titles_normalized[normalized],
                    "known_title": known_title,
                    "confidence": "normalized",
                }
            )
            matched_normalized_titles.add(normalized)
        else:
            known_not_owned.append(known_title)
    coverage_ratio = round(len(matched) / max(1, len(known_works)), 3) if known_works else 0.0
    recurring_themes = [
        {
            "label": term.title(),
            "why": f"This theme is supported by repeated signals across the owned titles: {', '.join(book.get('title', '') for book in books[:3])}.",
        }
        for term in corpus_terms[:3]
    ]
    if not recurring_themes:
        recurring_themes = [
            {"label": "Owned corpus", "why": "The system can reason about this author from books you actually possess."},
            {"label": "Reading path", "why": "Imported works can be turned into a stable author study path."},
        ]
    payload = {
        "generator_version": GENERATOR_VERSION,
        "author_id": author_slug,
        "one_line_summary": f"{author_name} represented by {len(books)} owned work(s) across {len(languages)} language layer(s) in your managed library.",
        "career_arc": (
            f"Your current corpus suggests an author profile centered on {', '.join(corpus_terms[:3]) or 'study-ready literary signals'}. "
            "This layer is generated from owned books first and can deepen as more editions and bibliography data arrive."
        ),
        "recurring_themes": recurring_themes,
        "entry_points": sorted([book.get("title", "") for book in books if book.get("title")], key=len)[:3],
        "read_next_strategy": (
            f"Start with {sorted([book.get('title', '') for book in books if book.get('title')], key=len)[:1][0] if books else 'the most accessible owned title'}, "
            "then move to the denser or thematically adjacent owned works to build a real author-study path."
        ),
        "open_library_id": external_profile.get("author_key", "") if external_profile else "",
        "bibliography_source": external_profile.get("source", "") if external_profile else "",
        "bibliography_coverage_note": (
            f"You currently own {len(books)} work(s), while {external_profile.get('source', 'the external bibliography')} lists about {external_profile.get('top_work_count', 0)} known work(s)."
            if external_profile
            else f"You currently own {len(books)} work(s); no external bibliography match has been cached yet."
        ),
        "external_work_count": external_profile.get("top_work_count", 0) if external_profile else 0,
        "notable_works": external_profile.get("notable_works", []) if external_profile else [],
        "owned_work_count": len(owned_titles),
        "known_work_count": len(known_works),
        "owned_works": owned_titles[:12],
        "known_works_sample": known_not_owned[:12],
        "coverage_ratio": coverage_ratio,
        "owned_vs_known_map": {
            "matched": matched[:12],
            "owned_unmatched": [
                title for normalized, title in owned_titles_normalized.items() if normalized not in matched_normalized_titles
            ][:12],
            "known_not_owned_sample": known_not_owned[:12],
        },
        "generated_at": now_iso(),
    }
    write_json(INTELLIGENCE_AUTHOR_ROOT / f"{author_slug}.json", payload)
    return payload


def generate_book_recommendations(work_slug: str) -> dict | None:
    anchor = find_catalog_book_by_slug(work_slug)
    if not anchor:
        return None

    anchor_profile = load_book_signal_profile(work_slug) or {}
    anchor_terms = anchor_profile.get("signal_terms", [])[:10]

    items = []
    for item in load_catalog():
        if item.get("slug") == work_slug:
            continue
        other_profile = load_book_signal_profile(item.get("slug", "")) or {}
        other_terms = other_profile.get("signal_terms", [])[:10]
        overlap = term_overlap(anchor_terms, other_terms)
        score = overlap
        reasons = ["already in your managed library", "ready for the same delivery and translation flows"]
        if item.get("author") == anchor.get("author"):
            score += 4
            reasons.insert(0, "same author already present in your owned corpus")
        if item.get("language") == anchor.get("language"):
            score += 1
            reasons.append("same reading language as the anchor book")
        if abs(float(other_profile.get("dialogue_ratio", 0)) - float(anchor_profile.get("dialogue_ratio", 0))) <= 0.05:
            score += 1
            reasons.append("similar dialogue density")
        if overlap:
            reasons.insert(0, f"shared study signals: {', '.join(sorted(set(anchor_terms) & set(other_terms))[:3])}")
        items.append(
            {
                "id": f"worker-book-{item.get('id')}",
                "kind": "book",
                "slug": item.get("slug"),
                "title": item.get("title"),
                "subtitle": item.get("author"),
                "reasons": reasons + ["discovery rail generated from owned books first"],
                "confidence": confidence_label(score),
                "_score": score,
            }
        )
    items = sorted(items, key=lambda item: (-item.get("_score", 0), item.get("title", "")))[:4]
    for item in items:
        item.pop("_score", None)

    payload = {
        "generator_version": GENERATOR_VERSION,
        "id": f"worker-rail-book-{work_slug}",
        "title": f"Because {anchor.get('title')} is already in your owned stack",
        "anchor_kind": "book",
        "anchor_id": work_slug,
        "items": items,
        "generated_at": now_iso(),
    }
    write_json(RECOMMENDATION_BOOK_ROOT / f"{work_slug}.json", payload)
    return payload


def generate_author_recommendations(author_slug: str) -> dict | None:
    books = find_catalog_books_by_author(author_slug)
    if not books:
        return None

    anchor_terms: list[str] = []
    known_not_owned_sample: list[str] = []
    author_intelligence = generate_author_intelligence(author_slug)
    if author_intelligence:
        anchor_terms = top_terms(
            " ".join(
                [*author_intelligence.get("entry_points", []), *[theme.get("label", "") for theme in author_intelligence.get("recurring_themes", [])]]
            ),
            limit=10,
        )
        known_not_owned_sample = author_intelligence.get("owned_vs_known_map", {}).get("known_not_owned_sample", [])

    items = []
    seen_authors = {author_slug}
    for item in load_catalog():
        other_author_slug = slugify(item.get("author", ""))
        if not other_author_slug or other_author_slug in seen_authors:
            continue
        seen_authors.add(other_author_slug)
        other_profile = load_book_signal_profile(item.get("slug", "")) or {}
        other_terms = other_profile.get("signal_terms", [])[:10]
        overlap = sorted(set(anchor_terms) & set(other_terms))
        score = len(overlap)
        reasons = ["already represented in your library", "ready for bibliography and recommendation enrichment"]
        if overlap:
            reasons.insert(0, f"shared thematic signals: {', '.join(overlap[:3])}")
            score += 2
        if item.get("language") in {book.get("language") for book in books}:
            reasons.append("available in a similar reading language layer")
            score += 1
        if known_not_owned_sample and any(normalize_title(item.get("title", "")) == normalize_title(title) for title in known_not_owned_sample):
            reasons.insert(0, "covers a gap in the known bibliography around this author study path")
            score += 2
        items.append(
            {
                "id": f"worker-author-{other_author_slug}",
                "kind": "author",
                "author_id": other_author_slug,
                "title": item.get("author"),
                "subtitle": "Another owned author available for immediate study",
                "reasons": reasons + [f"shares the same delivery and translation surface as {books[0].get('author', 'the anchor author')}"],
                "confidence": confidence_label(score),
                "_score": score,
            }
        )
    items = sorted(items, key=lambda item: (-item.get("_score", 0), item.get("title", "")))[:4]
    for item in items:
        item.pop("_score", None)

    payload = {
        "generator_version": GENERATOR_VERSION,
        "id": f"worker-rail-author-{author_slug}",
        "title": f"Adjacent owned authors to {books[0].get('author', 'this author')}",
        "anchor_kind": "author",
        "anchor_id": author_slug,
        "items": items,
        "generated_at": now_iso(),
    }
    write_json(RECOMMENDATION_AUTHOR_ROOT / f"{author_slug}.json", payload)
    return payload


def get_connector_status() -> dict:
    return {
        "configured": bool(SMTP_HOST and SMTP_FROM),
        "host": SMTP_HOST,
        "port": SMTP_PORT,
        "sender": SMTP_FROM,
        "uses_tls": SMTP_USE_TLS,
        "requires_approved_sender": True,
        "provider": "smtp",
        "missing_fields": [name for name, value in {"SMTP_HOST": SMTP_HOST, "SMTP_FROM": SMTP_FROM}.items() if not value],
    }


def build_translation_document(job_id: str) -> dict | None:
    job = get_job_by_id(TRANSLATION_JOBS_PATH, job_id)
    if not job:
        return None

    book = find_catalog_book_by_file_asset_id(job.get("file_asset_id", "")) or find_catalog_book_by_slug(job.get("work_slug", ""))
    chapter_manifest = read_json(TRANSLATION_OUTPUT_ROOT / f"{job_id}.json") or {}
    chapters = chapter_manifest.get("chapters", [])

    title = book.get("title") if book else job.get("work_slug", "Unknown book")
    author = book.get("author") if book else "Unknown author"
    work_slug = job.get("work_slug", "")

    return {
        "job_id": job_id,
        "work_slug": work_slug,
        "title": title,
        "author": author,
        "source_language": job.get("source_language") or chapter_manifest.get("source_language", "unknown"),
        "target_language": job.get("target_language", "cs"),
        "mode": job.get("mode", "study"),
        "provider": job.get("provider", "deepl-study"),
        "status": job.get("status", "queued"),
        "chapter_count": job.get("chapter_count", chapter_manifest.get("chapter_count", len(chapters))),
        "output_file_url": job.get("output_file_url", ""),
        "output_json_url": job.get("output_json_url", ""),
        "completed_at": job.get("completed_at", ""),
        "failure_reason": job.get("failure_reason", ""),
        "study_goal": chapter_manifest.get("study_goal", "Build a durable translation workspace for long-form study and terminology review."),
        "translation_strategy": chapter_manifest.get("translation_strategy", "Translate chapter by chapter, preserve key terms, then review voice and cadence on a second pass."),
        "terminology_focus": chapter_manifest.get("terminology_focus", []),
        "reading_path": chapter_manifest.get("reading_path", []),
        "back_to_book_url": f"/books/{work_slug}" if work_slug else "/library",
        "back_to_book_label": f"Back to {title}",
        "chapters": chapters,
    }


def send_epub_via_smtp(recipient_email: str, device_name: str, attachment_path: Path, work_title: str) -> None:
    if not SMTP_HOST or not SMTP_FROM:
        raise RuntimeError("SMTP connector is not configured")

    message = EmailMessage()
    message["Subject"] = work_title
    message["From"] = SMTP_FROM
    message["To"] = recipient_email
    message.set_content(
        f"Sending '{work_title}' to {device_name} through the Book Universe delivery connector."
    )
    content = attachment_path.read_bytes()
    message.add_attachment(
        content,
        maintype="application",
        subtype="epub+zip",
        filename=attachment_path.name,
    )

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
        if SMTP_USE_TLS:
            server.starttls()
        if SMTP_USERNAME:
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(message)


def process_delivery_job(job: dict) -> dict:
    def mark_processing(current: dict) -> dict:
        current["status"] = "processing"
        current["failure_reason"] = ""
        return current

    working = update_job(DELIVERY_JOBS_PATH, job["id"], mark_processing) or job
    time.sleep(0.35)

    book = find_catalog_book_by_slug(working["work_slug"])
    if not book:
        return update_job(
            DELIVERY_JOBS_PATH,
            working["id"],
            lambda current: {**current, "status": "failed", "failure_reason": "Source file is not available in worker catalog yet."},
        ) or working

    recipient_email = working.get("device_email") or ""
    if not recipient_email:
        return update_job(
            DELIVERY_JOBS_PATH,
            working["id"],
            lambda current: {**current, "status": "failed", "failure_reason": "Selected device has no send-to-device email configured."},
        ) or working

    if working.get("delivery_method") != "send-to-kindle":
        return update_job(
            DELIVERY_JOBS_PATH,
            working["id"],
            lambda current: {**current, "status": "failed", "failure_reason": "This delivery method is not implemented yet. Kindle send-to-email is first."},
        ) or working

    stored_path = Path(book.get("stored_path", ""))
    if not stored_path.exists():
        return update_job(
            DELIVERY_JOBS_PATH,
            working["id"],
            lambda current: {**current, "status": "failed", "failure_reason": "Source file path is missing on worker storage."},
        ) or working

    try:
        send_epub_via_smtp(
            recipient_email=recipient_email,
            device_name=working.get("device_name") or "device",
            attachment_path=stored_path,
            work_title=book.get("title") or working["work_slug"],
        )
    except Exception as exc:
        return update_job(
            DELIVERY_JOBS_PATH,
            working["id"],
            lambda current: {**current, "status": "failed", "failure_reason": str(exc)},
        ) or working

    return update_job(
        DELIVERY_JOBS_PATH,
        working["id"],
        lambda current: {**current, "status": "delivered", "completed_at": now_iso(), "failure_reason": ""},
    ) or working


def process_translation_job(job: dict) -> dict:
    def mark_processing(current: dict) -> dict:
        current["status"] = "processing"
        return current

    working = update_job(TRANSLATION_JOBS_PATH, job["id"], mark_processing) or job
    time.sleep(0.35)

    book = find_catalog_book_by_file_asset_id(working.get("file_asset_id", "")) or find_catalog_book_by_slug(working["work_slug"])
    if not book:
        return update_job(
            TRANSLATION_JOBS_PATH,
            working["id"],
            lambda current: {
                **current,
                "status": "failed",
                "output_file_path": "",
                "output_file_url": "",
                "output_json_url": "",
                "failure_reason": "Source book is not available in worker catalog yet.",
            },
        ) or working

    title = book.get("title") or working["work_slug"]
    source_language = book.get("language") or "unknown"
    stored_path = Path(book.get("stored_path", ""))
    preview = ""
    chapters: list[dict] = []
    if stored_path.exists():
        try:
            preview = extract_epub_preview(stored_path)
            chapters = extract_epub_chapters(stored_path)
        except Exception:
            preview = ""
            chapters = []

    translated_chapters = None
    if chapters and working.get("provider", "").startswith("deepl") and DEEPL_API_KEY:
        translated_chapters = translate_with_deepl(
            [chapter.get("source_excerpt", "") for chapter in chapters],
            target_language=working.get("target_language", "CS"),
            source_language=source_language,
            context_text=preview,
        )
        if translated_chapters:
            for chapter, translated_text in zip(chapters, translated_chapters):
                chapter["translated_excerpt"] = translated_text[:900]
                chapter["status"] = "translated"

    output_path = TRANSLATION_OUTPUT_ROOT / f"{working['id']}.md"
    output_json_path = TRANSLATION_OUTPUT_ROOT / f"{working['id']}.json"

    output_json = {
        "job_id": working["id"],
        "work_slug": working["work_slug"],
        "title": title,
        "author": book.get("author", "Unknown author"),
        "source_language": source_language,
        "target_language": working.get("target_language", "cs"),
        "mode": working.get("mode", "study"),
        "provider": working.get("provider", "deepl-study"),
        "study_goal": "Keep a chapter-level study translation that preserves tone, terminology, and useful return points for re-reading.",
        "translation_strategy": "Work chapter by chapter, verify key terms, then review draft excerpts for voice, pacing, and consistency.",
        "terminology_focus": top_terms(f"{title} {preview}", limit=6),
        "reading_path": [
            "Open the owned book detail to re-anchor context.",
            "Review chapter focus and key terms before translating.",
            "Check translated excerpts for terminology consistency.",
            "Return to the book page to queue delivery or continue study.",
        ],
        "provider_status": "live" if translated_chapters else "fallback",
        "chapter_count": len(chapters),
        "chapters": chapters,
        "generated_at": now_iso(),
    }
    write_json(output_json_path, output_json)

    lines = [
        f"# Translation workspace for {title}",
        "",
        f"- Work slug: {working['work_slug']}",
        f"- Source language: {source_language}",
        f"- Target language: {working.get('target_language', 'cs')}",
        f"- Mode: {working.get('mode', 'study')}",
        f"- Provider: {working.get('provider', 'deepl-study')}",
        f"- Source asset: {working.get('file_asset_id') or 'unknown'}",
        "",
        "## Status",
        "This artifact now includes a study-grade chapter structure generated from the EPUB source.",
        "",
        "## Study goal",
        output_json["study_goal"],
        "",
        "## Translation strategy",
        output_json["translation_strategy"],
        "",
        "## Terminology focus",
        ", ".join(output_json["terminology_focus"]) or "No explicit terminology focus extracted yet.",
        "",
        "## Source preview",
        preview or "No preview extracted from the source EPUB yet.",
        "",
        "## Chapters",
    ]
    for chapter in chapters:
        lines.extend(
            [
                f"### {chapter['index']}. {chapter['title']}",
                "",
                f"Source excerpt: {chapter['source_excerpt']}",
                "",
                f"Focus: {chapter.get('focus', 'Keep tone and terminology aligned with the source.')}",
                "",
                f"Study prompt: {chapter.get('study_prompt', 'Review terminology and cadence.')}",
                "",
                f"Key terms: {', '.join(chapter.get('key_terms', [])) or 'None'}",
                "",
                f"Draft translated excerpt: {chapter['translated_excerpt']}",
                "",
            ]
        )
    output_path.write_text("\n".join(lines), encoding="utf-8")

    return update_job(
        TRANSLATION_JOBS_PATH,
        working["id"],
        lambda current: {
            **current,
            "status": "completed",
            "source_language": source_language,
            "output_file_path": str(output_path),
            "output_file_url": build_translation_output_url(current["id"]),
            "output_json_url": build_translation_json_url(current["id"]),
            "chapter_count": len(chapters),
            "completed_at": now_iso(),
            "failure_reason": "",
        },
    ) or working


class Handler(BaseHTTPRequestHandler):
    def _send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/health":
            self._send_json(200, {"status": "ok"})
            return

        if self.path == "/catalog/books":
            self._send_json(200, {"status": "ok", "data": load_catalog()})
            return

        if self.path == "/connectors/smtp/status":
            self._send_json(200, {"status": "ok", "data": get_connector_status()})
            return

        if self.path.startswith("/intelligence/books/"):
            work_slug = unquote(self.path.removeprefix("/intelligence/books/"))
            payload = load_generated_or_refresh(
                INTELLIGENCE_BOOK_ROOT / f"{work_slug}.json",
                lambda: generate_book_intelligence(work_slug),
            )
            if not payload:
                self._send_json(404, {"error": "book intelligence not found"})
                return
            self._send_json(200, {"status": "ok", "data": payload})
            return

        if self.path.startswith("/intelligence/authors/"):
            author_slug = unquote(self.path.removeprefix("/intelligence/authors/"))
            payload = load_generated_or_refresh(
                INTELLIGENCE_AUTHOR_ROOT / f"{author_slug}.json",
                lambda: generate_author_intelligence(author_slug),
            )
            if not payload:
                self._send_json(404, {"error": "author intelligence not found"})
                return
            self._send_json(200, {"status": "ok", "data": payload})
            return

        if self.path.startswith("/recommendations/books/"):
            work_slug = unquote(self.path.removeprefix("/recommendations/books/"))
            payload = load_generated_or_refresh(
                RECOMMENDATION_BOOK_ROOT / f"{work_slug}.json",
                lambda: generate_book_recommendations(work_slug),
            )
            if not payload:
                self._send_json(404, {"error": "book recommendations not found"})
                return
            self._send_json(200, {"status": "ok", "data": payload})
            return

        if self.path.startswith("/recommendations/authors/"):
            author_slug = unquote(self.path.removeprefix("/recommendations/authors/"))
            payload = load_generated_or_refresh(
                RECOMMENDATION_AUTHOR_ROOT / f"{author_slug}.json",
                lambda: generate_author_recommendations(author_slug),
            )
            if not payload:
                self._send_json(404, {"error": "author recommendations not found"})
                return
            self._send_json(200, {"status": "ok", "data": payload})
            return

        if self.path == "/jobs/delivery":
            self._send_json(200, {"status": "ok", "data": load_json_list(DELIVERY_JOBS_PATH)})
            return

        if self.path.startswith("/jobs/delivery/"):
            job_id = unquote(self.path.removeprefix("/jobs/delivery/"))
            job = get_job_by_id(DELIVERY_JOBS_PATH, job_id)
            if not job:
                self._send_json(404, {"error": "job not found"})
                return
            self._send_json(200, {"status": "ok", "data": job})
            return

        if self.path == "/jobs/translation":
            self._send_json(200, {"status": "ok", "data": load_json_list(TRANSLATION_JOBS_PATH)})
            return

        if self.path.startswith("/jobs/translation/") and self.path.endswith("/document"):
            job_id = unquote(self.path.removeprefix("/jobs/translation/").removesuffix("/document"))
            document = build_translation_document(job_id)
            if not document:
                self._send_json(404, {"error": "translation document not found"})
                return
            self._send_json(200, {"status": "ok", "data": document})
            return

        if self.path.startswith("/jobs/translation/"):
            job_id = unquote(self.path.removeprefix("/jobs/translation/"))
            job = get_job_by_id(TRANSLATION_JOBS_PATH, job_id)
            if not job:
                self._send_json(404, {"error": "job not found"})
                return
            self._send_json(200, {"status": "ok", "data": job})
            return

        if self.path.startswith("/files/"):
            self._serve_uploaded_file()
            return

        if self.path.startswith("/artifacts/translations/"):
            self._serve_translation_artifact()
            return

        self._send_json(404, {"error": "not found"})

    def do_POST(self) -> None:  # noqa: N802
        content_length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(content_length)

        try:
            payload = json.loads(raw.decode("utf-8")) if raw else {}
        except json.JSONDecodeError:
            self._send_json(400, {"error": "invalid JSON payload"})
            return

        if self.path == "/extract/epub-metadata":
            self._extract_epub_metadata(payload)
            return

        if self.path == "/upload/epub":
            self._upload_epub(payload)
            return

        if self.path == "/jobs/delivery":
            self._create_delivery_job(payload)
            return

        if self.path == "/jobs/translation":
            self._create_translation_job(payload)
            return

        self._send_json(404, {"error": "not found"})

    def _extract_epub_metadata(self, payload: dict) -> None:
        epub_path = Path(payload.get("path", ""))
        if not epub_path.exists():
            self._send_json(404, {"error": "file not found"})
            return

        try:
            metadata = extract_book_metadata(epub_path)
        except Exception as exc:
            self._send_json(400, {"error": f"failed to parse epub: {exc}"})
            return

        self._send_json(200, {"status": "ok", "data": metadata})

    def _upload_epub(self, payload: dict) -> None:
        file_name = payload.get("file_name", "upload.epub")
        content_b64 = payload.get("content_base64")

        if not file_name.endswith(".epub"):
            self._send_json(400, {"error": "only .epub files are supported"})
            return

        if not content_b64:
            self._send_json(400, {"error": "content_base64 is required"})
            return

        try:
            content = base64.b64decode(content_b64)
        except Exception:
            self._send_json(400, {"error": "invalid base64 content"})
            return

        checksum = hashlib.sha256(content).hexdigest()
        target_path = UPLOAD_ROOT / f"{checksum}.epub"
        target_path.write_bytes(content)

        try:
            metadata = extract_book_metadata(target_path)
        except Exception as exc:
            self._send_json(400, {"error": f"failed to parse epub: {exc}"})
            return

        title = metadata.get("title") or Path(file_name).stem
        creator = metadata.get("creator") or "Unknown author"
        entry = {
            "id": checksum,
            "slug": slugify(title),
            "title": title,
            "author": creator,
            "language": metadata.get("language") or "unknown",
            "format": "EPUB",
            "status": "unread",
            "progress_percent": 0,
            "file_url": f"{PUBLIC_BASE_URL}/files/{checksum}.epub",
            "stored_path": str(target_path),
        }

        catalog = [item for item in load_catalog() if item.get("id") != checksum]
        catalog.insert(0, entry)
        save_catalog(catalog)

        self._send_json(
            200,
            {
                "status": "ok",
                "data": {
                    "file_name": file_name,
                    "stored_path": str(target_path),
                    "checksum": checksum,
                    "metadata": metadata,
                    "catalog_entry": entry,
                },
            },
        )

    def _serve_uploaded_file(self) -> None:
        file_name = unquote(self.path.removeprefix("/files/"))
        target_path = UPLOAD_ROOT / file_name
        if not target_path.exists():
            self._send_json(404, {"error": "file not found"})
            return

        content = target_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", "application/epub+zip")
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(content)

    def _serve_translation_artifact(self) -> None:
        file_name = unquote(self.path.removeprefix("/artifacts/translations/"))
        target_path = TRANSLATION_OUTPUT_ROOT / file_name
        if not target_path.exists():
            self._send_json(404, {"error": "artifact not found"})
            return

        content = target_path.read_bytes()
        if target_path.suffix == ".json":
            content_type = "application/json"
        else:
            content_type = "text/markdown; charset=utf-8"
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(content)

    def _create_delivery_job(self, payload: dict) -> None:
        work_slug = payload.get("work_slug")
        device_id = payload.get("device_id")
        if not work_slug or not device_id:
            self._send_json(400, {"error": "work_slug and device_id are required"})
            return

        jobs = load_json_list(DELIVERY_JOBS_PATH)
        job = {
            "id": f"worker-delivery-{len(jobs) + 1}",
            "work_slug": work_slug,
            "edition_id": payload.get("edition_id"),
            "device_id": device_id,
            "device_name": payload.get("device_name", ""),
            "device_email": payload.get("device_email", ""),
            "delivery_method": payload.get("delivery_method", ""),
            "device_provider": payload.get("device_provider", ""),
            "format": payload.get("format", "EPUB"),
            "attempt": int(payload.get("attempt", 1) or 1),
            "retried_from": payload.get("retried_from", ""),
            "status": "queued",
            "queued_at": now_iso(),
            "failure_reason": "",
        }
        jobs.insert(0, job)
        save_json_list(DELIVERY_JOBS_PATH, jobs)
        threading.Thread(target=process_delivery_job, args=(job,), daemon=True).start()
        self._send_json(201, {"status": "ok", "data": job})

    def _create_translation_job(self, payload: dict) -> None:
        work_slug = payload.get("work_slug")
        target_language = payload.get("target_language")
        if not work_slug or not target_language:
            self._send_json(400, {"error": "work_slug and target_language are required"})
            return

        jobs = load_json_list(TRANSLATION_JOBS_PATH)
        job = {
            "id": f"worker-translation-{len(jobs) + 1}",
            "work_slug": work_slug,
            "file_asset_id": payload.get("file_asset_id", ""),
            "source_language": "unknown",
            "target_language": target_language,
            "mode": payload.get("mode", "study"),
            "provider": payload.get("provider", "deepl-study"),
            "glossary_terms": payload.get("glossary_terms", []),
            "status": "queued",
            "output_format": payload.get("output_format", "EPUB"),
            "output_file_path": "",
            "output_file_url": "",
            "output_json_url": "",
            "chapter_count": 0,
            "queued_at": now_iso(),
            "failure_reason": "",
        }
        jobs.insert(0, job)
        save_json_list(TRANSLATION_JOBS_PATH, jobs)
        threading.Thread(target=process_translation_job, args=(job,), daemon=True).start()
        self._send_json(201, {"status": "ok", "data": job})


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"Book Universe AI Worker listening on http://{HOST}:{PORT}")
    server.serve_forever()
