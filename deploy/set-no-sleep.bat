@echo off
REM ---------------------------------------------------------------------------
REM Double-click this to stop the laptop sleeping while Crestfall serves.
REM It asks for administrator rights once (UAC), then reports which settings
REM this power plan actually accepted. Same result is in deploy\logs\no-sleep.log
REM ---------------------------------------------------------------------------
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0set-no-sleep.ps1"
