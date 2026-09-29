import os
import re
from typing import List, Dict

BOOKS_DIR = os.path.join(os.path.dirname(__file__), "data", "books")

class QuantumKnowledgeBase:
    def __init__(self, books_dir: str = BOOKS_DIR):
        self.books_dir = books_dir
        self.documents: List[Dict[str, str]] = [] # [{'source': '...', 'chunk': '...', 'title': '...'}]
        self.load_books()

    def load_books(self):
        """Scan data/books directory and load text/markdown/pdf files into memory chunks."""
        self.documents = []
        if not os.path.exists(self.books_dir):
            os.makedirs(self.books_dir, exist_ok=True)
            return

        for root, _, files in os.walk(self.books_dir):
            for file in files:
                filepath = os.path.join(root, file)
                if file.endswith(('.txt', '.md')):
                    try:
                        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                            text = f.read()
                            self._chunk_and_store(file, text)
                    except Exception as e:
                        print(f"Error reading {file}: {e}")
                elif file.endswith('.pdf'):
                    try:
                        import pypdf
                        reader = pypdf.PdfReader(filepath)
                        pdf_text = ""
                        for page in reader.pages:
                            pdf_text += (page.extract_text() or "") + "\n"
                        self._chunk_and_store(file, pdf_text)
                    except ImportError:
                        print(f"pypdf not installed. Skipping PDF {file}. Run `pip install pypdf` to enable PDF reading.")
                    except Exception as e:
                        print(f"Error reading PDF {file}: {e}")

    def _chunk_and_store(self, filename: str, text: str, chunk_size: int = 600, overlap: int = 100):
        """Split document into overlapping semantic chunks."""
        words = text.split()
        if not words:
            return
        
        step = chunk_size - overlap
        for i in range(0, len(words), max(1, step)):
            chunk_words = words[i:i + chunk_size]
            chunk_text = " ".join(chunk_words)
            if len(chunk_text.strip()) > 40: # ignore trivial chunks
                self.documents.append({
                    "source": filename,
                    "chunk": chunk_text
                })

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, str]]:
        """
        Fast keyword/BM25-style lexical relevance matching to retrieve the most pertinent excerpts.
        """
        if not self.documents:
            return []

        query_terms = re.findall(r'\w+', query.lower())
        if not query_terms:
            return []

        scored_docs = []
        for doc in self.documents:
            content_lower = doc["chunk"].lower()
            score = sum(1 for term in query_terms if term in content_lower)
            if score > 0:
                scored_docs.append((score, doc))

        # Sort by match score descending
        scored_docs.sort(key=lambda x: x[0], reverse=True)
        return [doc for _, doc in scored_docs[:top_k]]

    def get_books_list(self) -> List[str]:
        """List loaded document filenames."""
        if not os.path.exists(self.books_dir):
            return []
        return [f for f in os.listdir(self.books_dir) if not f.startswith('.')]
