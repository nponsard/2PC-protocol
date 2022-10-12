# 2PC tests

Implementation of the 2PC protocol.

## Start : coordinator

```sh
deno run -A index.ts --port 2002 --coordinator="localhost:2000"
```

## Start : node

```sh
deno run -A index.ts --port 2001 --coordinator="localhost:2000" 
```

## Send request

```sh
curl -X POST -H "Content-Type: text/plain" --data '{ "name":"bonjour","query":"test"}' http://localhost:2000/query
```
