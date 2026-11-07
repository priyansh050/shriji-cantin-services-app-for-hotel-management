@echo off
title Shreeji Campus Canteen - Food Ordering Server
echo ==========================================================
echo Starting Shreeji College Canteen Web App...
echo ==========================================================
powershell -ExecutionPolicy Bypass -File "%~dp0start-server.ps1"
pause
