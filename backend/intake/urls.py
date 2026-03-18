from django.urls import path
from .views import (
    IntakeSubmissionCreateView,
    IntakeSubmissionDetailView,
    IntakeSubmissionListView,
    IntakeDocumentUploadView,
    IntakeAnalyzeView,
)

urlpatterns = [
    path("", IntakeSubmissionListView.as_view(), name="intake-list"),
    path("submit/", IntakeSubmissionCreateView.as_view(), name="intake-submit"),
    path("<int:pk>/", IntakeSubmissionDetailView.as_view(), name="intake-detail"),
    path("<int:pk>/documents/", IntakeDocumentUploadView.as_view(), name="intake-documents"),
    path("<int:pk>/analyze/", IntakeAnalyzeView.as_view(), name="intake-analyze"),
]
