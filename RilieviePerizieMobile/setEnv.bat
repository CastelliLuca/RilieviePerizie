@echo off

REM *************** COMANDI DI CONFIGURAZIONE DI CORDOVA ***********************
REM Questo file imposta temporaneamente la configurazione (se chiudo il terminale, quando lo riapro devo rilanciare setEnv)

REM variabile di ambiente per JAVA JDK 
REM E' richiesta espressamente la versione jdk1.8.*
SET JAVA_HOME=C:\Program Files\Java\jdk1.8.0_281

REM variabile di ambiente per ANDROID SDK (copiare dai settings di Android Studio)
REM ANDROID_HOME è stato sostituito da ANDROID_SDK_ROOT
SET ANDROID_SDK_ROOT= C:\Users\lucac\AppData\Local\Android\Sdk

SET ANDROID_SDK_ROOT=C:\Users\lucac\AppData\Local\Android\Sdk


SET PATH=%PATH%;C:\Program Files\Java\jdk1.8.0_281\bin;
SET PATH=%PATH%;C:\Users\lucac\AppData\Local\Android\Sdk\tools;
SET PATH=%PATH%;C:\Users\lucac\AppData\Local\Android\Sdk\platform-tools;

REM path di GRADLE (copiare dai settings di Android Studio)
REM SET PATH=%PATH%;C:\Users\(myUser)\.gradle\wrapper\dists\gradle-5.4.1-all\3221gyojl5jsh0helicew7rwx\gradle-5.4.1\bin;

SET PATH=%PATH%;C:\Users\lucac\.gradle\wrapper\dists\gradle-6.5-bin\6nifqtx7604sqp1q6g8wikw7p\gradle-6.5\bin;

echo done