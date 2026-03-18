import json
import os
from pathlib import Path

from blog.ai_agents import BaseAgent


class DocumentAnalysisAgent(BaseAgent):
    """Extracts legally relevant facts from a single uploaded document."""

    def analyze(self, doc_type: str, filename: str, text_content: str) -> str:
        system_prompt = (
            "You are a legal document analyst at TenantGuard specializing in Tennessee tenant law. "
            "Extract all legally relevant information from the provided document. "
            "Be precise and objective. Focus on dates, parties, monetary amounts, deadlines, "
            "contractual obligations, and any potential violations of Tennessee landlord-tenant law."
        )
        user_prompt = (
            f"Document Type: {doc_type}\n"
            f"Filename: {filename}\n\n"
            f"Document Content:\n{text_content[:4000]}\n\n"
            "Return a JSON object with these keys:\n"
            "- dates: list of {{date, description}} objects\n"
            "- parties: list of names and roles\n"
            "- amounts: list of {{amount, currency, description}} objects\n"
            "- deadlines: list of {{date, action}} objects\n"
            "- obligations: list of obligations described in the document\n"
            "- potential_violations: list of possible legal violations found\n"
            "- key_clauses: list of important clauses or statements\n"
            "Return only valid JSON."
        )
        return self.call_ai(system_prompt, user_prompt, temperature=0.1)


class TimelineBuilderAgent(BaseAgent):
    """Constructs a chronological event timeline from all available intake data."""

    def build(self, submission_summary: str, document_analyses: list[str]) -> str:
        analyses_text = "\n\n".join(
            f"Document {i + 1}:\n{a}" for i, a in enumerate(document_analyses)
        )
        system_prompt = (
            "You are a legal timeline expert at TenantGuard. "
            "Given intake form data and document analyses, build an accurate chronological timeline "
            "of all events relevant to this tenant case. "
            "Each entry must include a date (or best estimate), a clear event description, "
            "its source, and its legal significance under Tennessee landlord-tenant law."
        )
        user_prompt = (
            f"Intake Information:\n{submission_summary}\n\n"
            f"Document Analyses:\n{analyses_text}\n\n"
            "Return a JSON array of timeline entries. Each entry:\n"
            "{{\"date\": \"YYYY-MM-DD or approximate\", \"event\": \"description\", "
            "\"source\": \"document or form field\", \"significance\": \"legal relevance\"}}\n"
            "Return only valid JSON array."
        )
        return self.call_ai(system_prompt, user_prompt, temperature=0.1)


class CaseNotebookAgent(BaseAgent):
    """Assembles the complete structured Case Notebook from all extracted data."""

    def assemble(
        self,
        submission_summary: str,
        document_analyses: list[str],
        timeline: str,
    ) -> str:
        analyses_text = "\n\n".join(
            f"Document {i + 1}:\n{a}" for i, a in enumerate(document_analyses)
        )
        system_prompt = (
            "You are the Lead Case Analyst at TenantGuard. "
            "Your job is to assemble a comprehensive, actionable Case Notebook for a Tennessee tenant "
            "or their attorney. Write with empathy and precision — the reader is likely a stressed "
            "non-lawyer facing an imminent deadline. Every statement must be traceable to provided evidence."
        )
        user_prompt = (
            f"Intake Form Data:\n{submission_summary}\n\n"
            f"Document Analyses:\n{analyses_text}\n\n"
            f"Timeline:\n{timeline}\n\n"
            "Produce a Case Notebook as a JSON object with these exact keys:\n"
            "- summary: string (2-3 paragraph plain-English executive summary)\n"
            "- facts: list of {{fact, source, confidence}} where confidence is high/medium/low\n"
            "- key_terms: list of {{term, definition}} for legal terms the tenant needs to know\n"
            "- disputed_points: list of {{issue, tenant_position, landlord_position}}\n"
            "- open_questions: list of strings — things that need clarification\n"
            "- urgent_deadlines: list of {{date, action}} sorted by urgency\n"
            "- recommended_next_steps: list of concrete action items in priority order\n"
            "Return only valid JSON."
        )
        return self.call_ai(system_prompt, user_prompt, temperature=0.2)


def extract_text_from_file(file_field) -> str:
    """
    Attempts to extract plain text from an uploaded file.
    Supports: .txt, .pdf (via pypdf if installed), .md
    Falls back to filename + metadata for unsupported types.
    """
    filename = file_field.name.lower()
    try:
        if filename.endswith(".txt") or filename.endswith(".md"):
            file_field.seek(0)
            return file_field.read().decode("utf-8", errors="replace")

        if filename.endswith(".pdf"):
            try:
                import pypdf

                file_field.seek(0)
                reader = pypdf.PdfReader(file_field)
                pages = [page.extract_text() or "" for page in reader.pages]
                return "\n".join(pages)
            except ImportError:
                return f"[PDF file: {os.path.basename(filename)} — install pypdf to extract text]"

        # Images, docx, etc. — return metadata only
        return f"[Binary file: {os.path.basename(filename)} — text extraction not supported for this format]"

    except Exception as e:
        return f"[Error extracting text from {os.path.basename(filename)}: {e}]"


class IntakeAnalysisWorkflow:
    """
    Orchestrates the full multi-agent document analysis pipeline for an intake submission.

    Pipeline:
    1. DocumentAnalysisAgent  — analyses each uploaded document individually
    2. TimelineBuilderAgent   — synthesises a unified chronological timeline
    3. CaseNotebookAgent      — assembles the complete structured Case Notebook
    """

    def __init__(self):
        self.doc_agent = DocumentAnalysisAgent()
        self.timeline_agent = TimelineBuilderAgent()
        self.notebook_agent = CaseNotebookAgent()

    def _submission_summary(self, submission) -> str:
        lines = [
            f"Role: {submission.get_role_display()}",
            f"Name: {submission.full_name}",
            f"Email: {submission.email}",
        ]
        if submission.role == "tenant":
            if submission.property_address:
                lines.append(f"Property Address: {submission.property_address}")
            if submission.county:
                lines.append(f"County: {submission.get_county_display()}")
            if submission.landlord_name:
                lines.append(f"Landlord: {submission.landlord_name}")
            if submission.issue_type:
                lines.append(f"Issue Type: {submission.get_issue_type_display()}")
            if submission.notice_date:
                lines.append(f"Notice Date: {submission.notice_date}")
            if submission.issue_description:
                lines.append(f"Description: {submission.issue_description}")
        else:
            if submission.bar_number:
                lines.append(f"Bar Number: {submission.bar_number}")
            if submission.firm_name:
                lines.append(f"Firm: {submission.firm_name}")
            if submission.case_description:
                lines.append(f"Case Description: {submission.case_description}")
        return "\n".join(lines)

    def _safe_parse_json(self, text: str, fallback):
        """Try to parse JSON from AI response; return fallback on failure."""
        if not text:
            return fallback
        # Strip markdown fences if present
        cleaned = text.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            cleaned = "\n".join(lines[1:-1]) if len(lines) > 2 else cleaned
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            return fallback

    def run(self, submission):
        from .models import CaseNotebook

        submission.status = "analyzing"
        submission.save(update_fields=["status"])

        try:
            submission_summary = self._submission_summary(submission)
            documents = submission.documents.all()

            # Step 1: Analyse each document
            doc_analyses_raw = []
            for doc in documents:
                text = extract_text_from_file(doc.file)
                if text and not doc.extracted_text:
                    doc.extracted_text = text
                    doc.save(update_fields=["extracted_text"])
                analysis = self.doc_agent.analyze(
                    doc.get_doc_type_display(), doc.original_filename, text
                )
                doc_analyses_raw.append(analysis)

            if not doc_analyses_raw:
                doc_analyses_raw = ["No documents uploaded."]

            # Step 2: Build timeline
            timeline_raw = self.timeline_agent.build(submission_summary, doc_analyses_raw)

            # Step 3: Assemble notebook
            notebook_raw = self.notebook_agent.assemble(
                submission_summary, doc_analyses_raw, timeline_raw
            )

            # Parse and save
            notebook_data = self._safe_parse_json(notebook_raw, {})
            timeline_data = self._safe_parse_json(timeline_raw, [])

            notebook, _ = CaseNotebook.objects.get_or_create(submission=submission)
            notebook.summary = notebook_data.get("summary", "")
            notebook.facts = notebook_data.get("facts", [])
            notebook.timeline = timeline_data if isinstance(timeline_data, list) else notebook_data.get("timeline", [])
            notebook.key_terms = notebook_data.get("key_terms", [])
            notebook.disputed_points = notebook_data.get("disputed_points", [])
            notebook.open_questions = notebook_data.get("open_questions", [])
            notebook.urgent_deadlines = notebook_data.get("urgent_deadlines", [])
            notebook.recommended_next_steps = notebook_data.get("recommended_next_steps", [])
            notebook.raw_output = notebook_raw
            notebook.save()

            submission.status = "complete"
            submission.save(update_fields=["status"])

        except Exception as e:
            submission.status = "error"
            submission.save(update_fields=["status"])
            raise e
