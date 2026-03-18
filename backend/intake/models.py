from django.db import models
from django.contrib.auth.models import User


class IntakeSubmission(models.Model):
    ROLE_CHOICES = [
        ("tenant", "Tenant"),
        ("attorney", "Attorney"),
    ]
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("analyzing", "Analyzing"),
        ("complete", "Complete"),
        ("error", "Error"),
    ]
    ISSUE_CHOICES = [
        ("eviction", "Eviction / Unlawful Detainer"),
        ("habitability", "Habitability / Repairs"),
        ("security_deposit", "Security Deposit Dispute"),
        ("harassment", "Landlord Harassment"),
        ("discrimination", "Housing Discrimination"),
        ("lease_dispute", "Lease Dispute"),
        ("other", "Other"),
    ]
    COUNTY_CHOICES = [
        ("davidson", "Davidson County"),
        ("shelby", "Shelby County"),
        ("knox", "Knox County"),
        ("hamilton", "Hamilton County"),
        ("other", "Other Tennessee County"),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="intake_submissions")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    # Common fields
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)

    # Tenant-specific fields
    property_address = models.TextField(blank=True)
    county = models.CharField(max_length=50, choices=COUNTY_CHOICES, blank=True)
    landlord_name = models.CharField(max_length=255, blank=True)
    landlord_contact = models.CharField(max_length=255, blank=True)
    issue_type = models.CharField(max_length=50, choices=ISSUE_CHOICES, blank=True)
    notice_date = models.DateField(null=True, blank=True)
    issue_description = models.TextField(blank=True)

    # Attorney-specific fields
    bar_number = models.CharField(max_length=50, blank=True)
    firm_name = models.CharField(max_length=255, blank=True)
    case_description = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_role_display()} intake — {self.full_name} ({self.created_at.date()})"


class IntakeDocument(models.Model):
    DOC_TYPE_CHOICES = [
        ("lease", "Lease Agreement"),
        ("eviction_notice", "Eviction Notice"),
        ("correspondence", "Correspondence / Letters"),
        ("photo", "Photo / Visual Evidence"),
        ("court_filing", "Court Filing"),
        ("payment_record", "Payment Record"),
        ("other", "Other"),
    ]

    submission = models.ForeignKey(
        IntakeSubmission, on_delete=models.CASCADE, related_name="documents"
    )
    doc_type = models.CharField(max_length=50, choices=DOC_TYPE_CHOICES)
    file = models.FileField(upload_to="intake/documents/")
    original_filename = models.CharField(max_length=255)
    extracted_text = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_doc_type_display()} — {self.original_filename}"


class CaseNotebook(models.Model):
    submission = models.OneToOneField(
        IntakeSubmission, on_delete=models.CASCADE, related_name="notebook"
    )
    summary = models.TextField(blank=True)
    facts = models.JSONField(default=list)
    timeline = models.JSONField(default=list)
    key_terms = models.JSONField(default=list)
    disputed_points = models.JSONField(default=list)
    open_questions = models.JSONField(default=list)
    urgent_deadlines = models.JSONField(default=list)
    recommended_next_steps = models.JSONField(default=list)
    raw_output = models.TextField(blank=True)  # full AI response for debugging

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Notebook for {self.submission}"
