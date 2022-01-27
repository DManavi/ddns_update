#
# shell integration
#

# Include project executables in shell
PROJECT_ROOT="$(pwd)"
NODE_MODULES_BIN="$PROJECT_ROOT/node_modules/.bin"
PROJECT_BIN="$PROJECT_ROOT/bin"

[ -d $NODE_MODULES_BIN ] && [[ ":$PATH:" != *":$NODE_MODULES_BIN:"* ]] && PATH="$NODE_MODULES_BIN:$PATH"
[ -d $PROJECT_BIN ] && [[ ":$PATH:" != *":$PROJECT_BIN:"* ]] && PATH="$PROJECT_BIN:$PATH"

# lock node version using nvm
nvm use
