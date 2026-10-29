' ---------------------------------------------------------------------------
' Crestfall keeper - silent launcher.
' Starts the watchdog with no console window at all. This is what the Startup
' folder shortcut points at, so the app comes back every time you log in.
' Resolve paths from this file's own folder so the repo can be moved.
' ---------------------------------------------------------------------------
Option Explicit

Dim fso, shell, here, deployDir, ps1, cmd

Set fso   = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

here      = fso.GetParentFolderName(WScript.ScriptFullName)
deployDir = here
ps1       = fso.BuildPath(deployDir, "crestfall-keepalive.ps1")

If Not fso.FileExists(ps1) Then
  MsgBox "Missing keeper script:" & vbCrLf & ps1, vbExclamation, "Crestfall keeper"
  WScript.Quit 1
End If

cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & ps1 & """"

' Optional switch, dropped in by the user: create an empty file named
' idle-screen-ok.txt next to this script if you would rather the screen be
' allowed to sleep. On this Modern Standby laptop the display request is what
' actually holds background processes running, so leaving it on (the default)
' is the stronger guarantee and this file is the deliberate weaker option.
If fso.FileExists(fso.BuildPath(deployDir, "idle-screen-ok.txt")) Then
  cmd = cmd & " -IdleScreenOk"
End If

shell.CurrentDirectory = deployDir
' 0 = hidden window, False = don't wait for it to finish
shell.Run cmd, 0, False
