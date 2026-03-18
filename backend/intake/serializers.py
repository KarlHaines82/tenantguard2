from rest_framework import serializers
from .models import IntakeSubmission, IntakeDocument, CaseNotebook


class IntakeDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntakeDocument
        fields = ["id", "doc_type", "file", "original_filename", "uploaded_at"]
        read_only_fields = ["original_filename", "uploaded_at"]

    def create(self, validated_data):
        file = validated_data.get("file")
        if file:
            validated_data["original_filename"] = file.name
        return super().create(validated_data)


class CaseNotebookSerializer(serializers.ModelSerializer):
    class Meta:
        model = CaseNotebook
        fields = [
            "id",
            "summary",
            "facts",
            "timeline",
            "key_terms",
            "disputed_points",
            "open_questions",
            "urgent_deadlines",
            "recommended_next_steps",
            "created_at",
            "updated_at",
        ]


class IntakeSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntakeSubmission
        fields = [
            "id",
            "role",
            "status",
            "full_name",
            "email",
            "phone",
            "property_address",
            "county",
            "landlord_name",
            "landlord_contact",
            "issue_type",
            "notice_date",
            "issue_description",
            "bar_number",
            "firm_name",
            "case_description",
            "created_at",
        ]
        read_only_fields = ["status", "created_at"]


class IntakeSubmissionDetailSerializer(IntakeSubmissionSerializer):
    documents = IntakeDocumentSerializer(many=True, read_only=True)
    notebook = CaseNotebookSerializer(read_only=True)

    class Meta(IntakeSubmissionSerializer.Meta):
        fields = IntakeSubmissionSerializer.Meta.fields + ["documents", "notebook"]
