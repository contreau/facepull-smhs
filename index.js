import fs from "fs";
import { JSDOM } from "jsdom";
import promptSync from "prompt-sync";
import chalk from "chalk";
import { Worker } from "worker_threads";
import os from "os";
import writeXlsxFile from "write-excel-file/node";

async function main() {
  // ** user provides URL input
  const prompt = promptSync();
  const url = prompt("Provide a valid faculty page URL: ");
  const departmentName = `${url.split(".smhs")[0].split("//")[1]}`;

  // ** excel file column names
  let excelData = [
    [
      {
        value: "Department",
        fontWeight: "bold",
      },
      {
        value: "Faculty",
        fontWeight: "bold",
      },
      {
        value: "Notes",
        fontWeight: "bold",
      },
    ],
  ];

  // ** parses a faculty member's name and image url from <tr>
  function parseDetails(html, dirPath) {
    let dom = new JSDOM(html).window.document;
    const imgSRC = dom.querySelector("img").src;
    const name = dom.querySelector("p").textContent.split(" ").join("");
    excelData = [
      ...excelData,
      [
        {
          type: String,
          value: `${url.split(".smhs")[0].split("//")[1]}`.toUpperCase(),
        },
        {
          type: String,
          value: `${dom.querySelector("p").textContent.trim()}`,
        },
        {
          type: String,
          value: "",
        },
      ],
    ];
    return {
      name: name,
      src: imgSRC,
      dirPath: dirPath,
    };
  }

  const dirPath = `./_${departmentName}`;
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath);
  if (!fs.existsSync(`${dirPath}/img`)) fs.mkdirSync(`${dirPath}/img`);
  const res = await fetch(url);
  const html = await res.text();
  const document = new JSDOM(html).window.document;
  console.clear();
  const container = document.querySelector('[role="main"]');
  const rows = Array.from(container.querySelectorAll("tr"));
  const faculty = rows
    .map((row) => row.innerHTML)
    .filter((html) => html.includes("<img") && !html.includes("/sites/"))
    .map((entry) => parseDetails(entry, dirPath));
  const facultyCount = faculty.length;

  // jobs determined at this point, initiate worker threads
  function chunkify(jobsArray, workers) {
    let chunks = [];
    for (let i = workers; i > 0; i--) {
      chunks.push(jobsArray.splice(0, Math.ceil(jobsArray.length / i)));
    }
    return chunks;
  }

  const cpus = Math.floor(os.cpus().length * 0.8);
  const chunks = chunkify(faculty, cpus);
  console.log(chalk.hex("#007cff").bold("Retrieving faculty images..."));
  const time1 = performance.now();
  const work = new Promise((resolve) => {
    chunks.forEach((facultyChunk, i) => {
      const worker = new Worker("./worker.js");
      worker.postMessage(facultyChunk);
      worker.on("exit", () => {
        if (i === cpus - 1) resolve(true);
      });
    });
  });

  await work;
  await writeXlsxFile(excelData, {
    filePath: `${dirPath}/${departmentName}-faculty.xlsx`,
  });
  const time2 = performance.now();
  console.log(
    chalk.hex("#00ff9f").bold(`\nRetrieved`),
    facultyCount,
    chalk.hex("#00ff9f").bold(`images in`),
    Math.floor(time2 - time1),
    chalk.hex("#00ff9f").bold(`ms.`)
  );
  console.log(chalk.hex("#ffe300")(`Saved to ${dirPath.slice(2)}`));
}

main();
