import fs from "fs";
import path from "path";
import { JSDOM } from "jsdom";
import promptSync from "prompt-sync";
import chalk from "chalk";

async function main() {
  // ** user provides URL input
  const prompt = promptSync();
  const url = prompt("Provide a valid faculty page URL: ");

  // ** parses a faculty member's name and image url from <tr>
  function parseDetails(html) {
    let dom = new JSDOM(html).window.document;
    const imgSRC = dom.querySelector("img").src;
    const name = dom.querySelector("p").textContent.split(" ").join("");
    return {
      name: name,
      src: imgSRC,
    };
  }

  // ** save images to file system
  async function saveImage(imgURL, filename, dirPath) {
    try {
      const raw = await fetch(imgURL);
      const response = await raw.arrayBuffer();
      const buffer = Buffer.from(response);
      fs.writeFile(path.join(dirPath, filename), buffer, (error) => {
        error ? console.error(error) : true;
      });
      return true;
    } catch (err) {
      console.error(chalk.hex("#ff3000")(`FAILED TO RETRIEVE ${filename}`));
      failedRetrievals.push(filename); // closure *dab*
      return false;
    }
  }

  const dirPath = `./${url.split(".smhs")[0].split("//")[1]}`;
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath);
  const res = await fetch(url);
  const html = await res.text();
  const document = new JSDOM(html).window.document;
  console.clear();
  const container = document.querySelector('[role="main"]');
  const rows = Array.from(container.querySelectorAll("tr"));
  const faculty = rows
    .map((row) => row.innerHTML)
    .map((entry) => parseDetails(entry))
    .filter((entry) => !entry.src.includes("/sites/"));

  console.log(chalk.hex("#007cff").bold("EXPECTED RESULTS:"), faculty.length);
  let count = 0;
  let retrievalFail = false;
  let failedRetrievals = [];
  for (let member of faculty) {
    const result = await saveImage(member.src, `${member.name}.jpg`, dirPath);
    count++;
    if (result) {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write(`${count}/${faculty.length} images requested.`);
      // console.log(`${member.name}.jpg retrieved.`);
    } else if (!result) {
      retrievalFail = true;
      continue;
    }
  }

  // ** console messaging upon finishing
  if (count === faculty.length && retrievalFail) {
    console.log(
      chalk.yellowBright.bold(
        "\nFINISHED RETRIEVAL, COULD NOT RETRIEVE THE FOLLOWING:"
      )
    );
    console.log(failedRetrievals);
  } else {
    console.log(chalk.hex("#00ff9f").bold("\nALL IMAGES RETRIEVED."));
  }
  console.log(
    chalk.hex("#ffe300")(`These images are saved to ${dirPath.slice(1)}`)
  );
}

main();

// examples:
// https://biochemistry.smhs.gwu.edu/faculty
// https://psychiatry.smhs.gwu.edu/faculty
// https://anatomy.smhs.gwu.edu/faculty
// https://dermatology.smhs.gwu.edu/faculty
