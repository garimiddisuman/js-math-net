import lodash from "lodash";

const isInrange = (minArgs, maxArgs, args) =>
  minArgs <= args.length && args.length <= maxArgs;

const areValidOperands = (args) => {
  for (const arg of args) {
    if (arg === null) return false;
  }

  return true;
};

const safeFn = (minArgs, maxArgs, fn, args) => {
  if (isInrange(minArgs, maxArgs, args) && areValidOperands(args)) {
    return fn(...args);
  }

  return { error: "Incorrect Argument." };
};

const executeCommand = (command, operands) => {
  const commands = {
    add: safeFn.bind(null, 2, 2, lodash.add),
    sub: safeFn.bind(null, 2, 2, lodash.subtract),
    mul: safeFn.bind(null, 2, 2, lodash.multiply),
    div: safeFn.bind(null, 2, 2, lodash.divide),
    abs: safeFn.bind(null, 1, 1, Math.abs),
    rand: safeFn.bind(null, 0, 2, lodash.random),
    exit: () => ({ response: "connection closed" }),
  };

  if (!(command in commands)) {
    return { error: "Unknown Command", command };
  }

  return commands[command](operands);
};

const decode = (request) => {
  const decodedData = new TextDecoder().decode(request);
  return JSON.parse(decodedData);
};

const encode = (response) => {
  if (typeof response === "number") {
    response = { result: response };
  }

  const stringifiedObject = JSON.stringify(response);
  return new TextEncoder().encode(stringifiedObject);
};

const handleConnection = async (connection) => {
  for await (const data of connection.readable) {
    const { operation, operands } = decode(data);
    const response = executeCommand(operation, operands);
    await connection.write(encode(response));
  }
};

const startServer = async () => {
  const listener = Deno.listen({ port: 8000 });

  for await (const connection of listener) {
    handleConnection(connection);
  }
};

startServer();
