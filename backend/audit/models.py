from django.db import models


class AuditRecord(models.Model):
    event = models.CharField(max_length=256)
    metadata = models.JSONField(default=dict)
    recorded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Audit: {self.event} @ {self.recorded_at.isoformat()}"
