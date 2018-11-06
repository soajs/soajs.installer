#!/bin/bash

SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do # resolve $SOURCE until the file is no longer a symlink
  TARGET="$(readlink "$SOURCE")"
  if [[ $SOURCE == /* ]]; then
    SOURCE="$TARGET"
  else
    DIR="$( dirname "$SOURCE" )"
    SOURCE="$DIR/$TARGET" # if $SOURCE was a relative symlink, we need to resolve it relative to the path where the symlink file was located
  fi
done

SOAJS_INSTALLER="$( cd -P "$( dirname "$SOURCE" )" && pwd )"

#location of /usr/bin based on operating system
BINLOCACTION=''

# check the platform to determine which node to use: linux | darwin
unamestr=`uname`
if [[ "$unamestr" == 'Linux' ]]; then
	BINLOCACTION='/usr/bin'
	NODE_LOCATION="node-8.12.0/node-linux-x64"

elif [[ "$unamestr" == 'Darwin' ]]; then
	BINLOCACTION='/usr/local/bin'
	NODE_LOCATION="node-8.12.0/node-darwin-x64"

fi

pushd $BINLOCACTION

echo "Linking SOAJS Installer: "
if [ -e soajs ]
then
	echo "soajs installer already installed"
else
	ln -s $SOAJS_INSTALLER"/bin/soajs" .
fi

echo "Linking NodeJS: "
if [ -e node ]
then
	echo "nodejs already installed"
else
	ln -s $SOAJS_INSTALLER"/include/"$NODE_LOCATION"/bin/node" .
fi

echo "Linking NPM: "
if [ -e npm ]
then
	echo "npm already installed"
else
	ln -s $SOAJS_INSTALLER"/node_modules/npm/bin/npm-cli.js" npm
	ln -s $SOAJS_INSTALLER"/node_modules/npm/bin/npx-cli.js" npx
fi

popd