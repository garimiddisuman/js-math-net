import { assertEquals } from "asserts";
import { describe, it, beforeAll, afterAll } from "testing";

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

describe("test server", () => {
  let connection;

  beforeAll(async () => {
    const port = 8000;
    connection = await Deno.connect({ port });
  });

  afterAll(() => {
    connection.close();
  });

  it("should return the sum of two numbers", async () => {
    await sendMessage(connection, "add", [1, 2]);
    const response = await getResponse(connection);
    assertEquals(response.result, 3);
  });

  it("should return the sub of two numbers", async () => {
    await sendMessage(connection, "sub", [10, 2]);
    const response = await getResponse(connection);
    assertEquals(response.result, 8);
  });

  it("should return the mul of two numbers", async () => {
    await sendMessage(connection, "mul", [10, 2]);
    const response = await getResponse(connection);
    assertEquals(response.result, 20);
  });

  it("should return the div of two numbers", async () => {
    await sendMessage(connection, "div", [10, 2]);
    const response = await getResponse(connection);
    assertEquals(response.result, 5);
  });

  it("should return the positive value for absolute of negative", async () => {
    await sendMessage(connection, "abs", [-10]);
    const response = await getResponse(connection);
    assertEquals(response.result, 10);
  });

  it("should return the 'Unknown Command' for invalid commands", async () => {
    await sendMessage(connection, "MuL", [1, 2]);
    const response = await getResponse(connection);
    assertEquals(response, { error: "Unknown Command", command: "MuL" });
  });

  it("should return the 'Incorrect Argument' for if size of args is incorrect", async () => {
    await sendMessage(connection, "mul", [1]);
    const response = await getResponse(connection);
    assertEquals(response, { error: "Incorrect Argument." });
  });
});
