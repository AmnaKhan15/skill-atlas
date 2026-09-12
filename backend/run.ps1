# Convenience wrapper so you don't have to type the full venv path
# every time. Run from the backend/ directory: .\run.ps1
& "$PSScriptRoot\.venv\Scripts\python.exe" -m uvicorn app.main:app --reload --port 8000
