@echo off
echo Iniciando commit automatico...
git add .
git commit -m "update %date% %time%"
git branch -M main
git push origin main
echo Pronto! Fechando...
exit
