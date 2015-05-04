#!/bin/sh

set -e # Fail on error

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
cd $DIR

BUILD_DEST=$DIR/build
cd $BUILD_DEST

if [ ! -d "Keybase.app" ]; then
	echo "You need to Export an archived build from Xcode (Keybase.app)"
	exit 1
fi

if [ ! -f "keybase" ]; then
	echo "Missing keybase binary"
	exit 1
fi

VERSION=`/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" Keybase.app/Contents/Info.plist`
echo "App Version: $VERSION"

KB_SERVICE_VERSION=`/usr/libexec/PlistBuddy -c "Print :KeybaseServiceVersion" Keybase.app/Contents/Info.plist`
echo "Keybased Service Version: $KB_SERVICE_VERSION"

KB_HELPER_VERSION=`/usr/libexec/PlistBuddy -c "Print :KeybaseHelperVersion" Keybase.app/Contents/Info.plist`
echo "Keybased Helper Version: $KB_HELPER_VERSION"


#KB_HELPER_VERSION=`otool -s __TEXT __info_plist Keybase.app/Contents/Library/LaunchServices/keybase.Helper`
#echo "Keybased Helper Version : $KB_HELPER_VERSION"


echo "Copying keybase into Keybase.app..."
chmod +x keybase
mkdir -p Keybase.app/Contents/SharedSupport/bin
cp keybase Keybase.app/Contents/SharedSupport/bin

# Verify
#codesign --verify --verbose=4 Keybase.app

#echo "Re-signing..."
#codesign --verbose --force --deep --sign "Developer ID Application: Keybase, Inc." Keybase.app

rm -rf Keybase-$VERSION.dmg

cp ../appdmg/* .

appdmg appdmg.json Keybase-$VERSION.dmg

echo "Opening..."
open Keybase-$VERSION.dmg

#echo "Installing to /Applications"
#rm -rf /Applications/Keybase.app
#cp -R Keybase.app /Applications

