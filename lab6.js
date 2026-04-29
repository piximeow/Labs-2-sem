const fs = require("fs");
const path = require("path");
const readline = require("readline");

async function generateCSV(filePath, rows = 100000) {
  const products = ["Laptop", "Phone", "Tablet", "Monitor", "Keyboard"];
  const ws = fs.createWriteStream(filePath);

  await new Promise((resolve, reject) => {
    ws.on("error", reject);
    ws.write("id,product,price,quantity\n");

    (async () => {
      for (let i = 1; i <= rows; i++) {
        const product = products[i % products.length];
        const price = (Math.random() * 2000 + 50).toFixed(2);
        const quantity = Math.floor(Math.random() * 100) + 1;

        const line = `${i},${product},${price},${quantity}\n`;
        if (!ws.write(line)) {
          await new Promise((res) => ws.once("drain", res));
        }
      }
      ws.end(resolve);
    })().catch(reject);
  });
}


async function* readCSV(filePath) {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  let first = true;
  for await (const line of rl) {
    if (first) { first = false; continue; }
    if (!line.trim()) continue;

    const [id, product, price, quantity] = line.split(",");
    yield {
      id: Number(id),
      product: product.trim(),
      price: Number(price),
      quantity: Number(quantity),
    };
  }
}

async function* filter(source, fn) {
  for await (const item of source) {
    if (fn(item)) yield item;
  }
}

async function* map(source, fn) {
  for await (const item of source) {
    yield fn(item);
  }
}

async function* batch(source, size) {
  let buf = [];
  for await (const item of source) {
    buf.push(item);
    if (buf.length >= size) {
      yield buf;
      buf = [];
    }
  }
  if (buf.length) yield buf;
}


async function main() {
  const file = path.join(__dirname, "data.csv");

  await generateCSV(file, 100000);

  const start = Date.now();
  const stats = {};
  let totalRows = 0;
  let totalBatches = 0;

   const rows = readCSV(file);
  const expensive = filter(rows, (r) => r.price > 500);
  const withUAH = map(expensive, (r) => ({
    ...r,
    priceUAH: +(r.price * 41).toFixed(2),
    revenueUAH: +(r.price * r.quantity * 41).toFixed(2),
  }));
  const batches = batch(withUAH, 1000);

  for await (const chunk of batches) {
    totalBatches++;
    for (const row of chunk) {
      totalRows++;
      if (!stats[row.product]) {
        stats[row.product] = { count: 0, totalRevenue: 0 };
      }
      stats[row.product].count++;
      stats[row.product].totalRevenue += row.revenueUAH;
    }
  }

  const time = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`Processed: ${totalRows} rows in ${time}s`);
  console.log(`Batches: ${totalBatches}\n`);

  for (const product in stats) {
    const s = stats[product];
    const avg = (s.totalRevenue / s.count).toFixed(2);
    console.log(`${product}: count=${s.count}, avgRevenue=${avg} UAH`);
  }

  fs.unlinkSync(file);
}

main().catch(console.error);