# Internet Applications - Web API Covid 19 data

### Authors: Matúš Škuta (xskuta04), Patrik Németh (xnemet)

## Requirements

Before running this example make sure you got installed `node v14.x`, `npm`, `typescript` and all required modules from `package.json`. If you do not have them install them as follows:

To install `node v14.x`, with `npm`, type in:

```Bash
$ curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
$ sudo apt-get install -y nodejs
```

To install `typescript` type in:
```Bash
$ npm i -g typescript
$ sudo apt-get install node-typescript
```

Finnaly to install all required modules, make sure you are in the same directory as `README.md` and type in:
```Bash
$ npm run install
```

## Build

By using command `npm run build`, the content of server is compiled into `Javascript` files and placed into dist directory.

## Run

By using command `npm run start`, project will be compiled and run, which will start server, with API on port `3000`.
