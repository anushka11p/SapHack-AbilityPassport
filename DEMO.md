# Demo sequence

Before starting: ./reset-demo.sh
Confirm it prints three task titles and NO_CONSENT.

1. Candidate portal — pick "Fix the failing test"
2. Paste the answer from demo-answer.txt (never type on stage)
3. Submit — agent scores it live
4. Passport appears: four skills, each with the evidence quote that earned it
5. Share with MeeraCorp
6. Employer view — verified skills plus accommodation note
7. Shortlist — decision logged with a human's name

Expected result: 8.5 overall, scores 9/8/8/9.

If the live call stalls past 10 seconds:
"The live call is timing out, here's the recorded run."
Play the video. Keep talking. Never debug on stage.

Morning-of checklist:
- Restart HANA instance (trial instances stop overnight)
- cf apps — confirm ability-passport-srv is running
- ./reset-demo.sh
- One warm-up submission before going on
