//Імпортуємо модулі
const http = require("http");
const fs = require("fs").promises;
const { program } = require("commander");
const { XMLBuilder } = require("fast-xml-parser");

// 1. Оголошення обов’язкових параметрів
program
  .requiredOption("-i, --input <path>", "Input JSON file")
  .requiredOption("-h, --host <host>", "Server host")
  .requiredOption("-p, --port <port>", "Server port");

program.parse(process.argv); //аналізує масив аргументів командного рядка
const options = program.opts(); //повертаєм об'єкт з отриманими параметрами

// 2. Перевірка, чи існує файл
fs.access(options.input)
  .then(() => {
    // 3. Створення веб-сервера
      const server = http.createServer(async (req, res) => {
      try {
        // 4. Читаємо NDJSON 
        const data = await fs.readFile(options.input, "utf8");
        //перетворюємо на масив об’єктів
        const jsonData = data
          .split("\n")                       // розділяємо на рядки
          .filter(line => line.trim() !== "") // прибираємо порожні
          .map(line => JSON.parse(line));     // перетворюємо кожен рядок у об’єкт

        // 5. Отримуємо і обробляємо параметри з URL
        const url = new URL(req.url, `http://${options.host}:${options.port}`);
        const showVariety = url.searchParams.get("variety") === "true";
        const minPetalLength = parseFloat(url.searchParams.get("min_petal_length"));

        // 6. Фільтрація даних
        let filtered = jsonData;
        if (!isNaN(minPetalLength)) {
          filtered = filtered.filter(f => f["petal.length"] > minPetalLength);
        }

        // 7. Формуємо об’єкти для XML
        const result = filtered.map(f => {
          const flower = {
            petal_length: f["petal.length"],
            petal_width: f["petal.width"],
          };
          if (showVariety) flower.variety = f.variety;
          return flower;
        });

        // 8. Перетворюємо у XML
        const builder = new XMLBuilder({});
        const xmlData = builder.build({ irises: { flower: result } });


        // 9. Відправляємо XML у відповідь
        res.setHeader("Content-Type", "application/xml");
        res.end(xmlData);

        // 10. Записуємо XML у файл
        await fs.writeFile("output.xml", xmlData);

      } catch (error) {
        // Обробка помилки
       res.statusCode = 500;
       res.end("Server error");
    }

    });

    // 11. Запуск сервера
    server.listen(options.port, options.host, () => {
      console.log(`Server running at http://${options.host}:${options.port}/`);
    });
  })
  .catch(() => {
    console.error("Cannot find input file");
  });