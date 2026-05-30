# management/
#     __init__.py
#     commands/
#       __init__.py
#       seed_voters.py
from django.db import models

class Voter(models.Model):
    # Identity fields
    aadhaar_number   = models.CharField(max_length=12, unique=True)
    full_name        = models.CharField(max_length=100)
    date_of_birth    = models.DateField()
    constituency     = models.CharField(max_length=100)
    
    # Eligibility
    is_eligible      = models.BooleanField(default=False)
    # ↑ set to True only if age ≥ 18 at seed time
    
    # Voting status
    has_voted        = models.BooleanField(default=False)
    
    # Never expose full Aadhaar — store last 4 only for display
    aadhaar_last4    = models.CharField(max_length=4)
    
    created_at       = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} ({self.constituency})"
    
    class Meta:
        db_table = 'voters'