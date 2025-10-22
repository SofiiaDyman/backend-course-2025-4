const http = require("http");
const fs = require("fs").promises;
const { program } = require("commander");

// Оголошення обов’язкових параметрів
program
  .requiredOption("-i, --input <path>", "Input JSON file")
  .requiredOption("-h, --host <host>", "Server host")
  .requiredOption("-p, --port <port>", "Server port");

program.parse(process.argv);
const options = program.opts();

// Перевірка чи файл існує
fs.access(options.input)
  .then(() => {
    const server = http.createServer((req, res) => {
      res.end("Server is running!!!");
    });

    // Передаємо host і port у listen()
    server.listen(options.port, options.host, () => {
      console.log(`Server running at http://${options.host}:${options.port}/`);
    });
  })
  .catch(() => {
    console.error("Cannot find input file");
  });
