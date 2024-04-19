import fs from "fs";
import path from "path";
import { parentPort } from "worker_threads";
import chalk from "chalk";

// "⣾⣽⣻⢿⡿⣟⣯⣷"

parentPort.on("message", async (faculty) => {
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
      failedRetrievals.push(filename);
      return false;
    }
  }

  let count = 0;
  let retrievalFail = false;
  let failedRetrievals = [];
  for (let member of faculty) {
    const result = await saveImage(
      member.src,
      `${member.name}.jpg`,
      `${member.dirPath}/img`
    );
    count++;
    if (!result) {
      retrievalFail = true;
      continue;
    }
  }
  // ** console messaging upon if failure
  if (count === faculty.length && retrievalFail) {
    console.log(
      chalk.yellowBright.bold(
        "\nFINISHED RETRIEVAL, COULD NOT RETRIEVE THE FOLLOWING:"
      )
    );
    console.log(failedRetrievals);
  }
  parentPort.unref();
});
