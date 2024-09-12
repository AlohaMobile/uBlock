#!/usr/bin/env bash
#
# This script assumes a linux environment

set -e

echo "*** uBlock0.ios: Creating web store package"

BLDIR=dist/build
DES="$BLDIR"/uBlock0.ios
mkdir -p $DES
rm -rf $DES/*

echo "*** uBlock0.ios: Copying common files"
bash ./tools/copy-common-files.sh $DES

# iOS-specific
echo "*** uBlock0.ios: Copying ios-specific files"
cp platform/ios/*.json $DES/
cp platform/ios/*.js   $DES/js/

# iOS store-specific
cp -R $DES/_locales/nb     $DES/_locales/no

echo "*** uBlock0.ios: Generating meta..."
python3 tools/make-ios-meta.py $DES/

echo "*** uBlock0.ios: Package done."
