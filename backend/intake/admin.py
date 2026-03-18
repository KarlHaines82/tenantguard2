from django.contrib import admin
from .models import CaseNotebook, IntakeDocument, IntakeSubmission


class IntakeDocumentInline(admin.TabularInline):
    model = IntakeDocument
    extra = 0
    readonly_fields = ["original_filename", "uploaded_at", "extracted_text"]


class CaseNotebookInline(admin.StackedInline):
    model = CaseNotebook
    extra = 0
    readonly_fields = ["summary", "facts", "timeline", "key_terms", "disputed_points",
                       "open_questions", "urgent_deadlines", "recommended_next_steps", "created_at"]
    can_delete = False


@admin.register(IntakeSubmission)
class IntakeSubmissionAdmin(admin.ModelAdmin):
    list_display = ["id", "full_name", "role", "issue_type", "status", "created_at"]
    list_filter = ["role", "status", "issue_type", "county"]
    search_fields = ["full_name", "email", "property_address", "landlord_name"]
    readonly_fields = ["status", "created_at", "updated_at"]
    inlines = [IntakeDocumentInline, CaseNotebookInline]


@admin.register(IntakeDocument)
class IntakeDocumentAdmin(admin.ModelAdmin):
    list_display = ["id", "submission", "doc_type", "original_filename", "uploaded_at"]
    list_filter = ["doc_type"]
    search_fields = ["original_filename", "submission__full_name"]
