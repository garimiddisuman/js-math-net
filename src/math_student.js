const createMessage = (operation, operands) => {
  const request = { operation, operands };
  return new TextEncoder().encode(JSON.stringify(request));
};

const sendMessage = async (connection, operation, operand) => {
  const writer = connection.writable.getWriter();
  const msg = createMessage(operation, operand);
  await writer.write(msg);
  writer.releaseLock();
};

const getResponse = async (connection) => {
  const reader = connection.readable.getReader();
  const response = await reader.read();
  reader.releaseLock();
  return JSON.parse(new TextDecoder().decode(response.value));
};

const parse = (input) => {
  const [command, ...args] = input.split(/\s+/);
  const operands = args.map(Number);
  return [command, operands];
};

const connectToServer = async () => {
  const port = 8000;
  const connection = await Deno.connect({ port });
  console.log("Welcome to Math net ......");

  while (true) {
    const input = prompt(">");
    const [operation, operand] = parse(input);
    await sendMessage(connection, operation, operand);
    const response = await getResponse(connection);
    console.log(response);

    if (operation.startsWith("exit")) {
      connection.close();
      return;
    }
  }
};

connectToServer();
