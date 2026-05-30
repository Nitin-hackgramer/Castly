from django.core.management.base import BaseCommand
from voters.models import Voter
from datetime import date


class Command(BaseCommand):

    def handle(self, *args, **kwargs):
        voters = [
            # DEMO VOTER 1 — valid, adult, use this in live demo
            {
                "aadhaar_number": "987654321011",
                "full_name": "Rahul Sharma",
                "date_of_birth": date(1995, 4, 15),
                "constituency": "New Delhi - 01",
            },
            # DEMO VOTER 2 — valid adult
            {
                "aadhaar_number": "987654321022",
                "full_name": "Priya Verma",
                "date_of_birth": date(1992, 8, 22),
                "constituency": "New Delhi - 02",
            },
            # DEMO VOTER 3 — under 18, will be REJECTED
            {
                "aadhaar_number": "987654321099",
                "full_name": "Arjun Singh",
                "date_of_birth": date(2010, 1, 10),
                "constituency": "New Delhi - 01",
            },
            # DEMO VOTER 4 — already voted
            {
                "aadhaar_number": "987654321033",
                "full_name": "Anjali Patel",
                "date_of_birth": date(1988, 6, 3),
                "constituency": "New Delhi - 03",
            },
            {
                "aadhaar_number": "987654321044",
                "full_name": "Vikas Kumar",
                "date_of_birth": date(1990, 11, 17),
                "constituency": "New Delhi - 04",
            },
            {
                "aadhaar_number": "987654321055",
                "full_name": "Neha Singh",
                "date_of_birth": date(1994, 3, 8),
                "constituency": "New Delhi - 05",
            },
            {
                "aadhaar_number": "987654321066",
                "full_name": "Amit Gupta",
                "date_of_birth": date(1987, 9, 12),
                "constituency": "New Delhi - 01",
            },
            {
                "aadhaar_number": "987654321077",
                "full_name": "Divya Sharma",
                "date_of_birth": date(1993, 5, 20),
                "constituency": "New Delhi - 02",
            },
            {
                "aadhaar_number": "987654321088",
                "full_name": "Rohan Desai",
                "date_of_birth": date(1991, 7, 14),
                "constituency": "New Delhi - 03",
            },
            {
                "aadhaar_number": "987654321100",
                "full_name": "Sneha Reddy",
                "date_of_birth": date(1996, 2, 25),
                "constituency": "New Delhi - 04",
            },
            {
                "aadhaar_number": "987654321111",
                "full_name": "Karan Nair",
                "date_of_birth": date(1989, 10, 9),
                "constituency": "New Delhi - 05",
            },
            {
                "aadhaar_number": "987654321122",
                "full_name": "Pooja Bhatt",
                "date_of_birth": date(1997, 4, 18),
                "constituency": "New Delhi - 01",
            },
            {
                "aadhaar_number": "987654321133",
                "full_name": "Sanjay Kapoor",
                "date_of_birth": date(1986, 12, 1),
                "constituency": "New Delhi - 02",
            },
            {
                "aadhaar_number": "987654321144",
                "full_name": "Ritika Malhotra",
                "date_of_birth": date(1999, 8, 11),
                "constituency": "New Delhi - 03",
            },
            {
                "aadhaar_number": "987654321155",
                "full_name": "Deepak Joshi",
                "date_of_birth": date(1992, 1, 27),
                "constituency": "New Delhi - 04",
            },
            {
                "aadhaar_number": "987654321166",
                "full_name": "Shreya Iyer",
                "date_of_birth": date(1985, 6, 15),
                "constituency": "New Delhi - 05",
            },
            {
                "aadhaar_number": "987654321177",
                "full_name": "Abhishek Roy",
                "date_of_birth": date(1998, 9, 3),
                "constituency": "New Delhi - 01",
            },
            {
                "aadhaar_number": "987654321188",
                "full_name": "Sapna Das",
                "date_of_birth": date(1991, 5, 22),
                "constituency": "New Delhi - 02",
            },
            {
                "aadhaar_number": "987654321199",
                "full_name": "Manish Saxena",
                "date_of_birth": date(1988, 3, 13),
                "constituency": "New Delhi - 03",
            },
            {
                "aadhaar_number": "987654321200",
                "full_name": "Isha Verma",
                "date_of_birth": date(1994, 11, 30),
                "constituency": "New Delhi - 04",
            },
            {
                "aadhaar_number": "987654321211",
                "full_name": "Nikhil Bhat",
                "date_of_birth": date(2008, 2, 19),
                "constituency": "New Delhi - 05",
            },
            {
                "aadhaar_number": "987654321222",
                "full_name": "Aisha Khan",
                "date_of_birth": date(1996, 7, 6),
                "constituency": "New Delhi - 01",
            },
            {
                "aadhaar_number": "987654321233",
                "full_name": "Ravi Tiwari",
                "date_of_birth": date(1989, 4, 28),
                "constituency": "New Delhi - 02",
            },
            {
                "aadhaar_number": "987654321244",
                "full_name": "Zoya Nazir",
                "date_of_birth": date(2006, 12, 21),
                "constituency": "New Delhi - 03",
            },
            {
                "aadhaar_number": "987654321255",
                "full_name": "Harshit Chawla",
                "date_of_birth": date(1993, 10, 5),
                "constituency": "New Delhi - 04",
            },
        ]

        today = date.today()

        for v in voters:
            # Calculate age
            dob = v["date_of_birth"]
            age = (today - dob).days // 365
            is_eligible = age >= 18

            Voter.objects.get_or_create(
                aadhaar_number=v["aadhaar_number"],
                defaults={
                    **v,
                    "is_eligible": is_eligible,
                    "aadhaar_last4": v["aadhaar_number"][-4:],
                },
            )

        self.stdout.write("✓ Voters seeded successfully")
