@echo off
echo ====================================================
echo Compiling and Running PaalVandi Java 21 Engine...
echo ====================================================
cd /d "%~dp0backend-java"
if not exist "bin" mkdir bin
javac -d bin -sourcepath src/main/java src/main/java/com/milkdelivery/MilkDeliveryServer.java
if %errorlevel% neq 0 (
    echo Compilation failed. Check your Java installation.
    pause
    exit /b %errorlevel%
)
java -cp bin com.milkdelivery.MilkDeliveryServer
pause
