echo "Creating Chrome extension... "
cp -a src/shared/. dist/chrome/src
cp -a src/chrome/. dist/chrome/src
cd dist/chrome/src
zip -r ../netbeep.zip *
cd ../../..
echo "Done"

echo "Creating Firefox extension... "
cp -a src/shared/. dist/firefox/src
cp -a src/firefox/. dist/firefox/src
cd dist/firefox/src
zip -r ../netbeep.zip *
cd ../../..
echo "Done"